const CryptoJS = require('crypto-js');

const ENCRYPTION_VERSION = 'v2';
const PBKDF2_ITERATIONS = 25000;
const PBKDF2_KEY_SIZE = 256 / 32;
const SALT_BYTES = 16;
const IV_BYTES = 16;
const SHARED_SECRET = process.env.MESSAGE_ENCRYPTION_SECRET || '';

function buildSecret(roomCode) {
  return `${roomCode}:${SHARED_SECRET}`;
}

function deriveKeys(secret, salt) {
  return {
    encryptionKey: CryptoJS.PBKDF2(`enc:${secret}`, salt, {
      keySize: PBKDF2_KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    }),
    macKey: CryptoJS.PBKDF2(`mac:${secret}`, salt, {
      keySize: PBKDF2_KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    }),
  };
}

function secureCompare(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Encrypts a text message using the roomCode as the secret key.
 * @param {string} text - Plain text message
 * @param {string} roomCode - Room code (acting as key)
 * @returns {string} - Base64 encoded ciphertext
 */
function encryptMessage(text, roomCode) {
  if (!text) return '';
  if (!roomCode) return '';
  try {
    const salt = CryptoJS.lib.WordArray.random(SALT_BYTES);
    const iv = CryptoJS.lib.WordArray.random(IV_BYTES);
    const secret = buildSecret(roomCode);
    const { encryptionKey, macKey } = deriveKeys(secret, salt);
    const encrypted = CryptoJS.AES.encrypt(text, encryptionKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const payload = [
      ENCRYPTION_VERSION,
      CryptoJS.enc.Base64.stringify(salt),
      CryptoJS.enc.Base64.stringify(iv),
      CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
    ].join('.');
    const mac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Base64);

    return `${payload}.${mac}`;
  } catch {
    return '';
  }
}

/**
 * Decrypts a ciphertext using the roomCode as the secret key.
 * @param {string} ciphertext - Encrypted message string
 * @param {string} roomCode - Room code (acting as key)
 * @returns {string} - Original plain text message
 */
function decryptMessage(ciphertext, roomCode) {
  if (!ciphertext) return '';
  if (!roomCode) return '';
  try {
    if (ciphertext.startsWith(`${ENCRYPTION_VERSION}.`)) {
      const parts = ciphertext.split('.');
      if (parts.length !== 5) return '';

      const [, saltB64, ivB64, cipherB64, macB64] = parts;
      const payload = parts.slice(0, 4).join('.');
      const salt = CryptoJS.enc.Base64.parse(saltB64);
      const iv = CryptoJS.enc.Base64.parse(ivB64);
      const secret = buildSecret(roomCode);
      const { encryptionKey, macKey } = deriveKeys(secret, salt);
      const expectedMac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Base64);

      if (!secureCompare(expectedMac, macB64)) return '';

      const bytes = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(cipherB64) },
        encryptionKey,
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '';
    }

    // Backward compatibility for legacy ciphertext.
    const legacy = CryptoJS.AES.decrypt(ciphertext, roomCode).toString(CryptoJS.enc.Utf8);
    return legacy || '';
  } catch {
    return '';
  }
}

module.exports = {
  encryptMessage,
  decryptMessage,
};
