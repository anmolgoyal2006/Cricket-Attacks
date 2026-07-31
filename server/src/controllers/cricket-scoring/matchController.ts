/**
 * Cricket Scoring Feature — Phase 2
 * Match controller: create, list, detail, add/remove scorers, start match.
 */

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { parsePagination, paginationResponse } from '../../utils/helpers';
import ScoringMatch from '../../models/cricket-scoring/ScoringMatch';
import Innings from '../../models/cricket-scoring/Innings';

// ── POST /api/scoring/matches ─────────────────────────────────────────────────
export async function createMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { teamA, teamB, oversFormat, tossWonBy, tossDecision, venue, scorers, individualBattingMode } = req.body;

    if (!teamA?.name || !teamA?.players?.length) {
      throw new BadRequestError('teamA must have a name and at least one player');
    }
    if (!teamB?.name || !teamB?.players?.length) {
      throw new BadRequestError('teamB must have a name and at least one player');
    }
    if (!oversFormat || oversFormat <= 0) {
      throw new BadRequestError('oversFormat must be a positive number');
    }
    if (!['teamA', 'teamB'].includes(tossWonBy)) {
      throw new BadRequestError('tossWonBy must be "teamA" or "teamB"');
    }
    if (!['bat', 'bowl'].includes(tossDecision)) {
      throw new BadRequestError('tossDecision must be "bat" or "bowl"');
    }

    // Normalise player entries from client:
    // Registered:  { id: '<objectId>', displayName: 'username' }
    // Guest:       { guestName: 'SomeName', displayName: 'SomeName' }
    type RawPlayer = { id?: string; guestName?: string; displayName?: string };

    function normalisePlayers(raw: RawPlayer[]) {
      return raw.map((p) => {
        if (p.id) {
          return { userId: new mongoose.Types.ObjectId(p.id), guestName: null, displayName: p.displayName || '' };
        }
        const name = (p.guestName || p.displayName || '').trim();
        if (!name) throw new BadRequestError('Each player must have a name');
        return { userId: null, guestName: name, displayName: name };
      });
    }

    // A player appearing twice — in one team or across both — silently corrupts
    // stats, because PlayerMatchStats is keyed on { matchId, playerId } and would
    // fold that player's batting and bowling into a single row.
    const seenPlayers = new Map<string, string>();

    function normalisePlayersChecked(raw: RawPlayer[], teamKey: 'teamA' | 'teamB') {
      const players = normalisePlayers(raw);
      for (const p of players) {
        const key = p.userId ? `uid:${p.userId.toString()}` : `g:${(p.guestName ?? '').toLowerCase()}`;
        const previous = seenPlayers.get(key);
        if (previous) {
          const label = p.displayName || p.guestName || 'A player';
          throw new BadRequestError(
            previous === teamKey
              ? `${label} is listed twice in the same team`
              : `${label} cannot be in both teams`
          );
        }
        seenPlayers.set(key, teamKey);
      }
      return players;
    }

    const match = await ScoringMatch.create({
      teamA: { name: teamA.name, players: normalisePlayersChecked(teamA.players, 'teamA') },
      teamB: { name: teamB.name, players: normalisePlayersChecked(teamB.players, 'teamB') },
      oversFormat,
      tossWonBy,
      tossDecision,
      individualBattingMode: !!individualBattingMode,
      venue: venue || null,
      createdBy: req.userId,
      scorers: scorers || [],
    });

    res.status(201).json({ match });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/my-teams ─────────────────────────────────────────
// Rosters are already stored in full on every match, so previous teams are derived
// rather than kept in their own collection. Must be routed BEFORE GET /:id.
export async function getMyTeams(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const matches = await ScoringMatch.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .limit(40)
      .select('teamA teamB createdAt')
      .populate('teamA.players.userId', 'username')
      .populate('teamB.players.userId', 'username')
      .lean();

    // Dedupe by team name, newest first. Rosters drift between matches, so keying
    // on the roster itself would return near-identical entries a picker can't tell apart.
    const seen = new Map<string, unknown>();

    for (const m of matches as any[]) {
      for (const team of [m.teamA, m.teamB]) {
        const name = (team?.name ?? '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;

        seen.set(key, {
          name,
          lastUsed: m.createdAt,
          players: (team.players ?? []).map((p: any) => ({
            id: p.userId?._id?.toString() ?? null,
            // displayName is a snapshot taken at match creation, so prefer the
            // current username when the player is registered.
            displayName: p.userId?.username ?? p.guestName ?? p.displayName,
            isGuest: !p.userId,
          })),
        });
      }
    }

    res.json({ teams: Array.from(seen.values()).slice(0, 20) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches ──────────────────────────────────────────────────
export async function listMatches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter: Record<string, any> = {};
    if (req.query.status) filter.status = req.query.status;

    const [matches, total] = await Promise.all([
      ScoringMatch.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScoringMatch.countDocuments(filter),
    ]);

    res.json({ matches, pagination: paginationResponse(total, page, limit) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:id ──────────────────────────────────────────────
export async function getMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id)
      .populate('teamA.players.userId', 'username')
      .populate('teamB.players.userId', 'username')
      .populate('createdBy', 'username')
      .populate('scorers', 'username')
      .lean();

    if (!match) throw new NotFoundError('Match');

    // Attach current innings summary
    const currentInnings = await Innings.findOne({
      matchId: match._id,
      inningsNumber: match.currentInnings,
    }).lean();

    res.json({ match: { ...match, currentInningsSummary: currentInnings || null } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/scoring/matches/:id/scorers ────────────────────────────────────
export async function updateScorers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id);
    if (!match) throw new NotFoundError('Match');
    if (match.createdBy.toString() !== req.userId) {
      throw new UnauthorizedError('Only the match creator can manage scorers');
    }

    const { add = [], remove = [] } = req.body;

    const addIds = add.map((id: string) => new mongoose.Types.ObjectId(id));
    const removeIds = remove.map((id: string) => id.toString());

    // Remove first, then add (de-dupe via Set)
    const filtered = match.scorers.filter((s) => !removeIds.includes(s.toString()));
    const existing = new Set(filtered.map((s) => s.toString()));
    for (const id of addIds) {
      if (!existing.has(id.toString())) filtered.push(id);
    }

    match.scorers = filtered;
    await match.save();

    res.json({ scorers: match.scorers });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/scoring/matches/:id/start-second-innings ──────────────────────
// Called by the scorer when they click "Start 2nd Innings" on the innings break screen.
// Transitions match status from 'innings_break' back to 'live' so ball recording works.
export async function startSecondInnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id);
    if (!match) throw new NotFoundError('Match');
    if (match.status !== 'innings_break') {
      throw new BadRequestError('Match is not in innings break');
    }

    match.status = 'live';
    await match.save();

    // Re-read with the same populates getMatch uses. The client replaces its whole
    // match object with this response, and it needs userId populated to tell
    // registered players from guests.
    const populated = await ScoringMatch.findById(match._id)
      .populate('teamA.players.userId', 'username')
      .populate('teamB.players.userId', 'username')
      .populate('createdBy', 'username')
      .populate('scorers', 'username')
      .lean();

    // Attach current innings summary
    const currentInnings = await Innings.findOne({
      matchId: match._id,
      inningsNumber: match.currentInnings,
    }).lean();

    res.json({ match: { ...populated, currentInningsSummary: currentInnings || null } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/scoring/matches/:id/start ─────────────────────────────────────
export async function startMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id);
    if (!match) throw new NotFoundError('Match');
    if (match.status !== 'upcoming') {
      throw new BadRequestError('Match has already started or is completed');
    }

    // Determine which team bats first based on toss
    const battingTeam =
      match.tossDecision === 'bat'
        ? match.tossWonBy
        : match.tossWonBy === 'teamA'
        ? 'teamB'
        : 'teamA';
    const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';

    // Create first innings
    await Innings.create({
      matchId: match._id,
      inningsNumber: 1,
      battingTeam,
      bowlingTeam,
    });

    match.status = 'live';
    match.currentInnings = 1;
    await match.save();

    res.json({ match, message: `Match started — ${battingTeam} batting first` });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:matchId/balls ───────────────────────────────────
// Returns ball-by-ball feed for a match, newest first. Public (authenticated only).
// Phase 5 addition — purely additive, no existing controller code changed.
export async function getBalls(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
    const skip = parseInt((req.query.skip as string) || '0', 10);

    const BallModel = (await import('../../models/cricket-scoring/Ball')).default;

    const balls = await BallModel.find({ matchId })
      .sort({ over: -1, ballNumber: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('batsmanOnStrikeId', 'username')
      .populate('bowlerId', 'username')
      .populate('dismissedPlayerId', 'username')
      .populate('fielderId', 'username')
      .lean();

    res.json({ balls });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:matchId/stats ───────────────────────────────────
// Returns per-player batting + bowling stats for a match. Used for scorecards.
// Phase 5 addition — purely additive.
export async function getMatchStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;

    const PlayerMatchStats = (await import('../../models/cricket-scoring/PlayerMatchStats')).default;

    const stats = await PlayerMatchStats.find({ matchId })
      .populate('playerId', 'username')
      .lean();

    res.json({ stats });
  } catch (err) {
    next(err);
  }
}
