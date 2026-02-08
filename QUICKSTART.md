# 🚀 Quick Start Guide - Cricket Clash Cards

## Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd cricket-clash-cards
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: `http://localhost:3000`

## 📋 What's Included

✅ **Home Dashboard** - Hero section, top cards, recent battles, leaderboard preview
✅ **Pack Opening** - Animated card reveals with 5 random players
✅ **Card Collection** - Search, filter by rarity, sort by stats
✅ **Battle Arena** - Select 5 cards, simulate battles, earn trophies
✅ **Player Comparison** - Compare stats across 6 formats with verdict system
✅ **Leaderboard** - Top 10 rankings with podium design

## 🎯 Key Features

### Navigation
- Click any nav link to explore different pages
- Mobile-responsive hamburger menu on small screens
- Active route highlighting

### Homepage
- Click "Open Daily Pack" to get new cards
- Click "Start Battle" to enter battle arena
- View your top cards, recent battles, and leaderboard

### Pack Opening
- Click the animated pack to reveal 5 new cards
- Beautiful flip animations
- "Open Another Pack" to get more cards

### Collection
- Search by player name, country, or role
- Filter by rarity (All, Legend, Epic, Rare, Common)
- Sort by overall, batting, bowling, or name
- Click any card to see detailed statistics

### Battle
- Click available players to add to your squad (max 5)
- Click squad members to remove them
- Hit "Simulate Battle" when you have 5 cards
- View results and best performer

### Compare
- Select two players from dropdowns
- Choose format (ODI, Test, T20I, World Cup, Knockouts, Bilateral)
- Green = Better stat, Gray = Worse stat
- Scroll down for overall verdict

### Leaderboard
- View top 3 on podium
- See rankings 4-10 below
- Your rank shown at bottom

## 🎨 Design Highlights

- **Dark cricket stadium theme** with field-inspired colors
- **Rarity-based card designs**:
  - 🥇 Legend: Gold glow
  - 💜 Epic: Purple glow
  - 💙 Rare: Blue glow
  - ⚪ Common: Gray
- **Smooth animations** powered by Framer Motion
- **Glass morphism** effects throughout
- **Fully responsive** - works on all devices

## 🔧 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React Icons

## 📦 Project Structure

```
cricket-clash-cards/
├── app/              # Pages (Next.js App Router)
├── components/       # Reusable components
├── data/            # Mock player data
├── lib/             # Utilities
└── ...config files
```

## 🎮 Try These

1. **Open a pack** and collect new cards
2. **Build a squad** with 5 legend cards
3. **Compare** Virat Kohli vs Rohit Sharma in World Cups
4. **Filter** collection to show only Legend cards
5. **Search** for players from your favorite country

## 🐛 Troubleshooting

**Port already in use?**
```bash
npm run dev -- -p 3001
```

**Dependencies not installing?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build failing?**
```bash
npm run build
```

## 📚 Learn More

Check the full README.md for:
- Detailed feature descriptions
- Component documentation
- Customization guide
- Future enhancements

---

Enjoy building your cricket card empire! 🏏🏆
