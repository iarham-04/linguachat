/**
 * Firebase Configuration — Optional Persistence Layer
 * 
 * Initializes Firebase Admin SDK and provides Firestore helpers.
 * Only activates if FIREBASE_PROJECT_ID is set in environment variables.
 * Otherwise, all methods are no-ops.
 */

let db = null;
let isEnabled = false;

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.log('[Firebase] No FIREBASE_PROJECT_ID set — using in-memory storage');
    return;
  }

  try {
    const admin = require('firebase-admin');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    isEnabled = true;
    console.log('[Firebase] Connected to Firestore successfully');
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error.message);
    console.log('[Firebase] Falling back to in-memory storage');
  }
}

/**
 * Save a room to Firestore
 */
async function saveRoom(roomCode, roomData) {
  if (!isEnabled) return;
  try {
    await db.collection('rooms').doc(roomCode).set({
      ...roomData,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('[Firebase] Error saving room:', error.message);
  }
}

/**
 * Save a message to Firestore (subcollection under room)
 */
async function saveMessage(roomCode, messageData) {
  if (!isEnabled) return;
  try {
    await db.collection('rooms').doc(roomCode)
      .collection('messages').add({
        ...messageData,
        timestamp: new Date(),
      });
  } catch (error) {
    console.error('[Firebase] Error saving message:', error.message);
  }
}

/**
 * Get message history for a room
 */
async function getRoomMessages(roomCode, limit = 50) {
  if (!isEnabled) return [];
  try {
    const snapshot = await db.collection('rooms').doc(roomCode)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[Firebase] Error getting messages:', error.message);
    return [];
  }
}

module.exports = { initFirebase, saveRoom, saveMessage, getRoomMessages };
