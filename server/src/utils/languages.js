/**
 * Language utilities shared between server modules
 */

const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  hi: { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  ru: { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  fr: { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  de: { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  zh: { name: 'Mandarin', flag: '🇨🇳', nativeName: '中文' },
  ar: { name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  pt: { name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
  ja: { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  tr: { name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
};

function isValidLanguage(langCode) {
  return langCode in SUPPORTED_LANGUAGES;
}

function getLanguageInfo(langCode) {
  return SUPPORTED_LANGUAGES[langCode] || null;
}

module.exports = { SUPPORTED_LANGUAGES, isValidLanguage, getLanguageInfo };
