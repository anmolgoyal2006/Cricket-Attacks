"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Calendar, MapPin, Trophy, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { getLiveMatches, CricbuzzLiveMatch } from '@/lib/cricbuzz';

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState<CricbuzzLiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      setRefreshing(true);
      const response = await getLiveMatches();
      
      if (response.success) {
        setMatches(response.data);
        setError(null);
      } else {
        setError('Failed to fetch live matches');
      }
    } catch (err) {
      setError('An error occurred while fetching matches');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMatches();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 font-body">Loading live matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <div className="text-center sm:text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6"
            >
              <Radio className="w-4 h-4 text-red-400 mr-2 animate-pulse" />
              <span className="text-sm text-red-400 font-body font-semibold">LIVE NOW</span>
            </motion.div>
            
            <h1 className="text-5xl font-display font-black gradient-text mb-4">Live Matches</h1>
            <p className="text-xl text-gray-300 font-body">Real-time cricket scores from around the world</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-body font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass rounded-2xl p-6 border-2 border-red-500/50"
          >
            <div className="flex items-center space-x-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-display font-bold text-white mb-1">Error Loading Matches</h3>
                <p className="text-gray-400 font-body">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!error && matches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <Radio className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-white mb-2">No Live Matches</h3>
            <p className="text-gray-400 font-body">There are currently no live matches. Check back later!</p>
          </motion.div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match, index) => (
            <motion.div
              key={match.matchInfo.matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 border-2 border-red-500/30 relative overflow-hidden hover:border-red-500/50 transition-all"
            >
              {/* Live Indicator */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-body font-semibold">LIVE</span>
              </div>

              {/* Series Name */}
              <div className="mb-4">
                <p className="text-sm text-amber-400 font-body font-semibold">{match.matchInfo.seriesName}</p>
              </div>

              {/* Match Info */}
              <div className="mb-6">
                <p className="text-lg text-white font-body font-medium">{match.matchInfo.matchDesc}</p>
              </div>

              {/* Teams and Scores */}
              <div className="space-y-4 mb-6">
                {match.score.map((score, scoreIndex) => (
                  <div
                    key={`${score.teamId}-${scoreIndex}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                        <span className="text-xl">🏏</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-white">{score.teamName}</h3>
                        <p className="text-sm text-gray-400 font-body">
                          {score.overs > 0 ? `(${score.overs} overs)` : 'Yet to bat'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-display font-black text-amber-400">
                        {score.scores || '0/0'}
                      </div>
                      {score.wickets > 0 && (
                        <p className="text-sm text-gray-400 font-body">{score.wickets} wickets</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Match Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                <p className="text-sm text-white font-body font-medium">{match.matchInfo.status}</p>
              </div>

              {/* Venue */}
              <div className="mt-4 flex items-center space-x-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <p className="text-sm font-body">
                  {match.matchInfo.venue.ground}, {match.matchInfo.venue.city}
                </p>
              </div>

              {/* Match State */}
              <div className="mt-2 flex items-center space-x-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <p className="text-xs font-body">{match.matchInfo.state}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        {!error && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 font-body">
              Data provided by Cricbuzz • Auto-refreshes every 30 seconds
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
