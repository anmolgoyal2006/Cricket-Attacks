'use client';

/**
 * Cricket Career Stats — /cricket-stats/[playerId]
 * Displays a player's aggregated career stats and a paginated per-match history.
 * Follows the dark glass-card visual language used across the app.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Activity,
  Star,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { scoringStatsApi, PlayerCareerStats, PlayerMatchHistoryEntry } from '@/lib/scoringApi';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, decimals = 2): string {
  if (n == null || isNaN(n)) return '—';
  return decimals === 0 ? String(Math.round(n)) : n.toFixed(decimals);
}

function oversDisplay(oversBowled: number): string {
  const fullOvers = Math.floor(oversBowled);
  const balls = Math.round((oversBowled - fullOvers) * 6);
  return `${fullOvers}.${balls}`;
}

/** Convert ballsBowled integer to overs string, e.g. 13 balls → "2.1" */
function ballsToOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function matchDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
      <p className="text-xs text-gray-400 font-body uppercase tracking-wider">{label}</p>
      <p className={cn('text-2xl font-display font-black', accent ?? 'text-white')}>{value}</p>
      {sub && <p className="text-xs text-gray-500 font-body">{sub}</p>}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-lg font-display font-bold text-white">{title}</h2>
    </div>
  );
}

// ── Match history row ─────────────────────────────────────────────────────────

function MatchRow({ entry }: { entry: PlayerMatchHistoryEntry }) {
  const match = entry.matchId;
  const bat = entry.battingStats;
  const bowl = entry.bowlingStats;
  const field = entry.fieldingStats;

  const teamA = match?.teamA?.name ?? '—';
  const teamB = match?.teamB?.name ?? '—';

  return (
    <Link href={`/matches/${match?._id}`}>
      <div className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/[0.07] transition-all cursor-pointer">

        {/* Match header */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-display font-bold text-white truncate">
              {teamA} <span className="text-gray-500 font-body font-normal">vs</span> {teamB}
            </p>
            <p className="text-xs text-gray-500 font-body mt-0.5">
              {match?.oversFormat ?? '—'} overs · Innings {entry.inningsNumber} ·{' '}
              {match?.createdAt ? matchDate(match.createdAt) : '—'}
            </p>
          </div>
          {match?.status === 'completed' && match.result && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-body font-semibold flex-shrink-0">
              {match.result.winner === 'tie'
                ? 'Tied'
                : match.result.winner === teamA || match.result.winner === teamB
                ? `${match.result.winner} won`
                : match.result.winner}
            </span>
          )}
        </div>

        {/* Stats grid — stacked on mobile, 3-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Batting */}
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wider mb-1.5">Batting</p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                'text-xl font-display font-black',
                bat.runs >= 50 ? 'text-amber-400' : 'text-white'
              )}>
                {bat.runs}
                {bat.runs >= 100 && <span className="text-amber-400 text-sm ml-0.5">★</span>}
              </span>
              <span className="text-xs text-gray-500 font-body">({bat.ballsFaced}b)</span>
              {!bat.isOut && (
                <span className="text-[10px] text-green-400 font-body">not out</span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-body mt-1">
              {bat.fours} fours · {bat.sixes} sixes · SR {fmt(bat.strikeRate, 1)}
            </p>
            {bat.isOut && bat.dismissalType && (
              <p className="text-[10px] text-gray-600 font-body capitalize mt-0.5">{bat.dismissalType}</p>
            )}
          </div>

          {/* Bowling */}
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wider mb-1.5">Bowling</p>
            {bowl.ballsBowled > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    'text-xl font-display font-black',
                    bowl.wickets >= 3 ? 'text-purple-400' : 'text-white'
                  )}>
                    {bowl.wickets}/{bowl.runsConceded}
                  </span>
                  <span className="text-xs text-gray-500 font-body">({ballsToOvers(bowl.ballsBowled)} ov)</span>
                </div>
                <p className="text-xs text-gray-400 font-body mt-1">
                  {bowl.maidens} maiden{bowl.maidens !== 1 ? 's' : ''} · Econ {fmt(bowl.economy, 2)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600 font-body">Did not bowl</p>
            )}
          </div>

          {/* Fielding */}
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wider mb-1.5">Fielding</p>
            {field.catches + field.runOuts + field.stumpings > 0 ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {field.catches > 0 && (
                  <span className="text-xs text-gray-300 font-body">{field.catches} catch{field.catches !== 1 ? 'es' : ''}</span>
                )}
                {field.runOuts > 0 && (
                  <span className="text-xs text-gray-300 font-body">{field.runOuts} run out{field.runOuts !== 1 ? 's' : ''}</span>
                )}
                {field.stumpings > 0 && (
                  <span className="text-xs text-gray-300 font-body">{field.stumpings} stumping{field.stumpings !== 1 ? 's' : ''}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 font-body">—</p>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CricketStatsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const playerId = params?.playerId as string;

  const [career, setCareer] = useState<PlayerCareerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<PlayerMatchHistoryEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);

  const [careerLoading, setCareerLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Load career stats once
  useEffect(() => {
    if (!playerId) return;
    setCareerLoading(true);
    setCareerError(null);
    scoringStatsApi
      .getCareerStats(playerId)
      .then(({ stats }) => setCareer(stats))
      .catch((err: Error) => {
        // 404 = no matches yet — treat as "no data" rather than a hard error
        if (err.message?.toLowerCase().includes('not found')) {
          setCareer(null);
        } else {
          setCareerError(err.message ?? 'Failed to load career stats');
        }
      })
      .finally(() => setCareerLoading(false));
  }, [playerId]);

  // Load match history whenever page changes
  const fetchHistory = useCallback(() => {
    if (!playerId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    scoringStatsApi
      .getMatchHistory(playerId, page, 15)
      .then(({ matchStats, pagination: pg }) => {
        setMatchHistory(matchStats);
        setPagination(pg);
      })
      .catch((err: Error) => setHistoryError(err.message ?? 'Failed to load match history'))
      .finally(() => setHistoryLoading(false));
  }, [playerId, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const isOwnProfile = user?.id === playerId;
  const displayName = career?.playerId?.username ?? (isOwnProfile ? user?.username : null);

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Back button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors text-sm font-body"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {isOwnProfile && (
            <Link
              href={`/profile/${playerId}`}
              className="text-sm text-gray-500 hover:text-amber-400 transition-colors font-body"
            >
              ← Card Battle Profile
            </Link>
          )}
        </div>

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Cricket Career Stats</span>
          </div>
          <h1 className="text-4xl font-display font-black gradient-text">
            {displayName ? `${displayName}'s Stats` : 'Career Stats'}
          </h1>
        </motion.div>

        {/* ── CAREER STATS PANEL ── */}
        {careerLoading ? (
          <div className="glass rounded-2xl p-10 flex justify-center mb-6">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          </div>
        ) : careerError ? (
          <div className="glass rounded-2xl p-8 flex items-center gap-4 mb-6 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <p className="text-red-400 font-body text-sm">{careerError}</p>
          </div>
        ) : !career ? (
          <div className="glass rounded-2xl p-12 text-center mb-6">
            <Trophy className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-white mb-2">No matches recorded yet</h2>
            <p className="text-gray-400 font-body text-sm">
              {isOwnProfile
                ? 'Play in a scored match to start building your career stats.'
                : 'This player hasn\'t participated in any scored matches yet.'}
            </p>
            <Link
              href="/matches/create"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              Score a Match
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-6 border border-white/10"
          >
            {/* Batting */}
            <div className="mb-6">
              <SectionHeading icon={TrendingUp} title="Batting" />
              {/* Mobile: single column. sm+: 2-col. md+: 4-col */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Matches"
                  value={fmt(career.matchesPlayed, 0)}
                  accent="text-white"
                />
                <StatCard
                  label="Runs"
                  value={fmt(career.totalRuns, 0)}
                  sub={`${fmt(career.totalBallsFaced, 0)} balls faced`}
                  accent="text-amber-400"
                />
                <StatCard
                  label="Batting Avg"
                  value={fmt(career.battingAverage)}
                  sub={`${fmt(career.timesOut, 0)} dismissals`}
                  accent="text-amber-300"
                />
                <StatCard
                  label="Strike Rate"
                  value={fmt(career.battingStrikeRate)}
                  accent="text-orange-400"
                />
                <StatCard
                  label="Highest Score"
                  value={fmt(career.highestScore, 0)}
                  accent={career.highestScore >= 100 ? 'text-amber-400' : 'text-white'}
                />
                <StatCard
                  label="Fours"
                  value={fmt(career.totalFours, 0)}
                  accent="text-blue-400"
                />
                <StatCard
                  label="Sixes"
                  value={fmt(career.totalSixes, 0)}
                  accent="text-purple-400"
                />
                <StatCard
                  label="Not Outs"
                  value={fmt(career.matchesPlayed - career.timesOut, 0)}
                  accent="text-green-400"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6" />

            {/* Bowling */}
            <div className="mb-6">
              <SectionHeading icon={Target} title="Bowling" />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Wickets"
                  value={fmt(career.totalWickets, 0)}
                  accent="text-red-400"
                />
                <StatCard
                  label="Best Figures"
                  value={`${career.bestBowlingFigures.wickets}/${career.bestBowlingFigures.runs}`}
                  accent={career.bestBowlingFigures.wickets >= 5 ? 'text-purple-400' : 'text-white'}
                />
                <StatCard
                  label="Bowling Avg"
                  value={career.totalWickets > 0 ? fmt(career.bowlingAverage) : '—'}
                  sub="runs per wicket"
                />
                <StatCard
                  label="Economy"
                  value={career.totalOversBowled > 0 ? fmt(career.economyRate) : '—'}
                  sub={`${oversDisplay(career.totalOversBowled)} overs bowled`}
                />
                <StatCard
                  label="Runs Conceded"
                  value={fmt(career.totalRunsConceded, 0)}
                  accent="text-gray-300"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6" />

            {/* Fielding */}
            <div>
              <SectionHeading icon={Shield} title="Fielding" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Catches"
                  value={fmt(career.totalCatches, 0)}
                  accent="text-cyan-400"
                />
                <StatCard
                  label="Run Outs"
                  value={fmt(career.totalRunOuts, 0)}
                  accent="text-yellow-400"
                />
                <StatCard
                  label="Stumpings"
                  value={fmt(career.totalStumpings, 0)}
                  accent="text-teal-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MATCH HISTORY ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-display font-bold text-white">Match History</h2>
            </div>
            {pagination.total > 0 && (
              <span className="text-xs text-gray-500 font-body">{pagination.total} match{pagination.total !== 1 ? 'es' : ''}</span>
            )}
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            </div>
          ) : historyError ? (
            <div className="glass rounded-2xl p-6 flex items-center gap-3 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-body text-sm">{historyError}</p>
            </div>
          ) : matchHistory.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-body text-sm">No match history yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {matchHistory.map((entry) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MatchRow entry={entry} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400 font-body">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
