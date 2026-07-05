'use client';

/**
 * Cricket Scoring Feature — Phase 5
 * Match list page — /matches
 * Shows Live / Upcoming / Completed tabs with paginated match cards.
 * Follows the same filter + pagination pattern as history/leaderboard pages.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, Radio, Clock, CheckCircle2, PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { scoringApi, scoringSpectatorApi, ScoringMatch } from '@/lib/scoringApi';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

type TabKey = 'live' | 'upcoming' | 'completed' | '';

const TABS: { key: TabKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'live',      label: 'Live',      icon: Radio,          color: 'text-red-400 border-red-500/50 bg-red-500/10' },
  { key: 'upcoming',  label: 'Upcoming',  icon: Clock,          color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2,   color: 'text-green-400 border-green-500/50 bg-green-500/10' },
  { key: '',          label: 'All',       icon: Trophy,         color: 'text-amber-400 border-amber-500/50 bg-amber-500/10' },
];

function overStr(oc: number, bic: number) {
  return `${oc}.${bic}`;
}

function StatusBadge({ status }: { status: ScoringMatch['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-body font-bold bg-red-500/15 border border-red-500/40 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
        LIVE
      </span>
    );
  }
  if (status === 'innings_break') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        INNINGS BREAK
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
        UPCOMING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-bold bg-green-500/15 border border-green-500/30 text-green-400">
      COMPLETED
    </span>
  );
}

function MatchCard({ match, index }: { match: ScoringMatch; index: number }) {
  const ci = match.currentInningsSummary;
  const isLive = match.status === 'live' || match.status === 'innings_break';
  const battingTeam = ci ? match[ci.battingTeam] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/matches/${match._id}`}>
        <div className={cn(
          'glass rounded-2xl p-4 sm:p-5 border transition-all hover:bg-white/[0.04] hover:border-white/20 cursor-pointer group',
          isLive ? 'border-red-500/20' : 'border-white/10'
        )}>
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-body mb-1">
                {match.oversFormat} overs{match.venue ? ` · ${match.venue}` : ''}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-display font-bold text-white">{match.teamA.name}</span>
                <span className="text-gray-600 font-body text-xs">vs</span>
                <span className="text-sm font-display font-bold text-white">{match.teamB.name}</span>
              </div>
            </div>
            <StatusBadge status={match.status} />
          </div>

          {/* Score line */}
          {isLive && ci && (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-gray-500 font-body">{battingTeam?.name ?? '—'}</span>
              <span className="text-xl font-display font-black text-white">
                {ci.totalRuns}/{ci.totalWickets}
              </span>
              <span className="text-xs text-gray-500 font-body">
                ({overStr(ci.oversCompleted, ci.ballsInCurrentOver)} ov)
              </span>
              {ci.target && (
                <span className="text-xs text-amber-400 font-body ml-1">
                  chasing {ci.target}
                </span>
              )}
            </div>
          )}

          {match.status === 'completed' && match.result && (
            <p className="text-sm text-green-400 font-body font-semibold mb-2">
              {match.result.winner === 'tie'
                ? 'Match tied'
                : `${match.result.winner} won by ${match.result.margin}`}
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600 font-body">
              {new Date(match.createdAt as unknown as string).toLocaleDateString()}
            </span>
            <span className={cn(
              'text-xs font-body font-semibold transition-colors',
              isLive ? 'text-red-400 group-hover:text-red-300' : 'text-amber-400 group-hover:text-amber-300'
            )}>
              {isLive ? 'Watch Live →' : match.status === 'upcoming' ? 'View →' : 'Scorecard →'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('live');
  const [matches, setMatches] = useState<ScoringMatch[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await scoringSpectatorApi.listMatchesPaged(activeTab || undefined, page, 12);
        if (!cancelled) {
          setMatches(data.matches ?? []);
          setPagination(data.pagination ?? null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load matches');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, page]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
                <Trophy className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                <span className="text-xs text-amber-400 font-body font-semibold">Cricket Scoring</span>
              </div>
              <h1 className="text-4xl font-display font-black gradient-text">Matches</h1>
            </div>
            {user && (
              <Link href="/matches/create">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Match
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-semibold whitespace-nowrap transition-all border',
                  active ? tab.color : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8 hover:text-gray-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 font-body">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <Trophy className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-white mb-2">No matches found</h2>
            <p className="text-gray-400 font-body text-sm">
              {activeTab === 'live' ? 'No live matches right now.' : 'Nothing here yet.'}
            </p>
            {user && (
              <Link href="/matches/create">
                <button className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-sm">
                  Start a Match
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, i) => <MatchCard key={m._id} match={m} index={i} />)}
          </div>
        )}

        {/* Pagination — same pattern as history/leaderboard pages */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400 font-body">
              Page {pagination.page} of {pagination.pages}
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
      </div>
    </div>
  );
}
