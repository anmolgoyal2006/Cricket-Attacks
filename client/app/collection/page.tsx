"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Grid3x3, X, Loader2 } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { userCardsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function CollectionPage() {
  const { user } = useAuth();
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'overall' | 'name' | 'batting' | 'bowling'>('overall');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function fetchCards() {
      try {
        const data = await userCardsApi.getMyCards({ limit: '100' });
        setAllCards(data.cards || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [user]);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = allCards.filter((card: any) => {
      const matchesSearch = !searchQuery ||
        card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.role?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity;
      return matchesSearch && matchesRarity;
    });

    filtered.sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });

    return filtered;
  }, [allCards, searchQuery, selectedRarity, sortBy]);

  const rarities = ['All', 'Legend', 'Epic', 'Rare', 'Common'];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Grid3x3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in to view your collection</h2>
          <p className="text-gray-400 font-body mb-6">Create an account to start collecting cards</p>
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            My Collection
          </h1>
          <p className="text-xl text-gray-300 font-body">
            {allCards.length} cards in your collection
          </p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer font-body"
              >
                {rarities.map(rarity => (
                  <option key={rarity} value={rarity} className="bg-cricket-stadium">
                    {rarity === 'All' ? 'All Rarities' : rarity}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer font-body"
              >
                <option value="overall" className="bg-cricket-stadium">Overall Rating</option>
                <option value="batting" className="bg-cricket-stadium">Batting</option>
                <option value="bowling" className="bg-cricket-stadium">Bowling</option>
                <option value="name" className="bg-cricket-stadium">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {(searchQuery || selectedRarity !== 'All') && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <span className="text-sm text-gray-400 font-body">Active filters:</span>
              {searchQuery && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-body">
                  <span>Search: {searchQuery}</span>
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedRarity !== 'All' && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-body">
                  <span>{selectedRarity}</span>
                  <button onClick={() => setSelectedRarity('All')}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cards Grid */}
        {filteredAndSortedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPlayers.map((card: any, index: number) => {
              return (
                <motion.div
                  key={card.cardId || card._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlayerCard
                    player={card}
                    onClick={() => setSelectedPlayer(card)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Grid3x3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-400 mb-2">
              {allCards.length === 0 ? 'No cards yet' : 'No cards found'}
            </h3>
            <p className="text-gray-500 font-body">
              {allCards.length === 0 ? 'Open some packs to get started!' : 'Try adjusting your filters'}
            </p>
            {allCards.length === 0 && (
              <Link href="/packs">
                <button className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
                  Open Packs
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Player Modal */}
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.8, rotateY: -20 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.8, rotateY: 20 }}
              className="relative max-w-4xl w-full glass-dark rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <PlayerCard
                    player={selectedPlayer}
                  />
                  <div className="mt-4 glass rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-400 font-body">Card Level</p>
                    <p className="text-2xl font-display font-bold text-amber-400">{selectedPlayer.level}</p>
                    <p className="text-xs text-gray-500 font-body mt-1">{selectedPlayer.xp} XP</p>
                    <p className="text-xs text-gray-500 font-body mt-1">{selectedPlayer.battlesPlayed} battles played • {selectedPlayer.battlesWon} won</p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-3xl font-display font-black text-white mb-6">
                    Career Statistics
                  </h2>
                  
                  {selectedPlayer.formats && (
                    <div className="space-y-4">
                      {['odi', 'test', 't20'].map((format) => {
                        const fmt = selectedPlayer.formats[format];
                        if (!fmt) return null;
                        return (
                          <div key={format} className="glass rounded-xl p-4">
                            <h3 className="text-lg font-display font-bold text-amber-400 mb-3 uppercase">{format}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-400 font-body">Matches</p>
                                <p className="text-white font-display font-bold">{fmt.matches}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 font-body">Runs</p>
                                <p className="text-white font-display font-bold">{fmt.runs}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 font-body">Average</p>
                                <p className="text-white font-display font-bold">{fmt.avg.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 font-body">Strike Rate</p>
                                <p className="text-white font-display font-bold">{fmt.sr.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
