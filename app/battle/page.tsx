"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Users, ChevronRight, Star, ArrowRight } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { players } from '@/data/mockData';

type GamePhase = 'selection' | 'battle' | 'result';
type BattleState = 'choosing' | 'revealing' | 'roundResult' | 'nextRound';

interface RoundResult {
  playerCard: typeof players[0];
  computerCard: typeof players[0];
  winner: 'player' | 'computer' | 'tie';
  playerStat: number;
  computerStat: number;
}

export default function BattlePage() {
  // Squad selection state
  const [mySquad, setMySquad] = useState<typeof players>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>('selection');
  
  // Battle state
  const [playerHand, setPlayerHand] = useState<typeof players>([]);
  const [computerHand, setComputerHand] = useState<typeof players>([]);
  const [battleState, setBattleState] = useState<BattleState>('choosing');
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<typeof players[0] | null>(null);
  const [selectedComputerCard, setSelectedComputerCard] = useState<typeof players[0] | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [gameWinner, setGameWinner] = useState<'player' | 'computer' | 'tie' | null>(null);

  const availablePlayers = players.filter(p => !mySquad.includes(p));

  const addToSquad = (player: typeof players[0]) => {
    if (mySquad.length < 5) {
      setMySquad([...mySquad, player]);
    }
  };

  const removeFromSquad = (player: typeof players[0]) => {
    setMySquad(mySquad.filter(p => p.id !== player.id));
  };

  // Get card's main stat based on role
  const getCardMainStat = (player: typeof players[0]): number => {
    if (player.role === 'Batsman' || player.role === 'Wicketkeeper-Batsman') {
      return player.batting;
    } else if (player.role === 'Bowler') {
      return player.bowling;
    } else {
      // All-rounder: average of batting and bowling
      return Math.round((player.batting + player.bowling) / 2);
    }
  };

  // Intelligent AI card selection
  const selectComputerCard = (playerCard: typeof players[0]): typeof players[0] => {
    const playerStat = getCardMainStat(playerCard);
    
    // Sort computer's remaining cards by their main stat
    const sortedHand = [...computerHand].sort((a, b) => getCardMainStat(a) - getCardMainStat(b));
    
    // Find cards that can beat the player's card
    const winningCards = sortedHand.filter(card => getCardMainStat(card) > playerStat);
    
    if (winningCards.length > 0) {
      // Strategy: Use the weakest card that can still win
      return winningCards[0];
    } else {
      // Strategy: Sacrifice the weakest card (can't win anyway)
      return sortedHand[0];
    }
  };

  const startBattle = () => {
    // Shuffle and deal 5 cards to each player
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const playerCards = shuffled.slice(0, 5);
    const computerCards = shuffled.slice(5, 10);
    
    setPlayerHand(playerCards);
    setComputerHand(computerCards);
    setGamePhase('battle');
    setCurrentRound(1);
    setPlayerScore(0);
    setComputerScore(0);
    setRoundHistory([]);
    setBattleState('choosing');
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    setGameWinner(null);
  };

  const handlePlayerCardClick = (card: typeof players[0]) => {
    if (battleState !== 'choosing') return;
    
    setSelectedPlayerCard(card);
    setBattleState('revealing');
    
    // AI selects card
    const aiCard = selectComputerCard(card);
    
    // Reveal computer card after delay
    setTimeout(() => {
      setSelectedComputerCard(aiCard);
      
      // Determine round winner
      setTimeout(() => {
        const playerStat = getCardMainStat(card);
        const computerStat = getCardMainStat(aiCard);
        
        let winner: 'player' | 'computer' | 'tie';
        if (playerStat > computerStat) {
          winner = 'player';
          setPlayerScore(prev => prev + 1);
        } else if (computerStat > playerStat) {
          winner = 'computer';
          setComputerScore(prev => prev + 1);
        } else {
          winner = 'tie';
        }
        
        const roundResult: RoundResult = {
          playerCard: card,
          computerCard: aiCard,
          winner,
          playerStat,
          computerStat
        };
        
        setRoundHistory(prev => [...prev, roundResult]);
        setBattleState('roundResult');
      }, 1000);
    }, 800);
  };

  const nextRound = () => {
    // Remove played cards from hands
    setPlayerHand(prev => prev.filter(c => c.id !== selectedPlayerCard?.id));
    setComputerHand(prev => prev.filter(c => c.id !== selectedComputerCard?.id));
    
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    
    if (currentRound < 5) {
      setCurrentRound(prev => prev + 1);
      setBattleState('choosing');
    } else {
      // Game over
      endGame();
    }
  };

  const endGame = () => {
    if (playerScore > computerScore) {
      setGameWinner('player');
    } else if (computerScore > playerScore) {
      setGameWinner('computer');
    } else {
      setGameWinner('tie');
    }
    setGamePhase('result');
  };

  const resetGame = () => {
    setMySquad([]);
    setGamePhase('selection');
    setPlayerHand([]);
    setComputerHand([]);
    setBattleState('choosing');
    setCurrentRound(1);
    setPlayerScore(0);
    setComputerScore(0);
    setSelectedPlayerCard(null);
    setSelectedComputerCard(null);
    setRoundHistory([]);
    setGameWinner(null);
  };

  const getRoundWinnerText = () => {
    if (!selectedPlayerCard || !selectedComputerCard) return '';
    
    const lastRound = roundHistory[roundHistory.length - 1];
    if (!lastRound) return '';
    
    if (lastRound.winner === 'player') {
      return `You Win! ${lastRound.playerStat} > ${lastRound.computerStat}`;
    } else if (lastRound.winner === 'computer') {
      return `Computer Wins! ${lastRound.computerStat} > ${lastRound.playerStat}`;
    } else {
      return `It's a Tie! ${lastRound.playerStat} = ${lastRound.computerStat}`;
    }
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
            <span className="text-sm text-red-400 font-body font-semibold">Turn-Based Battle Arena</span>
          </motion.div>
          
          <h1 className="text-5xl font-display font-black gradient-text mb-4">
            Card Battle
          </h1>
          <p className="text-xl text-gray-300 font-body">
            {gamePhase === 'selection' && 'Select 5 cards to start'}
            {gamePhase === 'battle' && `Round ${currentRound} of 5`}
            {gamePhase === 'result' && 'Battle Complete!'}
          </p>
        </div>

        {/* SELECTION PHASE */}
        {gamePhase === 'selection' && (
          <>
            {/* Squad Selection */}
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
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => removeFromSquad(player)}
                    className="cursor-pointer"
                  >
                    <PlayerCard player={player} className="max-w-[200px]" />
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

              {/* Start Battle Button */}
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
        )}

        {/* BATTLE PHASE */}
        {gamePhase === 'battle' && (
          <div>
            {/* Scoreboard */}
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Your Score</p>
                  <div className="text-5xl font-display font-black text-blue-400">{playerScore}</div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-amber-400 font-body mb-2">Round {currentRound}/5</p>
                  <Swords className="w-12 h-12 text-amber-400 mx-auto" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-body mb-2">Computer Score</p>
                  <div className="text-5xl font-display font-black text-red-400">{computerScore}</div>
                </div>
              </div>
            </div>

            {/* Battle Area */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Player Hand */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Your Hand ({playerHand.length} cards)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {playerHand.map((card) => {
                    const isSelected = selectedPlayerCard?.id === card.id;
                    const isDisabled = battleState !== 'choosing';
                    
                    return (
                      <motion.div
                        key={card.id}
                        whileHover={!isDisabled ? { scale: 1.05, y: -10 } : {}}
                        onClick={() => handlePlayerCardClick(card)}
                        className={`${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                          isSelected ? 'ring-4 ring-blue-500 rounded-2xl' : ''
                        }`}
                      >
                        <PlayerCard player={card} className="max-w-[180px]" />
                      </motion.div>
                    );
                  })}
                </div>
                
                {battleState === 'choosing' && (
                  <p className="text-center text-amber-400 font-body mt-4 text-sm">
                    👆 Click a card to play this round
                  </p>
                )}
              </div>

              {/* Computer Hand */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-3">
                    <Swords className="w-4 h-4 text-white" />
                  </div>
                  Computer Hand ({computerHand.length} cards)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {computerHand.map((card, index) => {
                    const isRevealed = selectedComputerCard?.id === card.id;
                    
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: isRevealed ? 360 : 0 }}
                        transition={{ duration: 0.6 }}
                        className={isRevealed ? 'ring-4 ring-red-500 rounded-2xl' : ''}
                      >
                        {isRevealed ? (
                          <PlayerCard player={card} className="max-w-[180px]" />
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

            {/* Round Result Display */}
            <AnimatePresence>
              {battleState === 'roundResult' && selectedPlayerCard && selectedComputerCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass rounded-2xl p-8 mb-8"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-display font-bold text-white mb-4">
                      {getRoundWinnerText()}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-6">
                      <div>
                        <p className="text-sm text-gray-400 font-body mb-2">Your Card</p>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <p className="text-lg font-display font-bold text-white">{selectedPlayerCard.name}</p>
                          <p className="text-sm text-gray-400 font-body">{selectedPlayerCard.role}</p>
                          <p className="text-2xl font-display font-black text-blue-400 mt-2">
                            {getCardMainStat(selectedPlayerCard)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 font-body mb-2">Computer Card</p>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                          <p className="text-lg font-display font-bold text-white">{selectedComputerCard.name}</p>
                          <p className="text-sm text-gray-400 font-body">{selectedComputerCard.role}</p>
                          <p className="text-2xl font-display font-black text-red-400 mt-2">
                            {getCardMainStat(selectedComputerCard)}
                          </p>
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
                      <span>{currentRound < 5 ? 'Next Round' : 'View Results'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Round History */}
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
                        round.winner === 'computer' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {round.winner === 'player' ? 'You Won' :
                         round.winner === 'computer' ? 'Computer Won' :
                         'Tie'}
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
            {/* Final Result Banner */}
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
                  gameWinner === 'computer' ? 'text-red-400' :
                  'text-amber-400'
                }>
                  {gameWinner === 'player' ? 'VICTORY!' :
                   gameWinner === 'computer' ? 'DEFEAT!' :
                   "IT'S A TIE!"}
                </span>
              </h2>
              
              <div className="flex items-center justify-center space-x-8 text-4xl font-display font-bold">
                <span className="text-blue-400">{playerScore}</span>
                <span className="text-gray-500">-</span>
                <span className="text-red-400">{computerScore}</span>
              </div>
              
              {gameWinner === 'player' && (
                <div className="mt-6 flex items-center justify-center space-x-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span className="text-2xl font-display font-bold text-amber-400">
                    +{25 + playerScore * 5} Trophies
                  </span>
                </div>
              )}
            </div>

            {/* Match Summary */}
            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-display font-bold text-white mb-4">Match Summary</h3>
              <div className="space-y-3">
                {roundHistory.map((round, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-amber-400 font-body font-semibold">Round {index + 1}</span>
                      <span className={`text-sm font-display font-bold ${
                        round.winner === 'player' ? 'text-green-400' :
                        round.winner === 'computer' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {round.winner === 'player' ? '✓ You Won' :
                         round.winner === 'computer' ? '✗ Computer Won' :
                         '= Tie'}
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

            {/* Actions */}
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