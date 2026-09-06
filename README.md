# Umegele — Anonymous Stranger Video Chat

Umegele is a real-time anonymous video chat application that connects users with random strangers for one-to-one video conversations.

The project is built around WebRTC for peer-to-peer audio/video communication and Socket.IO for real-time matchmaking, signaling, and text messaging.

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
                    │       Browser       │
                    │   Next.js / React   │
                    └──────────┬──────────┘
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