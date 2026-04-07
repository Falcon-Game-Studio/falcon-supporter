const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, Player, Conversation, Review, Request } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ========== Helpers ==========

function generateRequestId() {
  return `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ========== Routes ==========

// POST /api/auth — xác thực player, trả lịch sử chat
app.post('/api/auth', async (req, res) => {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: 'player_id is required' });

  const player = await Player.findOne({ id: player_id }).lean();
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const conv = await Conversation.findOne({ player_id }).lean();
  const history = conv?.messages || [];

  res.json({ player, history });
});

// POST /api/chat — gửi tin nhắn, tạo request cho AI Agent xử lý
app.post('/api/chat', async (req, res) => {
  const { player_id, message } = req.body;
  if (!player_id || !message)
    return res.status(400).json({ error: 'player_id and message are required' });

  const player = await Player.findOne({ id: player_id }).lean();
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Save user message to conversation
  const now = new Date().toISOString();
  await Conversation.findOneAndUpdate(
    { player_id },
    { $push: { messages: { role: 'user', message, timestamp: now } } },
    { upsert: true },
  );

  // Create request in DB for AI Agent to pick up
  const requestId = generateRequestId();
  await Request.create({
    request_id: requestId,
    player_id,
    player_data: player,
    message,
    status: 'pending',
  });

  res.json({
    request_id: requestId,
    status: 'waiting_for_ai',
    message: 'Yêu cầu đã được gửi. AI Agent đang xử lý...',
  });
});

// GET /api/chat/status/:requestId — poll kết quả từ AI Agent
app.get('/api/chat/status/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const request = await Request.findOne({ request_id: requestId }).lean();

  if (!request || request.status === 'pending' || request.status === 'processing') {
    return res.json({ status: 'waiting_for_ai' });
  }

  // Request is completed — save AI reply to conversation (idempotent)
  const conv = await Conversation.findOne({ player_id: request.player_id });
  if (conv) {
    const lastMsg = conv.messages[conv.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'ai' || lastMsg.request_id !== requestId) {
      conv.messages.push({
        role: 'ai',
        message: request.reply,
        request_id: requestId,
        timestamp: request.responded_at || new Date().toISOString(),
      });
      await conv.save();
    }
  }

  // If AI created a mock PR review (high confidence)
  let review = null;
  if (request.db_changes && request.confidence > 0.8) {
    let existing = await Review.findOne({ request_id: requestId });
    if (!existing) {
      const count = await Review.countDocuments();
      const reviewId = `R${String(count + 1).padStart(3, '0')}`;
      existing = await Review.create({
        review_id: reviewId,
        request_id: requestId,
        player_id: request.db_changes.player_id || request.player_id,
        field: request.db_changes.field,
        before: request.db_changes.before,
        after: request.db_changes.after,
        reason: request.db_changes.reason,
        status: 'pending',
      });
    }
    review = existing.toObject ? existing.toObject() : existing;
  }

  res.json({
    status: request.confidence > 0.8 ? 'pending_review' : 'escalated',
    reply: request.reply,
    confidence: request.confidence,
    review,
  });
});

// GET /api/pending-reviews — danh sách mock PR chờ duyệt
app.get('/api/pending-reviews', async (_req, res) => {
  const reviews = await Review.find({ status: 'pending' }).lean();
  res.json({ reviews });
});

// POST /api/resolve-pr — CSKH approve / reject
app.post('/api/resolve-pr', async (req, res) => {
  const { review_id, action } = req.body;
  if (!review_id || !['approve', 'reject'].includes(action))
    return res.status(400).json({ error: 'review_id and action (approve|reject) are required' });

  const review = await Review.findOne({ review_id });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.status !== 'pending')
    return res.status(400).json({ error: 'Review already resolved' });

  if (action === 'approve') {
    await Player.findOneAndUpdate(
      { id: review.player_id },
      { $set: { [review.field]: review.after } },
    );
    review.status = 'merged';
  } else {
    review.status = 'rejected';
  }

  await review.save();
  res.json({ status: review.status });
});

// ========== Start ==========

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Falcon Supporter Backend → http://localhost:${PORT}`);
    console.log(`⏳ Waiting for AI Agent to process requests...`);
  });
});
