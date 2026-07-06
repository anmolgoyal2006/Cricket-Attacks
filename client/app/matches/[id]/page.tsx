'use client';

/**
 * Cricket Scoring Feature — Phase 5
 * Match detail / live spectator page — /matches/[id]
 * Read-only view. Real-time via /live-match socket namespace.
 * Mobile-first: sticky score header, scrollable ball feed, tabbed scorecard.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Trophy, Radio,
  ChevronLeft, ChevronRight, RotateCcw, Wifi, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { scoringApi, scoringSpectatorApi, ScoringMatch, BallRecord, PlayerMatchStat, MatchPlayer } from '@/lib/scoringApi';
import { useLiveMatchSocket } from '@/lib/useLiveMatchSocket';
import { generateCommentary, ballPillLabel, ballPillClass } from '@/lib/commentary';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function oversStr(oc: number, bic: number) { return `${oc}.${bic}`; }

function runRate(runs: number, oc: number, bic: number) {
  const balls = oc * 6 + bic;
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}

function rrr(target: number, runs: number, oc: number, bic: number, totalOvers: number) {
  const ballsLeft = totalOvers * 6 - (oc * 6 + bic);
  if (ballsLeft <= 0) return '—';
  const needed = target - runs;
  if (needed <= 0) return '0.00';
  return ((needed / ballsLeft) * 6).toFixed(2);
}

function strikeRate(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 100).toFixed(1);
}

function economy(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}

function bowlingOvers(ballsBowled: number) {
  return `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ScoringMatch['status'] }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-red-500/15 border border-red-500/40 text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />LIVE
    </span>
  );
  if (status === 'innings_break') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
      INNINGS BREAK
    </span>
  );
  if (status === 'upcoming') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
      UPCOMING
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-green-500/15 border border-green-500/30 text-green-400">
      COMPLETED
    </span>
  );
}

// ── Wicket toast ──────────────────────────────────────────────────────────────
function WicketToast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-500/90 backdrop-blur-sm border border-red-400/50 text-white font-display font-bold text-base shadow-2xl shadow-red-500/40 max-w-xs text-center"
    >
      🏏 {text}
    </motion.div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface InningsState {
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  target?: number | null;
}

type ScorecardTab = 'batting' | 'bowling';
type InningsTab = 1 | 2;

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  // ── Core data ────────────────────────────────────────────────────────────────
  const [match, setMatch] = useState<ScoringMatch | null>(null);
  const [innings, setInnings] = useState<InningsState | null>(null);
  const [balls, setBalls] = useState<BallRecord[]>([]);
  const [stats, setStats] = useState<PlayerMatchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [scorecardTab, setScorecardTab] = useState<ScorecardTab>('batting');
  const [inningsTab, setInningsTab] = useState<InningsTab>(1);
  const [wicketToast, setWicketToast] = useState<string | null>(null);
  const [inningsBreakMsg, setInningsBreakMsg] = useState<string | null>(null);
  const [showAllBalls, setShowAllBalls] = useState(false);

  // ── Fetch everything ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!matchId) return;
    try {
      const [{ match: m }, { balls: b }, { stats: s }] = await Promise.all([
        scoringApi.getMatch(matchId),
        scoringSpectatorApi.getBalls(matchId, 0, 100),
        scoringSpectatorApi.getMatchStats(matchId),
      ]);
      setMatch(m);
      setBalls(b);
      setStats(s);
      if (m.currentInningsSummary) {
        const ci = m.currentInningsSummary;
        setInnings({
          totalRuns: ci.totalRuns,
          totalWickets: ci.totalWickets,
          oversCompleted: ci.oversCompleted,
          ballsInCurrentOver: ci.ballsInCurrentOver,
          extras: ci.extras,
          target: ci.target,
        });
      }
      // Auto-select the active innings tab
      setInningsTab((m.currentInnings ?? 1) as InningsTab);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Socket callbacks ──────────────────────────────────────────────────────────
  const { connected, reconnecting } = useLiveMatchSocket(
    // Only subscribe for live/break matches; completed ones don't need a socket
    match && match.status !== 'completed' ? matchId : null,
    {
      onBallRecorded: ({ ball, innings: i }) => {
        // Prepend to feed (newest first) and update score
        setBalls((prev) => [ball as unknown as BallRecord, ...prev]);
        setInnings(i);
      },

      onWicketFallen: (data: unknown) => {
        const d = data as { ball?: BallRecord & { guestDismissed?: string | null } };
        if (d?.ball) {
          const dismissed =
            (d.ball.dismissedPlayerId as { username?: string } | null)?.username ??
            d.ball.guestDismissed ??
            'Batsman';
          const wt = d.ball.wicketType ?? 'out';
          setWicketToast(`WICKET! ${dismissed} — ${wt}`);
        }
      },

      onInningsCompleted: (data: unknown) => {
        const d = data as { completedInningsNumber?: number; innings?: InningsState; target?: number | null };
        const inn = d?.innings;
        if (inn) {
          setInningsBreakMsg(
            `Innings ${d.completedInningsNumber ?? 1} complete — ${inn.totalRuns}/${inn.totalWickets}` +
            (d.target ? ` · Target: ${d.target}` : '')
          );
        }
        // Re-fetch everything so the second innings starts cleanly
        setTimeout(() => {
          fetchAll();
          setInningsBreakMsg(null);
        }, 4000);
      },

      onMatchCompleted: () => {
        // Re-fetch to get final result and completed status
        fetchAll();
      },

      onBallUndone: () => {
        // Re-fetch on undo — safest way to guarantee consistency across complex undo states
        fetchAll();
      },
    }
  );

  // ── Scorecard helpers ─────────────────────────────────────────────────────────
  // Filter balls to the currently-selected innings tab.
  // BallRecord.inningsId is a raw ObjectId string that matches the innings `_id`.
  // When viewing innings 1 while the match is in innings 2, balls whose inningsId
  // doesn't match the current innings summary are innings 1 deliveries.
  const filteredBalls = balls.filter((b) => {
    if (!match || !match.currentInningsSummary) return true;
    // Single-innings match — show everything
    if (match.currentInnings === 1) return true;
    // Two-innings match: match inningsId against the selected tab
    const currentInningsId = match.currentInningsSummary._id;
    if (inningsTab === 2) return b.inningsId === currentInningsId;
    // inn 1 tab while match is in inn 2: show balls NOT in the current innings
    return b.inningsId !== currentInningsId;
  });

  // Current over balls (last 6 legal + extra deliveries), oldest-first
  const currentOverBalls = (innings
    ? balls
        .filter(
          (b) =>
            b.over === innings.oversCompleted &&
            b.inningsId === match?.currentInningsSummary?._id
        )
        .slice()
        .reverse()
    : []
  ).slice(0, 8); // cap at 8 for display

  // Batting stats for the selected innings tab
  // Derive team keys correctly from the innings data, not just currentInnings
  // For inn 1: battingTeam is from currentInningsSummary (or toss logic)
  // For inn 2: bowlingTeam of inn 1 = battingTeam of inn 2
  const activeCi = match?.currentInningsSummary;

  // Build a helper: given a MatchPlayer, return a stable key string
  function playerKey(p: MatchPlayer): string {
    if (p.userId && typeof p.userId === 'object') return `uid:${p.userId._id}`;
    if (p.guestName) return `g:${p.guestName.toLowerCase()}`;
    return `d:${p.displayName.toLowerCase()}`;
  }

  // Build a helper: given a PlayerMatchStat, return the same key
  function statKey(s: PlayerMatchStat): string {
    if (s.playerId?._id) return `uid:${s.playerId._id}`;
    if (s.guestName) return `g:${s.guestName.toLowerCase()}`;
    return '';
  }

  // Determine which team keys correspond to batting/bowling for the selected inningsTab
  // For a 2-innings match: inn1 batting = whoever batted first (from toss)
  // We rely on the Innings record stored in currentInningsSummary for the active innings,
  // and infer inn1 batting from toss for the historical tab.
  let battingTeamKey: 'teamA' | 'teamB';
  let bowlingTeamKey: 'teamA' | 'teamB';

  if (inningsTab === match?.currentInnings) {
    // Active innings — use actual innings record
    battingTeamKey = (activeCi?.battingTeam ?? 'teamA') as 'teamA' | 'teamB';
    bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
  } else {
    // Historical (innings 1 while viewing a 2-innings match)
    // Inn 1 batting = opposite of inn 2 batting
    const inn2Batting = (activeCi?.battingTeam ?? 'teamA') as 'teamA' | 'teamB';
    battingTeamKey = inn2Batting === 'teamA' ? 'teamB' : 'teamA';
    bowlingTeamKey = inn2Batting;
  }

  const battingTeamPlayers = match
    ? (match[battingTeamKey]?.players ?? [])
    : [];
  const bowlingTeamPlayers = match
    ? (match[bowlingTeamKey]?.players ?? [])
    : [];

  // Build lookup sets for fast membership checks
  const battingKeys = new Set(battingTeamPlayers.map(playerKey));
  const bowlingKeys = new Set(bowlingTeamPlayers.map(playerKey));
  const battingStats = stats.filter((s) => {
    const k = statKey(s);
    return k && (battingKeys.size === 0 || battingKeys.has(k)) && (s.inningsNumber ?? 1) === inningsTab;
  });
  const bowlingStats = stats.filter((s) => {
    const k = statKey(s);
    return k && (bowlingKeys.size === 0 || bowlingKeys.has(k)) && (s.inningsNumber ?? 1) === inningsTab;
  });

  const isLive = match?.status === 'live' || match?.status === 'innings_break';
  const isCompleted = match?.status === 'completed';
  const displayBalls = showAllBalls ? filteredBalls : filteredBalls.slice(0, 20);

  // ── Guard renders ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (pageError || !match) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 font-body mb-4">{pageError || 'Match not found'}</p>
        <Link href="/matches">
          <button className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-display font-bold hover:bg-white/20 transition-all">
            ← Back to Matches
          </button>
        </Link>
      </div>
    </div>
  );

  const ci = match.currentInningsSummary;
  const battingTeamName = ci ? match[ci.battingTeam]?.name : match.teamA.name;
  const bowlingTeamName = ci ? match[ci.bowlingTeam]?.name : match.teamB.name;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cricket-stadium via-gray-950 to-black">

      {/* ── Wicket toast ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {wicketToast && (
          <WicketToast text={wicketToast} onDone={() => setWicketToast(null)} />
        )}
      </AnimatePresence>

      {/* ── Innings break banner ───────────────────────────────────────────── */}
      <AnimatePresence>
        {inningsBreakMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 inset-x-4 z-40 max-w-md mx-auto px-5 py-3 rounded-2xl bg-amber-500/90 backdrop-blur-sm border border-amber-400/50 text-white font-body font-semibold text-sm text-center shadow-xl shadow-amber-500/30"
          >
            🏏 {inningsBreakMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY SCORE HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cricket-stadium/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Back + status */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/matches" className="flex items-center gap-1 text-gray-400 hover:text-amber-400 transition-colors text-xs font-body">
              <ChevronLeft className="w-3.5 h-3.5" /> Matches
            </Link>
            <div className="flex items-center gap-2">
              {/* Reconnecting indicator */}
              {reconnecting && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-body">
                  <RotateCcw className="w-3 h-3 animate-spin" /> reconnecting…
                </span>
              )}
              {isLive && !reconnecting && (
                connected
                  ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                  : <WifiOff className="w-3.5 h-3.5 text-gray-600" />
              )}
              <StatusBadge status={match.status} />
            </div>
          </div>

          {/* Team names + overs */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-body truncate">
                {match.teamA.name} <span className="text-gray-600">vs</span> {match.teamB.name}
                {match.venue ? ` · ${match.venue}` : ''}
              </p>
            </div>
            {innings && (
              <span className="text-xs text-gray-500 font-body whitespace-nowrap">
                {oversStr(innings.oversCompleted, innings.ballsInCurrentOver)} / {match.oversFormat} ov
              </span>
            )}
          </div>

          {/* Score */}
          {innings && (
            <div className="flex items-end justify-between mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-500 font-body">{battingTeamName}</span>
                <span className="text-3xl font-display font-black text-white">
                  {innings.totalRuns}/{innings.totalWickets}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-body">
                  CRR {runRate(innings.totalRuns, innings.oversCompleted, innings.ballsInCurrentOver)}
                </p>
                {innings.target && (
                  <>
                    <p className="text-xs text-amber-400 font-body font-semibold">
                      Target {innings.target} · RRR {rrr(innings.target, innings.totalRuns, innings.oversCompleted, innings.ballsInCurrentOver, match.oversFormat)}
                    </p>
                    <p className="text-xs text-gray-500 font-body">
                      Need {Math.max(0, innings.target - innings.totalRuns)} off{' '}
                      {match.oversFormat * 6 - (innings.oversCompleted * 6 + innings.ballsInCurrentOver)} balls
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Completed result */}
          {isCompleted && match.result && (
            <p className="text-sm text-green-400 font-body font-semibold mt-1">
              {match.result.winner === 'tie' ? 'Match tied' : `${match.result.winner} won by ${match.result.margin}`}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 space-y-4">

        {/* ── SCORER LINK (if user is scorer/creator) ────────────────────── */}
        {isLive && (
          <Link href={`/matches/${matchId}/score`}>
            <div className="glass rounded-xl px-4 py-2.5 border border-amber-500/20 flex items-center justify-between hover:border-amber-500/40 transition-all cursor-pointer">
              <span className="text-xs text-amber-400 font-body font-semibold">Are you the scorer?</span>
              <span className="text-xs text-amber-400 font-body">Open scoring panel →</span>
            </div>
          </Link>
        )}

        {/* ── CURRENT OVER PILLS ─────────────────────────────────────────── */}
        {isLive && innings && (
          <div className="glass rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">
              Over {innings.oversCompleted + 1}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => {
                const ball = currentOverBalls[i];
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-xs font-display font-bold border transition-all',
                      ball
                        ? ballPillClass(ball)
                        : 'bg-white/5 border-dashed border-white/15 text-gray-600'
                    )}
                  >
                    {ball ? ballPillLabel(ball) : '·'}
                  </div>
                );
              })}
              {/* Extra deliveries beyond 6 */}
              {currentOverBalls.slice(6).map((ball, i) => (
                <div
                  key={`extra-${i}`}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-display font-bold border',
                    ballPillClass(ball)
                  )}
                >
                  {ballPillLabel(ball)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BATTING / BOWLING STATS BAR (live only) ────────────────────── */}
        {isLive && battingStats.length > 0 && (
          <div className="glass rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">At the crease</p>
            <div className="space-y-2">
              {battingStats
                .filter((s) => s.battingStats && !s.battingStats.isOut)
                .slice(0, 2)
                .map((s) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <span className="text-sm font-display font-bold text-white">{s.playerId?.username ?? s.guestName ?? '—'}</span>
                    <span className="text-sm font-body text-gray-300">
                      {s.battingStats.runs} <span className="text-gray-500 text-xs">({s.battingStats.ballsFaced})</span>
                    </span>
                  </div>
                ))}
            </div>
            {bowlingStats.length > 0 && (
              <>
                <div className="border-t border-white/10 mt-3 pt-3">
                  <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-2">Bowling</p>
                  {bowlingStats
                    .filter((s) => s.bowlingStats)
                    .sort((a, b) => (b.bowlingStats?.ballsBowled ?? 0) - (a.bowlingStats?.ballsBowled ?? 0))
                    .slice(0, 1)
                    .map((s) => (
                      <div key={s._id} className="flex items-center justify-between">
                        <span className="text-sm font-display font-bold text-white">{s.playerId?.username ?? s.guestName ?? '—'}</span>
                        <span className="text-sm font-body text-gray-300">
                          {bowlingOvers(s.bowlingStats?.ballsBowled ?? 0)}-{s.bowlingStats?.maidens ?? 0}-{s.bowlingStats?.runsConceded ?? 0}-{s.bowlingStats?.wickets ?? 0}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RESULT BANNER (completed) ──────────────────────────────────── */}
        {isCompleted && match.result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-green-500/30 bg-green-500/5 text-center"
          >
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-xl font-display font-black text-white mb-1">
              {match.result.winner === 'tie'
                ? 'Match Tied!'
                : `${match.result.winner} won!`}
            </p>
            <p className="text-sm text-gray-400 font-body">
              {match.result.winner === 'tie' ? 'Scores level' : `by ${match.result.margin}`}
            </p>
          </motion.div>
        )}

        {/* ── SCORECARD ─────────────────────────────────────────────────────── */}
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

          {/* Batting / Bowling tab switcher */}
          <div className="flex border-b border-white/10">
            {(['batting', 'bowling'] as ScorecardTab[]).map((tab) => (
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
                  {innings && (
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
        </div>

        {/* ── BALL-BY-BALL FEED ─────────────────────────────────────────────── */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider">Ball by Ball</p>
            {balls.length > 20 && (
              <button
                onClick={() => setShowAllBalls((v) => !v)}
                className="text-xs text-amber-400 font-body hover:text-amber-300 transition-colors"
              >
                {showAllBalls ? 'Show less' : `Show all ${balls.length} balls`}
              </button>
            )}
          </div>

          {balls.length === 0 ? (
            <p className="text-xs text-gray-600 font-body text-center py-8">
              {match.status === 'upcoming' ? 'Match hasn\'t started yet' : 'No balls recorded yet'}
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {displayBalls.map((ball, idx) => (
                  <motion.div
                    key={ball._id}
                    initial={idx === 0 ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Pill */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display font-bold border flex-shrink-0 mt-0.5',
                      ballPillClass(ball)
                    )}>
                      {ballPillLabel(ball)}
                    </div>

                    {/* Over.ball label + commentary */}
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
                      {/* Players line */}
                      <p className="text-[10px] text-gray-600 font-body mt-0.5">
                        {(ball.batsmanOnStrikeId as { username?: string } | null)?.username ?? ball.guestBatsman ?? '—'}
                        {' vs '}
                        {(ball.bowlerId as { username?: string } | null)?.username ?? ball.guestBowler ?? '—'}
                      </p>
                    </div>

                    {/* Run badge */}
                    <div className="text-right flex-shrink-0">
                      <span className={cn(
                        'text-sm font-display font-bold',
                        ball.runsScored === 6 ? 'text-purple-400' :
                        ball.runsScored === 4 ? 'text-blue-400' :
                        ball.runsScored > 0  ? 'text-green-400' : 'text-gray-600'
                      )}>
                        {ball.runsScored > 0 ? `+${ball.runsScored}` : '·'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom padding for mobile scrolling comfort */}
        <div className="h-8" />
      </div>
    </div>
  );
}
