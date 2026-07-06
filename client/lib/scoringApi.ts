/**
 * Cricket Scoring Feature — Phase 4
 * API helpers for the scoring feature.
 * Follows the same pattern as lib/api.ts (used across the rest of the app).
 */

import { api } from './api';

export interface ScoringPlayer {
  _id: string;
  username: string;
}

/** A player in a match — either a registered user or a guest-by-name */
export interface MatchPlayer {
  userId?: { _id: string; username: string } | null;
  guestName?: string | null;
  displayName: string;
}

export interface ScoringTeam {
  name: string;
  players: MatchPlayer[];
}

export interface ScoringMatch {
  _id: string;
  teamA: ScoringTeam;
  teamB: ScoringTeam;
  oversFormat: number;
  tossWonBy: 'teamA' | 'teamB';
  tossDecision: 'bat' | 'bowl';
  /** When true: no non-striker slot — one batsman faces every ball alone. */
  individualBattingMode: boolean;
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  currentInnings: number;
  result: { winner: string; margin: string; method: string } | null;
  scorers: ScoringPlayer[];
  createdBy: { _id: string; username: string } | string;
  venue?: string | null;
  currentInningsSummary?: InningsSummary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InningsSummary {
  _id: string;
  matchId: string;
  inningsNumber: 1 | 2;
  battingTeam: 'teamA' | 'teamB';
  bowlingTeam: 'teamA' | 'teamB';
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  target?: number | null;
  isCompleted: boolean;
}

export interface BallPayload {
  bowlerId: string;
  batsmanOnStrikeId: string;
  nonStrikerId: string;
  runsScored?: number;
  extraType?: 'wide' | 'noBall' | 'bye' | 'legBye' | null;
  extraRuns?: number;
  noballExtraKind?: 'bye' | 'legbye' | 'overthrow' | null;
  isWicket?: boolean;
  wicketType?: string | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
}

export interface BallResult {
  ball: Record<string, unknown>;
  innings: {
    totalRuns: number;
    totalWickets: number;
    oversCompleted: number;
    ballsInCurrentOver: number;
    extras: { wides: number; noBalls: number; byes: number; legByes: number };
    target?: number | null;
  };
  flags: {
    strikeSwapped: boolean;
    isEndOfOver: boolean;
    needsNewBatsman: boolean;
    inningsComplete: boolean;
    matchComplete: boolean;
    resultText: string | null;
  };
}

export interface CreateMatchPlayerPayload {
  id?: string;          // registered user ObjectId
  guestName?: string;   // guest name (no account)
  displayName: string;  // always present
}

export interface CreateMatchPayload {
  teamA: { name: string; players: CreateMatchPlayerPayload[] };
  teamB: { name: string; players: CreateMatchPlayerPayload[] };
  oversFormat: number;
  tossWonBy: 'teamA' | 'teamB';
  tossDecision: 'bat' | 'bowl';
  /** When true: no non-striker slot — one batsman faces every ball alone. */
  individualBattingMode?: boolean;
  venue?: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const scoringApi = {
  /** GET /api/auth/search-users?q= — reuse existing auth users for player selection */
  searchUsers: (q: string) =>
    api<{ users: ScoringPlayer[] }>(`/auth/users/search?q=${encodeURIComponent(q)}`),

  createMatch: (payload: CreateMatchPayload) =>
    api<{ match: ScoringMatch }>('/scoring/matches', { method: 'POST', body: payload }),

  startMatch: (matchId: string) =>
    api<{ match: ScoringMatch; message: string }>(`/scoring/matches/${matchId}/start`, {
      method: 'PATCH',
    }),

  startSecondInnings: (matchId: string) =>
    api<{ match: ScoringMatch }>(`/scoring/matches/${matchId}/start-second-innings`, {
      method: 'PATCH',
    }),

  getMatch: (matchId: string) =>
    api<{ match: ScoringMatch }>(`/scoring/matches/${matchId}`),

  listMatches: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return api<{ matches: ScoringMatch[] }>(`/scoring/matches${qs}`);
  },

  recordBall: (matchId: string, payload: BallPayload) =>
    api<BallResult>(`/scoring/matches/${matchId}/balls`, {
      method: 'POST',
      body: payload,
    }),

  undoLastBall: (matchId: string) =>
    api<{
      undone: Record<string, unknown>;
      innings: BallResult['innings'];
    }>(`/scoring/matches/${matchId}/balls/last`, { method: 'DELETE' }),
};

// ── Career & match-history stats ─────────────────────────────────────────────

/** Populated playerId field on career stats */
export interface CareerStatsPlayer {
  _id: string;
  username: string;
}

/**
 * Shape returned by GET /api/scoring/stats/player/:playerId/career
 * Mirrors IPlayerCareerStats with playerId populated as { _id, username }.
 */
export interface PlayerCareerStats {
  _id: string;
  playerId: CareerStatsPlayer;
  matchesPlayed: number;
  totalRuns: number;
  totalBallsFaced: number;
  highestScore: number;
  totalFours: number;
  totalSixes: number;
  battingAverage: number;
  battingStrikeRate: number;
  timesOut: number;
  totalWickets: number;
  totalOversBowled: number;
  totalRunsConceded: number;
  bestBowlingFigures: {
    wickets: number;
    runs: number;
  };
  bowlingAverage: number;
  economyRate: number;
  totalCatches: number;
  totalRunOuts: number;
  totalStumpings: number;
  lastUpdated: string;
}

/** Populated matchId on per-match stat rows */
export interface MatchSummary {
  _id: string;
  teamA: { name: string };
  teamB: { name: string };
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  result: { winner: string; margin: string; method: string } | null;
  createdAt: string;
  oversFormat: number;
}

/**
 * A single row from GET /api/scoring/stats/player/:playerId/matches
 * matchId is populated with the match summary.
 */
export interface PlayerMatchHistoryEntry {
  _id: string;
  matchId: MatchSummary;
  inningsNumber: 1 | 2;
  playerId: { _id: string; username: string } | null;
  guestName: string | null;
  battingStats: {
    runs: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    dismissalType: string | null;
    strikeRate: number;
  };
  bowlingStats: {
    oversBowled: number;
    ballsBowled: number;
    runsConceded: number;
    wickets: number;
    maidens: number;
    economy: number;
  };
  fieldingStats: {
    catches: number;
    runOuts: number;
    stumpings: number;
  };
  createdAt: string;
}

export interface MatchHistoryPagination {
  page: number;
  pages: number;
  total: number;
}

export const scoringStatsApi = {
  /**
   * GET /api/scoring/stats/player/:playerId/career
   * Returns the aggregated career stats for a registered player.
   * Throws NotFoundError (404) if the player has no recorded matches yet.
   */
  getCareerStats: (playerId: string) =>
    api<{ stats: PlayerCareerStats }>(`/scoring/stats/player/${playerId}/career`),

  /**
   * GET /api/scoring/stats/player/:playerId/matches
   * Returns per-match stat rows for a player, newest first, with pagination.
   */
  getMatchHistory: (playerId: string, page = 1, limit = 15) =>
    api<{ matchStats: PlayerMatchHistoryEntry[]; pagination: MatchHistoryPagination }>(
      `/scoring/stats/player/${playerId}/matches?page=${page}&limit=${limit}`
    ),
};

// ── Phase 5 additions ─────────────────────────────────────────────────────────

export interface BallRecord {
  _id: string;
  matchId: string;
  inningsId: string;
  over: number;
  ballNumber: number;
  bowlerId: { _id: string; username: string } | null;
  batsmanOnStrikeId: { _id: string; username: string } | null;
  nonStrikerId: string;
  // Guest name fields — populated when the corresponding ObjectId is null
  guestBowler: string | null;
  guestBatsman: string | null;
  guestNonStriker: string | null;
  guestDismissed: string | null;
  guestFielder: string | null;
  runsScored: number;
  extraType: 'wide' | 'noBall' | 'noball' | 'bye' | 'legBye' | 'legbye' | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType: string | null;
  dismissedPlayerId: { _id: string; username: string } | null;
  fielderId: { _id: string; username: string } | null;
  isLegalDelivery: boolean;
  timestamp: string;
}

export interface PlayerMatchStat {
  _id: string;
  matchId: string;
  inningsNumber?: 1 | 2;
  playerId: { _id: string; username: string } | null;
  guestName: string | null;
  displayName?: string;
  battingStats: {
    runs: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    dismissalType: string | null;
    strikeRate: number;
  };
  bowlingStats: {
    oversBowled: number;
    ballsBowled: number;
    runsConceded: number;
    wickets: number;
    maidens: number;
    economy: number;
  };
}

export const scoringSpectatorApi = {
  getBalls: (matchId: string, skip = 0, limit = 50) =>
    api<{ balls: BallRecord[] }>(
      `/scoring/matches/${matchId}/balls?skip=${skip}&limit=${limit}`
    ),

  getMatchStats: (matchId: string) =>
    api<{ stats: PlayerMatchStat[] }>(`/scoring/matches/${matchId}/stats`),

  listMatchesPaged: (status?: string, page = 1, limit = 12) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return api<{ matches: ScoringMatch[]; pagination: { page: number; pages: number; total: number } }>(
      `/scoring/matches?${params.toString()}`
    );
  },
};
