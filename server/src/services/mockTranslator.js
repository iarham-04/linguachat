/**
 * Mock Translation Service
 * 
 * Simulates translation by prefixing the original text with the target
 * language code. Adds an artificial delay to simulate API latency.
 * 
 * Replace this module with a real translator (e.g., googleTranslator.js)
 * by implementing the same `translate(text, sourceLang, targetLang)` interface.
 */

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ru: 'Russian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Mandarin',
  ar: 'Arabic',
  pt: 'Portuguese',
  ja: 'Japanese',
};

/**
 * Simulate translation by prefixing the text with a target language marker.
 * In production, replace this with actual API calls to Google Translate, DeepL, etc.
 * 
 * @param {string} text - The text to translate
 * @param {string} sourceLang - Source language code (e.g., 'en')
 * @param {string} targetLang - Target language code (e.g., 'ru')
 * @returns {Promise<string>} The "translated" text
 */
async function translate(text, sourceLang, targetLang) {
  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // Simulate network latency (200-500ms)
  const delay = Math.floor(Math.random() * 300) + 200;
  await new Promise(resolve => setTimeout(resolve, delay));

  const langName = LANGUAGE_NAMES[targetLang] || targetLang.toUpperCase();
  return `[${langName}] ${text}`;
}

module.exports = { translate };
