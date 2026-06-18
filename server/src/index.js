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
const { initDb, query } = require('./config/db');
const { ClerkExpressWithAuth, clerkClient, verifyToken } = require('@clerk/clerk-sdk-node');

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

// Authentication middleware wrapper with BYPASS_AUTH support
function optionalClerkAuth(req, res, next) {
  if (process.env.BYPASS_AUTH === 'true') {
    const mockUser = req.headers['x-mock-user'] || 'mock_alice';
    req.auth = { userId: mockUser };
    return next();
  }
  ClerkExpressWithAuth()(req, res, next);
}

// Get current user profile from DB
app.get('/api/users/me', optionalClerkAuth, async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { rows } = await query('SELECT * FROM users WHERE clerk_id = $1', [req.auth.userId]);
    if (rows.length > 0) {
      return res.json({ exists: true, user: rows[0] });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('[API] Error getting user profile:', error.message);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Create/Update user profile
app.post('/api/users/profile', optionalClerkAuth, async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { username, language, avatar } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar is required' });
    }

    // Resolve email (mocked for bypass, otherwise fetched from Clerk API)
    let email = 'mock@example.com';
    if (process.env.BYPASS_AUTH !== 'true') {
      try {
        const clerkUser = await clerkClient.users.getUser(req.auth.userId);
        email = clerkUser.emailAddresses[0]?.emailAddress || '';
      } catch (clerkErr) {
        console.warn('[Clerk] Failed to get email address, fallback to placeholder:', clerkErr.message);
      }
    } else {
      email = `${req.auth.userId}@example.com`;
    }

    const { rows } = await query(
      `INSERT INTO users (clerk_id, username, email, language, avatar) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (clerk_id) 
       DO UPDATE SET username = $2, language = $4, avatar = $5 
       RETURNING *`,
      [req.auth.userId, username.trim(), email, language, avatar]
    );

    return res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('[API] Error syncing user profile:', error.message);
    return res.status(500).json({ error: 'Database error' });
  }
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

// ── Initialize Services & Sockets ─────────────────
initFirebase();

// Socket.io Clerk token authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (process.env.BYPASS_AUTH === 'true') {
      return next();
    }

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify Clerk session token
    const decoded = await verifyToken(token);
    const clerkId = decoded.sub;

    // Fetch user profile from database
    const { rows } = await query('SELECT * FROM users WHERE clerk_id = $1', [clerkId]);
    if (rows.length === 0) {
      return next(new Error('User profile not set up'));
    }

    const user = rows[0];
    socket.user = {
      clerkId: user.clerk_id,
      username: user.username,
      language: user.language,
      avatar: user.avatar
    };
    return next();
  } catch (err) {
    console.error('[Socket Auth] Verification failed:', err.message);
    return next(new Error('Authentication failed'));
  }
});

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

// ── Periodic Database Cleanup ─────────────────────
function startDatabaseCleanup() {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run every hour
  
  const runCleanup = async () => {
    try {
      console.log('[Cleanup] Running periodic database cleanup...');
      
      // Delete messages older than 24 hours
      const msgRes = await query("DELETE FROM messages WHERE timestamp < NOW() - INTERVAL '24 hours'");
      
      // Delete rooms that have no messages and were created more than 24 hours ago
      const roomRes = await query(`
        DELETE FROM rooms 
        WHERE created_at < NOW() - INTERVAL '24 hours'
        AND code NOT IN (SELECT DISTINCT room_code FROM messages)
      `);
      
      console.log(`[Cleanup] Removed ${msgRes.rowCount || 0} old messages and ${roomRes.rowCount || 0} empty rooms.`);
    } catch (err) {
      console.error('[Cleanup] Database cleanup failed:', err.message);
    }
  };

  // Run immediately on boot
  runCleanup();
  
  // Schedule periodically
  setInterval(runCleanup, CLEANUP_INTERVAL);
}

// ── Boot Server ───────────────────────────────────
async function startServer() {
  try {
    // Ensure DB tables exist
    await initDb();
    
    // Start periodic cleanup of chats/rooms older than 24 hours
    startDatabaseCleanup();
    
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
  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
