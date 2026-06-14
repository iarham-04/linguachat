/**
 * LinguaChat E2E Test Script
 * 
 * Tests the complete flow: create room, join room, send messages,
 * verify translation and original text preservation.
 * 
 * Run: node test/e2e.js
 */

const { io } = require('socket.io-client');
const { encryptMessage, decryptMessage } = require('../src/utils/crypto');

const SERVER_URL = 'http://localhost:3001';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n🌐 LinguaChat E2E Test Suite\n');
  console.log('═'.repeat(50));

  // ── Test 1: Create Room ──────────────────────────
  console.log('\n📋 Test 1: Create Room');
  
  const alice = io(SERVER_URL);
  await new Promise(resolve => alice.on('connect', resolve));
  assert(alice.connected, 'Alice connected to server');

  const createResult = await new Promise(resolve => {
    alice.emit('create-room', { userName: 'Alice', userLang: 'en' }, resolve);
  });

  assert(createResult.success, 'Room created successfully');
  assert(createResult.roomCode && createResult.roomCode.length === 6, `Room code generated: ${createResult.roomCode}`);
  assert(createResult.users.length === 1, 'Alice is in the room');
  
  const roomCode = createResult.roomCode;

  // ── Test 2: Join Room ────────────────────────────
  console.log('\n📋 Test 2: Join Room');

  const boris = io(SERVER_URL);
  await new Promise(resolve => boris.on('connect', resolve));
  assert(boris.connected, 'Boris connected to server');

  // Test joining with correct code
  const joinResult = await new Promise(resolve => {
    boris.emit('join-room', { roomCode, userName: 'Boris', userLang: 'ru' }, resolve);
  });

  assert(joinResult.success, 'Boris joined room successfully');
  assert(joinResult.users.length === 2, 'Both users are in the room');

  // Wait for Alice to receive the user-joined event
  await sleep(200);

  // ── Test 3: Join Room Validation ─────────────────
  console.log('\n📋 Test 3: Join Validation');

  const dupUser = io(SERVER_URL);
  await new Promise(resolve => dupUser.on('connect', resolve));

  // Test duplicate name
  const dupResult = await new Promise(resolve => {
    dupUser.emit('join-room', { roomCode, userName: 'Alice', userLang: 'fr' }, resolve);
  });
  assert(dupResult.error !== undefined, 'Duplicate name rejected');

  // Test invalid room code
  const badResult = await new Promise(resolve => {
    dupUser.emit('join-room', { roomCode: 'ZZZZZZ', userName: 'Charlie', userLang: 'fr' }, resolve);
  });
  assert(badResult.error !== undefined, 'Invalid room code rejected');

  dupUser.disconnect();

  // ── Test 4: Send Message & Translation ───────────
  console.log('\n📋 Test 4: Send Message & Translation');

  // Set up message listeners with decryption
  const aliceMessages = [];
  const borisMessages = [];

  alice.on('receive-message', (msg) => {
    aliceMessages.push({
      ...msg,
      translatedText: decryptMessage(msg.translatedText, roomCode),
      originalText: decryptMessage(msg.originalText, roomCode),
    });
  });

  boris.on('receive-message', (msg) => {
    borisMessages.push({
      ...msg,
      translatedText: decryptMessage(msg.translatedText, roomCode),
      originalText: decryptMessage(msg.originalText, roomCode),
    });
  });

  // Alice sends a message (encrypted)
  alice.emit('send-message', { text: encryptMessage('Hello, Boris!', roomCode), roomCode });

  // Wait for translation to complete
  await sleep(1000);

  assert(aliceMessages.length === 1, 'Alice received her own message back');
  assert(aliceMessages[0].isOwn === true, 'Alice\'s message marked as own');
  assert(aliceMessages[0].translatedText === 'Hello, Boris!', 'Alice sees original text (not translated)');
  assert(aliceMessages[0].originalText === 'Hello, Boris!', 'Original text preserved for Alice');

  assert(borisMessages.length === 1, 'Boris received Alice\'s message');
  assert(borisMessages[0].isOwn === false, 'Boris\'s received message marked as not own');
  assert(borisMessages[0].translatedText === '[Russian] Hello, Boris!', `Boris sees translated text: "${borisMessages[0].translatedText}"`);
  assert(borisMessages[0].originalText === 'Hello, Boris!', 'Original text preserved for Boris');
  assert(borisMessages[0].senderName === 'Alice', 'Sender name is correct');
  assert(borisMessages[0].senderLang === 'en', 'Sender language is correct');

  // ── Test 5: Reverse Translation ──────────────────
  console.log('\n📋 Test 5: Reverse Translation (Boris → Alice)');

  // Clear previous messages
  aliceMessages.length = 0;
  borisMessages.length = 0;

  // Boris sends a message (encrypted)
  boris.emit('send-message', { text: encryptMessage('Привет, Алиса!', roomCode), roomCode });

  await sleep(1000);

  assert(borisMessages.length === 1, 'Boris received his own message back');
  assert(borisMessages[0].translatedText === 'Привет, Алиса!', 'Boris sees original Russian text');

  assert(aliceMessages.length === 1, 'Alice received Boris\'s message');
  assert(aliceMessages[0].translatedText === '[English] Привет, Алиса!', `Alice sees translated text: "${aliceMessages[0].translatedText}"`);
  assert(aliceMessages[0].originalText === 'Привет, Алиса!', 'Original Russian text preserved for Alice');
  assert(aliceMessages[0].senderLang === 'ru', 'Sender language (ru) is correct');

  // ── Test 6: Multi-user Translation ───────────────
  console.log('\n📋 Test 6: Multi-user (3 languages)');

  const carlos = io(SERVER_URL);
  await new Promise(resolve => carlos.on('connect', resolve));

  const carlosJoin = await new Promise(resolve => {
    carlos.emit('join-room', { roomCode, userName: 'Carlos', userLang: 'es' }, resolve);
  });
  assert(carlosJoin.success, 'Carlos (Spanish) joined room');
  assert(carlosJoin.users.length === 3, '3 users in room');

  const carlosMessages = [];
  carlos.on('receive-message', (msg) => {
    carlosMessages.push({
      ...msg,
      translatedText: decryptMessage(msg.translatedText, roomCode),
      originalText: decryptMessage(msg.originalText, roomCode),
    });
  });

  aliceMessages.length = 0;
  borisMessages.length = 0;

  // Alice sends to everyone (encrypted)
  alice.emit('send-message', { text: encryptMessage('Hello everyone!', roomCode), roomCode });
  await sleep(1000);

  assert(borisMessages.length === 1 && borisMessages[0].translatedText === '[Russian] Hello everyone!',
    'Boris receives Russian translation');
  assert(carlosMessages.length === 1 && carlosMessages[0].translatedText === '[Spanish] Hello everyone!',
    'Carlos receives Spanish translation');
  assert(aliceMessages[0].translatedText === 'Hello everyone!',
    'Alice sees her own message untranslated');

  // ── Test 7: Max Users Limit ──────────────────────
  console.log('\n📋 Test 7: Room Capacity');

  const user4 = io(SERVER_URL);
  await new Promise(resolve => user4.on('connect', resolve));
  const join4 = await new Promise(resolve => {
    user4.emit('join-room', { roomCode, userName: 'Dina', userLang: 'fr' }, resolve);
  });
  assert(join4.success, 'Dina (4th user) joined — room at max capacity');

  const user5 = io(SERVER_URL);
  await new Promise(resolve => user5.on('connect', resolve));
  const join5 = await new Promise(resolve => {
    user5.emit('join-room', { roomCode, userName: 'Eve', userLang: 'de' }, resolve);
  });
  assert(join5.error !== undefined, '5th user rejected — room is full');

  user5.disconnect();

  // ── Test 8: Live Language Switching ────────────────
  console.log('\n📋 Test 8: Live Language Switching');

  // Alice changes her language from 'en' to 'es' (Spanish)
  alice.emit('update-language', { lang: 'es', roomCode });
  await sleep(200);

  // Boris sends a message (encrypted)
  aliceMessages.length = 0;
  boris.emit('send-message', { text: encryptMessage('How are you?', roomCode), roomCode });
  await sleep(1000);

  assert(aliceMessages.length === 1, 'Alice received Boris\'s message after language update');
  assert(aliceMessages[0].translatedText === '[Spanish] How are you?', 
    `Alice gets message translated to Spanish: "${aliceMessages[0].translatedText}"`);

  // ── Summary ──────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed.\n');
  }

  // Cleanup
  alice.disconnect();
  boris.disconnect();
  carlos.disconnect();
  user4.disconnect();

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
