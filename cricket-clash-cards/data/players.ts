// ============================================
// TYPES ONLY - No Stats Data Here
// ============================================

export interface FormatStats {
  matches: number;
  runs: number;
  average: number;
  strikeRate: number;
  centuries: number;
  fifties: number;
  highestScore: number;
  wickets?: number;
  bowlingAverage?: number;
  economy?: number;
}

export interface PlayerStats {
  odi: FormatStats;
  test: FormatStats;
  t20i: FormatStats;
  worldCup: FormatStats;
  bilateral: FormatStats;
  knockouts: FormatStats;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  role: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  specialty: string;
  image: string;
  stats?: PlayerStats; // Optional - populated by API/mockData
}

// ============================================
// PLAYER IDENTITY LIST ONLY
// ============================================
// This contains ONLY basic player info
// Stats are added later from API or mockData

export const playerInfo: Omit<Player, 'stats'>[] = [
  {
    id: 1,
    name: "Virat Kohli",
    country: "India",
    role: "Batsman",
    rarity: "legendary",
    specialty: "Chase Master",
    image: "/players/kohli.jpg"
  },
  {
    id: 2,
    name: "Rohit Sharma",
    country: "India",
    role: "Batsman",
    rarity: "legendary",
    specialty: "Hitman",
    image: "/players/rohit.jpg"
  },
  {
    id: 3,
    name: "Sachin Tendulkar",
    country: "India",
    role: "Batsman",
    rarity: "legendary",
    specialty: "God of Cricket",
    image: "/players/sachin.jpg"
  },
  {
    id: 4,
    name: "MS Dhoni",
    country: "India",
    role: "Wicketkeeper-Batsman",
    rarity: "legendary",
    specialty: "Captain Cool",
    image: "/players/dhoni.jpg"
  },
  {
    id: 5,
    name: "Jasprit Bumrah",
    country: "India",
    role: "Bowler",
    rarity: "epic",
    specialty: "Death Overs Specialist",
    image: "/players/bumrah.jpg"
  },
  {
    id: 6,
    name: "Steve Smith",
    country: "Australia",
    role: "Batsman",
    rarity: "legendary",
    specialty: "Test Specialist",
    image: "/players/smith.jpg"
  },
  {
    id: 7,
    name: "Kane Williamson",
    country: "New Zealand",
    role: "Batsman",
    rarity: "epic",
    specialty: "Anchor",
    image: "/players/williamson.jpg"
  },
  {
    id: 8,
    name: "Joe Root",
    country: "England",
    role: "Batsman",
    rarity: "epic",
    specialty: "Accumulator",
    image: "/players/root.jpg"
  },
  {
    id: 9,
    name: "Babar Azam",
    country: "Pakistan",
    role: "Batsman",
    rarity: "epic",
    specialty: "Classical Batsman",
    image: "/players/babar.jpg"
  },
  {
    id: 10,
    name: "Ben Stokes",
    country: "England",
    role: "All-rounder",
    rarity: "legendary",
    specialty: "Match Winner",
    image: "/players/stokes.jpg"
  },
  {
    id: 11,
    name: "Pat Cummins",
    country: "Australia",
    role: "Bowler",
    rarity: "epic",
    specialty: "Pace Leader",
    image: "/players/cummins.jpg"
  },
  {
    id: 12,
    name: "Rashid Khan",
    country: "Afghanistan",
    role: "Bowler",
    rarity: "epic",
    specialty: "Spin Wizard",
    image: "/players/rashid.jpg"
  }
];