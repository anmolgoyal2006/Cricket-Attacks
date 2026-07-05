/**
 * Cricket Scoring Feature — Phase 2
 * Increment / decrement PlayerMatchStats for batsmen and bowlers.
 * Uses findOneAndUpdate + upsert so it is safe to call without pre-creating the doc.
 */

import mongoose from 'mongoose';
import PlayerMatchStats from '../models/cricket-scoring/PlayerMatchStats';

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
  playerId: mongoose.Types.ObjectId | string,
  delta: BattingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  const inc: Record<string, number> = {
    'battingStats.runs': delta.runs,
    'battingStats.ballsFaced': delta.ballFaced,
    'battingStats.fours': delta.isBoundaryFour ? 1 : 0,
    'battingStats.sixes': delta.isBoundarySix ? 1 : 0,
  };

  const set: Record<string, any> = {};
  if (delta.isOut) {
    set['battingStats.isOut'] = true;
    set['battingStats.dismissalType'] = delta.dismissalType || null;
  }

  const doc = await PlayerMatchStats.findOneAndUpdate(
    { matchId, playerId },
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
    { upsert: true, new: true, session }
  );
}

export async function decrementBattingStats(
  matchId: mongoose.Types.ObjectId | string,
  playerId: mongoose.Types.ObjectId | string,
  delta: BattingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  await PlayerMatchStats.findOneAndUpdate(
    { matchId, playerId },
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
  playerId: mongoose.Types.ObjectId | string,
  delta: BowlingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  await PlayerMatchStats.findOneAndUpdate(
    { matchId, playerId },
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
    { upsert: true, new: true, session }
  );
}

export async function decrementBowlingStats(
  matchId: mongoose.Types.ObjectId | string,
  playerId: mongoose.Types.ObjectId | string,
  delta: BowlingDelta,
  session?: mongoose.ClientSession
): Promise<void> {
  await PlayerMatchStats.findOneAndUpdate(
    { matchId, playerId },
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
