const { translate } = require('../src/services/mockTranslator');

const LANGUAGES = ['en', 'hi', 'ru', 'es', 'fr', 'de', 'zh', 'ar', 'pt', 'ja', 'tr'];

const HELLO_WORDS = {
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
};

const YES_WORDS = {
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
};

const NO_WORDS = {
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
};

async function runTests() {
  console.log('\n🌐 Running Translation Tests for All 11 Languages\n');
  console.log('═'.repeat(60));

  let passed = 0;
  let failed = 0;

  function assertTranslation(result, expected, message) {
    if (result && result.trim().toLowerCase() === expected.trim().toLowerCase()) {
      console.log(`  ✅ ${message} -> "${result}"`);
      passed++;
    } else {
      console.log(`  ❌ ${message} -> Expected "${expected}", got "${result}"`);
      failed++;
    }
  }

  // 1. Test translations to English
  console.log('\n📋 Test 1: Translating "Hello" from all languages to English');
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const word = HELLO_WORDS[lang];
    const result = await translate(word, lang, 'en');
    assertTranslation(result, 'Hello', `Translate "${word}" (${lang}) to English`);
  }

  // 2. Test translations from English to all other languages
  console.log('\n📋 Test 2: Translating "Hello" from English to all languages');
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const expected = HELLO_WORDS[lang];
    const result = await translate('Hello', 'en', lang);
    assertTranslation(result, expected, `Translate "Hello" (en) to ${lang}`);
  }

  // 3. Test bi-directional translations for "Yes" between all 90 language combinations
  console.log('\n📋 Test 3: Translating "Yes" between all 90 combinations');
  for (const source of LANGUAGES) {
    for (const target of LANGUAGES) {
      if (source === target) continue;
      const word = YES_WORDS[source];
      const expected = YES_WORDS[target];
      const result = await translate(word, source, target);
      assertTranslation(result, expected, `Translate "${word}" (${source}) to ${target}`);
    }
  }

  // 4. Test bi-directional translations for "No" between all 90 language combinations
  console.log('\n📋 Test 4: Translating "No" between all 90 combinations');
  for (const source of LANGUAGES) {
    for (const target of LANGUAGES) {
      if (source === target) continue;
      const word = NO_WORDS[source];
      const expected = NO_WORDS[target];
      const result = await translate(word, source, target);
      assertTranslation(result, expected, `Translate "${word}" (${source}) to ${target}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Translation Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed === 0) {
    console.log('\n🎉 All translation tests passed successfully!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some translation tests failed.\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
