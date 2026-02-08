"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, ChevronRight } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { players } from '@/data/mockData';
import Link from 'next/link';

export default function PacksPage() {
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCards, setRevealedCards] = useState<typeof players>([]);
  const [showCards, setShowCards] = useState(false);

  const openPack = () => {
    setIsOpening(true);
    
    // Simulate pack opening animation
    setTimeout(() => {
      // Get 5 random players
      const shuffled = [...players].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);
      setRevealedCards(selected);
      setShowCards(true);
      setIsOpening(false);
    }, 2000);
  };

  const resetPack = () => {
    setShowCards(false);
    setRevealedCards([]);
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
            <Gift className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Daily Pack Available</span>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            Open Your Pack!
          </h1>
          <p className="text-xl text-gray-300 font-body">
            Unlock 5 random cricket cards and expand your collection
          </p>
        </div>

        {/* Pack Opening Area */}
        {!showCards ? (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <AnimatePresence mode="wait">
              {!isOpening ? (
                <motion.div
                  key="pack"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="relative"
                >
                  {/* Pack Image */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotateZ: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative w-80 h-96 cursor-pointer group"
                    onClick={openPack}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-3xl shadow-2xl shadow-amber-500/50 group-hover:shadow-amber-500/70 transition-all" />
                    <div className="absolute inset-0 bg-stadium-pattern opacity-20" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <div className="w-32 h-32 mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Gift className="w-16 h-16 text-white" />
                      </div>
                      
                      <h2 className="text-3xl font-display font-black text-white mb-2 text-center">
                        Cricket Clash
                      </h2>
                      <p className="text-white/80 font-body text-center mb-6">
                        Premium Pack
                      </p>
                      
                      <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40">
                        <p className="text-white font-body font-bold">5 Cards Inside</p>
                      </div>
                    </div>

                    {/* Sparkles */}
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="absolute -top-4 -right-4"
                    >
                      <Sparkles className="w-8 h-8 text-amber-300" />
                    </motion.div>
                    <motion.div
                      animate={{ 
                        rotate: -360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2.5, repeat: Infinity }
                      }}
                      className="absolute -bottom-4 -left-4"
                    >
                      <Sparkles className="w-10 h-10 text-orange-300" />
                    </motion.div>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openPack}
                    className="mt-8 px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all flex items-center space-x-2 mx-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Open Pack</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="opening"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 2 }}
                  className="relative"
                >
                  <div className="w-80 h-96 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.5, 1],
                        rotate: [0, 360]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity
                      }}
                    >
                      <Sparkles className="w-32 h-32 text-white" />
                    </motion.div>
                  </div>
                  <p className="text-center text-2xl font-display font-bold text-amber-400 mt-6">
                    Opening Pack...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            {/* Revealed Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  🎉 Pack Opened!
                </h2>
                <p className="text-gray-400 font-body">Here are your new cards</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                {revealedCards.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, rotateY: 180, scale: 0.5 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.2,
                      duration: 0.8,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <PlayerCard player={player} />
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/collection">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all flex items-center space-x-2"
                  >
                    <span>View My Collection</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetPack}
                  className="px-8 py-4 rounded-xl bg-white/5 border-2 border-white/20 text-white font-display font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all flex items-center space-x-2 backdrop-blur-sm"
                >
                  <Gift className="w-5 h-5" />
                  <span>Open Another Pack</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
