// lib/cricbuzz.ts

// Live Matches Types
export interface CricbuzzTeam {
  teamId: number;
  teamName: string;
  teamImg: string;
}

export interface CricbuzzMatchInfo {
  matchId: number;
  seriesName: string;
  matchDesc: string;
  state: string;
  status: string;
  venue: {
    ground: string;
    city: string;
    country: string;
  };
  startDate: number;
  endDate: number;
}

export interface CricbuzzScore {
  teamId: number;
  teamName: string;
  scores: string;
  wickets: number;
  overs: number;
}

export interface CricbuzzLiveMatch {
  matchInfo: CricbuzzMatchInfo;
  score: CricbuzzScore[];
}

export interface CricbuzzUpcomingMatch {
  matchInfo: CricbuzzMatchInfo;
}

export interface LiveMatchesResponse {
  success: boolean;
  data: CricbuzzLiveMatch[];
  cached: boolean;
  timestamp: number;
  error?: string;
}

export interface UpcomingMatchesResponse {
  success: boolean;
  data: CricbuzzUpcomingMatch[];
  cached: boolean;
  timestamp: number;
  error?: string;
}

// Player Stats Types (existing)
interface FormatStats {
  matches: number;
  runs: number;
  avg: number;
  sr: number;
  hundreds: number;
  fifties: number;
  wickets: number;
  economy: number;
}

interface Player {
  id: number;
  name: string;
  country: string;
  role: string;
  rarity: string;
  specialty: string;
  image: string;
  batting: number;
  bowling: number;
  fielding: number;
  overall: number;
  stats: {
    batting: number;
    bowling: number;
    fielding: number;
    overall: number;
    formats: {
      odi: FormatStats;
      test: FormatStats;
      t20: FormatStats;
      worldCup: FormatStats;
      knockouts: FormatStats;
      bilateral: FormatStats;
    };
  };
}

const RAPIDAPI_KEY = process.env.CRICBUZZ_API_KEY;
const RAPIDAPI_HOST = 'cricbuzz-cricket.p.rapidapi.com';

// Cricbuzz player IDs (you'll need to find/update these)
export const playerIdMap: Record<string, number> = {
  'Virat Kohli': 253802,
  'Rohit Sharma': 34102,
  'Babar Azam': 348144,
  'Steve Smith': 267192,
  'Joe Root': 303669,
  'Kane Williamson': 277906,
  'Jasprit Bumrah': 625383,
  'Pat Cummins': 477906,
  'Kagiso Rabada': 560886,
  'Shaheen Afridi': 711676,
  'Ravindra Jadeja': 234675,
  'Ben Stokes': 311158,
  'Hardik Pandya': 625371,
  'Mitchell Starc': 279716,
  'Rashid Khan': 793463,
  'David Warner': 219889,
  'Quinton de Kock': 379143,
  'AB de Villiers': 44828,
  'MS Dhoni': 28081,
  'Trent Boult': 277912,
};

export async function fetchPlayerStats(playerId: number): Promise<any> {
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/stats/v1/player/${playerId}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

// Live Matches API Helpers
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export function convertCricbuzzToPlayer(cricbuzzData: any, playerInfo: any): Player {
  // Extract stats from Cricbuzz API response
  const bat = cricbuzzData?.bat || {};
  const bowl = cricbuzzData?.bowl || {};

  const createFormatStats = (
    runs: number = 0,
    avg: number = 0,
    sr: number = 0,
    hundreds: number = 0,
    fifties: number = 0,
    wickets: number = 0,
    economy: number = 0
  ): FormatStats => ({
    matches: Math.floor(runs / 50) || 0,
    runs,
    avg,
    sr,
    hundreds,
    fifties,
    wickets,
    economy,
  });

  return {
    ...playerInfo,
    stats: {
      batting: calculateBattingRating(bat),
      bowling: calculateBowlingRating(bowl),
      fielding: 75,
      overall: calculateOverallRating(bat, bowl),
      formats: {
        odi: createFormatStats(
          bat.odiRuns,
          bat.odiAvg,
          bat.odiSR,
          bat.odi100,
          bat.odi50,
          bowl?.odiWkts,
          bowl?.odiEcon
        ),
        test: createFormatStats(
          bat.testRuns,
          bat.testAvg,
          bat.testSR,
          bat.test100,
          bat.test50,
          bowl?.testWkts,
          bowl?.testEcon
        ),
        t20: createFormatStats(
          bat.t20Runs,
          bat.t20Avg,
          bat.t20SR,
          bat.t20100,
          bat.t2050,
          bowl?.t20Wkts,
          bowl?.t20Econ
        ),
        // Estimate World Cup stats (15% of ODI)
        worldCup: createFormatStats(
          Math.floor((bat.odiRuns || 0) * 0.15),
          (bat.odiAvg || 0) * 1.05,
          bat.odiSR || 0,
          Math.floor((bat.odi100 || 0) * 0.2),
          Math.floor((bat.odi50 || 0) * 0.25),
          Math.floor((bowl?.odiWkts || 0) * 0.15),
          (bowl?.odiEcon || 0) * 0.95
        ),
        // Estimate Knockouts (12% of ODI, slightly better avg/sr)
        knockouts: createFormatStats(
          Math.floor((bat.odiRuns || 0) * 0.12),
          (bat.odiAvg || 0) * 1.08,
          (bat.odiSR || 0) * 1.03,
          Math.floor((bat.odi100 || 0) * 0.15),
          Math.floor((bat.odi50 || 0) * 0.18),
          Math.floor((bowl?.odiWkts || 0) * 0.12),
          (bowl?.odiEcon || 0) * 0.92
        ),
        // Estimate Bilateral (85% of ODI)
        bilateral: createFormatStats(
          Math.floor((bat.odiRuns || 0) * 0.85),
          bat.odiAvg || 0,
          bat.odiSR || 0,
          Math.floor((bat.odi100 || 0) * 0.8),
          Math.floor((bat.odi50 || 0) * 0.82),
          Math.floor((bowl?.odiWkts || 0) * 0.85),
          bowl?.odiEcon || 0
        ),
      },
    },
  };
}

function calculateBattingRating(bat: any): number {
  const odiAvg = bat?.odiAvg || 0;
  const odi100 = bat?.odi100 || 0;
  const rating = Math.min(100, odiAvg * 1.5 + odi100 * 2);
  return Math.floor(rating);
}

function calculateBowlingRating(bowl: any): number {
  if (!bowl) return 20;
  const wickets = bowl.odiWkts || 0;
  const econ = bowl.odiEcon || 10;
  const rating = Math.min(100, wickets * 0.4 + (10 - econ) * 5);
  return Math.floor(rating);
}

function calculateOverallRating(bat: any, bowl: any): number {
  const battingRating = calculateBattingRating(bat);
  const bowlingRating = calculateBowlingRating(bowl);
  return Math.floor(battingRating * 0.6 + bowlingRating * 0.3 + 75 * 0.1);
}

export async function getLiveMatches(): Promise<LiveMatchesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cricbuzz/live`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = JSON.stringify(await response.json());
      } catch {
        errorBody = await response.text().catch(() => '');
      }
      throw new Error(`API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return {
      success: false,
      data: [],
      cached: false,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getUpcomingMatches(): Promise<UpcomingMatchesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cricbuzz/upcoming`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = JSON.stringify(await response.json());
      } catch {
        errorBody = await response.text().catch(() => '');
      }
      throw new Error(`API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return {
      success: false,
      data: [],
      cached: false,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}