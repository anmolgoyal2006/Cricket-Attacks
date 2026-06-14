"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Users, Loader2, AlertCircle, Wifi, Clock, Search, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { userCardsApi } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useMultiplayerBattle } from '@/lib/useMultiplayerBattle';
import Link from 'next/link';

const ATTRIBUTES = ['batting', 'bowling', 'fielding', 'captaincy', 'pressure'];

const ATTRIBUTE_LABELS: Record<string, string> = {
  batting: 'Batting',
  bowling: 'Bowling',
  fielding: 'Fielding',
  captaincy: 'Captaincy',
  pressure: 'Pressure',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  batting: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
  bowling: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  fielding: 'text-green-400 border-green-500/50 bg-green-500/10',
  captaincy: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
  pressure: 'text-red-400 border-red-500/50 bg-red-500/10',
};

interface CardDisplay {
  _id: string;
  name: string;
  role: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
  overall: number;
  rarity?: string;
}

export default function MultiplayerBattlePage() {
  const { user } = useAuth();
  const multiplayer = useMultiplayerBattle();

  const [availableCards, setAvailableCards] = useState<CardDisplay[]>([]);
  const [squad, setSquad] = useState<CardDisplay[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every second so cooldown countdowns update live
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCooldown = (expiresAt: number) => {
    const secs = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!user) {
      setLoadingCards(false);
      return;
    }
    async function fetchCards() {
      try {
        const data = await userCardsApi.getMyCards({ limit: '100', sort: 'overall' });
        setAvailableCards(data.cards || []);
      } catch {
        setAvailableCards([]);
      } finally {
        setLoadingCards(false);
      }
    }
    fetchCards();
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = connectSocket(token);
      setSocketConnected(socket.connected);
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
    }
    return () => {
      disconnectSocket();
    };
  }, []);

  const addToSquad = useCallback((card: CardDisplay) => {
    if (squad.length < 5) {
      setSquad((prev) => [...prev, card]);
    }
  }, [squad.length]);

  const removeFromSquad = useCallback((cardId: string) => {
    setSquad((prev) => prev.filter((c) => c._id !== cardId));
  }, []);

  const handleJoinQueue = useCallback(() => {
    if (squad.length !== 5) return;
    const pvpCards = squad.map((c) => ({
      _id: c._id,
      name: c.name,
      role: c.role,
      batting: c.batting,
      bowling: c.bowling,
      fielding: c.fielding,
      captaincy: c.captaincy ?? 70,
      pressure: c.pressure ?? 80,
      userCardId: c._id,
    }));
    multiplayer.joinMatchmaking(pvpCards);
  }, [squad, multiplayer]);

  const getMyCardStat = (card: CardDisplay): number => {
    if (card.role === 'Batsman' || card.role === 'Wicketkeeper-Batsman') return card.batting;
    if (card.role === 'Bowler') return card.bowling;
    return Math.round((card.batting + card.bowling) / 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Wifi className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in for PvP</h2>
          <p className="text-gray-400 font-body mb-6">Create an account to battle other players</p>
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingCards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (availableCards.length === 0 && multiplayer.status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">No cards in your collection</h2>
          <p className="text-gray-400 font-body mb-6">Open some packs first to get cards for PvP</p>
          <Link href="/packs">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
              Open Packs
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Link href="/battle">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 cursor-pointer hover:from-red-500/30 hover:to-orange-500/30 transition-all">
                <span className="text-sm text-red-400 font-body font-semibold flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  PvE Battle
                </span>
              </div>
            </Link>
            <Link href="/battle/multiplayer">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 cursor-pointer">
                <span className="text-sm text-blue-400 font-body font-semibold flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  PvP Battle
                </span>
              </div>
            </Link>
          </motion.div>

          <h1 className="text-5xl font-display font-black gradient-text mb-4">PvP Arena</h1>
          <p className="text-xl text-gray-300 font-body">
            Challenge other players in real-time card battles
          </p>
        </div>

        {multiplayer.error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400 font-body">{multiplayer.error}</p>
          </div>
        )}

        {/* Connection Status */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full ${
            socketConnected ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm font-body">{socketConnected ? 'Connected to game server' : 'Disconnected from game server'}</span>
          </div>
        </div>

        {/* MATCHMAKING UI */}
        {multiplayer.status === 'matchmaking' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="glass rounded-3xl p-12 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
              >
                <Search className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-display font-bold text-white mb-4">Searching for opponent...</h2>
              <p className="text-gray-400 font-body text-lg mb-6">
                Looking for a player with similar skill level
              </p>

              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-white">{multiplayer.queuePosition}</p>
                  <p className="text-sm text-gray-400 font-body">Position</p>
                </div>
                <div className="text-center">
                  <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-white">{multiplayer.queueSize}</p>
                  <p className="text-sm text-gray-400 font-body">In Queue</p>
                </div>
              </div>

              <button
                onClick={multiplayer.leaveMatchmaking}
                className="px-8 py-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-display font-bold text-lg hover:bg-red-500/30 transition-all flex items-center space-x-2 mx-auto"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* COUNTDOWN */}
        {multiplayer.status === 'countdown' && multiplayer.countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="glass rounded-3xl p-12 mb-8">
              <motion.div
                key={multiplayer.countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center"
              >
                <span className="text-6xl font-display font-black text-white">{multiplayer.countdown}</span>
              </motion.div>

              <h2 className="text-3xl font-display font-bold text-white mb-4">Match Found!</h2>
              <p className="text-lg text-gray-300 font-body">Get ready to battle</p>
            </div>
          </motion.div>
        )}

        {/* PLAYING / ROUND RESULT */}
        {(multiplayer.status === 'playing' || multiplayer.status === 'roundResult') && (
          <div>
            {/* Score Bar */}
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Your Score</p>
                  <div className="text-5xl font-display font-black text-blue-400">{multiplayer.myScore}</div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-amber-400 font-body mb-2">
                    Round {multiplayer.round}/{multiplayer.totalRounds}
                  </p>
                  {multiplayer.currentAttribute && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block border ${ATTRIBUTE_COLORS[multiplayer.currentAttribute] || 'text-amber-400 border-amber-500/50 bg-amber-500/10'}`}>
                      {ATTRIBUTE_LABELS[multiplayer.currentAttribute] || multiplayer.currentAttribute}
                    </div>
                  )}
                  {multiplayer.autoSelected && (
                    <div className="flex items-center gap-2 text-amber-400 justify-center">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-body">Auto-selected</span>
                    </div>
                  )}
                  <Swords className="w-8 h-8 text-amber-400 mx-auto mt-1" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Opponent Score</p>
                  <div className="text-5xl font-display font-black text-red-400">{multiplayer.opponentScore}</div>
                </div>
              </div>
            </div>

            {/* Turn indicator — shown above cards during playing phase */}
            {multiplayer.status === 'playing' && (
              <motion.div
                key={`turn-${multiplayer.round}-${multiplayer.isMyTurn}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                {multiplayer.isMyTurn ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-500/15 border border-blue-500/40 max-w-md mx-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 font-display font-bold text-sm">
                      {multiplayer.opponentPickedCard
                        ? `Opponent played ${multiplayer.opponentPickedCard.cardName} — now pick your card`
                        : 'Your turn — pick a card first'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 max-w-md mx-auto">
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                    <span className="text-red-300 font-body text-sm">
                      Waiting for opponent to pick first…
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Opponent's chosen card banner (shown to responder) */}
            {multiplayer.status === 'playing' && multiplayer.opponentPickedCard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-xl p-4 mb-4 flex items-center gap-4 border border-red-500/30 bg-red-500/5 max-w-md mx-auto"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Swords className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-body">Opponent chose</p>
                  <p className="text-sm font-display font-bold text-white">{multiplayer.opponentPickedCard.cardName}</p>
                  <p className="text-xs text-gray-400 font-body">{multiplayer.opponentPickedCard.cardRole}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-500 font-body italic">stats hidden</p>
                </div>
              </motion.div>
            )}

            {/* My Cards */}
            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Your Cards ({multiplayer.myCards.length - multiplayer.usedCardIds.size} remaining)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {multiplayer.myCards.map((card) => {
                  const isUsed = multiplayer.usedCardIds.has(card.userCardId);
                  // Can only click if: playing phase, not used, and it's my turn
                  const isDisabled = multiplayer.status !== 'playing' || isUsed || !multiplayer.isMyTurn;
                  // Show stats in roundResult for the card that was just played
                  const showStats = multiplayer.status === 'roundResult' &&
                    multiplayer.currentRoundResult?.player1Card.name === card.name;
                  return (
                    <motion.div
                      key={card.userCardId}
                      whileHover={!isDisabled ? { scale: 1.05, y: -10 } : {}}
                      onClick={() => !isDisabled && multiplayer.selectCard(card.userCardId)}
                      className={`${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${
                        isUsed ? 'ring-2 ring-gray-600 rounded-2xl' : !isDisabled ? 'hover:ring-2 hover:ring-blue-500 rounded-2xl' : 'rounded-2xl'
                      }`}
                    >
                      <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex flex-col items-center justify-center p-1.5 gap-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto">
                          <span className="text-white font-bold text-xs">{card.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <p className="text-[10px] font-display font-bold text-white leading-tight text-center">{card.name}</p>
                        <p className="text-[9px] text-gray-400 font-body">{card.role}</p>
                        {showStats && (
                          <div className="grid grid-cols-5 gap-0.5 w-full px-0.5 mt-0.5">
                            {ATTRIBUTES.map((attr) => {
                              const val = (card as any)[attr] ?? 80;
                              const isActive = attr === multiplayer.currentAttribute;
                              return (
                                <div key={attr} className={`flex flex-col items-center rounded ${isActive ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5'}`}>
                                  <span className={`text-[8px] font-body ${attr === 'batting' ? 'text-amber-400' : attr === 'bowling' ? 'text-blue-400' : attr === 'fielding' ? 'text-green-400' : attr === 'captaincy' ? 'text-purple-400' : 'text-red-400'}`}>
                                    {attr === 'captaincy' ? 'CAP' : attr === 'pressure' ? 'PRE' : attr.slice(0, 3).toUpperCase()}
                                  </span>
                                  <span className={`text-[11px] font-display font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{Math.round(val)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {!showStats && !isUsed && (
                          <p className="text-[8px] text-gray-500 font-body italic">stats hidden</p>
                        )}
                        {isUsed && (
                          <span className="text-[8px] text-gray-500 font-body">Used</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Round Result Display */}
            <AnimatePresence>
              {multiplayer.status === 'roundResult' && multiplayer.currentRoundResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass rounded-2xl p-8 mb-8"
                >
                  <div className="text-center mb-6">
                    <h3 className={`text-3xl font-display font-bold mb-2 ${
                      multiplayer.currentRoundResult.winner === 'player1' ? 'text-green-400' :
                      multiplayer.currentRoundResult.winner === 'player2' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {multiplayer.currentRoundResult.winner === 'player1' ? 'You Won This Round!' :
                       multiplayer.currentRoundResult.winner === 'player2' ? 'Opponent Won This Round!' :
                       "It's a Tie!"}
                    </h3>
                    {multiplayer.currentRoundResult.attribute && (
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-4 border ${ATTRIBUTE_COLORS[multiplayer.currentRoundResult.attribute] || ''}`}>
                        {ATTRIBUTE_LABELS[multiplayer.currentRoundResult.attribute] || multiplayer.currentRoundResult.attribute}
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-gray-400 font-body mb-1">Your Card</p>
                        <p className="text-lg font-display font-bold text-white">{multiplayer.currentRoundResult.player1Card.name}</p>
                        <p className="text-2xl font-display font-black text-blue-400 mt-1">{multiplayer.currentRoundResult.player1Card.stat}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-gray-400 font-body mb-1">Opponent Card</p>
                        <p className="text-lg font-display font-bold text-white">{multiplayer.currentRoundResult.player2Card.name}</p>
                        <p className="text-2xl font-display font-black text-red-400 mt-1">{multiplayer.currentRoundResult.player2Card.stat}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Round History */}
            {multiplayer.roundHistory.length > 0 && multiplayer.status === 'playing' && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4">Round History</h3>
                <div className="space-y-2">
                  {multiplayer.roundHistory.map((round, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Round {index + 1}</span>
                      <span className="text-sm font-body">
                        <span className="text-blue-400">{round.player1Card.name}</span>
                        {' vs '}
                        <span className="text-red-400">{round.player2Card.name}</span>
                      </span>
                      <span className={`text-sm font-display font-bold ${
                        round.winner === 'player1' ? 'text-green-400' :
                        round.winner === 'player2' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {round.winner === 'player1' ? 'You Won' : round.winner === 'player2' ? 'Opponent Won' : 'Tie'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BATTLE FINISHED */}
        {multiplayer.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className={`text-center mb-12 py-16 rounded-3xl ${
              multiplayer.winner === 'player1'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                : multiplayer.winner === 'player2'
                ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50'
            }`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {multiplayer.winner === 'player1' ? (
                  <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6" />
                ) : multiplayer.winner === 'player2' ? (
                  <Swords className="w-24 h-24 text-red-400 mx-auto mb-6" />
                ) : (
                  <Zap className="w-24 h-24 text-amber-400 mx-auto mb-6" />
                )}
              </motion.div>

              <h2 className="text-5xl font-display font-black mb-4">
                <span className={
                  multiplayer.winner === 'player1' ? 'text-green-400' :
                  multiplayer.winner === 'player2' ? 'text-red-400' : 'text-amber-400'
                }>
                  {multiplayer.winner === 'player1' ? 'VICTORY!' : multiplayer.winner === 'player2' ? 'DEFEAT!' : "IT'S A TIE!"}
                </span>
              </h2>

              <div className="flex items-center justify-center space-x-8 text-4xl font-display font-bold">
                <span className="text-blue-400">{multiplayer.myScore}</span>
                <span className="text-gray-500">-</span>
                <span className="text-red-400">{multiplayer.opponentScore}</span>
              </div>

              {multiplayer.rewards && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <span className="text-2xl font-display font-bold text-amber-400">+{multiplayer.rewards.trophies} Trophies</span>
                  </div>
                  <p className="text-lg text-amber-400/80 font-display font-bold">+{multiplayer.rewards.xp} XP</p>
                </div>
              )}
            </div>

            {/* Match Summary */}
            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-display font-bold text-white mb-4">Match Summary</h3>
              <div className="space-y-3">
                {multiplayer.roundHistory.map((round, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-amber-400 font-body font-semibold">Round {index + 1}</span>
                      {round.attribute && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ATTRIBUTE_COLORS[round.attribute] || ''}`}>{ATTRIBUTE_LABELS[round.attribute] || round.attribute}</span>}
                      <span className={`text-sm font-display font-bold ${
                        round.winner === 'player1' ? 'text-green-400' :
                        round.winner === 'player2' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {round.winner === 'player1' ? 'You Won' : round.winner === 'player2' ? 'Opponent Won' : 'Tie'}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-body">{round.player1Card.name}</span>
                        <span className="text-white font-display font-bold">{round.player1Card.stat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-body">{round.player2Card.name}</span>
                        <span className="text-white font-display font-bold">{round.player2Card.stat}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setSquad([]);
                  multiplayer.reset();
                }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-display font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Play Again</span>
              </button>
              <Link href="/battle">
                <button className="px-8 py-4 rounded-xl bg-white/5 border-2 border-white/20 text-white font-display font-bold text-lg hover:bg-white/10 transition-all flex items-center space-x-2">
                  <Swords className="w-5 h-5" />
                  <span>PvE Battle</span>
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* DISCONNECTED */}
        {multiplayer.status === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="glass rounded-3xl p-12 mb-8">
              <AlertCircle className="w-24 h-24 text-amber-400 mx-auto mb-6" />
              <h2 className="text-3xl font-display font-bold text-white mb-4">Opponent Disconnected</h2>
              <p className="text-gray-400 font-body text-lg mb-8">
                Waiting for reconnection... If they don&apos;t return, you win by default.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            </div>
          </motion.div>
        )}

        {/* IDLE STATE - Squad Selection */}
        {multiplayer.status === 'idle' && (
          <>
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">Your Squad</h2>
                    <p className="text-sm text-gray-400 font-body">{squad.length}/5 selected</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {squad.map((player, index) => (
                  <motion.div
                    key={player._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => removeFromSquad(player._id)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center p-2 relative group/slot">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">{player.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <p className="text-sm font-display font-bold text-white">{player.name}</p>
                        <p className="text-xs text-gray-400 font-body">{player.role}</p>
                        <p className="text-lg font-display font-bold text-amber-400">{getMyCardStat(player)}</p>
                      </div>
                      {/* Remove overlay on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-red-900/60 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center">
                        <X className="w-8 h-8 text-red-300" />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {Array.from({ length: 5 - squad.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-body">Empty Slot</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinQueue}
                  disabled={squad.length !== 5 || squad.some(c => multiplayer.cooldowns[c._id] && multiplayer.cooldowns[c._id] > now)}
                  className={`px-10 py-4 rounded-xl font-display font-bold text-lg shadow-2xl transition-all flex items-center space-x-2 mx-auto ${
                    squad.length === 5 && !squad.some(c => multiplayer.cooldowns[c._id] && multiplayer.cooldowns[c._id] > now)
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-blue-500/50 hover:shadow-blue-500/70'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Wifi className="w-5 h-5" />
                  <span>Find Match</span>
                </motion.button>
                {squad.length !== 5 && (
                  <p className="text-sm text-gray-400 font-body mt-3">
                    Select {5 - squad.length} more card{5 - squad.length !== 1 ? 's' : ''} to start
                  </p>
                )}
                {squad.length === 5 && squad.some(c => multiplayer.cooldowns[c._id] && multiplayer.cooldowns[c._id] > now) && (
                  <p className="text-sm text-red-400 font-body mt-3 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Some selected cards are on cooldown — swap them out
                  </p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-2xl font-display font-bold text-white mb-6">Your Cards</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableCards.map((card, index) => {
                  const inSquad = squad.some((c) => c._id === card._id);
                  const cooldownExpiry = multiplayer.cooldowns[card._id];
                  const onCooldown = cooldownExpiry && cooldownExpiry > now;
                  return (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (onCooldown) return;
                        if (inSquad) removeFromSquad(card._id);
                        else addToSquad(card);
                      }}
                      className={`relative cursor-pointer ${onCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border flex items-center justify-center p-2 transition-all ${
                        onCooldown ? 'border-red-500/40' : inSquad ? 'border-blue-500/40' : 'border-white/10 hover:border-blue-500/50'
                      }`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                            card.rarity === 'Legend' ? 'from-amber-400 to-orange-600' :
                            card.rarity === 'Epic' ? 'from-purple-500 to-purple-700' :
                            card.rarity === 'Rare' ? 'from-blue-500 to-blue-700' :
                            'from-gray-500 to-gray-700'
                          } flex items-center justify-center mx-auto mb-2`}>
                            <span className="text-white font-bold text-sm">
                              {card.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <p className="text-xs font-display font-bold text-white truncate">{card.name}</p>
                          <p className="text-xs text-gray-400 font-body">{card.role}</p>
                          {onCooldown ? (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-red-400" />
                              <p className="text-xs font-display font-bold text-red-400">{formatCooldown(cooldownExpiry)}</p>
                            </div>
                          ) : (
                            <p className="text-sm font-display font-bold text-amber-400">{card.overall}</p>
                          )}
                        </div>
                      </div>
                      {/* Cooldown overlay */}
                      {onCooldown && (
                        <div className="absolute inset-0 rounded-2xl bg-red-900/30 flex flex-col items-center justify-center">
                          <Clock className="w-6 h-6 text-red-400 mb-1" />
                          <span className="text-xs text-red-300 font-body font-semibold">Cooldown</span>
                          <span className="text-sm text-red-400 font-display font-bold">{formatCooldown(cooldownExpiry)}</span>
                        </div>
                      )}
                      {/* Selected overlay — click to deselect */}
                      {inSquad && !onCooldown && (
                        <div className="absolute inset-0 rounded-2xl bg-blue-900/40 group-hover:bg-red-900/50 flex items-center justify-center transition-colors">
                          <div className="w-10 h-10 rounded-full bg-blue-500 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                            <span className="text-white text-lg font-bold group-hover:hidden">✓</span>
                            <X className="w-5 h-5 text-white hidden group-hover:block" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
