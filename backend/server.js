const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const QUEUE_DIR = path.join(DATA_DIR, 'queue');

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Ensure queue directories exist
['requests', 'responses'].forEach(dir => {
  const p = path.join(QUEUE_DIR, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ========== Data Helpers ==========

function readPlayers() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'players.csv'), 'utf-8');
  const csv = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]?.trim()));
    return obj;
  });
}

function writePlayers(players) {
  const headers = ['id', 'username', 'gold', 'level', 'status', 'last_login'];
  const lines = [headers.join(',')];
  players.forEach(p => lines.push(headers.map(h => p[h]).join(',')));
  fs.writeFileSync(path.join(DATA_DIR, 'players.csv'), lines.join('\n') + '\n');
}

function readJSON(filename) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ========== Queue / File Bridge ==========

function createRequest(requestId, playerId, message, playerData) {
  const reqFile = path.join(QUEUE_DIR, 'requests', `${requestId}.json`);
  const payload = {
    request_id: requestId,
    player_id: playerId,
    player_data: playerData,
    message,
    created_at: new Date().toISOString(),
    status: 'pending',
  };
  fs.writeFileSync(reqFile, JSON.stringify(payload, null, 2));
  return payload;
}

function getResponse(requestId) {
  const resFile = path.join(QUEUE_DIR, 'responses', `${requestId}.json`);
  if (!fs.existsSync(resFile)) return null;
  try {
    const raw = fs.readFileSync(resFile, 'utf-8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

function generateRequestId() {
  return `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ========== Routes ==========

// POST /api/auth — xác thực player, trả lịch sử chat
app.post('/api/auth', (req, res) => {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: 'player_id is required' });

  const players = readPlayers();
  const player = players.find(p => p.id === player_id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const conversations = readJSON('conversations.json');
  const history = conversations[player_id] || [];

  res.json({ player, history });
});

// POST /api/chat — gửi tin nhắn, tạo request file cho Copilot xử lý
app.post('/api/chat', (req, res) => {
  const { player_id, message } = req.body;
  if (!player_id || !message)
    return res.status(400).json({ error: 'player_id and message are required' });

  const players = readPlayers();
  const player = players.find(p => p.id === player_id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Save user message to conversation
  const conversations = readJSON('conversations.json');
  if (!conversations[player_id]) conversations[player_id] = [];
  const now = new Date().toISOString();
  conversations[player_id].push({ role: 'user', message, timestamp: now });
  writeJSON('conversations.json', conversations);

  // Create request file for Copilot Agent to pick up
  const requestId = generateRequestId();
  createRequest(requestId, player_id, message, player);

  res.json({
    request_id: requestId,
    status: 'waiting_for_ai',
    message: 'Yêu cầu đã được gửi. AI Agent đang xử lý...',
  });
});

// GET /api/chat/status/:requestId — poll kết quả từ Copilot
app.get('/api/chat/status/:requestId', (req, res) => {
  const { requestId } = req.params;
  const response = getResponse(requestId);

  if (!response) {
    return res.json({ status: 'waiting_for_ai' });
  }

  // Save AI reply to conversation
  const conversations = readJSON('conversations.json');
  const playerId = response.player_id;
  if (!conversations[playerId]) conversations[playerId] = [];

  // Avoid duplicate saves — check if already saved
  const lastMsg = conversations[playerId][conversations[playerId].length - 1];
  if (!lastMsg || lastMsg.role !== 'ai' || lastMsg.request_id !== requestId) {
    conversations[playerId].push({
      role: 'ai',
      message: response.reply,
      request_id: requestId,
      timestamp: response.responded_at || new Date().toISOString(),
    });
    writeJSON('conversations.json', conversations);
  }

  // If Copilot created a mock PR review
  let review = null;
  if (response.db_changes && response.confidence > 0.8) {
    const reviews = readJSON('pending_reviews.json');
    const existing = reviews.find(r => r.request_id === requestId);
    if (!existing) {
      const reviewId = `R${String(reviews.length + 1).padStart(3, '0')}`;
      review = {
        review_id: reviewId,
        request_id: requestId,
        ...response.db_changes,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      reviews.push(review);
      writeJSON('pending_reviews.json', reviews);
    } else {
      review = existing;
    }
  }

  res.json({
    status: response.confidence > 0.8 ? 'pending_review' : 'escalated',
    reply: response.reply,
    confidence: response.confidence,
    review,
  });
});

// GET /api/pending-reviews — danh sách mock PR chờ duyệt
app.get('/api/pending-reviews', (_req, res) => {
  const reviews = readJSON('pending_reviews.json');
  res.json({ reviews: reviews.filter(r => r.status === 'pending') });
});

// POST /api/resolve-pr — CSKH approve / reject
app.post('/api/resolve-pr', (req, res) => {
  const { review_id, action } = req.body;
  if (!review_id || !['approve', 'reject'].includes(action))
    return res.status(400).json({ error: 'review_id and action (approve|reject) are required' });

  const reviews = readJSON('pending_reviews.json');
  const review = reviews.find(r => r.review_id === review_id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.status !== 'pending')
    return res.status(400).json({ error: 'Review already resolved' });

  if (action === 'approve') {
    const players = readPlayers();
    const player = players.find(p => p.id === review.player_id);
    if (player) {
      player[review.field] = String(review.after);
      writePlayers(players);
    }
    review.status = 'merged';
  } else {
    review.status = 'rejected';
  }

  writeJSON('pending_reviews.json', reviews);
  res.json({ status: review.status });
});

// ========== Start ==========

app.listen(PORT, () => {
  console.log(`🚀 Falcon Supporter Backend → http://localhost:${PORT}`);
  console.log(`📂 Queue directory: ${QUEUE_DIR}`);
  console.log(`⏳ Waiting for Copilot Agent to process requests in queue/requests/...`);
});
