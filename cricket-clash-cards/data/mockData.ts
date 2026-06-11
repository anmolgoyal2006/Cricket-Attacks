export type Format = 'ODI' | 'Test' | 'T20I';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legend';

export interface FormatStats {
  matches: number;
  runs: number;
  avg: number;
  sr: number;
  hundreds: number;
  fifties: number;
  wickets: number;
  economy: number;
  bestScore?: string;
}

export interface Player {
  id: number;
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  overall: number;
  specialty: string;
  rarity: Rarity;
  image: string;
  formats: {
    odi: FormatStats;
    test: FormatStats;
    t20: FormatStats;
    worldCup: FormatStats;
    knockouts: FormatStats;
    bilateral: FormatStats;
  };
}

export const players: Player[] = [
  {
    id: 1,
    name: "Virat Kohli",
    role: "Batsman",
    country: "India",
    batting: 96,
    bowling: 25,
    fielding: 92,
    overall: 95,
    specialty: "Chase Master",
    rarity: "Legend",
    image: "https://via.placeholder.com/300x400/1e3a8a/ffffff?text=VK",
    formats: {
      odi: { matches: 292, runs: 13848, avg: 58.18, sr: 93.54, hundreds: 50, fifties: 72, wickets: 4, economy: 6.21, bestScore: "183" },
      test: { matches: 113, runs: 8848, avg: 49.16, sr: 55.37, hundreds: 29, fifties: 30, wickets: 0, economy: 0, bestScore: "254*" },
      t20: { matches: 117, runs: 4008, avg: 52.73, sr: 137.96, hundreds: 1, fifties: 37, wickets: 0, economy: 0, bestScore: "122*" },
      worldCup: { matches: 37, runs: 1795, avg: 59.83, sr: 88.20, hundreds: 5, fifties: 12, wickets: 0, economy: 0 },
      knockouts: { matches: 25, runs: 1342, avg: 67.1, sr: 91.4, hundreds: 6, fifties: 7, wickets: 0, economy: 0 },
      bilateral: { matches: 230, runs: 11053, avg: 56.6, sr: 94.2, hundreds: 39, fifties: 53, wickets: 4, economy: 6.21 }
    }
  },
  {
    id: 2,
    name: "Rohit Sharma",
    role: "Batsman",
    country: "India",
    batting: 94,
    bowling: 28,
    fielding: 85,
    overall: 93,
    specialty: "Hitman",
    rarity: "Legend",
    image: "https://via.placeholder.com/300x400/0f766e/ffffff?text=RS",
    formats: {
      odi: { matches: 265, runs: 10866, avg: 48.96, sr: 90.30, hundreds: 31, fifties: 54, wickets: 8, economy: 5.29, bestScore: "264" },
      test: { matches: 59, runs: 4301, avg: 46.77, sr: 58.82, hundreds: 11, fifties: 16, wickets: 2, economy: 7.44, bestScore: "212" },
      t20: { matches: 151, runs: 3974, avg: 32.34, sr: 140.61, hundreds: 5, fifties: 29, wickets: 1, economy: 7.62, bestScore: "118" },
      worldCup: { matches: 28, runs: 1575, avg: 65.62, sr: 98.65, hundreds: 7, fifties: 7, wickets: 0, economy: 0 },
      knockouts: { matches: 18, runs: 892, avg: 55.75, sr: 94.3, hundreds: 3, fifties: 5, wickets: 0, economy: 0 },
      bilateral: { matches: 219, runs: 8399, avg: 45.6, sr: 88.9, hundreds: 21, fifties: 42, wickets: 8, economy: 5.29 }
    }
  },
  {
    id: 3,
    name: "Babar Azam",
    role: "Batsman",
    country: "Pakistan",
    batting: 93,
    bowling: 20,
    fielding: 88,
    overall: 91,
    specialty: "Consistency King",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/16a34a/ffffff?text=BA",
    formats: {
      odi: { matches: 122, runs: 5729, avg: 56.72, sr: 88.88, hundreds: 19, fifties: 31, wickets: 0, economy: 0, bestScore: "158" },
      test: { matches: 53, runs: 3897, avg: 45.29, sr: 54.19, hundreds: 9, fifties: 26, wickets: 0, economy: 0, bestScore: "196" },
      t20: { matches: 119, runs: 3897, avg: 41.45, sr: 129.43, hundreds: 3, fifties: 33, wickets: 0, economy: 0, bestScore: "122" },
      worldCup: { matches: 15, runs: 678, avg: 52.15, sr: 85.3, hundreds: 2, fifties: 4, wickets: 0, economy: 0 },
      knockouts: { matches: 12, runs: 534, avg: 48.5, sr: 83.2, hundreds: 1, fifties: 4, wickets: 0, economy: 0 },
      bilateral: { matches: 95, runs: 4517, avg: 58.2, sr: 90.1, hundreds: 16, fifties: 23, wickets: 0, economy: 0 }
    }
  },
  {
    id: 4,
    name: "Steve Smith",
    role: "Batsman",
    country: "Australia",
    batting: 92,
    bowling: 32,
    fielding: 86,
    overall: 90,
    specialty: "Test Legend",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/dc2626/ffffff?text=SS",
    formats: {
      odi: { matches: 155, runs: 5131, avg: 43.34, sr: 87.73, hundreds: 12, fifties: 29, wickets: 29, economy: 5.24, bestScore: "164" },
      test: { matches: 109, runs: 9685, avg: 56.97, sr: 54.48, hundreds: 32, fifties: 41, wickets: 17, economy: 3.07, bestScore: "239" },
      t20: { matches: 62, runs: 883, avg: 27.59, sr: 125.42, hundreds: 0, fifties: 2, wickets: 8, economy: 7.32, bestScore: "90" },
      worldCup: { matches: 22, runs: 911, avg: 50.61, sr: 91.2, hundreds: 2, fifties: 6, wickets: 3, economy: 5.1 },
      knockouts: { matches: 16, runs: 712, avg: 59.3, sr: 88.4, hundreds: 2, fifties: 4, wickets: 2, economy: 4.8 },
      bilateral: { matches: 117, runs: 3508, avg: 40.3, sr: 86.9, hundreds: 8, fifties: 19, wickets: 24, economy: 5.3 }
    }
  },
  {
    id: 5,
    name: "Joe Root",
    role: "Batsman",
    country: "England",
    batting: 91,
    bowling: 35,
    fielding: 84,
    overall: 89,
    specialty: "Anchor",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/1e40af/ffffff?text=JR",
    formats: {
      odi: { matches: 171, runs: 6507, avg: 47.49, sr: 86.73, hundreds: 16, fifties: 39, wickets: 28, economy: 5.39, bestScore: "133*" },
      test: { matches: 146, runs: 12377, avg: 50.11, sr: 52.85, hundreds: 33, fifties: 63, wickets: 5, economy: 3.20, bestScore: "262" },
      t20: { matches: 32, runs: 893, avg: 35.72, sr: 126.37, hundreds: 0, fifties: 5, wickets: 3, economy: 7.83, bestScore: "90*" },
      worldCup: { matches: 29, runs: 1323, avg: 51.88, sr: 88.6, hundreds: 3, fifties: 8, wickets: 2, economy: 5.2 },
      knockouts: { matches: 14, runs: 623, avg: 51.9, sr: 85.3, hundreds: 1, fifties: 5, wickets: 1, economy: 5.4 },
      bilateral: { matches: 128, runs: 4561, avg: 45.1, sr: 86.2, hundreds: 12, fifties: 26, wickets: 25, economy: 5.4 }
    }
  },
  {
    id: 6,
    name: "Kane Williamson",
    role: "Batsman",
    country: "New Zealand",
    batting: 90,
    bowling: 30,
    fielding: 87,
    overall: 88,
    specialty: "Captain Cool",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/0891b2/ffffff?text=KW",
    formats: {
      odi: { matches: 161, runs: 6173, avg: 47.48, sr: 81.86, hundreds: 13, fifties: 42, wickets: 37, economy: 5.03, bestScore: "148" },
      test: { matches: 97, runs: 8743, avg: 54.32, sr: 51.32, hundreds: 32, fifties: 35, wickets: 2, economy: 3.91, bestScore: "251" },
      t20: { matches: 90, runs: 2369, avg: 32.59, sr: 123.85, hundreds: 0, fifties: 18, wickets: 14, economy: 7.22, bestScore: "95" },
      worldCup: { matches: 24, runs: 1118, avg: 53.24, sr: 84.7, hundreds: 2, fifties: 8, wickets: 3, economy: 4.9 },
      knockouts: { matches: 15, runs: 678, avg: 56.5, sr: 82.1, hundreds: 2, fifties: 4, wickets: 2, economy: 5.2 },
      bilateral: { matches: 122, runs: 4377, avg: 44.6, sr: 80.8, hundreds: 9, fifties: 30, wickets: 32, economy: 5.1 }
    }
  },
  {
    id: 7,
    name: "Jasprit Bumrah",
    role: "Bowler",
    country: "India",
    batting: 35,
    bowling: 98,
    fielding: 82,
    overall: 94,
    specialty: "Yorker King",
    rarity: "Legend",
    image: "https://via.placeholder.com/300x400/7c2d12/ffffff?text=JB",
    formats: {
      odi: { matches: 89, runs: 109, avg: 10.90, sr: 84.50, hundreds: 0, fifties: 0, wickets: 149, economy: 4.63, bestScore: "16" },
      test: { matches: 36, runs: 117, avg: 7.31, sr: 42.39, hundreds: 0, fifties: 0, wickets: 159, economy: 2.69, bestScore: "10*" },
      t20: { matches: 70, runs: 21, avg: 7.00, sr: 105.00, hundreds: 0, fifties: 0, wickets: 89, economy: 6.48, bestScore: "7" },
      worldCup: { matches: 18, runs: 15, avg: 7.5, sr: 68.2, hundreds: 0, fifties: 0, wickets: 30, economy: 4.21 },
      knockouts: { matches: 12, runs: 8, avg: 4.0, sr: 57.1, hundreds: 0, fifties: 0, wickets: 21, economy: 4.05 },
      bilateral: { matches: 59, runs: 86, avg: 12.3, sr: 91.5, hundreds: 0, fifties: 0, wickets: 98, economy: 4.89 }
    }
  },
  {
    id: 8,
    name: "Pat Cummins",
    role: "Bowler",
    country: "Australia",
    batting: 42,
    bowling: 95,
    fielding: 85,
    overall: 92,
    specialty: "Pace Ace",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/15803d/ffffff?text=PC",
    formats: {
      odi: { matches: 88, runs: 547, avg: 18.23, sr: 89.23, hundreds: 0, fifties: 1, wickets: 171, economy: 5.04, bestScore: "63" },
      test: { matches: 61, runs: 988, avg: 19.76, sr: 50.74, hundreds: 0, fifties: 3, wickets: 269, economy: 2.91, bestScore: "72" },
      t20: { matches: 54, runs: 89, avg: 11.13, sr: 118.67, hundreds: 0, fifties: 0, wickets: 63, economy: 7.22, bestScore: "18*" },
      worldCup: { matches: 19, runs: 112, avg: 16.0, sr: 86.2, hundreds: 0, fifties: 0, wickets: 34, economy: 4.78 },
      knockouts: { matches: 11, runs: 67, avg: 13.4, sr: 89.3, hundreds: 0, fifties: 0, wickets: 19, economy: 4.52 },
      bilateral: { matches: 58, runs: 368, avg: 19.4, sr: 90.4, hundreds: 0, fifties: 1, wickets: 118, economy: 5.21 }
    }
  },
  {
    id: 9,
    name: "Kagiso Rabada",
    role: "Bowler",
    country: "South Africa",
    batting: 38,
    bowling: 94,
    fielding: 83,
    overall: 90,
    specialty: "Express Pace",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/059669/ffffff?text=KR",
    formats: {
      odi: { matches: 103, runs: 423, avg: 14.58, sr: 75.13, hundreds: 0, fifties: 0, wickets: 161, economy: 4.89, bestScore: "31" },
      test: { matches: 65, runs: 1128, avg: 17.23, sr: 56.00, hundreds: 0, fifties: 3, wickets: 295, economy: 3.32, bestScore: "56" },
      t20: { matches: 68, runs: 89, avg: 8.90, sr: 115.58, hundreds: 0, fifties: 0, wickets: 93, economy: 7.32, bestScore: "15" },
      worldCup: { matches: 16, runs: 78, avg: 13.0, sr: 71.6, hundreds: 0, fifties: 0, wickets: 24, economy: 5.12 },
      knockouts: { matches: 9, runs: 34, avg: 11.3, sr: 68.0, hundreds: 0, fifties: 0, wickets: 13, economy: 5.34 },
      bilateral: { matches: 78, runs: 311, avg: 15.1, sr: 76.8, hundreds: 0, fifties: 0, wickets: 124, economy: 4.76 }
    }
  },
  {
    id: 10,
    name: "Shaheen Afridi",
    role: "Bowler",
    country: "Pakistan",
    batting: 36,
    bowling: 93,
    fielding: 80,
    overall: 89,
    specialty: "Swing Sultan",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/0d9488/ffffff?text=SA",
    formats: {
      odi: { matches: 57, runs: 189, avg: 12.60, sr: 68.23, hundreds: 0, fifties: 0, wickets: 102, economy: 5.32, bestScore: "23" },
      test: { matches: 31, runs: 314, avg: 12.56, sr: 48.23, hundreds: 0, fifties: 0, wickets: 115, economy: 3.15, bestScore: "51" },
      t20: { matches: 74, runs: 78, avg: 9.75, sr: 98.73, hundreds: 0, fifties: 0, wickets: 108, economy: 7.45, bestScore: "12" },
      worldCup: { matches: 12, runs: 34, avg: 11.3, sr: 65.4, hundreds: 0, fifties: 0, wickets: 21, economy: 5.67 },
      knockouts: { matches: 8, runs: 21, avg: 10.5, sr: 70.0, hundreds: 0, fifties: 0, wickets: 14, economy: 5.89 },
      bilateral: { matches: 37, runs: 134, avg: 13.4, sr: 67.3, hundreds: 0, fifties: 0, wickets: 67, economy: 5.12 }
    }
  },
  {
    id: 11,
    name: "Ravindra Jadeja",
    role: "All-rounder",
    country: "India",
    batting: 78,
    bowling: 86,
    fielding: 97,
    overall: 91,
    specialty: "Sword Master",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/4338ca/ffffff?text=RJ",
    formats: {
      odi: { matches: 197, runs: 2756, avg: 32.75, sr: 87.23, hundreds: 2, fifties: 13, wickets: 220, economy: 4.92, bestScore: "87" },
      test: { matches: 74, runs: 3067, avg: 36.13, sr: 57.89, hundreds: 4, fifties: 21, wickets: 294, economy: 2.39, bestScore: "175*" },
      t20: { matches: 74, runs: 515, avg: 23.41, sr: 127.60, hundreds: 0, fifties: 2, wickets: 54, economy: 7.13, bestScore: "46*" },
      worldCup: { matches: 27, runs: 567, avg: 35.4, sr: 85.6, hundreds: 0, fifties: 3, wickets: 32, economy: 4.67 },
      knockouts: { matches: 16, runs: 312, avg: 31.2, sr: 82.1, hundreds: 0, fifties: 2, wickets: 18, economy: 4.52 },
      bilateral: { matches: 154, runs: 1877, avg: 31.6, sr: 88.4, hundreds: 2, fifties: 8, wickets: 170, economy: 5.04 }
    }
  },
  {
    id: 12,
    name: "Ben Stokes",
    role: "All-rounder",
    country: "England",
    batting: 84,
    bowling: 82,
    fielding: 89,
    overall: 90,
    specialty: "Match Winner",
    rarity: "Epic",
    image: "https://via.placeholder.com/300x400/b91c1c/ffffff?text=BS",
    formats: {
      odi: { matches: 113, runs: 3017, avg: 38.94, sr: 93.20, hundreds: 3, fifties: 21, wickets: 74, economy: 5.91, bestScore: "102*" },
      test: { matches: 105, runs: 6361, avg: 35.79, sr: 57.44, hundreds: 13, fifties: 30, wickets: 196, economy: 3.17, bestScore: "258" },
      t20: { matches: 43, runs: 591, avg: 22.73, sr: 135.78, hundreds: 0, fifties: 2, wickets: 28, economy: 8.32, bestScore: "63*" },
      worldCup: { matches: 23, runs: 719, avg: 39.9, sr: 94.1, hundreds: 1, fifties: 5, wickets: 15, economy: 6.12 },
      knockouts: { matches: 14, runs: 512, avg: 51.2, sr: 98.3, hundreds: 1, fifties: 3, wickets: 9, economy: 6.34 },
      bilateral: { matches: 76, runs: 1786, avg: 36.2, sr: 91.8, hundreds: 1, fifties: 13, wickets: 50, economy: 5.73 }
    }
  },
  {
    id: 13,
    name: "Hardik Pandya",
    role: "All-rounder",
    country: "India",
    batting: 80,
    bowling: 79,
    fielding: 88,
    overall: 87,
    specialty: "Big Hitter",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/0369a1/ffffff?text=HP",
    formats: {
      odi: { matches: 91, runs: 1768, avg: 32.89, sr: 114.08, hundreds: 1, fifties: 9, wickets: 76, economy: 5.68, bestScore: "113*" },
      test: { matches: 11, runs: 532, avg: 31.29, sr: 72.51, hundreds: 1, fifties: 3, wickets: 17, economy: 3.72, bestScore: "108" },
      t20: { matches: 104, runs: 1692, avg: 28.20, sr: 143.34, hundreds: 0, fifties: 7, wickets: 75, economy: 7.65, bestScore: "91" },
      worldCup: { matches: 17, runs: 412, avg: 34.3, sr: 118.4, hundreds: 0, fifties: 2, wickets: 14, economy: 5.89 },
      knockouts: { matches: 11, runs: 267, avg: 33.4, sr: 121.8, hundreds: 0, fifties: 2, wickets: 9, economy: 6.12 },
      bilateral: { matches: 63, runs: 1089, avg: 31.1, sr: 111.2, hundreds: 1, fifties: 5, wickets: 53, economy: 5.51 }
    }
  },
  {
    id: 14,
    name: "Mitchell Starc",
    role: "Bowler",
    country: "Australia",
    batting: 40,
    bowling: 93,
    fielding: 81,
    overall: 89,
    specialty: "White Ball Demon",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/7e22ce/ffffff?text=MS",
    formats: {
      odi: { matches: 115, runs: 707, avg: 15.37, sr: 88.05, hundreds: 0, fifties: 1, wickets: 247, economy: 5.19, bestScore: "52" },
      test: { matches: 87, runs: 1793, avg: 18.30, sr: 64.86, hundreds: 0, fifties: 6, wickets: 358, economy: 3.15, bestScore: "99" },
      t20: { matches: 62, runs: 116, avg: 11.60, sr: 130.34, hundreds: 0, fifties: 0, wickets: 75, economy: 7.28, bestScore: "25" },
      worldCup: { matches: 28, runs: 89, avg: 12.7, sr: 84.8, hundreds: 0, fifties: 0, wickets: 65, economy: 4.89 },
      knockouts: { matches: 15, runs: 45, avg: 11.3, sr: 78.9, hundreds: 0, fifties: 0, wickets: 34, economy: 4.67 },
      bilateral: { matches: 72, runs: 573, avg: 16.8, sr: 90.2, hundreds: 0, fifties: 1, wickets: 167, economy: 5.38 }
    }
  },
  {
    id: 15,
    name: "Rashid Khan",
    role: "Bowler",
    country: "Afghanistan",
    batting: 52,
    bowling: 92,
    fielding: 84,
    overall: 88,
    specialty: "Spin Wizard",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/be123c/ffffff?text=RK",
    formats: {
      odi: { matches: 98, runs: 1013, avg: 16.95, sr: 96.48, hundreds: 0, fifties: 2, wickets: 169, economy: 4.39, bestScore: "60*" },
      test: { matches: 6, runs: 165, avg: 27.50, sr: 79.33, hundreds: 0, fifties: 1, wickets: 34, economy: 3.38, bestScore: "51" },
      t20: { matches: 91, runs: 458, avg: 14.31, sr: 138.55, hundreds: 0, fifties: 0, wickets: 142, economy: 6.14, bestScore: "60" },
      worldCup: { matches: 16, runs: 134, avg: 16.8, sr: 93.7, hundreds: 0, fifties: 0, wickets: 28, economy: 4.12 },
      knockouts: { matches: 9, runs: 67, avg: 13.4, sr: 88.2, hundreds: 0, fifties: 0, wickets: 15, economy: 4.34 },
      bilateral: { matches: 73, runs: 812, avg: 17.0, sr: 97.8, hundreds: 0, fifties: 2, wickets: 126, economy: 4.48 }
    }
  },
  {
    id: 16,
    name: "David Warner",
    role: "Batsman",
    country: "Australia",
    batting: 89,
    bowling: 15,
    fielding: 82,
    overall: 86,
    specialty: "Aggressor",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/0891b2/ffffff?text=DW",
    formats: {
      odi: { matches: 161, runs: 6932, avg: 45.30, sr: 97.26, hundreds: 22, fifties: 33, wickets: 0, economy: 0, bestScore: "179" },
      test: { matches: 112, runs: 8786, avg: 44.59, sr: 70.19, hundreds: 26, fifties: 37, wickets: 0, economy: 0, bestScore: "335*" },
      t20: { matches: 110, runs: 3155, avg: 33.72, sr: 142.47, hundreds: 1, fifties: 28, wickets: 0, economy: 0, bestScore: "100*" },
      worldCup: { matches: 29, runs: 1527, avg: 56.56, sr: 105.4, hundreds: 6, fifties: 7, wickets: 0, economy: 0 },
      knockouts: { matches: 17, runs: 812, avg: 54.1, sr: 102.3, hundreds: 3, fifties: 4, wickets: 0, economy: 0 },
      bilateral: { matches: 115, runs: 4593, avg: 42.1, sr: 95.4, hundreds: 13, fifties: 22, wickets: 0, economy: 0 }
    }
  },
  {
    id: 17,
    name: "Quinton de Kock",
    role: "Wicketkeeper-Batsman",
    country: "South Africa",
    batting: 86,
    bowling: 10,
    fielding: 92,
    overall: 85,
    specialty: "Explosive Opener",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/ea580c/ffffff?text=QK",
    formats: {
      odi: { matches: 156, runs: 6676, avg: 44.51, sr: 96.49, hundreds: 19, fifties: 36, wickets: 0, economy: 0, bestScore: "178" },
      test: { matches: 54, runs: 3300, avg: 38.82, sr: 62.09, hundreds: 6, fifties: 22, wickets: 0, economy: 0, bestScore: "141*" },
      t20: { matches: 88, runs: 2256, avg: 30.35, sr: 136.39, hundreds: 1, fifties: 14, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup: { matches: 25, runs: 1109, avg: 55.45, sr: 101.2, hundreds: 4, fifties: 6, wickets: 0, economy: 0 },
      knockouts: { matches: 13, runs: 512, avg: 46.5, sr: 96.4, hundreds: 2, fifties: 3, wickets: 0, economy: 0 },
      bilateral: { matches: 118, runs: 4655, avg: 42.3, sr: 95.1, hundreds: 13, fifties: 27, wickets: 0, economy: 0 }
    }
  },
  {
    id: 18,
    name: "AB de Villiers",
    role: "Batsman",
    country: "South Africa",
    batting: 95,
    bowling: 28,
    fielding: 94,
    overall: 93,
    specialty: "Mr. 360",
    rarity: "Legend",
    image: "https://via.placeholder.com/300x400/c026d3/ffffff?text=AB",
    formats: {
      odi: { matches: 228, runs: 9577, avg: 53.50, sr: 101.09, hundreds: 25, fifties: 53, wickets: 0, economy: 0, bestScore: "176" },
      test: { matches: 114, runs: 8765, avg: 50.66, sr: 60.29, hundreds: 22, fifties: 46, wickets: 0, economy: 0, bestScore: "278*" },
      t20: { matches: 78, runs: 1672, avg: 26.13, sr: 135.16, hundreds: 0, fifties: 10, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup: { matches: 23, runs: 1207, avg: 63.53, sr: 117.3, hundreds: 4, fifties: 6, wickets: 0, economy: 0 },
      knockouts: { matches: 15, runs: 723, avg: 60.3, sr: 114.2, hundreds: 2, fifties: 5, wickets: 0, economy: 0 },
      bilateral: { matches: 190, runs: 7647, avg: 51.3, sr: 98.8, hundreds: 19, fifties: 42, wickets: 0, economy: 0 }
    }
  },
  {
    id: 19,
    name: "MS Dhoni",
    role: "Wicketkeeper-Batsman",
    country: "India",
    batting: 88,
    bowling: 20,
    fielding: 96,
    overall: 92,
    specialty: "Captain Cool",
    rarity: "Legend",
    image: "https://via.placeholder.com/300x400/0e7490/ffffff?text=MSD",
    formats: {
      odi: { matches: 350, runs: 10773, avg: 50.57, sr: 87.56, hundreds: 10, fifties: 73, wickets: 1, economy: 5.23, bestScore: "183*" },
      test: { matches: 90, runs: 4876, avg: 38.09, sr: 58.23, hundreds: 6, fifties: 33, wickets: 0, economy: 0, bestScore: "224" },
      t20: { matches: 98, runs: 1617, avg: 37.60, sr: 126.13, hundreds: 0, fifties: 2, wickets: 0, economy: 0, bestScore: "56" },
      worldCup: { matches: 50, runs: 1782, avg: 59.40, sr: 88.7, hundreds: 1, fifties: 15, wickets: 0, economy: 0 },
      knockouts: { matches: 28, runs: 912, avg: 60.8, sr: 86.3, hundreds: 0, fifties: 8, wickets: 0, economy: 0 },
      bilateral: { matches: 272, runs: 8079, avg: 48.0, sr: 87.2, hundreds: 8, fifties: 50, wickets: 1, economy: 5.23 }
    }
  },
  {
    id: 20,
    name: "Trent Boult",
    role: "Bowler",
    country: "New Zealand",
    batting: 33,
    bowling: 91,
    fielding: 79,
    overall: 86,
    specialty: "Swing Master",
    rarity: "Rare",
    image: "https://via.placeholder.com/300x400/0f766e/ffffff?text=TB",
    formats: {
      odi: { matches: 117, runs: 412, avg: 11.77, sr: 73.62, hundreds: 0, fifties: 0, wickets: 199, economy: 5.13, bestScore: "32" },
      test: { matches: 78, runs: 1114, avg: 15.97, sr: 53.41, hundreds: 0, fifties: 3, wickets: 317, economy: 2.85, bestScore: "52*" },
      t20: { matches: 63, runs: 67, avg: 8.38, sr: 108.06, hundreds: 0, fifties: 0, wickets: 74, economy: 7.82, bestScore: "14" },
      worldCup: { matches: 24, runs: 56, avg: 9.3, sr: 70.9, hundreds: 0, fifties: 0, wickets: 38, economy: 4.85 },
      knockouts: { matches: 14, runs: 34, avg: 8.5, sr: 68.0, hundreds: 0, fifties: 0, wickets: 22, economy: 4.67 },
      bilateral: { matches: 79, runs: 322, avg: 12.8, sr: 75.3, hundreds: 0, fifties: 0, wickets: 139, economy: 5.28 }
    }
  }
];

export interface Battle {
  id: number;
  date: string;
  opponent: string;
  result: 'won' | 'lost';
  score: string;
  trophies: number;
  bestPerformer: string;
}

export const recentBattles: Battle[] = [
  { id: 1, date: '2024-02-07', opponent: 'CricFan23', result: 'won', score: '485-462', trophies: 25, bestPerformer: 'Virat Kohli' },
  { id: 2, date: '2024-02-06', opponent: 'BowlMaster', result: 'won', score: '512-498', trophies: 30, bestPerformer: 'Jasprit Bumrah' },
  { id: 3, date: '2024-02-05', opponent: 'SixHitter', result: 'lost', score: '445-467', trophies: 0, bestPerformer: 'Rohit Sharma' },
  { id: 4, date: '2024-02-04', opponent: 'SpinKing', result: 'won', score: '523-501', trophies: 35, bestPerformer: 'Rashid Khan' },
  { id: 5, date: '2024-02-03', opponent: 'FastBowler', result: 'won', score: '498-476', trophies: 28, bestPerformer: 'Pat Cummins' },
];

export interface LeaderboardEntry {
  rank: number;
  username: string;
  battlesWon: number;
  trophies: number;
  winRate: number;
  avatar: string;
}

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'CricketKing', battlesWon: 342, trophies: 8945, winRate: 87.3, avatar: '👑' },
  { rank: 2, username: 'MasterBlaster', battlesWon: 318, trophies: 8312, winRate: 84.1, avatar: '🏆' },
  { rank: 3, username: 'BowlEmOver', battlesWon: 295, trophies: 7823, winRate: 81.7, avatar: '🥇' },
  { rank: 4, username: 'SixMachine', battlesWon: 278, trophies: 7234, winRate: 79.4, avatar: '💥' },
  { rank: 5, username: 'SpinDoctor', battlesWon: 256, trophies: 6789, winRate: 77.2, avatar: '🌀' },
  { rank: 6, username: 'FastAndFurious', battlesWon: 241, trophies: 6456, winRate: 75.8, avatar: '⚡' },
  { rank: 7, username: 'CaptainCool', battlesWon: 229, trophies: 6123, winRate: 73.5, avatar: '🧊' },
  { rank: 8, username: 'BoundaryBoss', battlesWon: 215, trophies: 5834, winRate: 71.3, avatar: '🎯' },
  { rank: 9, username: 'YorkerKing', battlesWon: 203, trophies: 5567, winRate: 69.8, avatar: '🎳' },
  { rank: 10, username: 'AllRounder', battlesWon: 189, trophies: 5234, winRate: 67.4, avatar: '⭐' },
];
