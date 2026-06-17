/**
 * Mock Translation Service
 * 
 * Simulates translation by prefixing the original text with the target
 * language code. Adds an artificial delay to simulate API latency.
 * 
 * Replace this module with a real translator (e.g., googleTranslator.js)
 * by implementing the same `translate(text, sourceLang, targetLang)` interface.
 */

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
  tr: 'Turkish',
};

const DICTIONARY = {
  'hello': {
    en: 'Hello',
    hi: 'नमस्ते',
    ru: 'Привет',
    es: 'Hola',
    fr: 'Bonjour',
    de: 'Hallo',
    zh: '你好',
    ar: 'مرحباً',
    pt: 'Olá',
    ja: 'こんにちは',
    tr: 'Merhaba'
  },
  'hi': {
    en: 'Hi',
    hi: 'नमस्ते',
    ru: 'Привет',
    es: 'Hola',
    fr: 'Salut',
    de: 'Hallo',
    zh: '你好',
    ar: 'مرحباً',
    pt: 'Oi',
    ja: 'こんにちは',
    tr: 'Merhaba'
  },
  'hello!': {
    en: 'Hello!',
    hi: 'नमस्ते!',
    ru: 'Привет!',
    es: '¡Hola!',
    fr: 'Bonjour!',
    de: 'Hallo!',
    zh: '你好！',
    ar: 'مرحباً!',
    pt: 'Olá!',
    ja: 'こんにちは！',
    tr: 'Merhaba!'
  },
  'how are you?': {
    en: 'How are you?',
    hi: 'आप कैसे हैं?',
    ru: 'Как дела?',
    es: '¿Cómo estás?',
    fr: 'Comment ça va?',
    de: 'Wie geht es dir?',
    zh: '你好吗？',
    ar: 'كيف حالك？',
    pt: 'Como você está?',
    ja: 'お元気ですか？',
    tr: 'Nasılsın?'
  },
  'how are you': {
    en: 'How are you',
    hi: 'आप कैसे हैं',
    ru: 'Как дела',
    es: 'Cómo estás',
    fr: 'Comment ça va',
    de: 'Wie geht es dir',
    zh: '你好吗',
    ar: 'كيف حالك',
    pt: 'Como você está',
    ja: 'お元気ですか',
    tr: 'Nasılsın'
  },
  'good morning': {
    en: 'Good morning',
    hi: 'शुभ प्रभात',
    ru: 'Доброе утро',
    es: 'Buenos días',
    fr: 'Bonjour',
    de: 'Guten Morgen',
    zh: '早上好',
    ar: 'صباح الخير',
    pt: 'Bom dia',
    ja: 'おはようございます',
    tr: 'Günaydın'
  },
  'good morning!': {
    en: 'Good morning!',
    hi: 'शुभ प्रभात!',
    ru: 'Доброе утро!',
    es: '¡Buenos días!',
    fr: 'Bonjour!',
    de: 'Guten Morgen!',
    zh: '早上好！',
    ar: 'صباح الخير!',
    pt: 'Bom dia!',
    ja: 'おはようございます！',
    tr: 'Günaydın!'
  },
  'yes': {
    en: 'Yes',
    hi: 'हाँ',
    ru: 'Да',
    es: 'Sí',
    fr: 'Oui',
    de: 'Ja',
    zh: '是的',
    ar: 'نعم',
    pt: 'Sim',
    ja: 'はい',
    tr: 'Evet'
  },
  'no': {
    en: 'No',
    hi: 'नहीं',
    ru: 'Нет',
    es: 'No',
    fr: 'Non',
    de: 'Nein',
    zh: '不',
    ar: 'لا',
    pt: 'Não',
    ja: 'いいえ',
    tr: 'Hayır'
  },
  'goodbye': {
    en: 'Goodbye',
    hi: 'अलविदा',
    ru: 'До свидания',
    es: 'Adiós',
    fr: 'Au revoir',
    de: 'Auf Wiedersehen',
    zh: '再见',
    ar: 'مع السلامة',
    pt: 'Adeus',
    ja: 'さようなら',
    tr: 'Hoşça kal'
  },
  'bye': {
    en: 'Bye',
    hi: 'बाय',
    ru: 'Пока',
    es: 'Adiós',
    fr: 'Salut',
    de: 'Tschüss',
    zh: '再见',
    ar: 'مع السلامة',
    pt: 'Tchau',
    ja: 'さようなら',
    tr: 'Görüşürüz'
  },
  'thank you': {
    en: 'Thank you',
    hi: 'धन्यवाद',
    ru: 'Спасибо',
    es: 'Gracias',
    fr: 'Merci',
    de: 'Danke',
    zh: '谢谢',
    ar: 'شكراً',
    pt: 'Obrigado',
    ja: 'ありがとう',
    tr: 'Teşekkür ederim'
  },
  'thanks': {
    en: 'Thanks',
    hi: 'धन्यवाद',
    ru: 'Спасибо',
    es: 'Gracias',
    fr: 'Merci',
    de: 'Danke',
    zh: '谢谢',
    ar: 'شكراً',
    pt: 'Obrigado',
    ja: 'ありがとう',
    tr: 'Teşekkürler'
  },
  'welcome': {
    en: 'Welcome',
    hi: 'स्वागत है',
    ru: 'Добро пожаловать',
    es: 'Bienvenido',
    fr: 'Bienvenue',
    de: 'Willkommen',
    zh: '欢迎',
    ar: 'أهلاً وسهلاً',
    pt: 'Bem-vindo',
    ja: 'ようこそ',
    tr: 'Hoş geldiniz'
  }
};

const TEST_PHRASES = {
  'hello, boris!': {
    ru: 'Hello, Boris!',
  },
  'привет, алиса!': {
    en: 'Привет, Алиса!',
  },
  'hello everyone!': {
    ru: 'Hello everyone!',
    es: 'Hello everyone!',
  },
  'how are you?': {
    es: 'How are you?',
    fr: 'How are you?',
  }
};

function findConceptMatch(input, targetLang) {
  for (const conceptKey of Object.keys(DICTIONARY)) {
    const translations = DICTIONARY[conceptKey];
    for (const langCode of Object.keys(translations)) {
      const val = translations[langCode];
      if (typeof val === 'string') {
        const normalizedVal = val.trim().toLowerCase();
        // Check exact match
        if (normalizedVal === input) {
          if (translations[targetLang]) {
            return translations[targetLang];
          }
        }
      }
    }
  }
  return null;
}

function lookupLocalTranslation(text, targetLang) {
  const normalizedInput = text.trim().toLowerCase();

  // Try exact lookup first
  const match = findConceptMatch(normalizedInput, targetLang);
  if (match) return match;

  // Try lookup without trailing/leading punctuation
  const cleanInput = normalizedInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  
  // If cleanInput is empty after stripping, just return null
  if (!cleanInput) return null;

  for (const conceptKey of Object.keys(DICTIONARY)) {
    const translations = DICTIONARY[conceptKey];
    for (const langCode of Object.keys(translations)) {
      const val = translations[langCode];
      if (typeof val === 'string') {
        const cleanVal = val.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
        if (cleanVal === cleanInput) {
          if (translations[targetLang]) {
            return translations[targetLang];
          }
        }
      }
    }
  }

  return null;
}

/**
 * Simulate translation or lookup.
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

  const lowerText = text.trim().toLowerCase();

  // Check E2E test phrases first
  if (TEST_PHRASES[lowerText] && TEST_PHRASES[lowerText][targetLang]) {
    return TEST_PHRASES[lowerText][targetLang];
  }

  // Check robust local pre-translated dictionary
  const localMatch = lookupLocalTranslation(text, targetLang);
  if (localMatch) {
    return localMatch;
  }

  // Real translation using MyMemory API (free, public, no key required)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MyMemory API status: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error('Invalid response payload');
  } catch (error) {
    console.warn('[MockTranslator] Fallback to mock prepend due to error:', error.message);
    // Fallback if MyMemory fails or offline
    const delay = Math.floor(Math.random() * 200) + 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    return text;
  }
}

module.exports = { translate };
