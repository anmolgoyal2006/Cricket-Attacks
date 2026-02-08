"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Users, ChevronRight, Star } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { players } from '@/data/mockData';

export default function BattlePage() {
  const [mySquad, setMySquad] = useState<typeof players>([]);
  const [opponentSquad, setOpponentSquad] = useState<typeof players>([]);
  const [battleResult, setBattleResult] = useState<{
    winner: 'you' | 'opponent';
    yourScore: number;
    opponentScore: number;
    trophies: number;
    bestPerformer: string;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const availablePlayers = players.filter(p => !mySquad.includes(p));

  const addToSquad = (player: typeof players[0]) => {
    if (mySquad.length < 5) {
      setMySquad([...mySquad, player]);
    }
  };

  const removeFromSquad = (player: typeof players[0]) => {
    setMySquad(mySquad.filter(p => p.id !== player.id));
  };

  const generateOpponentSquad = () => {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    setOpponentSquad(shuffled.slice(0, 5));
  };

  const simulateBattle = () => {
    if (opponentSquad.length === 0) {
      generateOpponentSquad();
    }
    
    setIsSelecting(false);
    
    setTimeout(() => {
      const myScore = mySquad.reduce((sum, p) => sum + p.overall, 0);
      const oppScore = opponentSquad.reduce((sum, p) => sum + p.overall, 0);
      
      const winner = myScore > oppScore ? 'you' : 'opponent';
      const trophies = winner === 'you' ? Math.floor(Math.random() * 20) + 20 : 0;
      
      const bestPerformer = mySquad.reduce((best, player) => 
        player.overall > best.overall ? player : best
      ).name;

      setBattleResult({
        winner,
        yourScore: myScore,
        opponentScore: oppScore,
        trophies,
        bestPerformer
      });
    }, 2000);
  };

  const resetBattle = () => {
    setMySquad([]);
    setOpponentSquad([]);
    setBattleResult(null);
    setIsSelecting(true);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6"
          >
            <Swords className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-sm text-red-400 font-body font-semibold">Battle Arena</span>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            Card Battle
          </h1>
          <p className="text-xl text-gray-300 font-body">
            Select 5 cards and face your opponent
          </p>
        </div>

        {isSelecting ? (
          <>
            {/* Squad Selection */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Your Squad */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">Your Squad</h2>
                      <p className="text-sm text-gray-400 font-body">{mySquad.length}/5 selected</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[400px]">
                  {mySquad.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => removeFromSquad(player)}
                      className="cursor-pointer"
                    >
                      <PlayerCard player={player} className="max-w-[160px]" />
                    </motion.div>
                  ))}
                  
                  {Array.from({ length: 5 - mySquad.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-body">Empty Slot</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent Squad */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">Opponent Squad</h2>
                      <p className="text-sm text-gray-400 font-body">Auto-generated</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[400px]">
                  {opponentSquad.length > 0 ? (
                    opponentSquad.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <PlayerCard player={player} className="max-w-[160px]" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 font-body">Opponent will be revealed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Battle Button */}
            <div className="text-center mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={simulateBattle}
                disabled={mySquad.length !== 5}
                className={`px-10 py-4 rounded-xl font-display font-bold text-lg shadow-2xl transition-all flex items-center space-x-2 mx-auto ${
                  mySquad.length === 5
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/50 hover:shadow-red-500/70'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Swords className="w-5 h-5" />
                <span>Simulate Battle</span>
              </motion.button>
              {mySquad.length !== 5 && (
                <p className="text-sm text-gray-400 font-body mt-3">
                  Select {5 - mySquad.length} more card{5 - mySquad.length !== 1 ? 's' : ''} to start
                </p>
              )}
            </div>

            {/* Available Players */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-2xl font-display font-bold text-white mb-6">
                Available Players
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availablePlayers.slice(0, 12).map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addToSquad(player)}
                    className="cursor-pointer"
                  >
                    <PlayerCard player={player} className="max-w-[160px]" />
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <AnimatePresence mode="wait">
            {!battleResult ? (
              <motion.div
                key="battling"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center justify-center min-h-[500px]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Swords className="w-32 h-32 text-red-500" />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-white mt-8">
                  Battle in Progress...
                </h2>
                <p className="text-gray-400 font-body mt-2">
                  Calculating results
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
              >
                {/* Result Banner */}
                <div className={`text-center mb-12 py-16 rounded-3xl ${
                  battleResult.winner === 'you'
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                    : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50'
                }`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {battleResult.winner === 'you' ? (
                      <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6" />
                    ) : (
                      <Swords className="w-24 h-24 text-red-400 mx-auto mb-6" />
                    )}
                  </motion.div>
                  
                  <h2 className="text-5xl font-display font-black mb-4">
                    <span className={battleResult.winner === 'you' ? 'text-green-400' : 'text-red-400'}>
                      {battleResult.winner === 'you' ? 'VICTORY!' : 'DEFEAT'}
                    </span>
                  </h2>
                  
                  <div className="flex items-center justify-center space-x-8 text-4xl font-display font-bold">
                    <span className="text-white">{battleResult.yourScore}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-white">{battleResult.opponentScore}</span>
                  </div>
                  
                  {battleResult.winner === 'you' && (
                    <div className="mt-6 flex items-center justify-center space-x-2">
                      <Trophy className="w-6 h-6 text-amber-400" />
                      <span className="text-2xl font-display font-bold text-amber-400">
                        +{battleResult.trophies} Trophies
                      </span>
                    </div>
                  )}
                </div>

                {/* Best Performer */}
                <div className="glass rounded-2xl p-6 mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <Star className="w-6 h-6 text-amber-400" />
                    <h3 className="text-xl font-display font-bold text-white">Best Performer</h3>
                  </div>
                  <p className="text-2xl font-display font-bold text-amber-400">
                    {battleResult.bestPerformer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetBattle}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 transition-all flex items-center space-x-2"
                  >
                    <Swords className="w-5 h-5" />
                    <span>Battle Again</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-4 rounded-xl bg-white/5 border-2 border-white/20 text-white font-display font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all flex items-center space-x-2 backdrop-blur-sm"
                  >
                    <span>Back to Home</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
