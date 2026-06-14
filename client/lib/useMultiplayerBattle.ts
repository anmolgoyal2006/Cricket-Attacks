'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from './socket';

export interface PvPCard {
  userCardId: string;
  name: string;
  role: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
}

export interface RoundResult {
  roundNumber: number;
  player1Card: { name: string; stat: number };
  player2Card: { name: string; stat: number };
  winner: 'player1' | 'player2' | 'tie';
  player1Score: number;
  player2Score: number;
  attribute: string;
}

export interface OpponentInfo {
  username: string;
  userId: string;
}

export type BattleStatus =
  | 'idle'
  | 'matchmaking'
  | 'countdown'
  | 'playing'
  | 'roundResult'
  | 'finished'
  | 'disconnected';

export interface BattleRewards {
  coins: number;
  xp: number;
  trophies: number;
}

export function useMultiplayerBattle() {
  const [status, setStatus] = useState<BattleStatus>('idle');
  const [battleId, setBattleId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentAttribute, setCurrentAttribute] = useState('');
  const [attributeOrder, setAttributeOrder] = useState<string[]>([]);
  const [myCards, setMyCards] = useState<PvPCard[]>([]);
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [rewards, setRewards] = useState<BattleRewards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Turn-based state
  // true  = it is my turn to pick this round (picker first, then responder)
  const [isMyTurn, setIsMyTurn] = useState(false);
  // Name + role of the card the opponent (picker) already chose — shown to responder only
  const [opponentPickedCard, setOpponentPickedCard] = useState<{ cardName: string; cardRole: string } | null>(null);

  const statusRef = useRef(status);
  statusRef.current = status;

  const attributeOrderRef = useRef(attributeOrder);
  attributeOrderRef.current = attributeOrder;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('cooldowns:get');

    const handleWaiting = (data: { position: number; queueSize: number }) => {
      setQueuePosition(data.position);
      setQueueSize(data.queueSize);
    };

    const handleFound = (data: { battleId: string; opponent1: OpponentInfo; opponent2: OpponentInfo }) => {
      if (statusRef.current === 'matchmaking') {
        setBattleId(data.battleId);
        setStatus('countdown');
        setCountdown(3);
        setRoundHistory([]);
        setMyScore(0);
        setOpponentScore(0);
        setUsedCardIds(new Set());
        setCurrentRoundResult(null);
        setWinner(null);
        setRewards(null);
        setOpponentPickedCard(null);
      }
    };

    const handleCountdown = (data: { seconds: number }) => {
      setCountdown(data.seconds);
    };

    const handleBattleStart = (data: {
      battleId: string;
      round: number;
      totalRounds: number;
      attribute?: string;
      attributeOrder?: string[];
      yourTurn: boolean;
      opponentPickedCard: { cardName: string; cardRole: string } | null;
    }) => {
      setBattleId(data.battleId);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setCurrentAttribute(data.attribute || 'batting');
      setAttributeOrder(data.attributeOrder || []);
      setIsMyTurn(data.yourTurn);
      setOpponentPickedCard(data.opponentPickedCard);
      setStatus('playing');
      setCountdown(0);
    };

    const handleRoundStart = (data: {
      round: number;
      totalRounds: number;
      attribute?: string;
      yourTurn: boolean;
      opponentPickedCard: { cardName: string; cardRole: string } | null;
    }) => {
      setRound(data.round);
      setCurrentAttribute(data.attribute || (attributeOrderRef.current[data.round - 1] || 'batting'));
      setIsMyTurn(data.yourTurn);
      setOpponentPickedCard(data.opponentPickedCard);
      setCurrentRoundResult(null);
      setAutoSelected(false);
      setStatus('playing');
    };

    // Sent only to the responder once the picker has chosen
    const handlePickerChose = (data: { cardName: string; cardRole: string }) => {
      setOpponentPickedCard(data);
      setIsMyTurn(true); // now the responder's turn to pick
    };

    const handleRoundResult = (data: RoundResult) => {
      setMyScore(data.player1Score);
      setOpponentScore(data.player2Score);
      setCurrentAttribute(data.attribute || 'batting');
      setCurrentRoundResult(data);
      setRoundHistory((prev) => [...prev, data]);
      setOpponentPickedCard(null);
      setStatus('roundResult');
    };

    const handleAutoSelected = (data: { card: PvPCard }) => {
      setAutoSelected(true);
      setUsedCardIds((prev) => new Set(prev).add(data.card.userCardId));
    };

    const handleBattleOver = (data: {
      winner: string;
      player1Score: number;
      player2Score: number;
      player1Rewards: BattleRewards;
      player2Rewards: BattleRewards;
      roundHistory: RoundResult[];
    }) => {
      setMyScore(data.player1Score);
      setOpponentScore(data.player2Score);
      setRoundHistory(data.roundHistory);
      setWinner(data.winner);
      setRewards(data.player1Rewards);
      setStatus('finished');
      socket.emit('cooldowns:get');
    };

    const handleOpponentDisconnected = () => {
      setStatus('disconnected');
    };

    const handleOpponentReconnected = () => {
      setStatus('playing');
    };

    const handleOpponentForfeit = (data: { winner: string; reason: string }) => {
      setWinner(data.winner);
      setStatus('finished');
      setRewards({ coins: 100, xp: 50, trophies: 20 });
      socket.emit('cooldowns:get');
    };

    const handleReconnected = (data: {
      battleId: string;
      round: number;
      totalRounds: number;
      attribute?: string;
      attributeOrder?: string[];
      player1Score: number;
      player2Score: number;
      roundHistory: RoundResult[];
      status: string;
      yourCards: PvPCard[];
      usedCardIds: string[];
      yourTurn: boolean;
      opponentPickedCard: { cardName: string; cardRole: string } | null;
    }) => {
      setBattleId(data.battleId);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setCurrentAttribute(data.attribute || (data.attributeOrder || [])[data.round - 1] || 'batting');
      setAttributeOrder(data.attributeOrder || []);
      setMyScore(data.player1Score);
      setOpponentScore(data.player2Score);
      setRoundHistory(data.roundHistory);
      setMyCards(data.yourCards);
      setUsedCardIds(new Set(data.usedCardIds));
      setIsMyTurn(data.yourTurn);
      setOpponentPickedCard(data.opponentPickedCard);
      if (data.status === 'completed') {
        setStatus('finished');
      } else {
        setStatus('playing');
      }
    };

    const handleCooldownsUpdate = (data: { cooldowns: Record<string, number> }) => {
      setCooldowns(data.cooldowns);
    };

    const handleCooldownError = (data: {
      message: string;
      cooldowns: Record<string, number>;
      cooledCardIds: string[];
    }) => {
      setError(data.message);
      setCooldowns(data.cooldowns);
      setStatus('idle');
      setTimeout(() => setError(null), 6000);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    socket.on('matchmaking:waiting', handleWaiting);
    socket.on('matchmaking:found', handleFound);
    socket.on('matchmaking:cooldown-error', handleCooldownError);
    socket.on('battle:countdown', handleCountdown);
    socket.on('battle:start', handleBattleStart);
    socket.on('battle:round-start', handleRoundStart);
    socket.on('battle:picker-chose', handlePickerChose);
    socket.on('battle:round-result', handleRoundResult);
    socket.on('battle:auto-selected', handleAutoSelected);
    socket.on('battle:over', handleBattleOver);
    socket.on('battle:opponent-disconnected', handleOpponentDisconnected);
    socket.on('battle:opponent-reconnected', handleOpponentReconnected);
    socket.on('battle:opponent-forfeit', handleOpponentForfeit);
    socket.on('battle:reconnected', handleReconnected);
    socket.on('cooldowns:update', handleCooldownsUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('matchmaking:waiting', handleWaiting);
      socket.off('matchmaking:found', handleFound);
      socket.off('matchmaking:cooldown-error', handleCooldownError);
      socket.off('battle:countdown', handleCountdown);
      socket.off('battle:start', handleBattleStart);
      socket.off('battle:round-start', handleRoundStart);
      socket.off('battle:picker-chose', handlePickerChose);
      socket.off('battle:round-result', handleRoundResult);
      socket.off('battle:auto-selected', handleAutoSelected);
      socket.off('battle:over', handleBattleOver);
      socket.off('battle:opponent-disconnected', handleOpponentDisconnected);
      socket.off('battle:opponent-reconnected', handleOpponentReconnected);
      socket.off('battle:opponent-forfeit', handleOpponentForfeit);
      socket.off('battle:reconnected', handleReconnected);
      socket.off('cooldowns:update', handleCooldownsUpdate);
      socket.off('error', handleError);
    };
  }, []);

  const joinMatchmaking = useCallback((squad: PvPCard[]) => {
    const socket = getSocket();
    if (!socket) return;
    setMyCards(squad);
    setStatus('matchmaking');
    setQueuePosition(0);
    setQueueSize(0);
    setError(null);
    socket.emit('matchmaking:join', { squad });
  }, []);

  const leaveMatchmaking = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('matchmaking:leave');
    setStatus('idle');
  }, []);

  const selectCard = useCallback(
    (cardId: string) => {
      const socket = getSocket();
      if (!socket || !battleId) return;
      socket.emit('battle:select-card', { battleId, cardId });
      setUsedCardIds((prev) => new Set(prev).add(cardId));
    },
    [battleId]
  );

  const reconnect = useCallback((id: string) => {
    const socket = getSocket();
    if (!socket) return;
    setBattleId(id);
    socket.emit('battle:reconnect', { battleId: id });
  }, []);

  const getCardMainStat = useCallback((card: PvPCard): number => {
    return Math.round(
      (card.batting + card.bowling + (card.fielding || 80) + (card.captaincy || 70) + (card.pressure || 80)) / 5
    );
  }, []);

  return {
    status,
    battleId,
    opponent,
    queuePosition,
    queueSize,
    countdown,
    round,
    totalRounds,
    currentAttribute,
    attributeOrder,
    myCards,
    usedCardIds,
    myScore,
    opponentScore,
    roundHistory,
    currentRoundResult,
    winner,
    rewards,
    error,
    autoSelected,
    cooldowns,
    isMyTurn,
    opponentPickedCard,
    joinMatchmaking,
    leaveMatchmaking,
    selectCard,
    reconnect,
    getCardMainStat,
    setMyCards,
  };
}
