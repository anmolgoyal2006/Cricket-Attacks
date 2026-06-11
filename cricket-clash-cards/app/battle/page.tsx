"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Users, ChevronRight, Star, ArrowRight, Loader2, AlertCircle, Wifi } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { useAuth } from '@/lib/auth-context';
import { cardsApi, battlesApi, userCardsApi } from '@/lib/api';
import Link from 'next/link';

type GamePhase = 'selection' | 'battle' | 'result';

interface BattleCard {
  userCardId: string;
  cardId: string;
  name: string;
  role: string;
  batting: number;
  bowling: number;
  overall: number;
}

interface RoundResult {
  playerCard: BattleCard;
  computerCard: { name: string; stat: number };
  winner: string;
  playerStat: number;
  computerStat: number;
}

export default function BattlePage() {
  const { user } = useAuth();
  const [gamePhase, setGamePhase] = useState<GamePhase>('selection');
  const [mySquad, setMySquad] = useState<BattleCard[]>([]);
  const [availableCards, setAvailableCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState('');

  // Battle state
  const [battleId, setBattleId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<BattleCard[]>([]);
  const [aiHand, setAiHand] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [battleState, setBattleState] = useState<string>('choosing');
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<BattleCard | null>(null);
  const [selectedComputerCard, setSelectedComputerCard] = useState<{ name: string; stat: number } | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [trophiesEarned, setTrophiesEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const addToSquad = (card: any) => {
    if (mySquad.length < 5) {
      setMySquad([...mySquad, {
        userCardId: card._id,
        cardId: card.cardId || card._id,
        name: card.cardName || card.card?.name || 'Unknown',
        role: card.card?.role || '',
        batting: card.batting,
        bowling: card.bowling,
        overall: card.overall,
      }]);
    }
  };

  const removeFromSquad = (card: BattleCard) => {
    setMySquad(mySquad.filter(c => c.userCardId !== card.userCardId));
  };

  const getCardMainStat = (card: BattleCard): number => {
    if (card.role === 'Batsman' || card.role === 'Wicketkeeper-Batsman') {
      return card.batting;
    } else if (card.role === 'Bowler') {
      return card.bowling;
    }
    return Math.round((card.batting + card.bowling) / 2);
  };

  const startBattle = async () => {
    if (mySquad.length !== 5) return;
    setError('');

    try {
      const data = await battlesApi.startPvE(mySquad.map(c => c.userCardId));
      setBattleId(data.battleId);
      setPlayerHand(data.playerCards);
      setAiHand(data.aiCards);
      setCurrentRound(data.currentRound + 1);
      setTotalRounds(data.totalRounds);
      setPlayerScore(0);
      setComputerScore(0);
      setRoundHistory([]);
      setBattleState('choosing');
      setSelectedPlayerCard(null);
      setSelectedComputerCard(null);
      setGameWinner(null);
      setGamePhase('battle');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePlayerCardClick = async (card: BattleCard) => {
    if (battleState !== 'choosing' || !battleId || submitting) return;
    setSubmitting(true);
    setSelectedPlayerCard(card);
    setBattleState('revealing');

    try {
      const data = await battlesApi.playRound(battleId, card.userCardId);
      
      setSelectedComputerCard({ name: data.computerCard.name, stat: data.computerCard.stat });
      
      setTimeout(() => {
        setPlayerScore(data.playerScore);
        setComputerScore(data.computerScore);
        
        const roundResult: RoundResult = {
          playerCard: card,
          computerCard: { name: data.computerCard.name, stat: data.computerCard.stat },
          winner: data.winner,
          playerStat: data.playerCard.stat,
          computerStat: data.computerCard.stat,
        };
        
        setRoundHistory(prev => [...prev, roundResult]);
        setBattleState('roundResult');
        
        if (data.isOver) {
          setTimeout(() => {
            setGameWinner(data.battleResult || 'tie');
            setTrophiesEarned(data.trophiesEarned);
            setXpEarned(data.xpEarned);
            setGamePhase('result');
          }, 1500);
        }
        setSubmitting(false);
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setBattleState('choosing');
      setSelectedPlayerCard(null);
      setSubmitting(false);
    }
  };

  const nextRound = () => {
    setPlayerHand(prev => prev.filter(c => c.userCardId !== selectedPlayerCard?.userCardId));
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    setCurrentRound(prev => prev + 1);
    setBattleState('choosing');
  };

  const resetGame = () => {
    setMySquad([]);
    setGamePhase('selection');
    setBattleId(null);
    setPlayerHand([]);
    setAiHand([]);
    setBattleState('choosing');
    setCurrentRound(1);
    setPlayerScore(0);
    setComputerScore(0);
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    setRoundHistory([]);
    setGameWinner(null);
    setTrophiesEarned(0);
    setXpEarned(0);
  };

  const getRoundWinnerText = () => {
    const lastRound = roundHistory[roundHistory.length - 1];
    if (!lastRound) return '';
    if (lastRound.winner === 'player') return `You Win! ${lastRound.playerStat} > ${lastRound.computerStat}`;
    if (lastRound.winner === 'computer') return `Computer Wins! ${lastRound.computerStat} > ${lastRound.playerStat}`;
    return `It's a Tie! ${lastRound.playerStat} = ${lastRound.computerStat}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in to battle</h2>
          <p className="text-gray-400 font-body mb-6">Create an account to enter the arena</p>
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

  if (availableCards.length === 0 && gamePhase === 'selection') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">No cards in your collection</h2>
          <p className="text-gray-400 font-body mb-6">Open some packs first to get cards for battle</p>
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
        {/* Header */}
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
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 cursor-pointer hover:from-blue-500/30 hover:to-cyan-500/30 transition-all">
                <span className="text-sm text-blue-400 font-body font-semibold flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  PvP Battle
                </span>
              </div>
            </Link>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">Card Battle</h1>
          <p className="text-xl text-gray-300 font-body">
            {gamePhase === 'selection' && 'Select 5 cards to start'}
            {gamePhase === 'battle' && `Round ${currentRound} of ${totalRounds}`}
            {gamePhase === 'result' && 'Battle Complete!'}
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400 font-body">{error}</p>
          </div>
        )}

        {/* SELECTION PHASE */}
        {gamePhase === 'selection' && (
          <>
            <div className="glass rounded-2xl p-6 mb-8">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {mySquad.map((player, index) => (
                  <motion.div
                    key={player.userCardId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => removeFromSquad(player)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center p-2">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">{player.name.split(' ').map((n: string) => n[0]).join('')}</span>
                        </div>
                        <p className="text-sm font-display font-bold text-white">{player.name}</p>
                        <p className="text-xs text-gray-400 font-body">{player.role}</p>
                        <p className="text-lg font-display font-bold text-amber-400">{player.overall}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {Array.from({ length: 5 - mySquad.length }).map((_, i) => (
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
                  onClick={startBattle}
                  disabled={mySquad.length !== 5}
                  className={`px-10 py-4 rounded-xl font-display font-bold text-lg shadow-2xl transition-all flex items-center space-x-2 mx-auto ${
                    mySquad.length === 5
                      ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/50 hover:shadow-red-500/70'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Swords className="w-5 h-5" />
                  <span>Start Battle</span>
                </motion.button>
                {mySquad.length !== 5 && (
                  <p className="text-sm text-gray-400 font-body mt-3">
                    Select {5 - mySquad.length} more card{5 - mySquad.length !== 1 ? 's' : ''} to start
                  </p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-2xl font-display font-bold text-white mb-6">Your Cards</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableCards.slice(0, 24).map((card: any, index: number) => {
                  const isInSquad = mySquad.some(c => c.userCardId === card._id);
                  return (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => !isInSquad && addToSquad(card)}
                      className={`cursor-pointer ${isInSquad ? 'opacity-40' : ''}`}
                    >
                      <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center p-2 hover:border-amber-500/50 transition-all">
                        <div className="text-center">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                            card.cardRarity === 'Legend' ? 'from-amber-400 to-orange-600' :
                            card.cardRarity === 'Epic' ? 'from-purple-500 to-purple-700' :
                            card.cardRarity === 'Rare' ? 'from-blue-500 to-blue-700' :
                            'from-gray-500 to-gray-700'
                          } flex items-center justify-center mx-auto mb-2`}>
                            <span className="text-white font-bold text-sm">
                              {(card.cardName || card.card?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <p className="text-xs font-display font-bold text-white truncate">{card.cardName || card.card?.name}</p>
                          <p className="text-xs text-gray-400 font-body">{card.card?.role || ''}</p>
                          <p className="text-sm font-display font-bold text-amber-400">{card.overall}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* BATTLE PHASE */}
        {gamePhase === 'battle' && (
          <div>
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Your Score</p>
                  <div className="text-5xl font-display font-black text-blue-400">{playerScore}</div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-amber-400 font-body mb-2">Round {currentRound}/{totalRounds}</p>
                  <Swords className="w-12 h-12 text-amber-400 mx-auto" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Computer Score</p>
                  <div className="text-5xl font-display font-black text-red-400">{computerScore}</div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Your Hand ({playerHand.length} cards)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {playerHand.map((card) => {
                    const isSelected = selectedPlayerCard?.userCardId === card.userCardId;
                    const isDisabled = battleState !== 'choosing';
                    return (
                      <motion.div
                        key={card.userCardId}
                        whileHover={!isDisabled ? { scale: 1.05, y: -10 } : {}}
                        onClick={() => handlePlayerCardClick(card)}
                        className={`${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                          isSelected ? 'ring-4 ring-blue-500 rounded-2xl' : ''
                        }`}
                      >
                        <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center p-2">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold text-sm">{card.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <p className="text-xs font-display font-bold text-white">{card.name}</p>
                            <p className="text-xs text-gray-400 font-body">{card.role}</p>
                            <p className="text-xl font-display font-bold text-amber-400">{getCardMainStat(card)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {battleState === 'choosing' && (
                  <p className="text-center text-amber-400 font-body mt-4 text-sm">Click a card to play this round</p>
                )}
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-3">
                    <Swords className="w-4 h-4 text-white" />
                  </div>
                  Computer Hand ({aiHand.length} cards)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {aiHand.map((card, index) => {
                    const isRevealed = selectedComputerCard?.name === card.name;
                    return (
                      <motion.div
                        key={index}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: isRevealed ? 360 : 0 }}
                        transition={{ duration: 0.6 }}
                        className={isRevealed ? 'ring-4 ring-red-500 rounded-2xl' : ''}
                      >
                        {isRevealed ? (
                          <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 flex items-center justify-center p-2">
                            <div className="text-center">
                              <p className="text-xs font-display font-bold text-white">{selectedComputerCard?.name}</p>
                              <p className="text-xl font-display font-bold text-red-400">{selectedComputerCard?.stat}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-500/30 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                                <Swords className="w-8 h-8 text-red-400" />
                              </div>
                              <p className="text-xs text-gray-500 font-body">Hidden</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {battleState === 'roundResult' && selectedPlayerCard && selectedComputerCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass rounded-2xl p-8 mb-8"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-display font-bold text-white mb-4">{getRoundWinnerText()}</h3>
                    <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-6">
                      <div>
                        <p className="text-sm text-gray-400 font-body mb-2">Your Card</p>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <p className="text-lg font-display font-bold text-white">{selectedPlayerCard.name}</p>
                          <p className="text-sm text-gray-400 font-body">{selectedPlayerCard.role}</p>
                          <p className="text-2xl font-display font-black text-blue-400 mt-2">{getCardMainStat(selectedPlayerCard)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-body mb-2">Computer Card</p>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                          <p className="text-lg font-display font-bold text-white">{selectedComputerCard.name}</p>
                          <p className="text-2xl font-display font-black text-red-400 mt-2">{selectedComputerCard.stat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={nextRound}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all flex items-center space-x-2 mx-auto"
                    >
                      <span>{currentRound < totalRounds ? 'Next Round' : 'View Results'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {roundHistory.length > 0 && battleState !== 'roundResult' && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4">Round History</h3>
                <div className="space-y-2">
                  {roundHistory.map((round, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-400 font-body">Round {index + 1}</span>
                      <span className="text-sm font-body">
                        <span className="text-blue-400">{round.playerCard.name}</span>
                        {' vs '}
                        <span className="text-red-400">{round.computerCard.name}</span>
                      </span>
                      <span className={`text-sm font-display font-bold ${
                        round.winner === 'player' ? 'text-green-400' :
                        round.winner === 'computer' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {round.winner === 'player' ? 'You Won' : round.winner === 'computer' ? 'Computer Won' : 'Tie'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT PHASE */}
        {gamePhase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className={`text-center mb-12 py-16 rounded-3xl ${
              gameWinner === 'player'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                : gameWinner === 'computer'
                ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50'
            }`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {gameWinner === 'player' ? (
                  <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6" />
                ) : gameWinner === 'computer' ? (
                  <Swords className="w-24 h-24 text-red-400 mx-auto mb-6" />
                ) : (
                  <Zap className="w-24 h-24 text-amber-400 mx-auto mb-6" />
                )}
              </motion.div>
              
              <h2 className="text-5xl font-display font-black mb-4">
                <span className={
                  gameWinner === 'player' ? 'text-green-400' :
                  gameWinner === 'computer' ? 'text-red-400' : 'text-amber-400'
                }>
                  {gameWinner === 'player' ? 'VICTORY!' : gameWinner === 'computer' ? 'DEFEAT!' : "IT'S A TIE!"}
                </span>
              </h2>
              
              <div className="flex items-center justify-center space-x-8 text-4xl font-display font-bold">
                <span className="text-blue-400">{playerScore}</span>
                <span className="text-gray-500">-</span>
                <span className="text-red-400">{computerScore}</span>
              </div>
              
              {trophiesEarned > 0 && (
                <div className="mt-6 flex items-center justify-center space-x-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span className="text-2xl font-display font-bold text-amber-400">+{trophiesEarned} Trophies</span>
                </div>
              )}
              {xpEarned > 0 && (
                <p className="text-lg text-amber-400/80 font-display font-bold mt-1">+{xpEarned} XP</p>
              )}
            </div>

            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-display font-bold text-white mb-4">Match Summary</h3>
              <div className="space-y-3">
                {roundHistory.map((round, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-amber-400 font-body font-semibold">Round {index + 1}</span>
                      <span className={`text-sm font-display font-bold ${
                        round.winner === 'player' ? 'text-green-400' :
                        round.winner === 'computer' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {round.winner === 'player' ? 'You Won' : round.winner === 'computer' ? 'Computer Won' : 'Tie'}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-body">{round.playerCard.name}</span>
                        <span className="text-white font-display font-bold">{round.playerStat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-body">{round.computerCard.name}</span>
                        <span className="text-white font-display font-bold">{round.computerStat}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 transition-all flex items-center space-x-2"
              >
                <Swords className="w-5 h-5" />
                <span>New Battle</span>
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
      </div>
    </div>
  );
}
