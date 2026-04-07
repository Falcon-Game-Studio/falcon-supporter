/**
 * Falcon Supporter — Seed Script
 *
 * Imports initial data from the existing JSON/CSV files into MongoDB.
 * Run once:  node seed.js
 *
 * Safe to re-run: drops existing data and re-seeds.
 */

require('dotenv').config();
const { connectDB, Player, Conversation, Review, KnowledgeBase, Request } = require('./db');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function readCSVPlayers() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'players.csv'), 'utf-8');
  const csv = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]?.trim()));
    // Convert numeric fields
    obj.gold = Number(obj.gold) || 0;
    obj.level = Number(obj.level) || 1;
    return obj;
  });
}

function readJSON(filename) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

async function seed() {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Player.deleteMany({}),
    Conversation.deleteMany({}),
    Review.deleteMany({}),
    KnowledgeBase.deleteMany({}),
    Request.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Seed players
  const players = readCSVPlayers();
  await Player.insertMany(players);
  console.log(`👥 Seeded ${players.length} players`);

  // Seed knowledge base
  const kb = readJSON('knowledge_base.json');
  await KnowledgeBase.insertMany(kb);
  console.log(`📚 Seeded ${kb.length} knowledge base entries`);

  // Seed conversations
  const conversations = readJSON('conversations.json');
  const convDocs = Object.entries(conversations).map(([player_id, messages]) => ({
    player_id,
    messages,
  }));
  if (convDocs.length) {
    await Conversation.insertMany(convDocs);
    console.log(`💬 Seeded ${convDocs.length} conversations`);
  }

  // Seed pending reviews
  const reviews = readJSON('pending_reviews.json');
  if (reviews.length) {
    await Review.insertMany(reviews);
    console.log(`📋 Seeded ${reviews.length} reviews`);
  }

  console.log('\n✅ Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
