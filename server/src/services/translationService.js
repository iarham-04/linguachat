/**
 * Translation Service — Abstraction Layer
 * 
 * Provides a unified interface for translation, regardless of the
 * underlying provider (mock, Google Cloud, DeepL, etc.).
 * 
 * The provider is selected via the TRANSLATION_PROVIDER environment variable.
 * 
 * Usage:
 *   const { translateForRecipients } = require('./translationService');
 *   const translations = await translateForRecipients('Hello', 'en', ['ru', 'es', 'en']);
 *   // => { ru: '[Russian] Hello', es: '[Spanish] Hello', en: 'Hello' }
 */

const mockTranslator = require('./mockTranslator');

/**
 * Get the active translator module based on environment config.
 * @returns {{ translate: Function }}
 */
function getTranslator() {
  const provider = process.env.TRANSLATION_PROVIDER || 'mock';

  switch (provider) {
    case 'mock':
      return mockTranslator;

    case 'google':
      // Future: return require('./googleTranslator');
      console.warn('[TranslationService] Google translator not yet implemented, falling back to mock');
      return mockTranslator;

    case 'deepl':
      // Future: return require('./deeplTranslator');
      console.warn('[TranslationService] DeepL translator not yet implemented, falling back to mock');
      return mockTranslator;

    default:
      console.warn(`[TranslationService] Unknown provider "${provider}", falling back to mock`);
      return mockTranslator;
  }
}

const { translateWithCache } = require('../lib/translateWithCache');

/**
 * Translate a single text string from source language to target language.
 * 
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} Translated text
 */
async function translate(text, sourceLang, targetLang) {
  if (sourceLang === targetLang) return text;
  try {
    const res = await translateWithCache(text, targetLang, sourceLang);
    return res.translatedText;
  } catch (err) {
    console.warn('[TranslationService] Cache layer failed, using raw translator:', err.message);
    const translator = getTranslator();
    return translator.translate(text, sourceLang, targetLang);
  }
}

/**
 * Translate a message for multiple recipient languages.
 * Deduplicates languages so each unique language is translated only once.
 * 
 * @param {string} text - Original message text
 * @param {string} sourceLang - Source language code
 * @param {string[]} targetLangs - Array of target language codes (may contain duplicates)
 * @returns {Promise<Object>} Map of { langCode: translatedText }
 */
async function translateForRecipients(text, sourceLang, targetLangs) {
  // Deduplicate target languages
  const uniqueLangs = [...new Set(targetLangs)];

  // Translate in parallel for all unique languages
  const translationPromises = uniqueLangs.map(async (lang) => {
    const translated = await translate(text, sourceLang, lang);
    return { lang, translated };
  });

  const results = await Promise.all(translationPromises);

  // Build the translations map
  const translations = {};
  for (const { lang, translated } of results) {
    translations[lang] = translated;
  }

  return translations;
}

module.exports = { translate, translateForRecipients };
