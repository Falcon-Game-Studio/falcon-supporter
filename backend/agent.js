/**
 * Falcon Supporter — AI Agent (Heartbeat Worker)
 *
 * Script này chạy liên tục, quét MongoDB collection `requests` mỗi 3 giây.
 * Khi phát hiện request mới (status: 'pending'), nó sẽ:
 *   1. Đọc request + Knowledge Base + player data từ MongoDB
 *   2. Gọi GitHub Copilot LLM (GitHub Models API) để phân tích
 *   3. Parse structured JSON response từ LLM
 *   4. Cập nhật request doc trong MongoDB với kết quả
 *
 * Cần: GITHUB_TOKEN (Personal Access Token) trong file .env
 * Khởi chạy: node agent.js   (hoặc qua run.bat / npm run dev)
 */

require('dotenv').config();
const { connectDB, KnowledgeBase, Request } = require('./db');
const POLL_MS = 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MODEL = process.env.COPILOT_MODEL || 'gpt-4o-mini';
const API_URL = 'https://models.inference.ai.azure.com/chat/completions';

// ========== Helpers ==========

async function loadKB() {
  return KnowledgeBase.find({}).lean();
}

// ========== Build LLM Prompt ==========

function buildSystemPrompt(player, kbContext) {
  return `Bạn là nhân viên CSKH (Chăm sóc Khách hàng) AI của Falcon Game Studio.
Bạn hỗ trợ người chơi giải quyết vấn đề liên quan đến tài khoản game.

## Thông tin người chơi hiện tại:
- ID: ${player.id}
- Username: ${player.username}
- Gold: ${player.gold}
- Level: ${player.level}
- Status: ${player.status}
- Last Login: ${player.last_login}

## Knowledge Base (các case đã giải quyết):
${kbContext}

## Quy tắc:
1. Xưng hô lịch sự, gọi tên người chơi.
2. Luôn hiển thị thông tin tài khoản hiện tại.
3. Nếu nhận diện được vấn đề (có trong KB), đề xuất thay đổi cụ thể với confidence > 0.8.
4. Nếu KHÔNG nhận diện được, trả confidence ≤ 0.5 và nói sẽ chuyển cho đội CSKH.
5. KHÔNG tự ý sửa dữ liệu — chỉ đề xuất qua db_changes.
6. Nếu người chơi nói mất X gold, đề xuất hoàn trả X gold (after = current + X).
7. Nếu người chơi bị ban nhầm, đề xuất đổi status thành "active".
8. Nếu sai level, đề xuất điều chỉnh level.
9. Nếu đổi tên, đề xuất username mới.

## Output format (BẮT BUỘC trả về JSON, không markdown):
{
  "reply": "Tin nhắn trả lời cho người chơi",
  "confidence": 0.9,
  "db_changes": {
    "player_id": "P001",
    "field": "gold",
    "before": 15000,
    "after": 15500,
    "reason": "Lý do thay đổi"
  }
}

Nếu không cần thay đổi DB, set db_changes = null.
CHỈ trả về JSON thuần, KHÔNG bọc trong code block hay markdown.`;
}

async function buildKBContext() {
  const kb = await loadKB();
  return kb.map(entry =>
    `- [${entry.id}] Keywords: ${entry.keywords.join(', ')} → Problem: ${entry.problem} → Solution: ${entry.solution} → Changes: ${JSON.stringify(entry.db_changes)}`
  ).join('\n');
}

// ========== Call GitHub Copilot LLM ==========

async function callLLM(systemPrompt, userMessage) {
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return content;
}

// ========== Parse LLM Response ==========

function parseLLMResponse(raw) {
  // Strip markdown code blocks if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return JSON.parse(cleaned);
}

// ========== Process a single request ==========

async function processRequest(request) {
  const { message, player_data, request_id } = request;

  console.log(`  📨 Message: "${message}"`);
  console.log(`  👤 Player: ${player_data.username} (${player_data.id})`);

  const kbContext = await buildKBContext();
  const systemPrompt = buildSystemPrompt(player_data, kbContext);

  console.log(`  🤖 Calling GitHub Copilot LLM (${MODEL})...`);
  const rawResponse = await callLLM(systemPrompt, message);
  const analysis = parseLLMResponse(rawResponse);

  // Update request document with response
  await Request.findOneAndUpdate(
    { request_id },
    {
      $set: {
        reply: analysis.reply,
        confidence: analysis.confidence,
        db_changes: analysis.db_changes || null,
        status: 'completed',
        responded_at: new Date().toISOString(),
      },
    },
  );

  console.log(`  ✅ Response saved → confidence: ${analysis.confidence}`);
  if (analysis.db_changes) {
    console.log(`  📋 Mock PR: ${analysis.db_changes.field} ${analysis.db_changes.before} → ${analysis.db_changes.after}`);
  }
  console.log('');
}

// ========== Heartbeat Loop ==========

let processing = false;
const failedRequests = new Set(); // Skip requests that failed (bad token, parse error, etc.)

async function heartbeat() {
  if (processing) return; // Prevent overlapping
  processing = true;

  try {
    const pending = await Request.find({
      status: 'pending',
      request_id: { $nin: [...failedRequests] },
    }).lean();

    for (const request of pending) {
      console.log(`🔔 Processing: ${request.request_id}`);
      // Mark as processing to prevent duplicate pickup
      await Request.findOneAndUpdate(
        { request_id: request.request_id, status: 'pending' },
        { $set: { status: 'processing' } },
      );
      try {
        await processRequest(request);
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        if (err.message.includes('401') || err.message.includes('403')) {
          console.error('  ⛔ Token không hợp lệ. Hãy kiểm tra GITHUB_TOKEN trong backend/.env');
          console.error('  ⏸  Tạm dừng request này. Restart agent sau khi sửa token.\n');
          failedRequests.add(request.request_id);
        } else {
          console.error('  🔁 Sẽ thử lại lần sau.\n');
        }
        // Revert to pending so it can be retried
        await Request.findOneAndUpdate(
          { request_id: request.request_id },
          { $set: { status: 'pending' } },
        );
      }
    }
  } catch (err) {
    console.error('Heartbeat error:', err.message);
  } finally {
    processing = false;
  }
}

// ========== Main ==========

console.log('================================================');
console.log(' 🦅 Falcon Supporter — AI Agent (GitHub Copilot)');
console.log('================================================');
console.log(`🤖 Model:    ${MODEL}`);
console.log(`⏱  Poll:     ${POLL_MS}ms`);

if (!GITHUB_TOKEN) {
  console.error('');
  console.error('❌ GITHUB_TOKEN không tìm thấy!');
  console.error('   Tạo file backend/.env với nội dung:');
  console.error('   GITHUB_TOKEN=ghp_your_personal_access_token');
  console.error('');
  console.error('   Lấy token tại: https://github.com/settings/tokens');
  console.error('   Cần scope: copilot (hoặc dùng Fine-grained token)');
  process.exit(1);
}

console.log(`🔑 Token:    ${GITHUB_TOKEN.slice(0, 8)}...${GITHUB_TOKEN.slice(-4)}`);
console.log('');

// Connect to MongoDB, then start heartbeat
connectDB().then(() => {
  heartbeat();
  setInterval(heartbeat, POLL_MS);
  console.log('🟢 Agent is running. Waiting for requests...');
  console.log('   Press Ctrl+C to stop.');
  console.log('');
});
