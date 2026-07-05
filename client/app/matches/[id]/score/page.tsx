'use client';

/**
 * Cricket Scoring Feature — Phase 4
 * Scorer view — /matches/[id]/score
 * Mobile-first layout for pitch-side ball-by-ball scoring.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, RotateCcw, ChevronRight,
  Trophy, X, Check, Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { scoringApi, ScoringMatch, BallResult } from '@/lib/scoringApi';
import { useLiveMatchSocket } from '@/lib/useLiveMatchSocket';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Player { _id: string; username: string; }

interface InningsState {
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  target?: number | null;
}

interface OverBall {
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType: string | null;
  label: string;
}

type ModalType =
  | 'extraRuns'       // extra type chosen, ask for extra runs
  | 'wicket'          // wicket details
  | 'newBatsman'      // triggered after wicket
  | 'newBowler'       // triggered at end of over
  | 'undoConfirm'     // confirm undo
  | 'inningsBreak'    // between innings
  | 'matchComplete'   // final result
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function oversDisplay(oc: number, bic: number) {
  return `${oc}.${bic}`;
}

function runRate(runs: number, oc: number, bic: number): string {
  const totalBalls = oc * 6 + bic;
  if (totalBalls === 0) return '0.00';
  return ((runs / totalBalls) * 6).toFixed(2);
}

function requiredRunRate(target: number, runs: number, oc: number, bic: number, totalOvers: number): string {
  const ballsLeft = totalOvers * 6 - (oc * 6 + bic);
  if (ballsLeft <= 0) return '—';
  const needed = target - runs;
  if (needed <= 0) return '0.00';
  return ((needed / ballsLeft) * 6).toFixed(2);
}

const WICKET_TYPES = ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'other'];
const EXTRA_TYPES: Array<{ key: 'wide' | 'noBall' | 'bye' | 'legBye'; label: string }> = [
  { key: 'wide',   label: 'Wide' },
  { key: 'noBall', label: 'No Ball' },
  { key: 'bye',    label: 'Bye' },
  { key: 'legBye', label: 'Leg Bye' },
];

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string; onClose?: () => void; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="relative z-10 w-full max-w-sm glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-white">{title}</h3>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Main scoring page ─────────────────────────────────────────────────────────
export default function ScorePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const matchId = params?.id as string;

  // ── Match data ───────────────────────────────────────────────────────────────
  const [match, setMatch] = useState<ScoringMatch | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [pageError, setPageError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ── Innings state (kept in sync with API responses) ──────────────────────────
  const [innings, setInnings] = useState<InningsState>({
    totalRuns: 0, totalWickets: 0,
    oversCompleted: 0, ballsInCurrentOver: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
  });

  // ── Current over balls (visual pill display) ──────────────────────────────────
  const [currentOverBalls, setCurrentOverBalls] = useState<OverBall[]>([]);

  // ── Current players ──────────────────────────────────────────────────────────
  const [striker, setStriker] = useState<Player | null>(null);
  const [nonStriker, setNonStriker] = useState<Player | null>(null);
  const [bowler, setBowler] = useState<Player | null>(null);

  // Tracks dismissed player ids to exclude from new-batsman list
  const [outPlayerIds, setOutPlayerIds] = useState<Set<string>>(new Set());

  // ── Scoring controls state ───────────────────────────────────────────────────
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Pending extra selection (set before opening extraRuns modal)
  const pendingExtraRef = useRef<{ type: 'wide' | 'noBall' | 'bye' | 'legBye'; runs: number } | null>(null);
  const [extraRunsInput, setExtraRunsInput] = useState('0');

  // Wicket modal state
  const [wicketType, setWicketType] = useState('bowled');
  const [dismissedId, setDismissedId] = useState('');
  const [fielderId, setFielderId] = useState('');
  const [incomingBatsmanId, setIncomingBatsmanId] = useState('');
  const [newBowlerId, setNewBowlerId] = useState('');

  // Innings break / match complete info
  const [inningsBreakData, setInningsBreakData] = useState<{ target: number | null; resultText: string | null } | null>(null);
  const [matchResultText, setMatchResultText] = useState('');

  // ── Load match on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    fetchMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function fetchMatch() {
    setLoadingMatch(true);
    try {
      const { match: m } = await scoringApi.getMatch(matchId);
      setMatch(m);

      // Auth check: must be creator or a scorer
      const creatorId = typeof m.createdBy === 'object' ? m.createdBy._id : m.createdBy;
      const userId = user?.id ?? '';
      const isScorerOrCreator =
        creatorId === userId ||
        m.scorers.some((s) => (typeof s === 'object' ? s._id : s) === userId);
      setIsAuthorized(isScorerOrCreator);

      // Seed innings state from currentInningsSummary
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

      if (m.status === 'completed' && m.result) {
        setMatchResultText(
          m.result.winner === 'tie'
            ? 'Match tied'
            : `${m.result.winner} won by ${m.result.margin}`
        );
        setActiveModal('matchComplete');
      } else if (m.status === 'innings_break') {
        setActiveModal('inningsBreak');
      }
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoadingMatch(false);
    }
  }

  // ── Live socket sync (handles ball:undone from another scorer) ────────────────
  useLiveMatchSocket(matchId, {
    onBallUndone: ({ innings: i }) => {
      setInnings(i);
      setCurrentOverBalls((prev) => prev.slice(0, -1));
    },
    onMatchCompleted: ({ resultText }) => {
      if (resultText) setMatchResultText(resultText);
      setActiveModal('matchComplete');
    },
  });

  // ── Derive batting/bowling teams ──────────────────────────────────────────────
  const battingTeamKey = match?.currentInningsSummary?.battingTeam ?? 'teamA';
  const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
  const battingTeam = match ? match[battingTeamKey as 'teamA' | 'teamB'] : null;
  const bowlingTeam = match ? match[bowlingTeamKey as 'teamA' | 'teamB'] : null;

  // Available batsmen (not out, not non-striker, not striker)
  const availableBatsmen: Player[] = (battingTeam?.players ?? []).filter(
    (p) =>
      !outPlayerIds.has(p._id) &&
      p._id !== striker?._id &&
      p._id !== nonStriker?._id
  );

  // Available bowlers (all bowling-team players; optionally exclude last bowler per over)
  const prevBowlerRef = useRef<string | null>(null);
  const availableBowlers: Player[] = (bowlingTeam?.players ?? []).filter(
    (p) => p._id !== prevBowlerRef.current
  );

  // ── Process API / socket ball response ───────────────────────────────────────
  const applyBallResult = useCallback(
    (result: BallResult, isWicketBall = false, extraTypeBall: string | null = null, runsBall = 0) => {
      const { innings: newInnings, flags } = result;
      setInnings(newInnings);

      // Add ball to current-over visual
      const overBall: OverBall = {
        runs: runsBall,
        isWicket: isWicketBall,
        isExtra: !!extraTypeBall,
        extraType: extraTypeBall,
        label: isWicketBall ? 'W' : extraTypeBall ? extraTypeBall[0].toUpperCase() : String(runsBall),
      };

      if (flags.isEndOfOver) {
        setCurrentOverBalls([]);
      } else {
        setCurrentOverBalls((prev) => [...prev, overBall]);
      }

      // Strike rotation
      if (flags.strikeSwapped && striker && nonStriker) {
        setStriker(nonStriker);
        setNonStriker(striker);
      }

      // Handle flags in priority order
      if (flags.matchComplete) {
        setMatchResultText(flags.resultText ?? 'Match complete');
        setActiveModal('matchComplete');
      } else if (flags.inningsComplete) {
        setInningsBreakData({
          target: result.innings.target ?? null,
          resultText: flags.resultText ?? null,
        });
        setActiveModal('inningsBreak');
      } else if (flags.needsNewBatsman) {
        // Wicket — record who got out
        if (isWicketBall) {
          setOutPlayerIds((prev) => new Set([...prev, striker?._id ?? '']));
        }
        setIncomingBatsmanId('');
        setActiveModal('newBatsman');
      } else if (flags.isEndOfOver) {
        prevBowlerRef.current = bowler?._id ?? null;
        setNewBowlerId('');
        setActiveModal('newBowler');
      }
    },
    [striker, nonStriker, bowler]
  );

  // ── Core POST ball ────────────────────────────────────────────────────────────
  const postBall = useCallback(
    async (
      runs: number,
      extra: { type: 'wide' | 'noBall' | 'bye' | 'legBye' | null; runs: number } = { type: null, runs: 0 },
      wicket: { isWicket: boolean; type: string; dismissedId: string; fielderId: string } = {
        isWicket: false, type: 'bowled', dismissedId: '', fielderId: '',
      }
    ) => {
      if (!striker || !nonStriker || !bowler) {
        setPostError('Set striker, non-striker, and bowler before scoring');
        return;
      }
      setPosting(true);
      setPostError('');
      try {
        const result = await scoringApi.recordBall(matchId, {
          batsmanOnStrikeId: striker._id,
          nonStrikerId: nonStriker._id,
          bowlerId: bowler._id,
          runsScored: runs,
          extraType: extra.type,
          extraRuns: extra.runs,
          isWicket: wicket.isWicket,
          wicketType: wicket.isWicket ? wicket.type : null,
          dismissedPlayerId: wicket.isWicket ? wicket.dismissedId || striker._id : null,
          fielderId: wicket.fielderId || null,
        });
        applyBallResult(result, wicket.isWicket, extra.type, runs);
      } catch (err: unknown) {
        setPostError(err instanceof Error ? err.message : 'Failed to record ball');
      } finally {
        setPosting(false);
      }
    },
    [matchId, striker, nonStriker, bowler, applyBallResult]
  );

  // ── Undo ──────────────────────────────────────────────────────────────────────
  const handleUndo = async () => {
    setActiveModal(null);
    setPosting(true);
    setPostError('');
    try {
      const result = await scoringApi.undoLastBall(matchId);
      setInnings(result.innings);
      setCurrentOverBalls((prev) => prev.slice(0, -1));
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : 'Undo failed');
    } finally {
      setPosting(false);
    }
  };

  // ── Scoring pad handlers ──────────────────────────────────────────────────────
  const handleRuns = (runs: number) => postBall(runs);

  const handleExtraClick = (extraKey: 'wide' | 'noBall' | 'bye' | 'legBye') => {
    pendingExtraRef.current = { type: extraKey, runs: 0 };
    setExtraRunsInput('0');
    setActiveModal('extraRuns');
  };

  const confirmExtra = () => {
    const extra = pendingExtraRef.current!;
    extra.runs = parseInt(extraRunsInput, 10) || 0;
    postBall(0, { type: extra.type, runs: extra.runs });
    pendingExtraRef.current = null;
    setActiveModal(null);
  };

  const confirmWicket = () => {
    postBall(
      0,
      { type: null, runs: 0 },
      {
        isWicket: true,
        type: wicketType,
        dismissedId: dismissedId || striker?._id || '',
        fielderId,
      }
    );
    setActiveModal(null);
  };

  const confirmNewBatsman = () => {
    if (!incomingBatsmanId) return;
    const player = battingTeam?.players.find((p) => p._id === incomingBatsmanId);
    if (player) setStriker(player);
    setActiveModal(null);
  };

  const confirmNewBowler = () => {
    if (!newBowlerId) return;
    const player = bowlingTeam?.players.find((p) => p._id === newBowlerId);
    if (player) setBowler(player);
    setActiveModal(null);
  };

  const handleStartSecondInnings = () => {
    setActiveModal(null);
    setCurrentOverBalls([]);
    setOutPlayerIds(new Set());
    setStriker(null);
    setNonStriker(null);
    setBowler(null);
    fetchMatch(); // re-fetch to get updated innings state
  };

  // ── Disable scoring pad while modal is open or players not set ───────────────
  const scoringDisabled =
    posting ||
    activeModal !== null ||
    !striker ||
    !nonStriker ||
    !bowler ||
    match?.status === 'completed';

  // ── Guard renders ─────────────────────────────────────────────────────────────
  if (authLoading || loadingMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-body mb-4">{pageError}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-display font-bold hover:bg-white/20 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!match) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 font-body mb-4">Only the match creator or assigned scorers can score this match.</p>
          <button
            onClick={() => router.push(`/matches/${matchId}`)}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-display font-bold hover:bg-white/20 transition-all"
          >
            View Match
          </button>
        </div>
      </div>
    );
  }

  const battingTeamName = battingTeam?.name ?? 'Batting';
  const bowlingTeamName = bowlingTeam?.name ?? 'Bowling';
  const isSecondInnings = (match.currentInningsSummary?.inningsNumber ?? 1) === 2;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cricket-stadium via-gray-950 to-black">

      {/* ── STICKY SCORE HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cricket-stadium/95 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-body uppercase tracking-wider">
              {battingTeamName} batting · Inn {match.currentInnings}
            </span>
            <span className="text-xs text-amber-400 font-body">
              {oversDisplay(innings.oversCompleted, innings.ballsInCurrentOver)} ov
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-4xl font-display font-black text-white">
                {innings.totalRuns}/{innings.totalWickets}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-body">CRR {runRate(innings.totalRuns, innings.oversCompleted, innings.ballsInCurrentOver)}</p>
              {isSecondInnings && innings.target && (
                <p className="text-xs text-amber-400 font-body font-semibold">
                  Target {innings.target} · RRR {requiredRunRate(innings.target, innings.totalRuns, innings.oversCompleted, innings.ballsInCurrentOver, match.oversFormat)}
                </p>
              )}
              {isSecondInnings && innings.target && (
                <p className="text-xs text-gray-400 font-body">
                  Need {Math.max(0, innings.target - innings.totalRuns)} off {match.oversFormat * 6 - (innings.oversCompleted * 6 + innings.ballsInCurrentOver)} balls
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">

        {/* ── CURRENT PLAYERS BAR ──────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">Current Players</p>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            {/* Striker */}
            <div
              className={cn('p-2 rounded-xl cursor-pointer transition-all border', striker ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-dashed border-white/20 hover:border-amber-500/30')}
              onClick={() => {
                if (!battingTeam) return;
                const next = battingTeam.players.find((p) => p._id !== nonStriker?._id && !outPlayerIds.has(p._id));
                if (!striker && next) setStriker(next);
              }}
            >
              <p className="text-[10px] text-amber-400 font-body mb-1">Striker *</p>
              <p className="text-xs font-display font-bold text-white truncate">
                {striker ? striker.username : <span className="text-gray-500">Pick player</span>}
              </p>
            </div>
            {/* Non-striker */}
            <div
              className={cn('p-2 rounded-xl cursor-pointer transition-all border', nonStriker ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-dashed border-white/20 hover:border-blue-500/30')}
              onClick={() => {
                if (!battingTeam) return;
                const next = battingTeam.players.find((p) => p._id !== striker?._id && !outPlayerIds.has(p._id));
                if (!nonStriker && next) setNonStriker(next);
              }}
            >
              <p className="text-[10px] text-blue-400 font-body mb-1">Non-Striker</p>
              <p className="text-xs font-display font-bold text-white truncate">
                {nonStriker ? nonStriker.username : <span className="text-gray-500">Pick player</span>}
              </p>
            </div>
            {/* Bowler */}
            <div
              className={cn('p-2 rounded-xl cursor-pointer transition-all border', bowler ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-dashed border-white/20 hover:border-green-500/30')}
              onClick={() => {
                if (!bowlingTeam) return;
                if (!bowler && bowlingTeam.players[0]) setBowler(bowlingTeam.players[0]);
              }}
            >
              <p className="text-[10px] text-green-400 font-body mb-1">Bowler</p>
              <p className="text-xs font-display font-bold text-white truncate">
                {bowler ? bowler.username : <span className="text-gray-500">Pick player</span>}
              </p>
            </div>
          </div>

          {/* Player pickers inline */}
          {!striker || !nonStriker || !bowler ? (
            <div className="space-y-3 border-t border-white/10 pt-3">
              {!striker && (
                <div>
                  <p className="text-xs text-amber-400 font-body mb-1.5">Select Striker</p>
                  <div className="flex flex-wrap gap-2">
                    {(battingTeam?.players ?? [])
                      .filter((p) => !outPlayerIds.has(p._id) && p._id !== nonStriker?._id)
                      .map((p) => (
                        <button key={p._id} type="button"
                          onClick={() => setStriker(p)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-body hover:bg-amber-500/25 transition-all"
                        >{p.username}</button>
                      ))}
                  </div>
                </div>
              )}
              {!nonStriker && striker && (
                <div>
                  <p className="text-xs text-blue-400 font-body mb-1.5">Select Non-Striker</p>
                  <div className="flex flex-wrap gap-2">
                    {(battingTeam?.players ?? [])
                      .filter((p) => !outPlayerIds.has(p._id) && p._id !== striker?._id)
                      .map((p) => (
                        <button key={p._id} type="button"
                          onClick={() => setNonStriker(p)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-body hover:bg-blue-500/25 transition-all"
                        >{p.username}</button>
                      ))}
                  </div>
                </div>
              )}
              {!bowler && striker && nonStriker && (
                <div>
                  <p className="text-xs text-green-400 font-body mb-1.5">Select Bowler</p>
                  <div className="flex flex-wrap gap-2">
                    {availableBowlers.map((p) => (
                      <button key={p._id} type="button"
                        onClick={() => setBowler(p)}
                        className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-body hover:bg-green-500/25 transition-all"
                      >{p.username}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ── CURRENT OVER BALLS ───────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">
            Over {innings.oversCompleted + 1}
          </p>
          <div className="flex items-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => {
              const ball = currentOverBalls[i];
              return (
                <div key={i} className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all border',
                  ball
                    ? ball.isWicket
                      ? 'bg-red-500/30 border-red-500/60 text-red-300'
                      : ball.isExtra
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : ball.runs === 0
                      ? 'bg-white/10 border-white/20 text-gray-400'
                      : ball.runs === 4
                      ? 'bg-blue-500/25 border-blue-500/50 text-blue-300'
                      : ball.runs === 6
                      ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                      : 'bg-green-500/20 border-green-500/40 text-green-300'
                    : 'bg-white/5 border-dashed border-white/15 text-gray-600'
                )}>
                  {ball ? ball.label : '·'}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ERROR BANNER ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {postError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400 font-body">{postError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SCORING PAD ──────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">Runs</p>
          {/* Run buttons — large touch targets */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <motion.button
                key={r}
                whileTap={{ scale: 0.92 }}
                type="button"
                disabled={scoringDisabled}
                onClick={() => handleRuns(r)}
                className={cn(
                  'py-5 rounded-2xl font-display font-black text-2xl transition-all border',
                  scoringDisabled
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-gray-500'
                    : r === 4
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30 active:scale-95'
                    : r === 6
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30 active:scale-95'
                    : 'bg-white/8 border-white/15 text-white hover:bg-white/15 active:scale-95'
                )}
              >
                {r}
              </motion.button>
            ))}
          </div>

          {/* Extras row */}
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-2">Extras</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {EXTRA_TYPES.map(({ key, label }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                type="button"
                disabled={scoringDisabled}
                onClick={() => handleExtraClick(key)}
                className={cn(
                  'py-3.5 rounded-xl font-display font-bold text-sm transition-all border',
                  scoringDisabled
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-gray-500'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 active:scale-95'
                )}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Wicket + Undo row */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              disabled={scoringDisabled}
              onClick={() => { setWicketType('bowled'); setDismissedId(''); setFielderId(''); setActiveModal('wicket'); }}
              className={cn(
                'py-4 rounded-xl font-display font-bold text-base transition-all border',
                scoringDisabled
                  ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-gray-500'
                  : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30 active:scale-95'
              )}
            >
              🏏 Wicket
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              disabled={posting || activeModal !== null}
              onClick={() => setActiveModal('undoConfirm')}
              className={cn(
                'py-4 rounded-xl font-display font-bold text-base transition-all border',
                (posting || activeModal !== null)
                  ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-gray-500'
                  : 'bg-gray-500/10 border-gray-500/30 text-gray-300 hover:bg-gray-500/20 active:scale-95'
              )}
            >
              <RotateCcw className="w-4 h-4 inline mr-1.5" />
              Undo
            </motion.button>
          </div>

          {posting && (
            <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-body">Recording…</span>
            </div>
          )}
        </div>

        {/* ── EXTRAS SUMMARY ───────────────────────────────────────────────── */}
        <div className="glass rounded-2xl px-4 py-3 border border-white/10">
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-2">Extras</p>
          <div className="flex gap-4 text-xs font-body text-gray-400">
            <span>Wd <strong className="text-white">{innings.extras.wides}</strong></span>
            <span>Nb <strong className="text-white">{innings.extras.noBalls}</strong></span>
            <span>B <strong className="text-white">{innings.extras.byes}</strong></span>
            <span>Lb <strong className="text-white">{innings.extras.legByes}</strong></span>
            <span className="ml-auto">
              Total <strong className="text-amber-400">{Object.values(innings.extras).reduce((a, b) => a + b, 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}

      {/* Extra runs input */}
      {activeModal === 'extraRuns' && (
        <Modal title={`${pendingExtraRef.current?.type ?? 'Extra'} — additional runs?`} onClose={() => setActiveModal(null)}>
          <p className="text-xs text-gray-400 font-body mb-3">Enter overthrows or additional runs (0 if none)</p>
          <input
            type="number" min={0} max={99}
            value={extraRunsInput}
            onChange={(e) => setExtraRunsInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-display font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
          />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveModal(null)}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-display font-bold hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={confirmExtra}
              className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* Wicket details */}
      {activeModal === 'wicket' && (
        <Modal title="Wicket" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            {/* Wicket type */}
            <div>
              <p className="text-xs text-gray-400 font-body mb-2">Dismissal Type</p>
              <div className="flex flex-wrap gap-2">
                {WICKET_TYPES.map((wt) => (
                  <button key={wt} type="button"
                    onClick={() => setWicketType(wt)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-body capitalize transition-all border',
                      wicketType === wt
                        ? 'bg-red-500/30 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30'
                    )}>
                    {wt}
                  </button>
                ))}
              </div>
            </div>
            {/* Dismissed player */}
            <div>
              <p className="text-xs text-gray-400 font-body mb-2">Dismissed Player</p>
              <select value={dismissedId} onChange={(e) => setDismissedId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-red-500/50">
                <option value="">{striker?.username ?? 'Striker (default)'}</option>
                {striker && <option value={striker._id}>{striker.username} (striker)</option>}
                {nonStriker && <option value={nonStriker._id}>{nonStriker.username} (non-striker)</option>}
              </select>
            </div>
            {/* Fielder (for catch/runout/stumping) */}
            {['caught', 'runout', 'stumped'].includes(wicketType) && (
              <div>
                <p className="text-xs text-gray-400 font-body mb-2">Fielder</p>
                <select value={fielderId} onChange={(e) => setFielderId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-red-500/50">
                  <option value="">Select fielder (optional)</option>
                  {(bowlingTeam?.players ?? []).map((p) => (
                    <option key={p._id} value={p._id}>{p.username}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => setActiveModal(null)}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-display font-bold hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={confirmWicket}
              className="py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-display font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Confirm Wicket
            </button>
          </div>
        </Modal>
      )}

      {/* New batsman */}
      {activeModal === 'newBatsman' && (
        <Modal title="New Batsman">
          <p className="text-xs text-gray-400 font-body mb-3">Wicket fell — select incoming batsman</p>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar mb-4">
            {availableBatsmen.length === 0 ? (
              <p className="text-xs text-gray-500 font-body text-center py-4">No more batsmen available</p>
            ) : availableBatsmen.map((p) => (
              <button key={p._id} type="button"
                onClick={() => setIncomingBatsmanId(p._id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left',
                  incomingBatsmanId === p._id
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-amber-500/20'
                )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {p.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-body">{p.username}</span>
                {incomingBatsmanId === p._id && <Check className="w-4 h-4 text-amber-400 ml-auto" />}
              </button>
            ))}
          </div>
          <button
            onClick={confirmNewBatsman}
            disabled={!incomingBatsmanId}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Send In Batsman
          </button>
        </Modal>
      )}

      {/* New bowler */}
      {activeModal === 'newBowler' && (
        <Modal title="New Bowler">
          <p className="text-xs text-gray-400 font-body mb-3">Over complete — select next bowler</p>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar mb-4">
            {availableBowlers.map((p) => (
              <button key={p._id} type="button"
                onClick={() => setNewBowlerId(p._id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left',
                  newBowlerId === p._id
                    ? 'bg-green-500/15 border-green-500/40 text-green-300'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-green-500/20'
                )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {p.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-body">{p.username}</span>
                {newBowlerId === p._id && <Check className="w-4 h-4 text-green-400 ml-auto" />}
              </button>
            ))}
          </div>
          <button
            onClick={confirmNewBowler}
            disabled={!newBowlerId}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-display font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Confirm Bowler
          </button>
        </Modal>
      )}

      {/* Undo confirm */}
      {activeModal === 'undoConfirm' && (
        <Modal title="Undo Last Ball?" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-gray-400 font-body mb-6">
            This will remove the last recorded delivery and revert the score for all connected scorers.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveModal(null)}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-display font-bold hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={handleUndo}
              className="py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-display font-bold border border-white/10 hover:from-gray-500 hover:to-gray-600 transition-all flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Undo
            </button>
          </div>
        </Modal>
      )}

      {/* Innings break */}
      {activeModal === 'inningsBreak' && (
        <Modal title="Innings Complete">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🏏</div>
            <p className="text-2xl font-display font-black text-white mb-1">
              {innings.totalRuns}/{innings.totalWickets}
            </p>
            <p className="text-sm text-gray-400 font-body">
              {battingTeamName} scored in {oversDisplay(innings.oversCompleted, innings.ballsInCurrentOver)} overs
            </p>
            {inningsBreakData?.target && (
              <div className="mt-3 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 inline-block">
                <p className="text-amber-400 font-display font-bold">
                  Target: {inningsBreakData.target}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleStartSecondInnings}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2">
            <ChevronRight className="w-5 h-5" /> Start 2nd Innings
          </button>
        </Modal>
      )}

      {/* Match complete */}
      {activeModal === 'matchComplete' && (
        <Modal title="Match Complete">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3" />
            <p className="text-xl font-display font-black text-white mb-1">{matchResultText}</p>
            <p className="text-sm text-gray-400 font-body">Final result</p>
          </div>
          <button
            onClick={() => router.push(`/matches/${matchId}`)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> View Match Summary
          </button>
        </Modal>
      )}

    </div>
  );
}
