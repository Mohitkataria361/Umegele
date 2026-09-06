# Umegele — Anonymous Stranger Video Chat

Umegele is a real-time anonymous video chat application that connects users with random strangers for one-to-one video conversations.

The project is built around WebRTC for peer-to-peer audio/video communication and Socket.IO for real-time matchmaking, signaling, and text messaging.

🔗 **Live Demo:** [https://umegele.onrender.com/](https://umegele.onrender.com/)

> Note: Since this is hosted on Render's free tier, the server may take 30–60 seconds to spin up on first load.

## ✨ Features

- 🎥 Anonymous one-to-one video chat
- 🔀 Random stranger matchmaking
- 🎤 Microphone on/off control
- 📹 Camera on/off control
- 💬 Real-time text chat
- ⏭️ Next Stranger functionality
- 🔌 Automatic handling when a stranger disconnects
- 🟢 Real-time connection status
- ⏱️ Call duration timer
- 🔐 STUN and TURN support for WebRTC connectivity
- ✨ AI-powered conversation suggestions using Google Gemini
- 📱 Responsive user interface
- 🏠 Simple home and chat navigation

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Real-time Communication
- WebRTC
- Socket.IO
- Socket.IO Client

### Backend
- Node.js
- Custom Next.js server
- Socket.IO server

### AI
- Google Gemini API
- `@google/genai`

### WebRTC Infrastructure
- STUN
- Metered TURN servers

## 🏗️ Architecture

The application uses a custom Node.js server to run Next.js and Socket.IO together.

```text
                    ┌─────────────────────┐
                    │       Browser        │
                    │   Next.js / React    │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
           Socket.IO Server              WebRTC
                  │                         │
          Matchmaking & Signaling      Audio / Video
                  │                         │
                  ▼                         ▼
            Random Stranger          Stranger's Browser
```

### Matchmaking

When a user clicks **Find Stranger**, the client sends a request to the Socket.IO server.

The server maintains:
- Waiting users
- Matched partners
- User rooms

When two users are available, the server creates a room and pairs them together.

```text
User A
   │
   ├── find-stranger
   │
   ▼
Socket.IO Server
   │
   ├── waitingUsers
   │
   ├── findMatch()
   │
   ▼
User B
   │
   └── matched
```

### WebRTC Signaling

Socket.IO is used only for signaling. The actual audio and video communication is handled by WebRTC.

```text
User A                         User B
  │                              │
  │──── WebRTC Offer ───────────>│
  │<─── WebRTC Answer ───────────│
  │                              │
  │──── ICE Candidates ─────────>│
  │<─── ICE Candidates ──────────│
  │                              │
  │══════ WebRTC Media ══════════│
```

This keeps the video/audio communication separate from the Socket.IO messaging layer.

## 🌐 STUN & TURN

WebRTC connections can fail when users are behind restrictive NATs or firewalls. To improve connectivity, the application uses:

- **STUN** for discovering network paths
- **TURN** as a relay when a direct connection cannot be established

The application retrieves the TURN configuration through `/api/turn`. The TURN configuration is kept on the server rather than exposing the API credentials in the client.

## ✨ AI Conversation Suggestions

Umegele includes an AI-powered feature that helps users continue a conversation with a stranger.

The user can click **✨ Suggest**. The current conversation is sent to the server, where the Google Gemini API generates up to three short conversational replies.

```text
User Conversation
       │
       ▼
/api/suggest
       │
       ▼
Google Gemini API
       │
       ▼
3 Suggested Replies
       │
       ▼
User selects a reply
```

The suggestion is placed into the chat input and is not automatically sent. The Gemini API key is stored as a server-side environment variable.

## 🔒 Environment Variables

Create a `.env.local` file in the project root:

```env
AI_API=your_gemini_api_key
METER_API=your_metered_api_key
```

Never commit `.env.local` or real API keys to GitHub. A `.env.example` file is included as a reference.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Mohitkataria361/Umegele.git
cd Umegele
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create `.env.local`:
```env
AI_API=your_gemini_api_key
METER_API=your_metered_api_key
```

### 4. Start the development server
```bash
npm run dev
```

The application will be available at:
```
http://localhost:3000
```

## 📁 Project Structure

```text
Umegele/
│
├── app/
│   ├── api/
│   │   ├── suggest/
│   │   │   └── route.ts
│   │   └── turn/
│   │       └── route.ts
│   │
│   ├── chat/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ChatWindow.tsx
│   └── WebRTCVideo.tsx
│
├── lib/
│   └── socket.ts
│
├── server/
│   └── server.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔑 Important Design Decisions

**Why WebRTC?**
WebRTC provides real-time peer-to-peer audio and video communication directly between browsers.

**Why Socket.IO?**
Socket.IO is used for:
- Stranger matchmaking
- WebRTC signaling
- Text messaging
- Connection/disconnection events

**Why TURN?**
A direct WebRTC connection is not always possible because of NATs, firewalls, or restrictive networks. TURN provides a fallback relay path when a direct peer-to-peer connection cannot be established.

**Why a custom server?**
The application requires a persistent Socket.IO server alongside Next.js. The custom server allows both the Next.js application and Socket.IO server to run within the same Node.js process.

## 🧪 Testing

The application should be tested using multiple browser windows or devices.

Recommended tests:
- Open two users and verify matchmaking
- Test microphone and camera controls
- Send messages between users
- Test Next Stranger
- Close one browser and verify stranger disconnect handling
- Test WebRTC connectivity across different networks
- Test TURN fallback
- Test Gemini suggestions

## 🚧 Future Improvements

- 🛡️ AI-assisted chat and video moderation
- 🚩 User reporting and abuse prevention improvements
- 👤 Admin dashboard
- 🚫 Temporary/permanent user restrictions
- 📊 Moderation and usage analytics
- 🔒 Additional privacy and security improvements
- ⚡ Further WebRTC and matchmaking optimizations

## 📌 Current Status

Umegele is currently an MVP focused on real-time anonymous video communication.

The primary goal of the project is to explore and demonstrate:
- WebRTC
- Real-time communication
- Socket.IO
- NAT traversal
- TURN infrastructure
- Next.js
- Server-side API integration
- AI API integration

## 👨‍💻 Author

**Mohit Kataria**
GitHub: [https://github.com/Mohitkataria361](https://github.com/Mohitkataria361)
Live Demo: [https://umegele.onrender.com/](https://umegele.onrender.com/)
