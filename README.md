# 🏏 Cricket Clash

A full-stack cricket web app that combines a **collectible card battle game**, a **live ball-by-ball match scoring platform**, and three **cricket mini-games** — all in one place.

Build a squad from real player cards, battle friends in real time, score your own matches ball-by-ball, and settle cricket debates with head-to-head stat comparisons.

![Season 2026 Now Live](Screenshots/Screenshot%202026-07-12%20124522.png)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

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
- Create a match with custom teams, overs, toss, and guest players (no account required)
- Ball-by-ball live scoring interface — runs, extras (wide/no-ball/bye/leg-bye), wickets, overs
- Real-time score updates broadcast via a dedicated Socket.IO namespace
- Auto-generated ball-by-ball commentary
- Full scorecards with batting/bowling breakdowns per innings
- Player career stats aggregated across all scored matches
- Live data enrichment via the Cricbuzz API (RapidAPI)

### 🎮 Mini-Games
- **Cricket Wordle** — guess the mystery cricketer, Wordle-style
- **Cricket Quiz** — trivia questions on cricket history, players, and moments
- **Face Reveal** — guess the player from a progressively revealed photo, or from progressive stat clues (country, role, batting hand, IPL team, debut era, etc.)

---

## Tech Stack

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

## Project Structure

```
cricketattack/
├── package.json              # root orchestrator — runs client + server together
├── Screenshots/               # README screenshots
│
├── client/                    # Next.js frontend
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
│   ├── components/            # Navbar, PlayerCard, RankBadge, RankProgress
│   └── lib/                   # API client, auth context, socket hooks, scoring logic
│
└── server/                    # Express backend
    ├── src/
    │   ├── server.ts          # Entry point (Express + HTTP + Socket.IO)
    │   ├── models/             # User, Player, Battle, Season, LeaderboardEntry,
    │   │                       # + cricket-scoring models (ScoringMatch, Ball, Innings,
    │   │                       #   PlayerCareerStats, PlayerMatchStats)
    │   ├── controllers/        # Route handlers per resource
    │   ├── routes/             # Express routers
    │   ├── services/           # Elo, battle, career stats, Cricbuzz, rewards
    │   ├── socket/              # Socket.IO bootstrap, battle rooms, matchmaking, live scoring
    │   ├── middleware/         # JWT auth, rate limiting, error handling
    │   ├── utils/              # Cricket scoring rules engine, validation schemas
    │   └── scripts/            # Database seeding
    └── render.yaml             # Render deployment config
```

---

## Getting Started

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

Copy the example env files and fill in your own values (see [Environment Variables](#environment-variables)):

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

This starts the backend (Express + Socket.IO) and frontend (Next.js) concurrently. By default the client runs at `http://localhost:3000` and the server at the port set in `server/.env`.

---

## Environment Variables

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

## Available Scripts

Run from the project root:

| Command | Description |
|---|---|
| `npm run dev` | Run client + server together in dev mode |
| `npm run build` | Build server (TypeScript) then client (Next.js) |
| `npm start` | Run client + server together in start mode |
| `npm run seed` | Seed the database with the player card catalog |

---

## Deployment

- **Frontend** — deployed on Vercel (`client/vercel.json`)
- **Backend** — deployed on Render (`server/render.yaml`), with a `/health` check endpoint
- **Database** — MongoDB Atlas

---

## Screenshots

### Home
Build your squad, battle friends, and settle cricket debates.

![Home](Screenshots/Screenshot%202026-07-12%20124522.png)

### Card Battle (PvE)
Pick a card from your hand each round and out-stat the computer across 5 rounds.

![PvE Battle](Screenshots/Screenshot%202026-07-12%20124616.png)

### PvP Arena
Real-time matchmaking pairs you with an opponent of similar skill.

![PvP Arena](Screenshots/Screenshot%202026-07-12%20124640.png)

### Player Comparison
Compare two players across formats and get a weighted final verdict.

![Compare](Screenshots/Screenshot%202026-07-12%20124737.png)

### Leaderboard
Global Elo rankings, filterable by season and rank tier.

![Leaderboard](Screenshots/Screenshot%202026-07-12%20124759.png)

### Mini-Game: Face Reveal
Guess the cricketer as more of their photo is revealed.

![Face Reveal](Screenshots/Screenshot%202026-07-12%20124829.png)

### Mini-Game: Cricket Quiz
Trivia questions on cricket history, quotes, and legends.

![Cricket Quiz](Screenshots/Screenshot%202026-07-12%20124848.png)

### Mini-Game: Face Reveal — Clue Mode
Guess the player from progressively revealed stat clues instead of a photo.

![Face Reveal Clue Mode](Screenshots/Screenshot%202026-07-12%20125138.png)

### Live Match Scoring
Score a match ball-by-ball with runs, extras, and wicket tracking.

![Live Scoring](Screenshots/Screenshot%202026-07-12%20125241.png)

### Match Result & Scorecard
Full batting/bowling scorecards generated automatically as the match completes.

![Scorecard](Screenshots/Screenshot%202026-07-12%20125327.png)

### Matches List
Browse live, upcoming, and completed matches.

![Matches](Screenshots/Screenshot%202026-07-12%20125344.png)

### Player Career Stats
Aggregated batting and bowling stats across all scored matches.

![Career Stats](Screenshots/Screenshot%202026-07-12%20125913.png)
