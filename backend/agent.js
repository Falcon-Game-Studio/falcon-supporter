/**
 * Falcon Supporter — AI Agent (Heartbeat Worker)
 *
 * Script này chạy liên tục, quét folder queue/requests/ mỗi 3 giây.
 * Khi phát hiện request mới (chưa có response tương ứng), nó sẽ:
 *   1. Đọc request file + Knowledge Base + player data
 *   2. Gọi GitHub Copilot LLM (GitHub Models API) để phân tích
 *   3. Parse structured JSON response từ LLM
 *   4. Ghi response file vào queue/responses/
 *
 * Cần: GITHUB_TOKEN (Personal Access Token) trong file .env
 * Khởi chạy: node agent.js   (hoặc qua run.bat / npm run dev)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const QUEUE_DIR = path.join(DATA_DIR, 'queue');
const REQ_DIR = path.join(QUEUE_DIR, 'requests');
const RES_DIR = path.join(QUEUE_DIR, 'responses');
const POLL_MS = 3000;

// ========== Load .env ==========

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MODEL = process.env.COPILOT_MODEL || 'gpt-4o-mini';
const API_URL = 'https://models.inference.ai.azure.com/chat/completions';

// ========== Helpers ==========

function readJSON(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

function loadKB() {
  return readJSON(path.join(DATA_DIR, 'knowledge_base.json'));
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

function buildKBContext() {
  const kb = loadKB();
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

async function processRequest(reqFile) {
  const reqPath = path.join(REQ_DIR, reqFile);
  const resPath = path.join(RES_DIR, reqFile);

  const request = readJSON(reqPath);
  const { message, player_data } = request;

  console.log(`  📨 Message: "${message}"`);
  console.log(`  👤 Player: ${player_data.username} (${player_data.id})`);

  const kbContext = buildKBContext();
  const systemPrompt = buildSystemPrompt(player_data, kbContext);

  console.log(`  🤖 Calling GitHub Copilot LLM (${MODEL})...`);
  const rawResponse = await callLLM(systemPrompt, message);
  const analysis = parseLLMResponse(rawResponse);

  // Build response file
  const response = {
    request_id: request.request_id,
    player_id: request.player_id,
    reply: analysis.reply,
    confidence: analysis.confidence,
    db_changes: analysis.db_changes || null,
    responded_at: new Date().toISOString(),
  };

  fs.writeFileSync(resPath, JSON.stringify(response, null, 2));
  console.log(`  ✅ Response written → confidence: ${analysis.confidence}`);
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
    const reqFiles = fs.readdirSync(REQ_DIR).filter(f => f.endsWith('.json'));
    const resFiles = new Set(fs.readdirSync(RES_DIR).filter(f => f.endsWith('.json')));

    const pending = reqFiles.filter(f => !resFiles.has(f) && !failedRequests.has(f));

    for (const reqFile of pending) {
      console.log(`🔔 Processing: ${reqFile}`);
      try {
        await processRequest(reqFile);
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        if (err.message.includes('401') || err.message.includes('403')) {
          console.error('  ⛔ Token không hợp lệ. Hãy kiểm tra GITHUB_TOKEN trong backend/.env');
          console.error('  ⏸  Tạm dừng request này. Restart agent sau khi sửa token.\n');
          failedRequests.add(reqFile);
        } else {
          console.error('  🔁 Sẽ thử lại lần sau.\n');
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Heartbeat error:', err.message);
  } finally {
    processing = false;
  }
}

// ========== Main ==========

console.log('================================================');
console.log(' 🦅 Falcon Supporter — AI Agent (GitHub Copilot)');
console.log('================================================');
console.log(`📂 Watching: ${REQ_DIR}`);
console.log(`📂 Writing:  ${RES_DIR}`);
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

// Process any existing pending requests immediately
heartbeat();

// Then poll continuously
setInterval(heartbeat, POLL_MS);

console.log('🟢 Agent is running. Waiting for requests...');
console.log('   Press Ctrl+C to stop.');
console.log('');
