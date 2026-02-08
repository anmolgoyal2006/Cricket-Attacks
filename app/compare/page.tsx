"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, Trophy, TrendingUp, Target } from 'lucide-react';
import { players } from '@/data/mockData';

type Format = 'odi' | 'test' | 't20' | 'worldCup' | 'knockouts' | 'bilateral';

export default function ComparePage() {
  const [playerA, setPlayerA] = useState<typeof players[0] | null>(players[0]);
  const [playerB, setPlayerB] = useState<typeof players[0] | null>(players[1]);
  const [selectedFormat, setSelectedFormat] = useState<Format>('odi');

  const formats: { key: Format; label: string }[] = [
    { key: 'odi', label: 'ODI' },
    { key: 'test', label: 'Test' },
    { key: 't20', label: 'T20I' },
    { key: 'worldCup', label: 'World Cup' },
    { key: 'knockouts', label: 'Knockouts' },
    { key: 'bilateral', label: 'Bilateral' },
  ];

  const calculateWinner = () => {
    if (!playerA || !playerB) return null;
    
    let scoreA = 0;
    let scoreB = 0;
    
    formats.forEach(({ key }) => {
      const statsA = playerA.formats[key];
      const statsB = playerB.formats[key];
      
      // Compare based on runs and average
      const pointsA = (statsA.runs / 100) + statsA.avg + (statsA.hundreds * 2) + statsA.fifties;
      const pointsB = (statsB.runs / 100) + statsB.avg + (statsB.hundreds * 2) + statsB.fifties;
      
      if (pointsA > pointsB) scoreA++;
      else if (pointsB > pointsA) scoreB++;
    });
    
    return {
      winner: scoreA > scoreB ? playerA : playerB,
      scoreA,
      scoreB,
      verdicts: {
        worldCup: playerA.formats.worldCup.avg > playerB.formats.worldCup.avg ? playerA.name : playerB.name,
        bilateral: playerA.formats.bilateral.runs > playerB.formats.bilateral.runs ? playerA.name : playerB.name,
        knockouts: playerA.formats.knockouts.avg > playerB.formats.knockouts.avg ? playerA.name : playerB.name,
      }
    };
  };

  const result = calculateWinner();

  const getComparison = (valueA: number, valueB: number) => {
    if (valueA > valueB) return 'better';
    if (valueB > valueA) return 'worse';
    return 'equal';
  };

  const renderStat = (label: string, valueA: number | string, valueB: number | string) => {
    const isNumeric = typeof valueA === 'number' && typeof valueB === 'number';
    const comparison = isNumeric ? getComparison(valueA, valueB) : 'equal';
    
    return (
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center py-3 border-b border-white/10 last:border-0">
        <div className={`text-right ${
          comparison === 'better' ? 'text-green-400 font-bold' : 
          comparison === 'worse' ? 'text-gray-500' : 
          'text-white'
        }`}>
          <span className="text-lg font-display">{valueA}</span>
        </div>
        
        <div className="text-center min-w-[120px]">
          <span className="text-sm text-gray-400 font-body">{label}</span>
        </div>
        
        <div className={`text-left ${
          comparison === 'worse' ? 'text-green-400 font-bold' : 
          comparison === 'better' ? 'text-gray-500' : 
          'text-white'
        }`}>
          <span className="text-lg font-display">{valueB}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6"
          >
            <Users className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-sm text-purple-400 font-body font-semibold">Player Comparison</span>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            Compare Players
          </h1>
          <p className="text-xl text-gray-300 font-body">
            Settle cricket debates with data
          </p>
        </div>

        {/* Player Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <label className="block text-sm text-gray-400 font-body mb-2">Select Player A</label>
            <select
              value={playerA?.id || ''}
              onChange={(e) => setPlayerA(players.find(p => p.id === parseInt(e.target.value)) || null)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer font-body text-lg"
            >
              {players.map(player => (
                <option key={player.id} value={player.id} className="bg-cricket-stadium">
                  {player.name} - {player.country}
                </option>
              ))}
            </select>
            
            {playerA && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white">
                    {playerA.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">{playerA.name}</h3>
                    <p className="text-sm text-gray-400 font-body">{playerA.role} • {playerA.country}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-400 font-body">
                        Overall: {playerA.overall}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <label className="block text-sm text-gray-400 font-body mb-2">Select Player B</label>
            <select
              value={playerB?.id || ''}
              onChange={(e) => setPlayerB(players.find(p => p.id === parseInt(e.target.value)) || null)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer font-body text-lg"
            >
              {players.map(player => (
                <option key={player.id} value={player.id} className="bg-cricket-stadium">
                  {player.name} - {player.country}
                </option>
              ))}
            </select>
            
            {playerB && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-2xl font-bold text-white">
                    {playerB.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">{playerB.name}</h3>
                    <p className="text-sm text-gray-400 font-body">{playerB.role} • {playerB.country}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-400 font-body">
                        Overall: {playerB.overall}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {playerA && playerB && (
          <>
            {/* Format Tabs */}
            <div className="glass rounded-2xl p-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {formats.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFormat(key)}
                    className={`px-6 py-3 rounded-lg font-body font-semibold transition-all ${
                      selectedFormat === key
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="glass rounded-2xl p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
                  {formats.find(f => f.key === selectedFormat)?.label} Statistics
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto" />
              </div>

              <div className="max-w-3xl mx-auto">
                {/* Player Headers */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-6 pb-4 border-b-2 border-white/20">
                  <div className="text-right">
                    <h3 className="text-xl font-display font-bold text-blue-400">{playerA.name}</h3>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-display font-bold text-orange-400">{playerB.name}</h3>
                  </div>
                </div>

                {/* Stats Comparison */}
                <div className="space-y-1">
                  {renderStat('Matches', playerA.formats[selectedFormat].matches, playerB.formats[selectedFormat].matches)}
                  {renderStat('Runs', playerA.formats[selectedFormat].runs.toLocaleString(), playerB.formats[selectedFormat].runs.toLocaleString())}
                  {renderStat('Average', playerA.formats[selectedFormat].avg.toFixed(2), playerB.formats[selectedFormat].avg.toFixed(2))}
                  {renderStat('Strike Rate', playerA.formats[selectedFormat].sr.toFixed(2), playerB.formats[selectedFormat].sr.toFixed(2))}
                  {renderStat('100s / 50s', `${playerA.formats[selectedFormat].hundreds} / ${playerA.formats[selectedFormat].fifties}`, `${playerB.formats[selectedFormat].hundreds} / ${playerB.formats[selectedFormat].fifties}`)}
                  
                  {playerA.role !== 'Batsman' && playerB.role !== 'Batsman' && (
                    <>
                      {renderStat('Wickets', playerA.formats[selectedFormat].wickets, playerB.formats[selectedFormat].wickets)}
                      {renderStat('Economy', playerA.formats[selectedFormat].economy.toFixed(2), playerB.formats[selectedFormat].economy.toFixed(2))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verdict Card */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8 mb-8"
              >
                <div className="text-center mb-8">
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-display font-black text-white mb-2">
                    Final Verdict
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto" />
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-body">🏆 World Cups:</span>
                      <span className="text-lg font-display font-bold text-purple-400">
                        {result.verdicts.worldCup} dominates
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-body">🎯 Bilaterals:</span>
                      <span className="text-lg font-display font-bold text-blue-400">
                        {result.verdicts.bilateral} stronger
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-body">⚡ Knockouts:</span>
                      <span className="text-lg font-display font-bold text-orange-400">
                        {result.verdicts.knockouts} edges it
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-600/20 border-2 border-amber-500/50">
                    <div className="text-center">
                      <p className="text-gray-300 font-body mb-2">Overall Winner</p>
                      <h3 className="text-3xl font-display font-black text-amber-400 mb-1">
                        {result.winner.name}
                      </h3>
                      <p className="text-xl font-display font-bold text-white">
                        ({result.scoreA} - {result.scoreB})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-display font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all flex items-center space-x-2 mx-auto"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share Comparison</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
