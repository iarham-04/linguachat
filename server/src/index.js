/**
 * LinguaChat Server — Entry Point
 * 
 * Express + Socket.io server that handles real-time multilingual chat.
 * Translation happens server-side before delivering messages to each recipient.
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { initFirebase } = require('./config/firebase');
const { registerSocketHandlers } = require('./handlers/socketHandlers');

// ── Configuration ─────────────────────────────────
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ── Express App ───────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// In production, serve the built React frontend
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    translationProvider: process.env.TRANSLATION_PROVIDER || 'mock',
  });
});

// ── HTTP Server + Socket.io ───────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction
      ? [process.env.CLIENT_URL || '*']
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

// ── Initialize Services ───────────────────────────
initFirebase();

// ── Socket.io Connection Handler ──────────────────
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// In production, serve index.html for all non-API routes (React SPA)
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── Start Server ──────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  🌐 ─────────────────────────────────────────');
  console.log('  │                                           │');
  console.log(`  │   LinguaChat Server running on port ${PORT}   │`);
  console.log('  │                                           │');
  console.log(`  │   Translation: ${(process.env.TRANSLATION_PROVIDER || 'mock').padEnd(24)}│`);
  console.log(`  │   Firebase:    ${process.env.FIREBASE_PROJECT_ID ? 'enabled'.padEnd(24) : 'disabled (in-memory)'.padEnd(24)}│`);
  console.log('  │                                           │');
  console.log('  ─────────────────────────────────────────────');
  console.log('');
});
