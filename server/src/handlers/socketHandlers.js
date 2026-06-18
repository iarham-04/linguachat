/**
 * Socket.io Event Handlers — PostgreSQL Backed
 * 
 * Manages real-time room operations, client-side encryption propagation,
 * translations storage, and user status syncing with DB persistence.
 */

const { v4: uuidv4 } = require('uuid');
const { translateForRecipients } = require('../services/translationService');
const { isValidLanguage, getLanguageInfo } = require('../utils/languages');
const { encryptMessage, decryptMessage } = require('../utils/crypto');
const { query } = require('../config/db');

const EDIT_TIME_LIMIT = 2 * 60 * 1000; // 2 minutes

// In-memory presence tracker: Map<roomCode, { users: Map<socketId, userInfo>, createdAt: number }>
const rooms = new Map();

/**
 * Generate a unique 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get sanitized user list for an active room (safe for client consumption)
 */
function getRoomUsers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];

  return Array.from(room.users.entries()).map(([socketId, user]) => ({
    id: socketId,
    clerkId: user.clerkId,
    name: user.name,
    avatar: user.avatar,
    lang: user.lang,
    langInfo: getLanguageInfo(user.lang),
  }));
}

/**
 * Helper to sync or register a mock user profile in DB (for BYPASS_AUTH mode)
 */
async function syncBypassUser(socket, userName, userLang) {
  if (socket.user) return socket.user.clerkId;

  const socketSuffix = socket.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
  const mockId = `mock_${userName.toLowerCase().trim()}_${socketSuffix}`;
  const { rows } = await query(
    `INSERT INTO users (clerk_id, username, email, language, avatar) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (clerk_id) 
     DO UPDATE SET username = $2, language = $4 
     RETURNING *`,
    [mockId, userName.trim(), `${mockId}@example.com`, userLang, '🐱']
  );

  socket.user = {
    clerkId: rows[0].clerk_id,
    username: rows[0].username,
    language: rows[0].language,
    avatar: rows[0].avatar
  };

  return rows[0].clerk_id;
}

function registerSocketHandlers(io, socket) {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── Create Room ───────────────────────────────────
  socket.on('create-room', async ({ userName, userLang }, callback) => {
    try {
      if (!userName || !userName.trim()) {
        return callback({ error: 'Display name is required' });
      }
      if (!isValidLanguage(userLang)) {
        return callback({ error: 'Invalid language selection' });
      }

      // Sync user profile if in bypass mode
      const creatorClerkId = await syncBypassUser(socket, userName, userLang);

      // Attempt direct insert to save a SELECT query roundtrip.
      // In the extremely rare event of a room code collision, retry.
      let roomCode;
      let inserted = false;
      let attempts = 0;
      
      while (!inserted && attempts < 5) {
        attempts++;
        roomCode = generateRoomCode();
        try {
          await query(
            'INSERT INTO rooms (code, host_id) VALUES ($1, $2)',
            [roomCode, creatorClerkId]
          );
          inserted = true;
        } catch (dbErr) {
          // Unique key violation code in PostgreSQL is '23505'
          if (dbErr.code === '23505' && attempts < 5) {
            console.warn(`[Room] Collision detected for code ${roomCode}, retrying...`);
            continue;
          }
          throw dbErr;
        }
      }

      // Initialize room in-memory for socket tracking
      rooms.set(roomCode, {
        users: new Map(),
        createdAt: Date.now(),
        isNew: true, // Mark as brand new room
      });

      const room = rooms.get(roomCode);
      room.users.set(socket.id, {
        clerkId: creatorClerkId,
        name: socket.user.username,
        avatar: socket.user.avatar,
        lang: socket.user.language,
        joinedAt: Date.now(),
      });

      socket.join(roomCode);
      socket.roomCode = roomCode;

      console.log(`[Room] Created ${roomCode} by ${socket.user.username} (DB Backed)`);

      callback({
        success: true,
        roomCode,
        users: getRoomUsers(roomCode),
      });

      io.to(roomCode).emit('room-users', { users: getRoomUsers(roomCode) });
    } catch (error) {
      console.error('[Socket] Error creating room:', error.message);
      callback({ error: 'Failed to create room' });
    }
  });

  // ── Join Room ─────────────────────────────────────
  socket.on('join-room', async ({ roomCode, userName, userLang }, callback) => {
    try {
      if (!userName || !userName.trim()) {
        return callback({ error: 'Display name is required' });
      }
      if (!isValidLanguage(userLang)) {
        return callback({ error: 'Invalid language selection' });
      }

      const code = (roomCode || '').toUpperCase().trim();

      // Check if room exists: check in-memory first to save a DB query
      let room = rooms.get(code);
      let roomExists = !!room;

      if (!roomExists) {
        // Check if room exists and is active in database
        const { rows: roomRows } = await query(
          'SELECT * FROM rooms WHERE code = $1 AND active = true',
          [code]
        );
        if (roomRows.length === 0) {
          return callback({ error: 'Room not found. Please check the room code.' });
        }
        roomExists = true;
      }

      // Sync user profile if in bypass mode
      const joiningClerkId = await syncBypassUser(socket, userName, userLang);

      // Initialize in-memory presence room if server restarted
      if (!room) {
        room = {
          users: new Map(),
          createdAt: Date.now(),
        };
        rooms.set(code, room);
      }

      // Handle rejoining duplicates
      const socketsToRemove = [];
      for (const [sid, u] of room.users) {
        const isSameUser = u.clerkId === joiningClerkId || sid === socket.id;
        if (isSameUser) {
          socketsToRemove.push(sid);
        } else if (u.name.toLowerCase() === userName.trim().toLowerCase()) {
          return callback({ error: 'A user with this name is already in the room' });
        }
      }

      // Capacity verification
      const effectiveSize = room.users.size - socketsToRemove.length;
      if (effectiveSize >= 4) {
        return callback({ error: 'Room is full (max 4 users)' });
      }

      // Remove replaced client socket entries
      for (const sid of socketsToRemove) {
        room.users.delete(sid);
      }

      // Save new client socket entry
      room.users.set(socket.id, {
        clerkId: joiningClerkId,
        name: socket.user.username,
        avatar: socket.user.avatar,
        lang: socket.user.language,
        joinedAt: Date.now(),
      });

      socket.join(code);
      socket.roomCode = code;

      console.log(`[Room] ${socket.user.username} joined room ${code}`);

      // Query last 50 room messages from PostgreSQL (skip if brand new room)
      let dbMessages = [];
      if (room.isNew) {
        // Brand new room, no historical messages exist yet
        room.isNew = false;
      } else {
        const { rows } = await query(
          `SELECT m.*, u.username as sender_name, u.language as sender_lang, u.avatar as sender_avatar 
           FROM messages m 
           JOIN users u ON m.sender_id = u.clerk_id 
           WHERE m.room_code = $1 
           ORDER BY m.timestamp ASC LIMIT 50`,
          [code]
        );
        dbMessages = rows;
      }

      // Format message history mapping translations correctly
      const historyMessages = dbMessages.map((row) => {
        const translations = row.translations || {};
        const receiverLang = socket.user.language;
        const translatedText = translations[receiverLang] || row.original_text;

        return {
          id: row.id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          senderAvatar: row.sender_avatar,
          senderLang: row.sender_lang,
          originalText: row.original_text,
          translatedText: translatedText,
          timestamp: new Date(row.timestamp).getTime(),
          isEdited: row.is_edited,
          isUnsent: row.is_unsent,
          isOwn: row.sender_id === joiningClerkId,
        };
      });

      callback({
        success: true,
        roomCode: code,
        users: getRoomUsers(code),
        messages: historyMessages,
      });

      // Notify others in room
      if (socketsToRemove.length === 0) {
        socket.to(code).emit('user-joined', {
          id: socket.id,
          name: socket.user.username,
          avatar: socket.user.avatar,
          lang: socket.user.language,
          langInfo: getLanguageInfo(socket.user.language),
        });
      }

      io.to(code).emit('room-users', { users: getRoomUsers(code) });
    } catch (error) {
      console.error('[Socket] Error joining room:', error.message);
      callback({ error: 'Failed to join room' });
    }
  });

  // ── Request Room Users ────────────────────────────
  socket.on('request-room-users', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    if (rooms.has(code)) {
      socket.emit('room-users', { users: getRoomUsers(code) });
    }
  });

  // ── Update Language ───────────────────────────────
  socket.on('update-language', async ({ lang, roomCode }) => {
    try {
      if (!isValidLanguage(lang)) {
        return socket.emit('error', { message: 'Invalid language selection' });
      }

      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        return socket.emit('error', { message: 'You are not in this room' });
      }

      const user = room.users.get(socket.id);
      
      // Update in-memory state immediately to avoid race conditions with concurrent socket events
      user.lang = lang;
      socket.user.language = lang;
      
      // Update in DB
      await query('UPDATE users SET language = $1 WHERE clerk_id = $2', [lang, user.clerkId]);

      console.log(`[Language] ${socket.user.username} updated language to ${lang} in ${code}`);

      io.to(code).emit('room-users', { users: getRoomUsers(code) });
    } catch (error) {
      console.error('[Socket] Error updating language:', error.message);
      socket.emit('error', { message: 'Failed to update language' });
    }
  });

  // ── Update Profile ────────────────────────────────
  socket.on('update-profile', async ({ username, avatar, roomCode }, callback) => {
    try {
      if (!username || !username.trim()) {
        return callback ? callback({ error: 'Username is required' }) : null;
      }
      if (!avatar) {
        return callback ? callback({ error: 'Avatar is required' }) : null;
      }

      const cleanName = username.trim();
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        return callback ? callback({ error: 'You are not in this room' }) : null;
      }

      // Check if username is already taken in the room by someone else
      for (const [sid, u] of room.users) {
        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
        const match = u.name.match(emojiRegex);
        let otherCleanName = u.name;
        if (match && u.name.startsWith(match[0])) {
          otherCleanName = u.name.substring(match[0].length).trim();
        }
        if (sid !== socket.id && otherCleanName.toLowerCase() === cleanName.toLowerCase()) {
          return callback ? callback({ error: 'A user with this name is already in the room' }) : null;
        }
      }

      const user = room.users.get(socket.id);
      
      // Update in-memory state
      user.name = cleanName;
      user.avatar = avatar;
      socket.user.username = cleanName;
      socket.user.avatar = avatar;
      
      // Update in DB
      await query('UPDATE users SET username = $1, avatar = $2 WHERE clerk_id = $3', [cleanName, avatar, user.clerkId]);

      console.log(`[Profile] ${user.clerkId} updated profile to ${avatar} ${cleanName} in ${code}`);

      io.to(code).emit('room-users', { users: getRoomUsers(code) });

      if (callback) callback({ success: true, name: user.name });
    } catch (error) {
      console.error('[Socket] Error updating profile:', error.message);
      if (callback) callback({ error: 'Failed to update profile' });
    }
  });

  // ── Send Message ──────────────────────────────────
  socket.on('send-message', async ({ text, roomCode }) => {
    try {
      if (!text || !text.trim()) return;

      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        return socket.emit('error', { message: 'You are not in this room' });
      }

      console.log(`[Debug SendMessage] Sender: ${socket.id} (${socket.user.username}), Room: ${code}, Users in room: ${Array.from(room.users.entries()).map(([sid, u]) => `${sid} (${u.name})`).join(', ')}`);

      const decryptedText = decryptMessage(text, code);
      if (!decryptedText || !decryptedText.trim()) return;

      const originalText = decryptedText.trim();
      const timestamp = Date.now();
      const messageId = uuidv4();

      socket.to(code).emit('translating', { senderName: socket.user.username });

      // Gather recipient languages
      const recipientLangs = [];
      for (const [sid, user] of room.users) {
        if (sid !== socket.id) {
          recipientLangs.push(user.lang);
        }
      }

      // Translate per recipient language
      const translations = await translateForRecipients(
        originalText,
        socket.user.language,
        recipientLangs
      );

      // Encrypt payloads for database and propagation
      const encryptedOriginalText = encryptMessage(originalText, code);
      const encryptedTranslations = {};
      for (const lang in translations) {
        encryptedTranslations[lang] = encryptMessage(translations[lang], code);
      }

      // Persist to PostgreSQL database
      await query(
        `INSERT INTO messages (id, room_code, sender_id, original_text, translations, timestamp) 
         VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))`,
        [messageId, code, socket.user.clerkId, encryptedOriginalText, encryptedTranslations, timestamp]
      );

      // Send confirmation to sender
      socket.emit('receive-message', {
        id: messageId,
        senderId: socket.user.clerkId,
        senderName: socket.user.username,
        senderAvatar: socket.user.avatar,
        senderLang: socket.user.language,
        translatedText: encryptedOriginalText,
        originalText: encryptedOriginalText,
        isOwn: true,
        timestamp,
      });

      // Broadcast to individual clients
      for (const [sid, user] of room.users) {
        if (sid !== socket.id) {
          const translatedText = translations[user.lang] || originalText;
          const encryptedTranslatedText = encryptMessage(translatedText, code);
          io.to(sid).emit('receive-message', {
            id: messageId,
            senderId: socket.user.clerkId,
            senderName: socket.user.username,
            senderAvatar: socket.user.avatar,
            senderLang: socket.user.language,
            translatedText: encryptedTranslatedText,
            originalText: encryptedOriginalText,
            isOwn: false,
            timestamp,
          });
        }
      }

      console.log(`[Message] ${socket.user.username} in ${code}: [Stored & Dispatched]`);
    } catch (error) {
      console.error('[Socket] Error sending message:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Edit Message ──────────────────────────────────
  socket.on('edit-message', async ({ messageId, text, roomCode }, callback) => {
    try {
      if (!text || !text.trim()) return;

      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        if (callback) callback({ error: 'You are not in this room' });
        return;
      }

      // Query message from DB
      const { rows } = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
      if (rows.length === 0) {
        if (callback) callback({ error: 'Message not found' });
        return;
      }

      const message = rows[0];
      if (message.sender_id !== socket.user.clerkId) {
        if (callback) callback({ error: 'You can only edit your own messages' });
        return;
      }

      const elapsed = Date.now() - new Date(message.timestamp).getTime();
      if (elapsed > EDIT_TIME_LIMIT) {
        if (callback) callback({ error: 'Time limit for editing has expired' });
        return;
      }

      const decryptedText = decryptMessage(text, code);
      if (!decryptedText || !decryptedText.trim()) return;

      const originalText = decryptedText.trim();

      // Gather recipient languages
      const recipientLangs = [];
      for (const [sid, user] of room.users) {
        if (sid !== socket.id) {
          recipientLangs.push(user.lang);
        }
      }

      const translations = await translateForRecipients(
        originalText,
        socket.user.language,
        recipientLangs
      );

      const encryptedOriginalText = encryptMessage(originalText, code);
      const encryptedTranslations = {};
      for (const lang in translations) {
        encryptedTranslations[lang] = encryptMessage(translations[lang], code);
      }

      // Update in Database
      await query(
        `UPDATE messages 
         SET original_text = $1, translations = $2, is_edited = true 
         WHERE id = $3`,
        [encryptedOriginalText, encryptedTranslations, messageId]
      );

      // Broadcast changes to active room clients
      for (const [sid, user] of room.users) {
        const isSelf = sid === socket.id;
        const translatedText = isSelf ? originalText : (translations[user.lang] || originalText);
        const encryptedTranslatedText = encryptMessage(translatedText, code);

        io.to(sid).emit('message-edited', {
          id: messageId,
          translatedText: encryptedTranslatedText,
          originalText: encryptedOriginalText,
        });
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('[Socket] Error editing message:', error.message);
      if (callback) callback({ error: 'Failed to edit message' });
    }
  });

  // ── Unsend Message ────────────────────────────────
  socket.on('unsend-message', async ({ messageId, roomCode }, callback) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room || !room.users.has(socket.id)) {
        if (callback) callback({ error: 'You are not in this room' });
        return;
      }

      // Query message from DB
      const { rows } = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
      if (rows.length === 0) {
        if (callback) callback({ error: 'Message not found' });
        return;
      }

      const message = rows[0];
      if (message.sender_id !== socket.user.clerkId) {
        if (callback) callback({ error: 'You can only unsend your own messages' });
        return;
      }

      const elapsed = Date.now() - new Date(message.timestamp).getTime();
      if (elapsed > EDIT_TIME_LIMIT) {
        if (callback) callback({ error: 'Time limit for unsending has expired' });
        return;
      }

      // Delete from Database
      await query('DELETE FROM messages WHERE id = $1', [messageId]);

      // Broadcast unsend trigger
      io.to(code).emit('message-unsent', { id: messageId });

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('[Socket] Error unsending message:', error.message);
      if (callback) callback({ error: 'Failed to unsend message' });
    }
  });

  // ── Disconnect ────────────────────────────────────
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;

    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const isRegistered = room.users.has(socket.id);

      if (isRegistered) {
        room.users.delete(socket.id);

        console.log(`[Room] ${socket.user.username} left room ${roomCode}`);

        // Notify others
        socket.to(roomCode).emit('user-left', {
          id: socket.id,
          name: socket.user.username,
          avatar: socket.user.avatar,
        });

        io.to(roomCode).emit('room-users', { users: getRoomUsers(roomCode) });

        // Gracefully clean up active room presence after a delay
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomCode) && rooms.get(roomCode).users.size === 0) {
              rooms.delete(roomCode);
              console.log(`[Room] Deleted in-memory active space ${roomCode}`);
            }
          }, 60000);
        }
      }
    }

    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
}

module.exports = { registerSocketHandlers };
