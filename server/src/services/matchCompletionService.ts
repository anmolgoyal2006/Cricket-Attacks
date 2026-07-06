/**
 * Cricket Scoring Feature — Phase 2
 * Checks whether an innings or the entire match has finished,
 * and updates documents accordingly.
 */

import mongoose from 'mongoose';
import ScoringMatch, { IScoringMatch } from '../models/cricket-scoring/ScoringMatch';
import Innings, { IInnings } from '../models/cricket-scoring/Innings';
import { foldMatchStatsIntoCareer } from './careerStatsService';

interface CompletionResult {
  inningsComplete: boolean;
  matchComplete: boolean;
  resultText?: string;
  innings2Created?: boolean;
}

export async function checkAndHandleCompletion(
  innings: IInnings,
  match: IScoringMatch,
  session?: mongoose.ClientSession
): Promise<CompletionResult> {
  // Count batting-team players to determine all-out threshold
  const battingPlayers =
    innings.battingTeam === 'teamA'
      ? match.teamA.players.length
      : match.teamB.players.length;

  const allOutWickets = match.individualBattingMode
    ? battingPlayers                    // solo mode: all players must be dismissed
    : Math.max(0, battingPlayers - 1);  // normal: N-1 wickets (last man can't bat alone)

  const inningsOver =
    innings.oversCompleted >= match.oversFormat ||
    innings.totalWickets >= allOutWickets;

  // Also check target-chased for 2nd innings (caller may already have done this, but safe to repeat)
  const targetChased =
    innings.inningsNumber === 2 &&
    innings.target != null &&
    innings.totalRuns >= innings.target;

  if (!inningsOver && !targetChased) {
    return { inningsComplete: false, matchComplete: false };
  }

  // ── Innings is complete ────────────────────────────────────────────────────
  innings.isCompleted = true;
  await innings.save({ session });

  if (innings.inningsNumber === 1) {
    // Start innings break and prepare innings 2
    match.status = 'innings_break';
    match.currentInnings = 2;
    await (match as any).save({ session });

    const innings2 = await Innings.create(
      [
        {
          matchId: match._id,
          inningsNumber: 2,
          battingTeam: innings.bowlingTeam,
          bowlingTeam: innings.battingTeam,
          target: innings.totalRuns + 1,
        },
      ],
      { session }
    );

    return { inningsComplete: true, matchComplete: false, innings2Created: true };
  }

  // ── 2nd innings complete → match over ─────────────────────────────────────
  match.status = 'completed';

  const innings1 = await Innings.findOne({
    matchId: match._id,
    inningsNumber: 1,
  }).lean();

  const team1Runs = innings1?.totalRuns ?? 0;
  const team2Runs = innings.totalRuns;

  let winner: string;
  let margin: string;
  let method = 'normal';

  if (targetChased) {
    // Chasing team won by remaining wickets
    const wicketsRemaining = allOutWickets - innings.totalWickets;
    winner = innings.battingTeam === 'teamA' ? match.teamA.name : match.teamB.name;
    margin = `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
  } else if (team2Runs > team1Runs) {
    const wicketsRemaining = allOutWickets - innings.totalWickets;
    winner = innings.battingTeam === 'teamA' ? match.teamA.name : match.teamB.name;
    margin = `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
  } else if (team1Runs > team2Runs) {
    const runMargin = team1Runs - team2Runs;
    winner = innings.bowlingTeam === 'teamA' ? match.teamA.name : match.teamB.name;
    margin = `${runMargin} run${runMargin !== 1 ? 's' : ''}`;
  } else {
    winner = 'tie';
    margin = 'tied';
    method = 'tie';
  }

  match.result = { winner, margin, method };
  await (match as any).save({ session });

  // Fold per-match stats into career stats (async, after writes committed)
 foldMatchStatsIntoCareer(match._id.toString()).catch((err) => {
  console.error("[careerStats] fold failed for match", match._id, err);
});

  return {
    inningsComplete: true,
    matchComplete: true,
    resultText: winner === 'tie' ? 'Match tied' : `${winner} won by ${margin}`,
  };
}
