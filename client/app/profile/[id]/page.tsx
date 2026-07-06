"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Swords, TrendingUp, Calendar, Loader2, ArrowLeft, User, Zap, Crown, Shield, BarChart3 } from 'lucide-react';
import { profileApi, historyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import RankBadge from '@/components/RankBadge';
import RankProgress from '@/components/RankProgress';
import Link from 'next/link';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profileData, historyData] = await Promise.all([
          profileApi.getProfile(id),
          historyApi.getByUser(id, { limit: '10' }),
        ]);
        setProfile(profileData.profile);
        setMatches(historyData.matches || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">User not found</h2>
          <Link href="/" className="text-amber-400 font-body hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === id;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">Back to Leaderboard</span>
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RankBadge tier={profile.rankTier} elo={profile.eloRating} size="lg" animated />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-display font-black text-white mb-2">{profile.username}</h1>
              <p className="text-gray-400 font-body mb-4">
                <Calendar className="w-4 h-4 inline mr-1" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-2xl font-display font-bold text-white">{profile.battlesPlayed}</p>
                  <p className="text-xs text-gray-400 font-body">Battles</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-display font-bold text-green-400">{profile.winRate}%</p>
                  <p className="text-xs text-gray-400 font-body">Win Rate</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Swords className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-display font-bold text-blue-400">{profile.wins}</p>
                  <p className="text-xs text-gray-400 font-body">Wins</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Zap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-display font-bold text-purple-400">{profile.battleStreak}</p>
                  <p className="text-xs text-gray-400 font-body">Streak</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Rank Progress */}
          <div className="lg:col-span-1">
            <RankProgress
              currentTier={profile.currentTier || profile.rankTier}
              nextTier={profile.nextTier}
              progress={profile.progress || 0}
              eloToNext={profile.eloToNext || 0}
              elo={profile.eloRating}
            />
          </div>

          {/* Stats Grid */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold text-white mb-4">Battle Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-white">{profile.wins}</p>
                <p className="text-xs text-gray-400 font-body">Wins</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-red-400">{profile.losses}</p>
                <p className="text-xs text-gray-400 font-body">Losses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-amber-400">{profile.draws}</p>
                <p className="text-xs text-gray-400 font-body">Draws</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-purple-400">{profile.longestStreak}</p>
                <p className="text-xs text-gray-400 font-body">Best Streak</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-amber-400">{profile.highestElo}</p>
                <p className="text-xs text-gray-400 font-body">Peak ELO</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-blue-400">{profile.level}</p>
                <p className="text-xs text-gray-400 font-body">Level</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-cyan-400">{profile.coins?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-body">Coins</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-display font-bold text-green-400">{profile.xp}</p>
                <p className="text-xs text-gray-400 font-body">XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-white">Recent Matches</h3>
            <div className="flex items-center gap-3">
              <Link
                href={`/cricket-stats/${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/25 text-blue-400 hover:border-blue-400/50 transition-all text-xs font-body font-semibold"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Cricket Stats
              </Link>
              {isOwnProfile && (
                <Link href="/history" className="text-sm text-amber-400 font-body hover:underline">
                  View all
                </Link>
              )}
            </div>
          </div>

          {matches.length === 0 ? (
            <p className="text-center text-gray-500 font-body py-8">No matches played yet</p>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 5).map((match: any) => (
                <div key={match._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      match.result === 'win' ? 'bg-green-500/20 text-green-400' :
                      match.result === 'loss' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-white">{match.opponentName}</p>
                      <p className="text-xs text-gray-400 font-body">{new Date(match.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-display font-bold ${
                      match.eloChange > 0 ? 'text-green-400' : match.eloChange < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {match.eloChange > 0 ? '+' : ''}{match.eloChange} ELO
                    </p>
                    <p className="text-xs text-gray-400 font-body">{match.playerScore} - {match.opponentScore}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
