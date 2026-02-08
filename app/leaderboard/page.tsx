"use client";

import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Zap, Award } from 'lucide-react';
import { leaderboard } from '@/data/mockData';

export default function LeaderboardPage() {
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaders = leaderboard.slice(3);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

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
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
          >
            <Trophy className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Global Rankings</span>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-300 font-body">
            Top Cricket Clash Cards players worldwide
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Second Place */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-2 md:order-1"
            >
              <div className="glass rounded-2xl p-6 border-2 border-gray-400/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300/10 to-gray-500/10" />
                <div className="relative">
                  <div className="text-6xl text-center mb-4">{topThree[1].avatar}</div>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 mb-3 shadow-lg">
                      <span className="text-2xl font-display font-black text-white">2</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-1">
                      {topThree[1].username}
                    </h3>
                    <p className="text-sm text-gray-400 font-body">Silver Champion</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Battles Won</span>
                      <span className="text-lg font-display font-bold text-white">{topThree[1].battlesWon}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Trophies</span>
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-lg font-display font-bold text-amber-400">
                          {topThree[1].trophies.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Win Rate</span>
                      <span className="text-lg font-display font-bold text-green-400">{topThree[1].winRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-1 md:order-2 md:-mt-8"
            >
              <div className="glass rounded-2xl p-8 border-2 border-amber-400/50 relative overflow-hidden stadium-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-600/10" />
                <div className="relative">
                  <div className="text-7xl text-center mb-4">{topThree[0].avatar}</div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 mb-3 shadow-2xl shadow-amber-500/50 animate-pulse-glow">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-display font-black text-amber-400 mb-1">
                      {topThree[0].username}
                    </h3>
                    <p className="text-sm text-gray-300 font-body">Gold Champion</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                      <span className="text-sm text-gray-300 font-body">Battles Won</span>
                      <span className="text-xl font-display font-bold text-white">{topThree[0].battlesWon}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                      <span className="text-sm text-gray-300 font-body">Trophies</span>
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="text-xl font-display font-bold text-amber-400">
                          {topThree[0].trophies.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                      <span className="text-sm text-gray-300 font-body">Win Rate</span>
                      <span className="text-xl font-display font-bold text-green-400">{topThree[0].winRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="order-3"
            >
              <div className="glass rounded-2xl p-6 border-2 border-orange-600/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-orange-800/10" />
                <div className="relative">
                  <div className="text-6xl text-center mb-4">{topThree[2].avatar}</div>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 mb-3 shadow-lg">
                      <span className="text-2xl font-display font-black text-white">3</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-1">
                      {topThree[2].username}
                    </h3>
                    <p className="text-sm text-gray-400 font-body">Bronze Champion</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Battles Won</span>
                      <span className="text-lg font-display font-bold text-white">{topThree[2].battlesWon}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Trophies</span>
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-lg font-display font-bold text-amber-400">
                          {topThree[2].trophies.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Win Rate</span>
                      <span className="text-lg font-display font-bold text-green-400">{topThree[2].winRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Rest of Leaderboard */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Top 10 Rankings</h2>
            <p className="text-gray-400 font-body">Compete to climb the ranks</p>
          </div>

          <div className="space-y-3">
            {restOfLeaders.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankGradient(entry.rank)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-xl font-display font-black text-white">{entry.rank}</span>
                  </div>
                  
                  <div className="text-4xl">{entry.avatar}</div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-white group-hover:text-amber-400 transition-colors">
                      {entry.username}
                    </h3>
                    <p className="text-sm text-gray-400 font-body">
                      {entry.battlesWon} battles won
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-lg font-display font-bold text-amber-400">
                        {entry.trophies.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 font-body">trophies</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-lg font-display font-bold text-green-400">
                        {entry.winRate}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 font-body">win rate</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Your Rank (Mock) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-6 border-2 border-blue-500/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-xl font-display font-black text-white">42</span>
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">Your Rank</h3>
                <p className="text-sm text-gray-400 font-body">Keep battling to climb higher!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-lg font-display font-bold text-amber-400">1,245</span>
                </div>
                <p className="text-sm text-gray-400 font-body">trophies</p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-display font-bold text-green-400">64.2%</span>
                </div>
                <p className="text-sm text-gray-400 font-body">win rate</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
