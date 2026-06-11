"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Loader2, Users, ChevronLeft, ChevronRight, Crown, Shield, Swords } from 'lucide-react';
import { leaderboardApi, seasonApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import RankBadge from '@/components/RankBadge';
import Link from 'next/link';

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];

function getTierIcon(tier: string) {
  const icons: Record<string, string> = {
    Bronze: '🟤', Silver: '🥈', Gold: '🥇', Platinum: '💎', Diamond: '🔷', Master: '👑',
  };
  return icons[tier] || '🟤';
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<number | undefined>(undefined);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [tierFilter, setTierFilter] = useState<string>('');
  const LIMIT = 20;

  useEffect(() => {
    seasonApi.getHistory().then(d => setSeasons(d.seasons || [])).catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [lbData, rankData] = await Promise.all([
          leaderboardApi.get(LIMIT, season),
          user ? leaderboardApi.getMyRank(season) : Promise.resolve(null),
        ]);
        setLeaderboard(lbData.leaderboard || []);
        setMyRank(rankData);
      } catch {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, season]);

  const filtered = tierFilter
    ? leaderboard.filter(e => e.rankTier === tierFilter)
    : leaderboard;

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const paged = filtered.slice(page * 10, (page + 1) * 10);

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1: return 'from-amber-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-600 to-orange-800';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6">
            <Trophy className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">ELO Rankings</span>
          </div>
          <h1 className="text-5xl font-display font-black gradient-text mb-4">Leaderboard</h1>
          <p className="text-xl text-gray-300 font-body">Top Cricket Clash players by ELO rating</p>
        </motion.div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Users className="w-5 h-5 text-gray-400" />
            {/* Season Filter */}
            <select
              value={season ?? ''}
              onChange={e => { setSeason(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-body outline-none focus:border-amber-500/50"
            >
              <option value="">All Seasons</option>
              {seasons.map(s => (
                <option key={s._id} value={s.seasonNumber}>Season {s.seasonNumber}</option>
              ))}
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={e => { setTierFilter(e.target.value); setPage(0); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-body outline-none focus:border-amber-500/50"
            >
              <option value="">All Tiers</option>
              {TIER_ORDER.map(t => (
                <option key={t} value={t}>{getTierIcon(t)} {t}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-white mb-2">No entries yet</h2>
            <p className="text-gray-400 font-body">Play ranked matches to climb the leaderboard</p>
          </div>
        ) : (
          <>
            {/* Leaderboard List */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 hidden md:grid md:grid-cols-12 gap-4 text-xs text-gray-400 font-body uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-2 text-center">ELO</div>
                <div className="col-span-1 text-center">Tier</div>
                <div className="col-span-1 text-center">W</div>
                <div className="col-span-1 text-center">L</div>
                <div className="col-span-1 text-center">D</div>
                <div className="col-span-1 text-center">Streak</div>
              </div>
              <div className="divide-y divide-white/10">
                {paged.map((entry: any, index: number) => {
                  const displayRank = page * 10 + index + 1;
                  const isYou = user && entry.userId === user.id;
                  return (
                    <Link key={entry._id || index} href={`/profile/${entry.userId}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`grid grid-cols-2 md:grid-cols-12 gap-4 items-center p-4 transition-all hover:bg-white/5 cursor-pointer ${isYou ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''}`}
                      >
                        <div className="col-span-1 flex items-center gap-2">
                          {displayRank <= 3 ? (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankGradient(displayRank)} flex items-center justify-center`}>
                              {displayRank === 1 ? <Crown className="w-4 h-4 text-white" /> :
                               displayRank === 2 ? <Medal className="w-4 h-4 text-white" /> :
                               <Medal className="w-4 h-4 text-white" />}
                            </div>
                          ) : (
                            <span className="w-8 h-8 flex items-center justify-center text-sm font-display font-bold text-gray-400">
                              #{displayRank}
                            </span>
                          )}
                        </div>
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-lg">
                            {entry.avatar || getTierIcon(entry.rankTier)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-display font-bold text-white truncate">{entry.username}</p>
                            {isYou && <span className="text-[10px] text-amber-400 font-body">You</span>}
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-lg font-display font-bold text-amber-400">{entry.eloRating}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-xs">{getTierIcon(entry.rankTier)}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-sm font-display font-bold text-green-400">{entry.battlesWon || 0}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-sm font-display font-bold text-red-400">{entry.battlesLost || 0}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-sm font-display font-bold text-amber-400">{entry.battlesDrawn || 0}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className={`text-sm font-display font-bold ${(entry.streak || 0) > 0 ? 'text-purple-400' : 'text-gray-400'}`}>
                            {(entry.streak || 0) > 0 ? `🔥${entry.streak}` : '-'}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 font-body">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Your Rank */}
        {user && myRank && myRank.rank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 glass rounded-2xl p-6 border-2 border-amber-500/50"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankGradient(myRank.rank)} flex items-center justify-center shadow-lg`}>
                  <span className="text-xl font-display font-black text-white">{myRank.rank}</span>
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Your Rank</h3>
                  <p className="text-sm text-gray-400 font-body">Keep battling to climb higher!</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-body">ELO</p>
                  <p className="text-lg font-display font-bold text-amber-400">{myRank.eloRating}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-body">Tier</p>
                  <p className="text-lg font-display font-bold text-white">{getTierIcon(myRank.rankTier)} {myRank.rankTier}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-body">Wins</p>
                  <p className="text-lg font-display font-bold text-green-400">{myRank.wins}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
