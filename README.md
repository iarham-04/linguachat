# 🌐 LinguaChat — Real-Time Multilingual Chat

A real-time chat application where users speaking different languages can communicate naturally. Each user types in their own language, and every other participant sees the message automatically translated into their preferred language.

## 🎯 How It Works

```
Alice (English) types: "How are you?"
  → Boris (Russian) sees: "[Russian] How are you?"  (with mock translator)
  → Carlos (Spanish) sees: "[Spanish] How are you?"

Boris (Russian) types: "Привет!"
  → Alice (English) sees: "[English] Привет!"
  → Carlos (Spanish) sees: "[Spanish] Привет!"
```

The sender always sees their own message in the original language. Each recipient sees the translated version, with a "Show original" toggle to view the exact text that was typed.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                      │
│                                                             │
│  LoginForm → RoomLobby → ChatRoom                          │
│                 │              │                             │
│           Socket.io        Messages + Translation           │
│                 │              │                             │
└────────────────┼──────────────┼─────────────────────────────┘
                 │              │
                 ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (Express + Socket.io)              │
│                                                             │
│  socketHandlers.js ──→ translationService.js                │
│       │                      │                              │
│       │               mockTranslator.js  ← swap this!       │
│       │                                                     │
│       └──→ In-memory rooms (Map) / Firebase (optional)      │
└─────────────────────────────────────────────────────────────┘
```

### Translation Flow

1. User A sends a message via Socket.io
2. Server identifies all recipients and their preferred languages
3. Server deduplicates target languages (translate once per unique language)
4. Translation service translates the message for each unique target language
5. Server sends the **original** text back to the sender
6. Server sends the **translated** text (with original attached) to each recipient

## 📁 Project Structure

```
linguachat/
├── client/                         # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatRoom.jsx    # Main chat container
│   │   │   │   ├── MessageBubble.jsx # Message with "show original" toggle
│   │   │   │   ├── MessageInput.jsx  # Auto-resizing text input
│   │   │   │   └── TranslatingIndicator.jsx
│   │   │   ├── Layout/
│   │   │   │   ├── Header.jsx      # App header with connection status
│   │   │   │   └── Sidebar.jsx     # Online users + room code
│   │   │   ├── Room/
│   │   │   │   └── RoomLobby.jsx   # Create/join room flow
│   │   │   └── User/
│   │   │       ├── LoginForm.jsx   # Name + language picker
│   │   │       └── UserBadge.jsx   # Name + flag badge
│   │   ├── contexts/
│   │   │   ├── SocketContext.jsx   # Socket.io connection provider
│   │   │   └── UserContext.jsx     # User state (sessionStorage backed)
│   │   ├── utils/
│   │   │   ├── languages.js        # 11 supported languages + flags
│   │   │   └── constants.js
│   │   ├── App.jsx                 # State-based routing
│   │   ├── index.css               # Tailwind + glassmorphism + animations
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── translationService.js  # Translation abstraction layer
│   │   │   └── mockTranslator.js      # Mock: returns [Language] text
│   │   ├── handlers/
│   │   │   └── socketHandlers.js      # All Socket.io event handlers
│   │   ├── config/
│   │   │   └── firebase.js            # Optional Firestore persistence
│   │   ├── utils/
│   │   │   └── languages.js
│   │   └── index.js                   # Express + Socket.io server
│   ├── test/
│   │   └── e2e.js                     # End-to-end test suite (32 tests)
│   ├── .env                           # Local environment config
│   └── .env.example                   # Template for environment vars
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### 1. Start the Backend

```bash
cd server
npm install
cp .env.example .env    # Uses mock translation by default
npm run dev
```

The server starts on `http://localhost:3001`.

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

The client starts on `http://localhost:5173`.

### 3. Try It Out

1. Open `http://localhost:5173` in your browser
2. Enter a display name and select your language
3. Click **Create Room** — a 6-character room code is generated
4. Open a second browser tab/window to `http://localhost:5173`
5. Enter a different name, select a different language
6. Click **Join Room** and enter the room code
7. Start chatting! Messages are translated automatically

### 4. Run E2E Tests

```bash
cd server
npm run dev          # Keep server running in one terminal
node test/e2e.js     # Run in another terminal
```

## 🌍 Supported Languages

| Language | Code | Flag |
|----------|------|------|
| English | `en` | 🇺🇸 |
| Hindi | `hi` | 🇮🇳 |
| Russian | `ru` | 🇷🇺 |
| Spanish | `es` | 🇪🇸 |
| French | `fr` | 🇫🇷 |
| German | `de` | 🇩🇪 |
| Mandarin | `zh` | 🇨🇳 |
| Arabic | `ar` | 🇸🇦 |
| Portuguese | `pt` | 🇧🇷 |
| Japanese | `ja` | 🇯🇵 |
| Turkish | `tr` | 🇹🇷 |

## 🔌 Plugging in Real Translation

The translation system is designed to be swappable. The mock translator currently returns `[Language] original text`.

### Option 1: Google Cloud Translation API

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Create `server/src/services/googleTranslator.js`:

```javascript
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ key: process.env.GOOGLE_API_KEY });

async function translateText(text, sourceLang, targetLang) {
  if (sourceLang === targetLang) return text;
  const [translation] = await translate.translate(text, {
    from: sourceLang,
    to: targetLang,
  });
  return translation;
}

module.exports = { translate: translateText };
```

3. Update `.env`:
```
TRANSLATION_PROVIDER=google
GOOGLE_API_KEY=your-api-key-here
```

4. Update the `switch` statement in `translationService.js` to import your new module.

### Option 2: DeepL API

Same pattern — create `deeplTranslator.js` implementing `translate(text, sourceLang, targetLang)` and update the provider config.

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `TRANSLATION_PROVIDER` | `mock` | Translation backend: `mock`, `google`, `deepl` |
| `GOOGLE_API_KEY` | — | Google Cloud Translation API key |
| `FIREBASE_PROJECT_ID` | — | Firebase project ID (enables Firestore) |
| `FIREBASE_CLIENT_EMAIL` | — | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | — | Firebase service account private key |

## 🎨 UI Features

- **Dark mode** with glassmorphism design
- **Gradient** accent colors (indigo → violet)
- **Responsive** layout (desktop sidebar, mobile overlay)
- **Connection status** indicator (green dot = connected)
- **Online users** panel with flag emojis and language labels
- **"Show original"** toggle on translated messages (🌐 icon)
- **"Translating..."** animated indicator during translation
- **System messages** for user join/leave events
- **Auto-scroll** to latest messages
- **Copyable room code** in the sidebar

## 📐 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | Client → Server | Create a new room |
| `join-room` | Client → Server | Join existing room with code |
| `send-message` | Client → Server | Send a chat message |
| `receive-message` | Server → Client | Receive translated message |
| `room-users` | Server → Client | Updated user list |
| `user-joined` | Server → Room | New user notification |
| `user-left` | Server → Room | User departure notification |
| `translating` | Server → Room | Translation in progress |
| `request-room-users` | Client → Server | Request current user list |

## 📜 License

MIT
