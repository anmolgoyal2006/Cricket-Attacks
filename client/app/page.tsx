"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Swords, Trophy, ChevronRight, Star, TrendingUp, Zap, Loader2, Hash, HelpCircle } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { useAuth } from '@/lib/auth-context';
import { userCardsApi, leaderboardApi, battlesApi } from '@/lib/api';

export default function HomePage() {
  const { user } = useAuth();
  const [topCards, setTopCards] = useState<any[]>([]);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [collectionStats, setCollectionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const lbData = await leaderboardApi.get(3);
        setLeaderboard(lbData.leaderboard || []);

        if (user) {
          const [cardsData, battlesData, statsData] = await Promise.all([
            userCardsApi.getMyCards({ limit: '6', sort: 'overall' }),
            battlesApi.getHistory({ limit: '5' }),
            userCardsApi.getStats(),
          ]);
          setTopCards(cardsData.cards || []);
          setRecentBattles(battlesData.battles || []);
          setCollectionStats(statsData.stats);
        }
      } catch {
        // Fallback to empty
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-stadium-lines opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6">
              <Star className="w-4 h-4 text-amber-400 mr-2" />
              <span className="text-sm text-amber-400 font-body font-semibold">Season 2026 Now Live</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black mb-6">
              <span className="block gradient-text">Collect Cards.</span>
              <span className="block gradient-text">Battle Friends.</span>
              <span className="block text-white">Settle Cricket Debates.</span>
            </h1>
            
            <p className="text-xl text-gray-300 font-body max-w-2xl mx-auto mb-10">
              Build your ultimate cricket squad, challenge rivals in epic card battles, and prove who knows cricket best.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={user ? "/packs" : "/login"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all flex items-center space-x-2 group"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Open Daily Pack</span>
                </motion.button>
              </Link>
              
              <Link href={user ? "/battle" : "/login"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-white/5 border-2 border-white/20 text-white font-display font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all flex items-center space-x-2 group backdrop-blur-sm"
                >
                  <Swords className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Start Battle</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {user && (
        <>
          {/* My Top Cards Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-display font-bold text-white mb-2">My Collection</h2>
                  <p className="text-gray-400 font-body">
                    {collectionStats ? `${collectionStats.totalCards} cards owned` : 'Your legendary collection'}
                  </p>
                </div>
                <Link href="/collection">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-amber-400 font-body">
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {topCards.slice(0, 6).map((card, index) => (
                  <PlayerCard 
                    key={card.cardId || card._id}
                    player={{
                      _id: card._id,
                      name: card.name,
                      role: card.role,
                      country: card.country,
                      batting: card.batting,
                      bowling: card.bowling,
                      fielding: card.fielding,
                      overall: card.overall,
                      specialty: card.specialty,
                      rarity: card.rarity,
                      image: card.image,
                      formats: card.formats || {},
                    }}
                    animate={true}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Latest Battles Section */}
          {recentBattles.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Latest Battles</h2>
                    <p className="text-gray-400 font-body">Your recent match history</p>
                  </div>
                  <Link href="/battle">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-amber-400 font-body">
                      <span>Battle Now</span>
                      <Swords className="w-4 h-4" />
                    </button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentBattles.map((battle, index) => (
                    <motion.div
                      key={battle._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-dark rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            battle.winner === 'player'
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                              : 'bg-gradient-to-br from-red-500 to-rose-600'
                          }`}>
                            {battle.winner === 'player' ? '✓' : '✗'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-display font-bold text-white">
                                {battle.type === 'pve' ? 'vs Computer' : 'vs Player'}
                              </h3>
                              <span className={`text-sm font-body px-2 py-0.5 rounded-full ${
                                battle.winner === 'player'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {battle.winner === 'player' ? 'WON' : 'LOST'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 font-body mt-1">
                              {new Date(battle.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-white mb-1">
                            {battle.playerScore}-{battle.computerScore}
                          </div>
                          {battle.trophiesEarned > 0 && (
                            <div className="flex items-center space-x-2 text-amber-400">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-body">+{battle.trophiesEarned}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Daily Games Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Daily Games</h2>
            <p className="text-gray-400 font-body">Come back every day — new challenges, new bragging rights</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cricket Wordle */}
            <Link href="/wordle">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/5 hover:border-amber-500/40 transition-all group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                    <Hash className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-display font-bold text-white">Cricket Wordle</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-body">Daily</span>
                    </div>
                    <p className="text-gray-400 font-body text-sm leading-relaxed">
                      Guess the mystery cricketer from clues revealed one by one. 6 guesses. Resets at midnight.
                    </p>
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 font-body">
                      <span>🌍 Country</span>
                      <span>🏏 Role</span>
                      <span>📊 Stats</span>
                      <span>⚡ Specialty</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            {/* Who Said This Quiz */}
            <Link href="/quiz">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-600/5 hover:border-purple-500/40 transition-all group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                    <HelpCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-display font-bold text-white">Who Said This?</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-body">Quiz</span>
                    </div>
                    <p className="text-gray-400 font-body text-sm leading-relaxed">
                      Famous quotes, spicy controversies, press conference moments — match the words to the cricketer.
                    </p>
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 font-body">
                      <span>🗣️ 10 Questions</span>
                      <span>🪙 Earn Coins</span>
                      <span>📤 Shareable Score</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Top Players</h2>
              <p className="text-gray-400 font-body">Global leaderboard champions</p>
            </div>
            <Link href="/leaderboard">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-amber-400 font-body">
                <span>Full Leaderboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.slice(0, 3).map((entry, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              const gradients = [
                'from-amber-400 to-yellow-600',
                'from-gray-300 to-gray-500',
                'from-orange-600 to-orange-800'
              ];
              
              return (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative overflow-hidden rounded-2xl p-6 ${
                    index === 0 ? 'stadium-glow' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-10`} />
                  <div className="relative">
                    <div className="text-6xl mb-4">{medals[index]}</div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="text-4xl">{entry.avatar}</div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">{entry.username}</h3>
                        <p className="text-sm text-gray-400 font-body">Rank #{entry.rank}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 font-body">Battles Won</span>
                        <span className="text-lg font-display font-bold text-white">{entry.battlesWon}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 font-body">Trophies</span>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span className="text-lg font-display font-bold text-amber-400">{entry.trophies.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 font-body">Win Rate</span>
                        <span className="text-lg font-display font-bold text-green-400">{entry.winRate}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      {user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-body">Total Cards</p>
                    <p className="text-3xl font-display font-bold text-white">
                      {collectionStats?.totalCards || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Swords className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-body">Battles Played</p>
                    <p className="text-3xl font-display font-bold text-white">
                      {user.stats.battlesPlayed}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-body">Trophies</p>
                    <p className="text-3xl font-display font-bold text-white">{user.trophies}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
