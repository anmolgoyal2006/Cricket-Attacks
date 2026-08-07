'use client';

/**
 * Shared match scorecard — batting, bowling tables, and live commentary.
 * Used by the spectator page and by the Scorecard tab on the live scoring page.
 */

import { useState } from 'react';
import { ScoringMatch, PlayerMatchStat, MatchPlayer, BallRecord } from '@/lib/scoringApi';
import { generateCommentary, ballPillLabel, ballPillClass } from '@/lib/commentary';
import { cn } from '@/lib/utils';

export interface ScorecardInnings {
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  target?: number | null;
}

type ScorecardTab = 'batting' | 'bowling' | 'commentary';
type InningsTab = 1 | 2;

function oversStr(oc: number, bic: number) { return `${oc}.${bic}`; }

function strikeRate(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 100).toFixed(1);
}

function economy(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}

function bowlingOvers(ballsBowled: number) {
  return `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
}

/** Stable key for a team roster entry, matched against statKey below. */
function playerKey(p: MatchPlayer): string {
  if (p.userId && typeof p.userId === 'object') return `uid:${p.userId._id}`;
  if (p.guestName) return `g:${p.guestName.toLowerCase()}`;
  return `d:${p.displayName.toLowerCase()}`;
}

function statKey(s: PlayerMatchStat): string {
  if (s.playerId?._id) return `uid:${s.playerId._id}`;
  if (s.guestName) return `g:${s.guestName.toLowerCase()}`;
  return '';
}

interface MatchScorecardProps {
  match: ScoringMatch;
  stats: PlayerMatchStat[];
  /** Totals for the CURRENT innings — used for the Extras/Total footer. */
  innings: ScorecardInnings | null;
  /** All ball records for this match — drives the Commentary tab. */
  balls?: BallRecord[];
}

export default function MatchScorecard({ match, stats, innings, balls = [] }: MatchScorecardProps) {
  const [scorecardTab, setScorecardTab] = useState<ScorecardTab>('batting');
  const [inningsTab, setInningsTab] = useState<InningsTab>(
    (match.currentInnings === 2 ? 2 : 1) as InningsTab
  );

  // Filter balls to the selected innings tab
  const activeCi = match.currentInningsSummary;
  const commentaryBalls = balls.filter((b) => {
    if (!activeCi) return true;
    if (match.currentInnings === 1) return true;
    const currentInningsId = activeCi._id;
    if (inningsTab === 2) return b.inningsId === currentInningsId;
    return b.inningsId !== currentInningsId;
  });

  // Which team bats in the selected innings. The active innings comes straight from
  // the innings record; the historical innings-1 tab is its inverse.
  let battingTeamKey: 'teamA' | 'teamB';
  if (inningsTab === match.currentInnings) {
    battingTeamKey = (activeCi?.battingTeam ?? 'teamA') as 'teamA' | 'teamB';
  } else {
    const inn2Batting = (activeCi?.battingTeam ?? 'teamA') as 'teamA' | 'teamB';
    battingTeamKey = inn2Batting === 'teamA' ? 'teamB' : 'teamA';
  }
  const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';

  const battingKeys = new Set((match[battingTeamKey]?.players ?? []).map(playerKey));
  const bowlingKeys = new Set((match[bowlingTeamKey]?.players ?? []).map(playerKey));

  const battingStats = stats.filter((s) => {
    const k = statKey(s);
    return k && (battingKeys.size === 0 || battingKeys.has(k)) && (s.inningsNumber ?? 1) === inningsTab;
  });
  const bowlingStats = stats.filter((s) => {
    const k = statKey(s);
    return k && (bowlingKeys.size === 0 || bowlingKeys.has(k)) && (s.inningsNumber ?? 1) === inningsTab;
  });

  // `innings` holds the CURRENT innings only, so the footer would show the wrong
  // totals under a historical innings-1 table.
  const showTotals = innings && inningsTab === match.currentInnings;

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Innings tabs (show only if 2 innings exist) */}
      {match.currentInnings === 2 && (
        <div className="flex border-b border-white/10">
          {([1, 2] as InningsTab[]).map((inn) => (
            <button
              key={inn}
              onClick={() => setInningsTab(inn)}
              className={cn(
                'flex-1 py-3 text-sm font-display font-bold transition-all',
                inningsTab === inn
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              Innings {inn}
            </button>
          ))}
        </div>
      )}

      {/* Batting / Bowling / Commentary tab switcher */}
      <div className="flex border-b border-white/10">
        {(['batting', 'bowling', 'commentary'] as ScorecardTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setScorecardTab(tab)}
            className={cn(
              'flex-1 py-2.5 text-xs font-body font-semibold uppercase tracking-wider transition-all capitalize',
              scorecardTab === tab
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Batting scorecard */}
      {scorecardTab === 'batting' && (
        <div className="overflow-x-auto">
          {battingStats.length === 0 ? (
            <p className="text-xs text-gray-600 font-body text-center py-8">
              No batting data yet
            </p>
          ) : (
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-semibold">Batter</th>
                  <th className="text-right px-2 py-2.5 font-semibold">R</th>
                  <th className="text-right px-2 py-2.5 font-semibold">B</th>
                  <th className="text-right px-2 py-2.5 font-semibold">4s</th>
                  <th className="text-right px-2 py-2.5 font-semibold">6s</th>
                  <th className="text-right px-3 py-2.5 font-semibold">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {battingStats.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-display font-bold text-white">{s.playerId?.username ?? s.guestName ?? '—'}</p>
                      <p className="text-gray-600 text-[10px] capitalize">
                        {s.battingStats?.isOut
                          ? s.battingStats.dismissalType ?? 'out'
                          : 'not out'}
                      </p>
                    </td>
                    <td className={cn(
                      'text-right px-2 py-2.5 font-display font-bold',
                      (s.battingStats?.runs ?? 0) >= 50 ? 'text-amber-400' : 'text-white'
                    )}>
                      {s.battingStats?.runs ?? 0}
                      {(s.battingStats?.runs ?? 0) >= 100 && <span className="text-amber-400 ml-0.5">★</span>}
                    </td>
                    <td className="text-right px-2 py-2.5 text-gray-400">{s.battingStats?.ballsFaced ?? 0}</td>
                    <td className="text-right px-2 py-2.5 text-blue-400">{s.battingStats?.fours ?? 0}</td>
                    <td className="text-right px-2 py-2.5 text-purple-400">{s.battingStats?.sixes ?? 0}</td>
                    <td className="text-right px-3 py-2.5 text-gray-400">
                      {strikeRate(s.battingStats?.runs ?? 0, s.battingStats?.ballsFaced ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Extras row */}
              {showTotals && innings && (
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-2 text-gray-500 text-[10px]" colSpan={6}>
                      Extras: {Object.values(innings.extras).reduce((a, b) => a + b, 0)}&nbsp;
                      (Wd {innings.extras.wides}, Nb {innings.extras.noBalls},&nbsp;
                      B {innings.extras.byes}, Lb {innings.extras.legByes})
                    </td>
                  </tr>
                  <tr className="border-t border-white/10 bg-white/[0.02]">
                    <td className="px-4 py-2 text-white font-display font-bold text-sm">Total</td>
                    <td className="px-2 py-2 text-right text-white font-display font-bold text-sm" colSpan={5}>
                      {innings.totalRuns}/{innings.totalWickets}&nbsp;
                      <span className="text-gray-500 font-body text-xs">
                        ({oversStr(innings.oversCompleted, innings.ballsInCurrentOver)} ov)
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* Bowling scorecard */}
      {scorecardTab === 'bowling' && (
        <div className="overflow-x-auto">
          {bowlingStats.length === 0 ? (
            <p className="text-xs text-gray-600 font-body text-center py-8">
              No bowling data yet
            </p>
          ) : (
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-semibold">Bowler</th>
                  <th className="text-right px-2 py-2.5 font-semibold">O</th>
                  <th className="text-right px-2 py-2.5 font-semibold">M</th>
                  <th className="text-right px-2 py-2.5 font-semibold">R</th>
                  <th className="text-right px-2 py-2.5 font-semibold">W</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bowlingStats
                  .filter((s) => (s.bowlingStats?.ballsBowled ?? 0) > 0)
                  .map((s) => (
                    <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 font-display font-bold text-white">
                        {s.playerId?.username ?? s.guestName ?? '—'}
                      </td>
                      <td className="text-right px-2 py-2.5 text-gray-400">
                        {bowlingOvers(s.bowlingStats?.ballsBowled ?? 0)}
                      </td>
                      <td className="text-right px-2 py-2.5 text-gray-400">{s.bowlingStats?.maidens ?? 0}</td>
                      <td className="text-right px-2 py-2.5 text-gray-400">{s.bowlingStats?.runsConceded ?? 0}</td>
                      <td className={cn(
                        'text-right px-2 py-2.5 font-display font-bold',
                        (s.bowlingStats?.wickets ?? 0) >= 3 ? 'text-amber-400' : 'text-white'
                      )}>
                        {s.bowlingStats?.wickets ?? 0}
                      </td>
                      <td className="text-right px-3 py-2.5 text-gray-400">
                        {economy(s.bowlingStats?.runsConceded ?? 0, s.bowlingStats?.ballsBowled ?? 0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Commentary tab */}
      {scorecardTab === 'commentary' && (
        <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
          {commentaryBalls.length === 0 ? (
            <p className="text-xs text-gray-600 font-body text-center py-8">
              No balls recorded yet
            </p>
          ) : (
            commentaryBalls.map((ball) => (
              <div
                key={ball._id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Ball pill */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display font-bold border flex-shrink-0 mt-0.5',
                    ballPillClass(ball)
                  )}
                >
                  {ballPillLabel(ball)}
                </div>

                {/* Over.ball + commentary text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-gray-600 font-body tabular-nums">
                      {ball.over}.{ball.ballNumber}
                    </span>
                    {ball.isWicket && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-body font-bold">
                        WICKET
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 font-body leading-snug">
                    {generateCommentary(ball)}
                  </p>
                  <p className="text-[10px] text-gray-600 font-body mt-0.5">
                    {(ball.batsmanOnStrikeId as { username?: string } | null)?.username ?? ball.guestBatsman ?? '—'}
                    {' vs '}
                    {(ball.bowlerId as { username?: string } | null)?.username ?? ball.guestBowler ?? '—'}
                  </p>
                </div>

                {/* Run badge */}
                <div className="text-right flex-shrink-0">
                  <span
                    className={cn(
                      'text-sm font-display font-bold',
                      ball.runsScored === 6 ? 'text-purple-400' :
                      ball.runsScored === 4 ? 'text-blue-400' :
                      ball.runsScored > 0   ? 'text-green-400' : 'text-gray-600'
                    )}
                  >
                    {ball.runsScored > 0 ? `+${ball.runsScored}` : '·'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}