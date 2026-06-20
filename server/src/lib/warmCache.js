const { translateWithCache } = require("./translateWithCache");

const COMMON_PHRASES = [
  "Hello", "Hi", "Hey",
  "How are you?", "I am fine",
  "Good morning", "Good night",
  "Thank you", "Thanks", "Welcome",
  "Yes", "No", "Ok", "Okay",
  "Sorry", "Please", "Excuse me",
  "See you later", "Bye", "Goodbye",
  "Nice to meet you",
  "What time is it?",
  "I don't understand",
  "Can you repeat that?",
  "😂", "😊", "👍", "❤️"   // common emojis with text
];

const ALL_LANGUAGES = [
  "hi", "ru", "es", "fr",
  "de", "zh", "ar", "pt", "ja"
];
// English is source, pre-translate to all others

async function warmTranslationCache() {
  console.log("🔥 Warming translation cache...");
  let count = 0;

  for (const phrase of COMMON_PHRASES) {
    for (const lang of ALL_LANGUAGES) {
      try {
        await translateWithCache(phrase, lang, "en");
        count++;
        // Small delay to avoid rate limiting on startup
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        console.warn(`Failed to warm: ${phrase} → ${lang}`);
      }
    }
  }

  console.log(`✅ Cache warmed with ${count} translations`);
}

module.exports = { warmTranslationCache };
