"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Loader2, AlertCircle, Filter, ChevronLeft, ChevronRight, TrendingUp, Trophy } from 'lucide-react';
import { historyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function HistoryPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    async function fetchHistory() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: page.toString(), limit: '20' };
        if (filter) params.result = filter;
        const data = await historyApi.get(params);
        setMatches(data.matches || []);
        setPagination(data.pagination);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user, page, filter]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in to view history</h2>
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6">
            <Swords className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Match History</span>
          </div>
          <h1 className="text-5xl font-display font-black gradient-text mb-4">Match History</h1>
          <p className="text-xl text-gray-300 font-body">Review your past battles</p>
        </motion.div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => { setFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all ${!filter ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('win'); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all ${filter === 'win' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
            >
              Wins
            </button>
            <button
              onClick={() => { setFilter('loss'); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all ${filter === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
            >
              Losses
            </button>
            <button
              onClick={() => { setFilter('draw'); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all ${filter === 'draw' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
            >
              Draws
            </button>
          </div>
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-white mb-2">No matches found</h2>
            <p className="text-gray-400 font-body mb-6">Play some ranked battles to see your history</p>
            <Link href="/battle/multiplayer">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
                Battle Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any, index: number) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="glass rounded-2xl p-5 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-black ${
                      match.result === 'win' ? 'bg-green-500/20 text-green-400' :
                      match.result === 'loss' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                    </div>
                    <div>
                      <Link href={`/profile/${match.opponentId}`} className="text-lg font-display font-bold text-white hover:text-amber-400 transition-colors">
                        vs {match.opponentName}
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 font-body">
                          {new Date(match.createdAt).toLocaleDateString()} {new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-500 font-body">|</span>
                        <span className="text-xs text-gray-400 font-body capitalize">{match.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 font-body">Score</p>
                        <p className="text-lg font-display font-bold text-white">{match.playerScore} - {match.opponentScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400 font-body">ELO</p>
                        <p className={`text-lg font-display font-bold ${
                          match.eloChange > 0 ? 'text-green-400' : match.eloChange < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {match.eloChange > 0 ? '+' : ''}{match.eloChange}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400 font-body">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
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
