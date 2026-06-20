/**
 * LinguaChat Server — Entry Point
 * 
 * Express + Socket.io server that handles real-time multilingual chat.
 * Translation happens server-side before delivering messages to each recipient.
 * 
 * Security Layers:
 *   Layer 1 → In Transit    : HTTPS/TLS via Render (automatic)
 *   Layer 2 → Auth          : Clerk JWT on every API + Socket.io
 *   Layer 3 → Application   : Helmet, CORS, Rate limiting, Input sanitization, XSS prevention
 *   Layer 4 → At Rest       : Neon PostgreSQL encrypted by default
 *   Layer 5 → Code          : Env validation, safe error handling, request logging
 */

require('dotenv').config();

// ── Environment Variable Validation ───────────────
// Crash early if required env vars are missing (skip in BYPASS_AUTH dev mode)
if (process.env.BYPASS_AUTH !== 'true') {
  const required = [
    'DATABASE_URL',
    'CLERK_SECRET_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  console.log('✅ All required environment variables present');
} else {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required even in BYPASS_AUTH mode');
    process.exit(1);
  }
  console.log('✅ Environment variables verified (BYPASS_AUTH mode)');
}

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initFirebase } = require('./config/firebase');
const { registerSocketHandlers } = require('./handlers/socketHandlers');
const { initDb, query } = require('./config/db');
const { ClerkExpressWithAuth, clerkClient, verifyToken } = require('@clerk/clerk-sdk-node');

// ── Configuration ─────────────────────────────────
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'https://linguachat-vy6y.onrender.com',  // production
  'http://localhost:3000',                   // local dev
  'http://localhost:3001',                   // local dev (same port)
  'http://localhost:5173',                   // Vite dev server
  'http://localhost:5174',                   // Vite fallback port
  'http://127.0.0.1:5173',                  // Vite dev alternative
];

// ── Express App ───────────────────────────────────
const app = express();

// ── B. HELMET (Security HTTP Headers) ─────────────
// Must be added BEFORE all routes
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:", "https://api.clerk.dev",
                   "https://*.clerk.accounts.dev",
                   "https://*.neon.tech"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
                  "https://*.clerk.accounts.dev"],
      styleSrc: ["'self'", "'unsafe-inline'",
                 "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      frameSrc: ["'self'", "https://*.clerk.accounts.dev"],
      workerSrc: ["'self'", "blob:"],
    }
  },
  crossOriginEmbedderPolicy: false,  // needed for Socket.io
  crossOriginOpenerPolicy: false,    // needed for Clerk popups
}));

// ── C. CORS (Cross-Origin Resource Sharing) ───────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Allow file uploads up to 10MB

// ── D. RATE LIMITING ──────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                    // 100 requests per window
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in BYPASS_AUTH dev mode for E2E tests
  skip: () => process.env.BYPASS_AUTH === 'true',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                     // 20 attempts per window
  message: { error: 'Too many auth attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.BYPASS_AUTH === 'true',
});

app.use('/api', generalLimiter);
app.use('/api/users/profile', authLimiter);

// ── E. INPUT SANITIZATION ─────────────────────────
app.use((req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .slice(0, 5000)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
      );
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  next();
});

// ── I. REQUEST LOGGING (Security Monitoring) ──────
app.use((req, res, next) => {
  // Log suspicious patterns
  if (req.path.includes('..') ||
      req.path.includes('<script') ||
      req.path.toLowerCase().includes('union select')) {
    console.warn('⚠️  Suspicious request detected:', {
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.auth?.userId || 'unauthenticated'
    });
  }
  next();
});

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
    security: 'helmet+cors+rateLimit+sanitization',
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

// ── F. HTTP Server + Socket.io (Secured) ──────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  // Prevent oversized payloads (10MB for file sharing)
  maxHttpBufferSize: 10e6,
  // Ping/pong timeout settings
  pingTimeout: 60000,
  pingInterval: 25000,
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
    const decoded = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const clerkId = decoded.sub;

    // Attach userId for sender verification
    socket.userId = clerkId;

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

// ── J. GLOBAL ERROR HANDLER ──────────────────────
// Must be the LAST middleware registered
app.use((err, req, res, next) => {
  // Log full error internally
  console.error('Internal error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    userId: req.auth?.userId
  });

  // Send sanitized error to client (never expose stack traces)
  const status = err.status || 500;
  const message = status === 500
    ? 'Something went wrong. Please try again.'
    : err.message;

  res.status(status).json({ error: message });
});

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

// ── Periodic Database Keep-Alive ──────────────────
function startDatabaseKeepAlive() {
  const KEEPALIVE_INTERVAL = 4 * 60 * 1000; // Run every 4 minutes to prevent Neon auto-suspend
  
  const runPing = async () => {
    try {
      const start = Date.now();
      await query('SELECT 1');
      console.log(`[Database Keep-Alive] Ping successful in ${Date.now() - start}ms`);
    } catch (err) {
      console.error('[Database Keep-Alive] Ping failed:', err.message);
    }
  };

  // Run once shortly after startup
  setTimeout(runPing, 5000);
  
  // Schedule periodically
  setInterval(runPing, KEEPALIVE_INTERVAL);
}

// ── Periodic Server Keep-Alive (Self-Ping) ────────
function startServerKeepAlive() {
  const selfUrl = process.env.SELF_URL;
  if (!selfUrl) {
    console.log('[Server Keep-Alive] SELF_URL not configured — auto-sleep prevention disabled');
    return;
  }

  const pingUrl = `${selfUrl.replace(/\/$/, '')}/api/health`;
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes (Render spins down after 15m)

  const https = require('https');
  const http = require('http');
  const client = pingUrl.startsWith('https') ? https : http;

  const runPing = () => {
    client.get(pingUrl, (res) => {
      console.log(`[Server Keep-Alive] Self-ping successful: status ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[Server Keep-Alive] Self-ping failed:', err.message);
    });
  };

  // Run once shortly after startup
  setTimeout(runPing, 10000);

  // Schedule periodically
  setInterval(runPing, PING_INTERVAL);
  console.log(`[Server Keep-Alive] Scheduled self-ping to ${pingUrl} every 10 minutes`);
}

// ── Boot Server ───────────────────────────────────
async function startServer() {
  try {
    // Ensure DB tables exist
    await initDb();
    
    // Start periodic cleanup of chats/rooms older than 24 hours
    startDatabaseCleanup();
    
    // Start periodic database keep-alive pings
    startDatabaseKeepAlive();

    // Start periodic server keep-alive pings
    startServerKeepAlive();
    
    server.listen(PORT, () => {
      console.log('');
      console.log('  🔒 ─────────────────────────────────────────');
      console.log('  │                                           │');
      console.log(`  │   LinguaChat Server running on port ${PORT}   │`);
      console.log('  │                                           │');
      console.log(`  │   Translation: ${(process.env.TRANSLATION_PROVIDER || 'mock').padEnd(24)}│`);
      console.log(`  │   Firebase:    ${process.env.FIREBASE_PROJECT_ID ? 'enabled'.padEnd(24) : 'disabled (in-memory)'.padEnd(24)}│`);
      console.log(`  │   Security:    ${'helmet+cors+rateLimit'.padEnd(24)}│`);
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
