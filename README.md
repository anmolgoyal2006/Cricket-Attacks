# Cricket Clash Cards 🏏

A modern, feature-rich digital cricket card battle and player comparison platform inspired by Cricket Attax. Built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

![Cricket Clash Cards](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🌟 Features

### 🏠 Home Dashboard
- Stunning hero section with call-to-action buttons
- Display of top cards in your collection
- Recent battle history with results
- Leaderboard preview showing top 3 players
- Real-time statistics overview

### 🎁 Pack Opening
- Animated pack opening experience
- Reveal 5 random player cards with flip animations
- Beautiful card reveal sequence
- Option to view full collection after opening

### 📚 Card Collection
- Grid view of all collected cards
- Advanced search functionality
- Filter by rarity (Common, Rare, Epic, Legend)
- Sort by overall rating, batting, bowling, or name
- Click cards to view detailed statistics in modal
- Responsive design for all screen sizes

### ⚔️ Card Battle
- Select your 5-card squad
- Auto-generated opponent squad
- Animated battle simulation
- Win/loss results with trophy rewards
- Best performer highlights
- Battle again functionality

### 🔄 Player Comparison (Featured)
- Compare any two players head-to-head
- Filter by formats:
  - ODI
  - Test
  - T20I
  - World Cup
  - Knockouts
  - Bilateral
- Comprehensive statistics comparison
- Visual indicators for better/worse stats
- Smart verdict system showing:
  - World Cup performance winner
  - Bilateral series winner
  - Knockout match winner
  - Overall winner with score
- Share comparison feature

### 🏆 Leaderboard
- Top 10 global rankings
- Beautiful podium design for top 3
- Gold, Silver, Bronze styling
- Detailed stats for each player:
  - Battles won
  - Total trophies
  - Win rate percentage
- Your current rank display

## 🎨 Design Features

### Visual Aesthetics
- **Cricket Stadium Theme**: Dark mode with cricket field-inspired colors
- **Premium Card Design**: Rarity-based gradients and glows
  - Legend: Gold gradient with amber glow
  - Epic: Purple gradient with purple glow
  - Rare: Blue gradient with blue glow
  - Common: Gray gradient
- **Glass Morphism**: Frosted glass effects throughout
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Mobile-first approach

### Typography
- **Display Font**: Exo 2 (bold, modern, sports-inspired)
- **Body Font**: Inter (clean, readable)

### Color Palette
- **Stadium Colors**: Dark blues and blacks
- **Cricket Green**: Field-inspired greens
- **Trophy Colors**: Gold (#ffd700), Silver (#c0c0c0), Bronze (#cd7f32)
- **Rarity Colors**: Amber, Purple, Blue, Gray gradients

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Exo 2, Inter)

## 📦 Installation

1. **Clone or extract the project**
```bash
cd cricket-clash-cards
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
cricket-clash-cards/
├── app/
│   ├── layout.tsx              # Root layout with fonts
│   ├── page.tsx                # Home dashboard
│   ├── globals.css             # Global styles
│   ├── packs/
│   │   └── page.tsx            # Pack opening page
│   ├── collection/
│   │   └── page.tsx            # Card collection page
│   ├── battle/
│   │   └── page.tsx            # Battle arena page
│   ├── compare/
│   │   └── page.tsx            # Player comparison page
│   └── leaderboard/
│       └── page.tsx            # Leaderboard page
├── components/
│   ├── Navbar.tsx              # Navigation component
│   └── PlayerCard.tsx          # Reusable player card
├── data/
│   └── mockData.ts             # Mock player data
├── lib/
│   └── utils.ts                # Utility functions
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies

```

## 🎮 Usage Guide

### Opening Packs
1. Navigate to "Open Packs" from the navbar
2. Click the animated pack
3. Watch the reveal animation
4. View your new cards
5. Go to collection or open another pack

### Building Your Squad
1. Go to "Card Battle"
2. Select 5 cards from available players
3. Click "Simulate Battle"
4. View battle results and rewards
5. Battle again or return home

### Comparing Players
1. Navigate to "Compare Players"
2. Select Player A from dropdown
3. Select Player B from dropdown
4. Choose format (ODI, Test, T20I, etc.)
5. View head-to-head statistics
6. Check the verdict section
7. Share your comparison

### Viewing Collection
1. Go to "Collection" from navbar
2. Use search to find specific players
3. Filter by rarity
4. Sort by different stats
5. Click any card for detailed view

## 🎯 Key Components

### PlayerCard
Reusable card component with:
- Player name, role, country
- Overall rating badge
- Batting, Bowling, Fielding stats
- Rarity-based styling
- Hover effects and animations
- Click handler support

### Navbar
Sticky navigation with:
- Logo and branding
- Active route highlighting
- Profile section
- Mobile-responsive menu
- Smooth transitions

## 📊 Mock Data Structure

Each player includes:
```typescript
{
  id: number;
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  overall: number;
  specialty: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legend';
  formats: {
    odi: { matches, runs, avg, sr, hundreds, fifties, wickets, economy },
    test: { ... },
    t20: { ... },
    worldCup: { ... },
    knockouts: { ... },
    bilateral: { ... }
  }
}
```

## 🚀 Build for Production

```bash
npm run build
npm start
```

## 🎨 Customization

### Adding New Players
Edit `data/mockData.ts` and add new player objects with complete statistics.

### Changing Colors
Modify `tailwind.config.ts` to update the color scheme.

### Animation Speeds
Adjust Framer Motion `duration` and `delay` values in component files.

## 📱 Responsive Design

- **Mobile**: Optimized card grids, stacked layouts
- **Tablet**: 2-3 column grids, improved spacing
- **Desktop**: Full 6-column grids, side-by-side comparisons

## 🔮 Future Enhancements

- [ ] User authentication
- [ ] Real-time multiplayer battles
- [ ] Trading system
- [ ] Achievement badges
- [ ] Season rewards
- [ ] Advanced filtering
- [ ] Player stats graphs
- [ ] Social features
- [ ] Backend integration
- [ ] Card evolution system

## 📄 License

This project is a demonstration/portfolio piece. Feel free to use for learning purposes.

## 🙏 Acknowledgments

- Inspired by Cricket Attax card game
- Player statistics are fictional for demonstration
- Built as a modern web development showcase

---

**Built with ❤️ for cricket fans worldwide**

🏏 Cricket Clash Cards - Where Legends Battle
