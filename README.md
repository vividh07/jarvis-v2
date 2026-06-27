# JarvisV2

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Theme-Dark%20Indigo-6366F1?style=for-the-badge" alt="Theme" />
</p>

<p align="center">
  <strong>Control your AI assistant from your pocket.</strong><br/>
  Chat, voice, briefings, Spotify, calendar, and live PC status — all in one sleek mobile app.
</p>

---

## Screenshots & highlights

| Tab | What you get |
|-----|--------------|
| **Home** | Live server status, weather, Spotify now-playing, morning briefing |
| **Chat** | Text chat with quick prompts and real-time AI status |
| **History** | Conversation log synced from the Windows server |
| **Settings** | AI provider, briefing time, notifications test, memory clear |

Dark indigo/cyan UI · Safe area aware · Keyboard-friendly chat

---

## Features

- **WebSocket control** — Real-time link to [Jarvis Windows Server](https://github.com/vividh07/jarvis-windows-server)
- **Morning briefing** — Weather + top headlines in a modal
- **Spotify integration** — OAuth login, now-playing, BPM-aware vibes
- **Google Calendar** — OAuth + upcoming events
- **Notifications** — Test pipeline + server-side AI summaries
- **PC dashboard** — CPU, RAM, battery, connection status at a glance
- **Zustand state** — Fast, lightweight global store

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo Go](https://expo.dev/go) on your phone (iOS or Android)
- Jarvis Windows Server running on your PC

### 1. Clone & install

```powershell
git clone https://github.com/vividh07/jarvis-v2.git
cd jarvis-v2
npm install
```

### 2. Configure environment

```powershell
copy .env.example .env
```

Fill in your keys in `.env`, then **restart** the dev server (Expo only reads env on startup).

### 3. Start the app

```powershell
npm start
```

Scan the QR code with Expo Go.

### 4. Connect to your PC

1. Open the app → enter your PC's local IP and port (`8765`)
2. Example: `192.168.1.13:8765`
3. Phone and PC must be on the **same Wi-Fi**

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_WEATHER_API_KEY` | OpenWeatherMap for briefing & dashboard |
| `EXPO_PUBLIC_WEATHER_CITY` | Your city (default: `Noida`) |
| `EXPO_PUBLIC_NEWS_API_KEY` | NewsAPI for headlines |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Spotify OAuth |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` | Spotify OAuth |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google Calendar OAuth |
| `EXPO_PUBLIC_GOOGLE_CLIENT_SECRET` | Google Calendar OAuth |

> Never commit `.env` — only `.env.example` is tracked.

---

## Project structure

```
jarvis-v2/
├── src/
│   ├── screens/          # Chat, Dashboard, History, Settings
│   ├── services/         # Socket, weather, news, Spotify, calendar
│   ├── store/            # Zustand stores
│   ├── hooks/            # useSocket, useNotifications
│   ├── navigation/       # Tab navigator
│   ├── config/env.ts     # Centralized env loader
│   └── theme/            # Colors, typography, spacing
├── app.json
├── .env.example
└── package.json
```

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 54 |
| UI | React Native + custom dark theme |
| Navigation | React Navigation (bottom tabs) |
| State | Zustand |
| Realtime | WebSocket to Windows server |
| Storage | AsyncStorage |

---

## Known limitations

| Item | Note |
|------|------|
| iOS notification mirroring | Apple blocks reading other apps' notifications |
| Expo Go on Android | Full notification listener needs a dev build |
| Spotify audio-features | May 403 on free tier — app falls back to 120 BPM |

---

## Related

- **Windows server:** [github.com/vividh07/jarvis-windows-server](https://github.com/vividh07/jarvis-windows-server)

---

<p align="center">
  Built by <a href="https://github.com/vividh07">vividh07</a> · Your Jarvis. Your rules.
</p>
