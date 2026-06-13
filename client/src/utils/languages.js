/**
 * Supported Languages — shared configuration
 * Used for the language picker dropdown and message flag badges.
 */

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Mandarin', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

/**
 * Get language info by code
 */
export function getLanguage(code) {
  return LANGUAGES.find(l => l.code === code) || null;
}

/**
 * Get flag emoji for a language code
 */
export function getFlag(code) {
  const lang = getLanguage(code);
  return lang ? lang.flag : '🌐';
}

/**
 * Get display name for a language code
 */
export function getLanguageName(code) {
  const lang = getLanguage(code);
  return lang ? lang.name : code;
}
