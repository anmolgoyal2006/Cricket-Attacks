<div align="center">

# 🏏 Cricket Clash

**Collect. Battle. Score. Debate.**

A full-stack cricket web app combining a collectible **card battle game**, a **live ball-by-ball scoring platform**, and three **cricket mini-games** — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Frontend%20%26%20Backend-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Cricket Clash Home](Screenshots/Screenshot%202026-07-12%20124522.png)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Cricket Clash is where cricket knowledge meets game design. Build a squad from real player cards, battle friends in real time, score your own local matches ball-by-ball, and settle "who's better" debates with data-backed comparisons — no other app bundles all four in one place.

| | |
|---|---|
| 🎴 **Card Game** | Open packs, build a 5-card squad, battle PvE or live PvP with Elo ranking |
| 🔴 **Live Scoring** | Score real matches ball-by-ball with auto-generated commentary and full scorecards |
| ⚖️ **Compare** | Head-to-head player stats across ODIs, Tests, T20Is, World Cups & Knockouts |
| 🎮 **Mini-Games** | Wordle, Quiz, and Face Reveal to test your cricket IQ |

---

## ✨ Features

### 🎴 Card Collection & Battle Game
- **Pack Opening** — open packs to reveal random player cards across rarity tiers (Common / Rare / Epic / Legend)
- **Collection** — browse, search, filter, and sort your owned cards
- **PvE Battle** — build a 5-card squad and battle a computer opponent across 5 rounds, choosing stats (Batting, Bowling, Fielding, Captaincy, Pressure) to outscore your rival each round
- **PvP Battle** — real-time multiplayer card battles over Socket.IO with skill-based matchmaking
- **Ranked Play** — Elo rating system with rank tiers and seasonal resets
- **Leaderboard** — global rankings by Elo, filterable by season and tier
- **Player Comparison** — head-to-head stat comparisons across ODIs, Tests, T20Is, World Cups, and Knockouts, with a weighted final verdict
- **Profiles & History** — user profiles, coins/XP/level progression, and full battle history

### 🔴 Live Cricket Match Scoring
- Create a match with custom teams, overs, toss, and guest players — no account required
- Ball-by-ball live scoring interface — runs, extras (wide / no-ball / bye / leg-bye), wickets, overs
- Real-time score updates broadcast via a dedicated Socket.IO namespace
- Auto-generated ball-by-ball commentary
- Full scorecards with batting/bowling breakdowns per innings
- Player career stats aggregated across all scored matches
- Live data enrichment via the Cricbuzz API (RapidAPI)

### 🎮 Mini-Games
- **Cricket Wordle** — guess the mystery cricketer, Wordle-style
- **Cricket Quiz** — trivia questions on cricket history, players, and iconic moments
- **Face Reveal** — guess the player from a progressively revealed photo, or switch to Clue Mode and guess from stat clues (country, role, batting hand, IPL team, debut era, and more)

---

## 🛠 Tech Stack

**Frontend** (`client/`)
- [Next.js 16](https://nextjs.org/) (App Router) + React 18 + TypeScript
- Tailwind CSS + `tailwindcss-animate` + `class-variance-authority`
- Framer Motion (animations), Lucide React (icons)
- Socket.IO Client (real-time battles & live scoring)

**Backend** (`server/`)
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Socket.IO (real-time battle rooms, matchmaking, live match broadcasts)
- JWT + bcrypt (auth), Zod (validation), Axios (Cricbuzz/RapidAPI integration)

**Infrastructure**
- Frontend deployed on [Vercel](https://vercel.com/)
- Backend deployed on [Render](https://render.com/)
- Database hosted on MongoDB Atlas

---

## 📂 Project Structure

```
cricketattack/
├── package.json                # root orchestrator — runs client + server together
├── LICENSE
├── Screenshots/                 # README screenshots
│
├── client/                      # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                       # Home dashboard
│   │   ├── login/, register/              # Auth
│   │   ├── packs/                         # Pack opening
│   │   ├── collection/                    # Card collection
│   │   ├── battle/                        # PvE battle
│   │   ├── battle/multiplayer/            # Real-time PvP battle
│   │   ├── compare/                       # Player comparison
│   │   ├── leaderboard/                   # Elo leaderboard & seasons
│   │   ├── profile/[id]/                  # User profile
│   │   ├── history/                       # Battle/match history
│   │   ├── matches/                       # Live scoring: list
│   │   ├── matches/create/                # Live scoring: create match
│   │   ├── matches/[id]/, [id]/score/     # Live scoring: detail & scorer UI
│   │   ├── cricket-stats/[playerId]/      # Player career stats
│   │   ├── wordle/, quiz/, face-reveal/   # Mini-games
│   │   └── api/players/                   # Next.js API route
│   ├── components/              # Navbar, PlayerCard, RankBadge, RankProgress
│   └── lib/                     # API client, auth context, socket hooks, scoring logic
│
└── server/                      # Express backend
    ├── src/
    │   ├── server.ts             # Entry point (Express + HTTP + Socket.IO)
    │   ├── models/               # User, Player, Battle, Season, LeaderboardEntry,
    │   │                         #   + cricket-scoring models (ScoringMatch, Ball, Innings,
    │   │                         #   PlayerCareerStats, PlayerMatchStats)
    │   ├── controllers/          # Route handlers per resource
    │   ├── routes/               # Express routers
    │   ├── services/             # Elo, battle, career stats, Cricbuzz, rewards
    │   ├── socket/               # Socket.IO bootstrap, battle rooms, matchmaking, live scoring
    │   ├── middleware/           # JWT auth, rate limiting, error handling
    │   ├── utils/                # Cricket scoring rules engine, validation schemas
    │   └── scripts/              # Database seeding
    └── render.yaml                # Render deployment config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
git clone <repo-url>
cd cricketattack

# install dependencies for root, client, and server
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### Configure environment variables

Copy the example env files and fill in your own values (see [Environment Variables](#-environment-variables)):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

### Seed the database (optional but recommended)

```bash
npm run seed
```

### Run the app

```bash
npm run dev
```

This starts the backend (Express + Socket.IO) and frontend (Next.js) concurrently.

By default:
- Client → `http://localhost:3000`
- Server → the port set in `server/.env`

---

## 🔑 Environment Variables

**`server/.env`**

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token expiry duration |
| `PORT` | Port the server listens on |
| `FRONTEND_URL` | Client origin, used for CORS |
| `NODE_ENV` | `development` / `production` |
| `RAPIDAPI_KEY` | API key for Cricbuzz data via RapidAPI |
| `RAPIDAPI_HOST` | RapidAPI host for Cricbuzz |

**`client/.env.local`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## 📜 Available Scripts

Run from the project root:

| Command | Description |
|---|---|
| `npm run dev` | Run client + server together in dev mode |
| `npm run build` | Build server (TypeScript) then client (Next.js) |
| `npm start` | Run client + server together in production mode |
| `npm run seed` | Seed the database with the player card catalog |

> `npm start` requires `npm run build` to have been run first (the client needs a production build for `next start` to serve).

---

## ☁️ Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com/) | Config in `client/vercel.json` |
| Backend | [Render](https://render.com/) | Config in `server/render.yaml`, exposes a `/health` check endpoint |
| Database | MongoDB Atlas | — |

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

**Home**
Build your squad, battle friends, and settle cricket debates.
![Home](Screenshots/Screenshot%202026-07-12%20124522.png)

</td>
<td width="50%">

**Card Battle (PvE)**
Pick a card from your hand each round and out-stat the computer across 5 rounds.
![PvE Battle](Screenshots/Screenshot%202026-07-12%20124616.png)

</td>
</tr>
<tr>
<td width="50%">

**PvP Arena**
Real-time matchmaking pairs you with an opponent of similar skill.
![PvP Arena](Screenshots/Screenshot%202026-07-12%20124640.png)

</td>
<td width="50%">

**Player Comparison**
Compare two players across formats and get a weighted final verdict.
![Compare](Screenshots/Screenshot%202026-07-12%20124737.png)

</td>
</tr>
<tr>
<td width="50%">

**Leaderboard**
Global Elo rankings, filterable by season and rank tier.
![Leaderboard](Screenshots/Screenshot%202026-07-12%20124759.png)

</td>
<td width="50%">

**Mini-Game: Face Reveal**
Guess the cricketer as more of their photo is revealed.
![Face Reveal](Screenshots/Screenshot%202026-07-12%20124829.png)

</td>
</tr>
<tr>
<td width="50%">

**Mini-Game: Cricket Quiz**
Trivia questions on cricket history, quotes, and legends.
![Cricket Quiz](Screenshots/Screenshot%202026-07-12%20124848.png)

</td>
<td width="50%">

**Mini-Game: Face Reveal — Clue Mode**
Guess the player from progressively revealed stat clues instead of a photo.
![Face Reveal Clue Mode](Screenshots/Screenshot%202026-07-12%20125138.png)

</td>
</tr>
<tr>
<td width="50%">

**Live Match Scoring**
Score a match ball-by-ball with runs, extras, and wicket tracking.
![Live Scoring](Screenshots/Screenshot%202026-07-12%20125241.png)

</td>
<td width="50%">

**Match Result & Scorecard**
Full batting/bowling scorecards generated automatically as the match completes.
![Scorecard](Screenshots/Screenshot%202026-07-12%20125327.png)

</td>
</tr>
<tr>
<td width="50%">

**Matches List**
Browse live, upcoming, and completed matches.
![Matches](Screenshots/Screenshot%202026-07-12%20125344.png)

</td>
<td width="50%">

**Player Career Stats**
Aggregated batting and bowling stats across all scored matches.
![Career Stats](Screenshots/Screenshot%202026-07-12%20125913.png)

</td>
</tr>
</table>

---

## 🗺 Roadmap

- [ ] Tournament mode for live scoring (league/knockout brackets)
- [ ] Card trading between users
- [ ] Push notifications for live match updates
- [ ] Mobile-optimized PWA
- [ ] Additional mini-games (Cricket Connections, Career Path)

> Have an idea? Open an issue and let's talk about it.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with 🏏 by cricket fans, for cricket fans.

</div>
