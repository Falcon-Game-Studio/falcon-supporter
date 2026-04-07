/**
 * Falcon Supporter — MongoDB Connection & Models
 *
 * Manages the Mongoose connection and exports all data models:
 *   - Player, Conversation, Review, KnowledgeBase, Request
 */

const mongoose = require('mongoose');

// ========== Connection ==========

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/falcon_supporter';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`🗄️  MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ========== Schemas & Models ==========

// --- Player ---
const playerSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true }, // P001, P002...
  username:   { type: String, required: true },
  gold:       { type: Number, default: 0 },
  level:      { type: Number, default: 1 },
  status:     { type: String, default: 'active', enum: ['active', 'banned', 'suspended'] },
  last_login: { type: String },
}, { timestamps: false, versionKey: false });

const Player = mongoose.model('Player', playerSchema);

// --- Conversation message (embedded in array per player) ---
const messageSchema = new mongoose.Schema({
  role:       { type: String, required: true, enum: ['user', 'ai', 'system'] },
  message:    { type: String, required: true },
  request_id: { type: String },
  timestamp:  { type: String, default: () => new Date().toISOString() },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  player_id: { type: String, required: true, unique: true },
  messages:  [messageSchema],
}, { timestamps: false, versionKey: false });

const Conversation = mongoose.model('Conversation', conversationSchema);

// --- Pending Review (Mock PR) ---
const reviewSchema = new mongoose.Schema({
  review_id:  { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  player_id:  { type: String, required: true },
  field:      { type: String, required: true },
  before:     { type: mongoose.Schema.Types.Mixed },
  after:      { type: mongoose.Schema.Types.Mixed },
  reason:     { type: String },
  status:     { type: String, default: 'pending', enum: ['pending', 'merged', 'rejected'] },
  created_at: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const Review = mongoose.model('Review', reviewSchema);

// --- Knowledge Base ---
const kbSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true }, // KB001...
  keywords:   [String],
  problem:    { type: String },
  solution:   { type: String },
  db_changes: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: false, versionKey: false });

const KnowledgeBase = mongoose.model('KnowledgeBase', kbSchema);

// --- AI Request Queue ---
const requestSchema = new mongoose.Schema({
  request_id:  { type: String, required: true, unique: true },
  player_id:   { type: String, required: true },
  player_data: { type: mongoose.Schema.Types.Mixed },
  message:     { type: String, required: true },
  status:      { type: String, default: 'pending', enum: ['pending', 'processing', 'completed'] },
  // Response fields (filled when agent processes)
  reply:       { type: String },
  confidence:  { type: Number },
  db_changes:  { type: mongoose.Schema.Types.Mixed },
  created_at:  { type: String, default: () => new Date().toISOString() },
  responded_at:{ type: String },
}, { timestamps: false, versionKey: false });

const Request = mongoose.model('Request', requestSchema);

module.exports = {
  connectDB,
  Player,
  Conversation,
  Review,
  KnowledgeBase,
  Request,
};
