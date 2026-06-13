/**
 * Socket.io Event Handlers
 * 
 * Manages all real-time chat events: room creation/joining,
 * message sending with translation, and user presence.
 */

const { v4: uuidv4 } = require('uuid');
const { translateForRecipients } = require('../services/translationService');
const { saveRoom, saveMessage } = require('../config/firebase');
const { isValidLanguage, getLanguageInfo } = require('../utils/languages');

// ── In-Memory Storage ─────────────────────────────
// Map<roomCode, { users: Map<socketId, userInfo>, messages: [] }>
const rooms = new Map();

/**
 * Generate a 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get sanitized user list for a room (safe for client consumption)
 */
function getRoomUsers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];

  return Array.from(room.users.entries()).map(([socketId, user]) => ({
    id: socketId,
    name: user.name,
    lang: user.lang,
    langInfo: getLanguageInfo(user.lang),
  }));
}

/**
 * Register all socket event handlers
 */
function registerSocketHandlers(io, socket) {
  console.log(`[Socket] User connected: ${socket.id}`);

  // ── Create Room ───────────────────────────────────
  socket.on('create-room', ({ userName, userLang }, callback) => {
    try {
      if (!userName || !userName.trim()) {
        return callback({ error: 'Display name is required' });
      }
      if (!isValidLanguage(userLang)) {
        return callback({ error: 'Invalid language selection' });
      }

      // Generate unique room code
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      // Create room
      rooms.set(roomCode, {
        users: new Map(),
        messages: [],
        createdAt: Date.now(),
        createdBy: userName.trim(),
      });

      // Add creator to the room
      const room = rooms.get(roomCode);
      room.users.set(socket.id, {
        name: userName.trim(),
        lang: userLang,
        joinedAt: Date.now(),
      });

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.userName = userName.trim();
      socket.userLang = userLang;

      // Persist to Firebase (optional)
      saveRoom(roomCode, { createdBy: userName.trim(), maxUsers: 4 });

      console.log(`[Room] Created room ${roomCode} by ${userName} (${userLang})`);

      callback({
        success: true,
        roomCode,
        users: getRoomUsers(roomCode),
      });

      // Broadcast user list update to the room
      io.to(roomCode).emit('room-users', { users: getRoomUsers(roomCode) });
    } catch (error) {
      console.error('[Socket] Error creating room:', error);
      callback({ error: 'Failed to create room' });
    }
  });

  // ── Join Room ─────────────────────────────────────
  socket.on('join-room', ({ roomCode, userName, userLang }, callback) => {
    try {
      if (!userName || !userName.trim()) {
        return callback({ error: 'Display name is required' });
      }
      if (!isValidLanguage(userLang)) {
        return callback({ error: 'Invalid language selection' });
      }

      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return callback({ error: 'Room not found. Please check the room code.' });
      }

      if (room.users.size >= 4) {
        return callback({ error: 'Room is full (max 4 users)' });
      }

      // Check for duplicate names in the room
      for (const [, user] of room.users) {
        if (user.name.toLowerCase() === userName.trim().toLowerCase()) {
          return callback({ error: 'A user with this name is already in the room' });
        }
      }

      // Add user to room
      room.users.set(socket.id, {
        name: userName.trim(),
        lang: userLang,
        joinedAt: Date.now(),
      });

      socket.join(code);
      socket.roomCode = code;
      socket.userName = userName.trim();
      socket.userLang = userLang;

      console.log(`[Room] ${userName} (${userLang}) joined room ${code}`);

      // Send room state to the joining user
      callback({
        success: true,
        roomCode: code,
        users: getRoomUsers(code),
        messages: room.messages.slice(-50), // Last 50 messages
      });

      // Notify others in the room
      socket.to(code).emit('user-joined', {
        id: socket.id,
        name: userName.trim(),
        lang: userLang,
        langInfo: getLanguageInfo(userLang),
      });

      // Broadcast updated user list
      io.to(code).emit('room-users', { users: getRoomUsers(code) });
    } catch (error) {
      console.error('[Socket] Error joining room:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  // ── Request Room Users (on-demand refresh) ────────
  socket.on('request-room-users', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    if (rooms.has(code)) {
      socket.emit('room-users', { users: getRoomUsers(code) });
    }
  });

  // ── Send Message ──────────────────────────────────
  socket.on('send-message', async ({ text, roomCode }) => {
    try {
      if (!text || !text.trim()) return;

      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      const sender = room.users.get(socket.id);
      const messageId = uuidv4();
      const timestamp = Date.now();
      const originalText = text.trim();

      // Notify room that translation is in progress
      socket.to(code).emit('translating', { senderName: sender.name });

      // Collect unique recipient languages (excluding sender's own language)
      const recipientLangs = [];
      for (const [sid, user] of room.users) {
        if (sid !== socket.id) {
          recipientLangs.push(user.lang);
        }
      }

      // Translate for all unique recipient languages
      const translations = await translateForRecipients(
        originalText,
        sender.lang,
        recipientLangs
      );

      // Build the full message object for storage
      const messageData = {
        id: messageId,
        senderId: socket.id,
        senderName: sender.name,
        senderLang: sender.lang,
        originalText,
        translations,
        timestamp,
      };

      // Store in room's in-memory history
      room.messages.push(messageData);

      // Keep only the last 100 messages in memory
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Persist to Firebase (optional)
      saveMessage(code, messageData);

      // Send the original message back to the sender
      socket.emit('receive-message', {
        id: messageId,
        senderId: socket.id,
        senderName: sender.name,
        senderLang: sender.lang,
        translatedText: originalText, // Sender sees original
        originalText,
        isOwn: true,
        timestamp,
      });

      // Send translated messages to each recipient
      for (const [sid, user] of room.users) {
        if (sid !== socket.id) {
          const translatedText = translations[user.lang] || originalText;
          io.to(sid).emit('receive-message', {
            id: messageId,
            senderId: socket.id,
            senderName: sender.name,
            senderLang: sender.lang,
            translatedText,
            originalText,
            isOwn: false,
            timestamp,
          });
        }
      }

      console.log(`[Message] ${sender.name} in ${code}: "${originalText}" → translated to ${Object.keys(translations).join(', ')}`);
    } catch (error) {
      console.error('[Socket] Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Disconnect ────────────────────────────────────
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;

    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.users.delete(socket.id);

      console.log(`[Room] ${socket.userName} left room ${roomCode}`);

      // Notify others
      socket.to(roomCode).emit('user-left', {
        id: socket.id,
        name: socket.userName,
      });

      // Update user list
      io.to(roomCode).emit('room-users', { users: getRoomUsers(roomCode) });

      // Clean up empty rooms after a delay
      if (room.users.size === 0) {
        setTimeout(() => {
          if (rooms.has(roomCode) && rooms.get(roomCode).users.size === 0) {
            rooms.delete(roomCode);
            console.log(`[Room] Deleted empty room ${roomCode}`);
          }
        }, 60000); // 1 minute grace period
      }
    }

    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
}

module.exports = { registerSocketHandlers };
