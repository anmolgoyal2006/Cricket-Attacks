/**
 * Cricket Scoring Feature — Phase 2 + Guest Player extension
 * Increment / decrement PlayerMatchStats for batsmen and bowlers.
 * Uses findOneAndUpdate + upsert so it is safe to call without pre-creating the doc.
 *
 * Guest players: pass playerIdOrGuest as { guestName: string } instead of an id string.
 * Stats are stored with playerId=null, guestName=<name>.
 * When the guest later registers with a matching username, careerStatsService will link them.
 */

import mongoose from 'mongoose';
import PlayerMatchStats from '../models/cricket-scoring/PlayerMatchStats';

type PlayerKey = mongoose.Types.ObjectId | string | { guestName: string };

function playerFilter(matchId: string | mongoose.Types.ObjectId, player: PlayerKey) {
  if (typeof player === 'object' && !(player instanceof mongoose.Types.ObjectId) && 'guestName' in player) {
    // Do NOT include playerId in the filter for guests — the old non-sparse { matchId, playerId }
    // index treats null as a real value, so two guests in the same match would collide.
    // Filter only on { matchId, guestName } so it uses the correct guest index.
    return { matchId, guestName: player.guestName };
  }
  return { matchId, playerId: player };
}

function playerUpsertFields(player: PlayerKey): Record<string, unknown> {
  if (typeof player === 'object' && !(player instanceof mongoose.Types.ObjectId) && 'guestName' in player) {
    return { playerId: null, guestName: player.guestName };
  }
  return { playerId: player, guestName: null };
}

// ─── Batting ─────────────────────────────────────────────────────────────────

interface BattingDelta {
  runs: number;
  ballFaced: number;          // 1 for legal deliveries only
  isBoundaryFour: boolean;
  isBoundarySix: boolean;
  isOut: boolean;
  dismissalType?: string | null;
}

export async function incrementBattingStats(
  matchId: mongoose.Types.ObjectId | string,
  player: PlayerKey,
  delta: BattingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter = playerFilter(matchId, player);
  const upsertFields = playerUpsertFields(player);

  // Pipeline updates don't support $setOnInsert, so we use a two-step approach:
  // ensure the doc exists first (upsert with $setOnInsert for identity fields),
  // then apply the aggregation pipeline update.
  await PlayerMatchStats.findOneAndUpdate(
    filter,
    { $setOnInsert: upsertFields },
    { upsert: true, new: false, session, setDefaultsOnInsert: true }
  );

  await PlayerMatchStats.findOneAndUpdate(
    filter,
    [
      {
        $set: {
          'battingStats.runs': { $add: ['$battingStats.runs', delta.runs] },
          'battingStats.ballsFaced': { $add: ['$battingStats.ballsFaced', delta.ballFaced] },
          'battingStats.fours': { $add: ['$battingStats.fours', delta.isBoundaryFour ? 1 : 0] },
          'battingStats.sixes': { $add: ['$battingStats.sixes', delta.isBoundarySix ? 1 : 0] },
          ...(delta.isOut ? {
            'battingStats.isOut': true,
            'battingStats.dismissalType': delta.dismissalType || null,
          } : {}),
        },
      },
      {
        $set: {
          'battingStats.strikeRate': {
            $cond: [
              { $gt: ['$battingStats.ballsFaced', 0] },
              { $multiply: [{ $divide: ['$battingStats.runs', '$battingStats.ballsFaced'] }, 100] },
              0,
            ],
          },
        },
      },
    ],
    { session }
  );
}

export async function decrementBattingStats(
  matchId: mongoose.Types.ObjectId | string,
  player: PlayerKey,
  delta: BattingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter = playerFilter(matchId, player);
  await PlayerMatchStats.findOneAndUpdate(
    filter,
    [
      {
        $set: {
          'battingStats.runs': { $max: [0, { $subtract: ['$battingStats.runs', delta.runs] }] },
          'battingStats.ballsFaced': { $max: [0, { $subtract: ['$battingStats.ballsFaced', delta.ballFaced] }] },
          'battingStats.fours': { $max: [0, { $subtract: ['$battingStats.fours', delta.isBoundaryFour ? 1 : 0] }] },
          'battingStats.sixes': { $max: [0, { $subtract: ['$battingStats.sixes', delta.isBoundarySix ? 1 : 0] }] },
          ...(delta.isOut ? { 'battingStats.isOut': false, 'battingStats.dismissalType': null } : {}),
        },
      },
      {
        $set: {
          'battingStats.strikeRate': {
            $cond: [
              { $gt: ['$battingStats.ballsFaced', 0] },
              { $multiply: [{ $divide: ['$battingStats.runs', '$battingStats.ballsFaced'] }, 100] },
              0,
            ],
          },
        },
      },
    ],
    { session }
  );
}

// ─── Bowling ──────────────────────────────────────────────────────────────────

interface BowlingDelta {
  ballBowled: number;       // 1 for legal deliveries
  runsConceded: number;     // bat runs + extras chargeable to bowler
  isWicket: boolean;
  isMaiden?: boolean;
}

export async function incrementBowlingStats(
  matchId: mongoose.Types.ObjectId | string,
  player: PlayerKey,
  delta: BowlingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter = playerFilter(matchId, player);
  const upsertFields = playerUpsertFields(player);

  // Ensure the doc exists with correct identity fields before the pipeline update
  await PlayerMatchStats.findOneAndUpdate(
    filter,
    { $setOnInsert: upsertFields },
    { upsert: true, new: false, session, setDefaultsOnInsert: true }
  );

  await PlayerMatchStats.findOneAndUpdate(
    filter,
    [
      {
        $set: {
          'bowlingStats.ballsBowled': { $add: ['$bowlingStats.ballsBowled', delta.ballBowled] },
          'bowlingStats.runsConceded': { $add: ['$bowlingStats.runsConceded', delta.runsConceded] },
          'bowlingStats.wickets': { $add: ['$bowlingStats.wickets', delta.isWicket ? 1 : 0] },
          'bowlingStats.maidens': { $add: ['$bowlingStats.maidens', delta.isMaiden ? 1 : 0] },
        },
      },
      {
        $set: {
          'bowlingStats.oversBowled': { $divide: ['$bowlingStats.ballsBowled', 6] },
          'bowlingStats.economy': {
            $cond: [
              { $gt: ['$bowlingStats.ballsBowled', 0] },
              {
                $divide: [
                  '$bowlingStats.runsConceded',
                  { $divide: ['$bowlingStats.ballsBowled', 6] },
                ],
              },
              0,
            ],
          },
        },
      },
    ],
    { session }
  );
}

export async function decrementBowlingStats(
  matchId: mongoose.Types.ObjectId | string,
  player: PlayerKey,
  delta: BowlingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter = playerFilter(matchId, player);
  await PlayerMatchStats.findOneAndUpdate(
    filter,
    [
      {
        $set: {
          'bowlingStats.ballsBowled': { $max: [0, { $subtract: ['$bowlingStats.ballsBowled', delta.ballBowled] }] },
          'bowlingStats.runsConceded': { $max: [0, { $subtract: ['$bowlingStats.runsConceded', delta.runsConceded] }] },
          'bowlingStats.wickets': { $max: [0, { $subtract: ['$bowlingStats.wickets', delta.isWicket ? 1 : 0] }] },
          'bowlingStats.maidens': { $max: [0, { $subtract: ['$bowlingStats.maidens', delta.isMaiden ? 1 : 0] }] },
        },
      },
      {
        $set: {
          'bowlingStats.oversBowled': { $divide: ['$bowlingStats.ballsBowled', 6] },
          'bowlingStats.economy': {
            $cond: [
              { $gt: ['$bowlingStats.ballsBowled', 0] },
              { $divide: ['$bowlingStats.runsConceded', { $divide: ['$bowlingStats.ballsBowled', 6] }] },
              0,
            ],
          },
        },
      },
    ],
    { session }
  );
}
