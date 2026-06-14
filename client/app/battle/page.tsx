"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Users, ChevronRight, ArrowRight, Loader2, AlertCircle, Wifi } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { useAuth } from '@/lib/auth-context';
import { battlesApi, userCardsApi } from '@/lib/api';
import Link from 'next/link';

type GamePhase = 'selection' | 'battle' | 'result';

// Battle state flow (PvE): 'computer-choosing' → 'choosing' → 'revealing' → 'roundResult'
type BattleState = 'computer-choosing' | 'choosing' | 'revealing' | 'roundResult';

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

interface BattleCard {
  userCardId: string;
  cardId: string;
  name: string;
  role: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
  overall: number;
  stat?: number;
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
  const [cardSearch, setCardSearch] = useState('');
  const [cardRarityFilter, setCardRarityFilter] = useState('All');

  // Battle state
  const [battleId, setBattleId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<BattleCard[]>([]);
  const [aiHand, setAiHand] = useState<any[]>([]);
  const [attributeOrder, setAttributeOrder] = useState<string[]>([]);
  const [currentAttribute, setCurrentAttribute] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [battleState, setBattleState] = useState<BattleState>('choosing');
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<BattleCard | null>(null);
  const [selectedComputerCard, setSelectedComputerCard] = useState<{ name: string; stat: number } | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [trophiesEarned, setTrophiesEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!user) {
      setLoadingCards(false);
      return;
    }
    async function fetchCards() {
      try {
        // Fetch all cards — get first page to know total, then fetch all at once
        const first = await userCardsApi.getMyCards({ limit: '100', sort: 'overall', page: '1' });
        const total = first.pagination?.total || first.cards?.length || 0;

        if (total <= 100) {
          setAvailableCards(first.cards || []);
        } else {
          // Fetch remaining pages in parallel
          const totalPages = Math.ceil(total / 100);
          const pageRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
            userCardsApi.getMyCards({ limit: '100', sort: 'overall', page: String(i + 2) })
          );
          const rest = await Promise.all(pageRequests);
          const allCards = [
            ...(first.cards || []),
            ...rest.flatMap(r => r.cards || []),
          ];
          setAvailableCards(allCards);
        }
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
      // cardId is the composite "playerId_index" key from the collection API.
      // Fall back to _id if cardId is missing (edge case).
      const userCardId = card.cardId || card._id;
      setMySquad([...mySquad, {
        userCardId,
        cardId: card._id,
        name: card.name,
        role: card.role,
        batting: card.batting,
        bowling: card.bowling,
        fielding: card.fielding,
        captaincy: card.captaincy ?? 70,
        pressure: card.pressure ?? 80,
        overall: card.overall,
      }]);
    }
  };

  const removeFromSquad = (card: BattleCard) => {
    setMySquad(mySquad.filter(c => c.userCardId !== card.userCardId));
  };

  const getCardMainStat = (card: BattleCard): number => {
    if (card.stat !== undefined) return card.stat;
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
      setAiHand(data.aiCards || []);
      setAttributeOrder(data.attributeOrder);
      setCurrentAttribute(data.attributeOrder?.[0] || 'batting');
      setCurrentRound(data.currentRound + 1);
      setTotalRounds(data.totalRounds);
      setPlayerScore(0);
      setComputerScore(0);
      setRoundHistory([]);
      // PvE: computer "picks" first — show a brief thinking phase then let player choose
      setBattleState('computer-choosing');
      setSelectedPlayerCard(null);
      setSelectedComputerCard(null);
      setGameWinner(null);
      setGamePhase('battle');
      setTimeout(() => setBattleState('choosing'), 1800);
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
            setCoinsEarned(data.coinsEarned ?? 0);
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
    const nextAiHand = aiHand.filter(c => c.name !== selectedComputerCard?.name);

    setAiHand(nextAiHand);
    setPlayerHand(prev => prev.filter(c => c.userCardId !== selectedPlayerCard?.userCardId));
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    const nextRoundNum = currentRound + 1;
    setCurrentRound(nextRoundNum);
    setCurrentAttribute(attributeOrder[nextRoundNum - 1] || 'batting');
    // PvE: computer picks first each round
    setBattleState('computer-choosing');
    setTimeout(() => setBattleState('choosing'), 1800);
  };

  const resetGame = () => {
    setMySquad([]);
    setGamePhase('selection');
    setBattleId(null);
    setPlayerHand([]);
    setAiHand([]);
    setAttributeOrder([]);
    setCurrentAttribute('');
    setBattleState('choosing');
    setCurrentRound(1);
    setPlayerScore(0);
    setComputerScore(0);
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    setRoundHistory([]);
    setGameWinner(null);
    setTrophiesEarned(0);
    setCoinsEarned(0);
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
                    key={player.userCardId + index}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">Your Cards</h3>
                  <p className="text-sm text-gray-400 font-body mt-0.5">{availableCards.length} cards · click to add to squad</p>
                </div>
                {/* Search + filter */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={cardSearch}
                    onChange={e => setCardSearch(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 font-body text-sm w-full sm:w-48"
                  />
                  <select
                    value={cardRarityFilter}
                    onChange={e => setCardRarityFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="All" className="bg-gray-900">All</option>
                    <option value="Legend" className="bg-gray-900">Legend</option>
                    <option value="Epic" className="bg-gray-900">Epic</option>
                    <option value="Rare" className="bg-gray-900">Rare</option>
                    <option value="Common" className="bg-gray-900">Common</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {availableCards
                  .filter((card: any) => {
                    const matchSearch = !cardSearch || card.name?.toLowerCase().includes(cardSearch.toLowerCase());
                    const matchRarity = cardRarityFilter === 'All' || card.rarity === cardRarityFilter;
                    return matchSearch && matchRarity;
                  })
                  .map((card: any, index: number) => {
                    const isInSquad = mySquad.some(c => c.userCardId === (card.cardId || card._id));
                    return (
                      <motion.div
                        key={card.cardId || card._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5) }}
                        onClick={() => !isInSquad && addToSquad(card)}
                        className={`relative transition-all ${
                          isInSquad
                            ? 'opacity-30 cursor-not-allowed'
                            : 'cursor-pointer hover:scale-[1.03] hover:-translate-y-1'
                        }`}
                      >
                        <PlayerCard
                          player={{
                            _id: card._id,
                            name: card.name,
                            role: card.role,
                            country: card.country,
                            batting: card.batting,
                            bowling: card.bowling,
                            fielding: card.fielding,
                            captaincy: card.captaincy,
                            pressure: card.pressure,
                            overall: card.overall,
                            specialty: card.specialty,
                            rarity: card.rarity,
                            image: card.image,
                            formats: card.formats,
                          }}
                        />
                        {/* Selected checkmark */}
                        {isInSquad && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">✓</span>
                            </div>
                          </div>
                        )}
                        {/* Tap to add hint on hover */}
                        {!isInSquad && mySquad.length < 5 && (
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-amber-500/90 rounded-lg py-1 text-center text-xs font-display font-bold text-white">
                              + Add to Squad
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
              {availableCards.filter((card: any) => {
                const matchSearch = !cardSearch || card.name?.toLowerCase().includes(cardSearch.toLowerCase());
                const matchRarity = cardRarityFilter === 'All' || card.rarity === cardRarityFilter;
                return matchSearch && matchRarity;
              }).length === 0 && (
                <p className="text-center text-gray-500 font-body py-8">No cards match your filters</p>
              )}
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
                  {currentAttribute && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block border ${ATTRIBUTE_COLORS[currentAttribute] || 'text-amber-400 border-amber-500/50 bg-amber-500/10'}`}>
                      {ATTRIBUTE_LABELS[currentAttribute] || currentAttribute}
                    </div>
                  )}
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
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {playerHand.map((card) => {
                    const isSelected = selectedPlayerCard?.userCardId === card.userCardId;
                    // Cards are disabled except during the choosing phase
                    const isDisabled = battleState !== 'choosing';
                    const attrIcons: Record<string, string> = { batting: 'text-amber-400', bowling: 'text-blue-400', fielding: 'text-green-400', captaincy: 'text-purple-400', pressure: 'text-red-400' };
                    // Stats only revealed on the played card after the round result arrives
                    const showStats = battleState === 'roundResult' && isSelected;
                    return (
                      <motion.div
                        key={card.userCardId}
                        whileHover={!isDisabled ? { scale: 1.05, y: -10 } : {}}
                        onClick={() => handlePlayerCardClick(card)}
                        className={`${isDisabled && battleState !== 'roundResult' ? 'opacity-60 cursor-not-allowed' : isDisabled ? 'cursor-default' : 'cursor-pointer'} ${
                          isSelected ? 'ring-4 ring-blue-500 rounded-2xl' : ''
                        }`}
                      >
                        <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex flex-col items-center justify-center p-1.5 gap-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto">
                            <span className="text-white font-bold text-xs">{card.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <p className="text-[10px] font-display font-bold text-white leading-tight text-center">{card.name}</p>
                          <p className="text-[9px] text-gray-400 font-body">{card.role}</p>
                          <div className={`px-1.5 py-0.5 rounded text-[9px] font-display font-bold ${ATTRIBUTE_COLORS[currentAttribute]?.split(' ')[0] || 'text-amber-400'}`}>
                            OVR {card.overall}
                          </div>
                          {/* Stats grid — hidden until post-round reveal */}
                          <div className="grid grid-cols-5 gap-0.5 w-full px-0.5 mt-0.5">
                            {ATTRIBUTES.map((attr) => {
                              const val = (card as any)[attr] ?? 80;
                              const isActive = attr === currentAttribute;
                              return showStats ? (
                                <div key={attr} className={`flex flex-col items-center rounded ${isActive ? 'bg-white/20 ring-1 ring-white/40' : 'bg-white/5'}`}>
                                  <span className={`text-[7px] font-body ${attrIcons[attr] || 'text-gray-400'}`}>{attr === 'captaincy' ? 'CAP' : attr === 'pressure' ? 'PRE' : attr.slice(0, 3).toUpperCase()}</span>
                                  <span className={`text-[10px] font-display font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{val}</span>
                                </div>
                              ) : (
                                <div key={attr} className="flex flex-col items-center rounded bg-white/5">
                                  <span className={`text-[7px] font-body ${attrIcons[attr] || 'text-gray-400'}`}>{attr === 'captaincy' ? 'CAP' : attr === 'pressure' ? 'PRE' : attr.slice(0, 3).toUpperCase()}</span>
                                  <span className="text-[10px] font-display font-bold text-gray-600">??</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {battleState === 'computer-choosing' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-center text-red-400 font-body mt-4 text-sm"
                  >
                    🤖 Computer is choosing its card...
                  </motion.p>
                )}
                {battleState === 'choosing' && (
                  <p className="text-center text-amber-400 font-body mt-4 text-sm animate-pulse">
                    ✅ Computer has chosen — now pick your card!
                  </p>
                )}
