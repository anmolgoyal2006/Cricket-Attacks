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

export interface ScoringTeam {
  name: string;
  players: ScoringPlayer[];
}

export interface ScoringMatch {
  _id: string;
  teamA: ScoringTeam;
  teamB: ScoringTeam;
  oversFormat: number;
  tossWonBy: 'teamA' | 'teamB';
  tossDecision: 'bat' | 'bowl';
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

export interface CreateMatchPayload {
  teamA: { name: string; players: string[] };
  teamB: { name: string; players: string[] };
  oversFormat: number;
  tossWonBy: 'teamA' | 'teamB';
  tossDecision: 'bat' | 'bowl';
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
  playerId: { _id: string; username: string };
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
