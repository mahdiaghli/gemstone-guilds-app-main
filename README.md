# 🎲 Gemstone Guilds

Gemstone Guilds is a modern cross-platform board game platform built with React, TypeScript, and Vite. It brings classic and modern board games into a single online experience with multiplayer gameplay, AI opponents, social features, and an intuitive interface.

> Built with ❤️ using React, TypeScript, Tailwind CSS, and shadcn/ui.

---

# ✨ Features

## 🎮 Board Games

Currently available games include:

- Dead Man's Draw
- (Add other implemented games here)

Each game has its own rules, assets, and gameplay logic while sharing a common platform experience.

---

## 👥 Multiplayer

- Real-time multiplayer
- Private game rooms
- Invite friends
- Join by room code
- Match history
- Reconnect support

---

## 🤖 Single Player

- Play against AI
- Solo challenges
- Practice mode

---

## 🌐 Social Features

- User authentication
- Friends system
- Groups / Guilds
- Global leaderboard
- Chat system
- Player profiles
- Notifications

---

## 🎨 User Experience

- Responsive design
- Dark / Light theme
- Mobile-friendly UI
- Smooth animations
- Accessibility improvements

---

# 🛠 Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Node.js (local backend)
- Local Storage (development)
- Socket-ready architecture

---

# 📁 Project Structure

```
src/
│
├── assets/
├── components/
│   ├── game/
│   ├── layout/
│   ├── social/
│   └── ui/
│
├── hooks/
├── lib/
├── pages/
│   ├── home/
│   ├── dead-mans-draw/
│   ├── friends/
│   ├── groups/
│   ├── leaderboard/
│   ├── profile/
│   └── ...
│
├── styles/
└── main.tsx
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- npm

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Go into the project

```bash
cd gemstone-guilds
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# 📦 Production Build

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

---

# 🖥 Local Backend

Start the local development server

```bash
node server.js
```

The backend is currently intended for local development and stores data in `shared-state.json`.

Future versions will migrate to PostgreSQL and a production-ready API.

---

# 📱 Mobile Roadmap

The project is designed to be packaged as a native mobile application using **Capacitor**, allowing deployment to:

- Android
- iOS
- Google Play
- Bazaar
- Myket
- Apple App Store

---

# 🔮 Planned Features

- Voice chat
- Ranked matchmaking
- Tournament mode
- Spectator mode
- Cloud save
- Cross-device synchronization
- Push notifications
- Achievement system
- Statistics dashboard
- More board games

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# ❤️ Acknowledgements

Built with:

- React
- Vite
- Tailwind CSS
- shadcn/ui

Special thanks to the open-source community.
