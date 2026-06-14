import CryptoJS from 'crypto-js';

/**
 * Encrypts a text message using the roomCode as the secret key.
 * @param {string} text - Plain text message
 * @param {string} roomCode - Room code (acting as key)
 * @returns {string} - Base64 encoded ciphertext
 */
export function encryptMessage(text, roomCode) {
  if (!text) return '';
  if (!roomCode) return text;
  try {
    return CryptoJS.AES.encrypt(text, roomCode).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

/**
 * Decrypts a ciphertext using the roomCode as the secret key.
 * @param {string} ciphertext - Encrypted message string
 * @param {string} roomCode - Room code (acting as key)
 * @returns {string} - Original plain text message
 */
export function decryptMessage(ciphertext, roomCode) {
  if (!ciphertext) return '';
  if (!roomCode) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, roomCode);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      return ciphertext; // Fallback to raw ciphertext
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return ciphertext; // Fallback to raw ciphertext
  }
}
