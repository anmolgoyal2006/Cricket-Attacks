import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth';
import mongoose from 'mongoose';
import Battle from '../models/Battle';
import User from '../models/Player';
import { updateLeaderboardForUser } from '../services/leaderboardService';

const ROUND_TIMEOUT = 30000;
const TOTAL_ROUNDS = 5;

const ATTRIBUTES = ['batting', 'bowling', 'fielding', 'captaincy', 'pressure'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PvPRoundCard {
  userCardId: string;
  name: string;
  role: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
}

interface PvPBattleState {
  battleId: string;
  player1: { userId: string; username: string; socketId: string; cards: PvPRoundCard[] };
  player2: { userId: string; username: string; socketId: string; cards: PvPRoundCard[] };
  round: number;
  attributeOrder: string[];
  player1Score: number;
  player2Score: number;
  player1Choice: PvPRoundCard | null;
  player2Choice: PvPRoundCard | null;
  player1UsedCardIds: Set<string>;
  player2UsedCardIds: Set<string>;
  roundHistory: any[];
  status: 'in_progress' | 'completed';
  timer: ReturnType<typeof setTimeout> | null;
  mongoId?: string;
}

const activeBattles = new Map<string, PvPBattleState>();

function getAttr(card: any, attr: string): number {
  return card[attr] ?? 80;
}

function createPvPCard(card: any): PvPRoundCard {
  return {
    userCardId: card._id || card.userCardId,
    name: card.name,
    role: card.role,
    batting: card.batting ?? getAttr(card, 'batting'),
    bowling: card.bowling ?? getAttr(card, 'bowling'),
    fielding: card.fielding ?? getAttr(card, 'fielding'),
    captaincy: card.captaincy ?? 70,
    pressure: card.pressure ?? 80,
  };
}

export function setupBattleRooms(io: Server) {
  function getBattleState(battleId: string) {
    return activeBattles.get(battleId);
  }

  function checkRoundComplete(battle: PvPBattleState) {
    if (!battle.player1Choice || !battle.player2Choice) return;

    if (battle.timer) {
      clearTimeout(battle.timer);
      battle.timer = null;
    }

    const p1Card = battle.player1Choice;
    const p2Card = battle.player2Choice;
    const attribute = battle.attributeOrder[battle.round - 1] || 'batting';

    const p1Stat = getAttr(p1Card, attribute);
    const p2Stat = getAttr(p2Card, attribute);

    let winner: 'player1' | 'player2' | 'tie';
    if (p1Stat > p2Stat) {
      winner = 'player1';
      battle.player1Score++;
    } else if (p2Stat > p1Stat) {
      winner = 'player2';
      battle.player2Score++;
    } else {
      winner = 'tie';
    }

    const roundResult = {
      roundNumber: battle.round,
      attribute,
      player1Card: { name: p1Card.name, stat: p1Stat },
      player2Card: { name: p2Card.name, stat: p2Stat },
      winner,
      player1Score: battle.player1Score,
      player2Score: battle.player2Score,
    };

    battle.roundHistory.push(roundResult);

    io.to(battle.battleId).emit('battle:round-result', roundResult);

    battle.player1Choice = null;
    battle.player2Choice = null;

    if (battle.round >= TOTAL_ROUNDS) {
      endBattle(io, battle);
    } else {
      battle.round++;
      io.to(battle.battleId).emit('battle:round-start', {
        round: battle.round,
        totalRounds: TOTAL_ROUNDS,
        attribute: battle.attributeOrder[battle.round - 1] || 'batting',
      });
    }
  }

  function startRoundTimer(battle: PvPBattleState) {
    battle.timer = setTimeout(() => {
      const p1Socket = io.sockets.sockets.get(battle.player1.socketId);
      const p2Socket = io.sockets.sockets.get(battle.player2.socketId);

      if (!battle.player1Choice && p1Socket?.connected) {
        const fallback = battle.player1.cards.find(
          (c) => !battle.player1UsedCardIds.has(c.userCardId)
        );
        if (fallback) {
          battle.player1Choice = fallback;
          battle.player1UsedCardIds.add(fallback.userCardId);
          p1Socket.emit('battle:auto-selected', { card: fallback });
        }
      }

      if (!battle.player2Choice && p2Socket?.connected) {
        const fallback = battle.player2.cards.find(
          (c) => !battle.player2UsedCardIds.has(c.userCardId)
        );
        if (fallback) {
          battle.player2Choice = fallback;
          battle.player2UsedCardIds.add(fallback.userCardId);
          p2Socket.emit('battle:auto-selected', { card: fallback });
        }
      }

      if (battle.player1Choice && battle.player2Choice) {
        checkRoundComplete(battle);
      }
    }, ROUND_TIMEOUT);
  }

  async function endBattle(io: Server, battle: PvPBattleState) {
    battle.status = 'completed';

    let overallWinner: 'player1' | 'player2' | 'tie' | string = 'tie';
    if (battle.player1Score > battle.player2Score) {
      overallWinner = 'player1';
    } else if (battle.player2Score > battle.player1Score) {
      overallWinner = 'player2';
    }

    const player1Won = overallWinner === 'player1';
    const player2Won = overallWinner === 'player2';

    const p1Reward = player1Won ? { coins: 150, xp: 75, trophies: 30 } : overallWinner === 'tie' ? { coins: 75, xp: 40, trophies: 15 } : { coins: 30, xp: 20, trophies: 5 };
    const p2Reward = player2Won ? { coins: 150, xp: 75, trophies: 30 } : overallWinner === 'tie' ? { coins: 75, xp: 40, trophies: 15 } : { coins: 30, xp: 20, trophies: 5 };

    try {
      const mongoBattle = await Battle.create({
        user: new mongoose.Types.ObjectId(battle.player1.userId),
        attributeOrder: battle.attributeOrder,
        playerSquad: battle.player1.cards.map((c) => new mongoose.Types.ObjectId(c.userCardId)),
        aiSquad: battle.player2.cards.map((c) => ({ name: c.name, role: c.role, batting: c.batting, bowling: c.bowling, fielding: c.fielding, captaincy: c.captaincy, pressure: c.pressure, overall: Math.round((c.batting + c.bowling + c.fielding + c.captaincy + c.pressure) / 5) })),
        rounds: battle.roundHistory.map((r) => ({
          roundNumber: r.roundNumber,
          playerCardId: r.player1Card ? battle.player1.cards[0]?.userCardId : undefined,
          playerCardName: r.player1Card?.name || '',
          playerStat: r.player1Card?.stat || 0,
          attribute: r.attribute || 'batting',
          computerCardName: r.player2Card?.name || '',
          computerStat: r.player2Card?.stat || 0,
          winner: r.winner === 'player1' ? 'player' : r.winner === 'player2' ? 'computer' : 'tie',
        })),
        playerScore: battle.player1Score,
        computerScore: battle.player2Score,
        winner: player1Won ? 'player' : player2Won ? 'computer' : 'tie',
        type: 'pvp',
        status: 'completed',
      });

      const mongoBattle2 = await Battle.create({
        user: new mongoose.Types.ObjectId(battle.player2.userId),
        attributeOrder: battle.attributeOrder,
        playerSquad: battle.player2.cards.map((c) => new mongoose.Types.ObjectId(c.userCardId)),
        aiSquad: battle.player1.cards.map((c) => ({ name: c.name, role: c.role, batting: c.batting, bowling: c.bowling, fielding: c.fielding, captaincy: c.captaincy, pressure: c.pressure, overall: Math.round((c.batting + c.bowling + c.fielding + c.captaincy + c.pressure) / 5) })),
        rounds: battle.roundHistory.map((r) => ({
          roundNumber: r.roundNumber,
          playerCardId: r.player2Card ? battle.player2.cards[0]?.userCardId : undefined,
          playerCardName: r.player2Card?.name || '',
          playerStat: r.player2Card?.stat || 0,
          attribute: r.attribute || 'batting',
          computerCardName: r.player1Card?.name || '',
          computerStat: r.player1Card?.stat || 0,
          winner: r.winner === 'player2' ? 'player' : r.winner === 'player1' ? 'computer' : 'tie',
        })),
        playerScore: battle.player2Score,
        computerScore: battle.player1Score,
        winner: player2Won ? 'player' : player1Won ? 'computer' : 'tie',
        type: 'pvp',
        status: 'completed',
      });

      battle.mongoId = mongoBattle._id.toString();

      const UserModel = await import('../models/User').then((m) => m.default);

      await UserModel.findByIdAndUpdate(battle.player1.userId, {
        $inc: {
          coins: p1Reward.coins,
          xp: p1Reward.xp,
          trophies: player1Won ? p1Reward.trophies : 0,
          battlesPlayed: 1,
          wins: player1Won ? 1 : 0,
          losses: player2Won ? 1 : 0,
        },
      });

      await UserModel.findByIdAndUpdate(battle.player2.userId, {
        $inc: {
          coins: p2Reward.coins,
          xp: p2Reward.xp,
          trophies: player2Won ? p2Reward.trophies : 0,
          battlesPlayed: 1,
          wins: player2Won ? 1 : 0,
          losses: player1Won ? 1 : 0,
        },
      });

      await updateLeaderboardForUser(battle.player1.userId);
      await updateLeaderboardForUser(battle.player2.userId);
    } catch (err) {
      console.error('Failed to persist PvP battle:', err);
    }

    io.to(battle.battleId).emit('battle:over', {
      winner: overallWinner,
      player1Score: battle.player1Score,
      player2Score: battle.player2Score,
      player1Rewards: p1Reward,
      player2Rewards: p2Reward,
      roundHistory: battle.roundHistory,
    });

    setTimeout(() => {
      activeBattles.delete(battle.battleId);
    }, 60000);
  }

  return {
    initializeBattle(
      socket: AuthenticatedSocket,
      io: Server,
      battleId: string,
      player1Data: { userId: string; username: string; socketId: string; cards: any[] },
      player2Data: { userId: string; username: string; socketId: string; cards: any[] }
    ) {
      const attributeOrder = shuffleArray(ATTRIBUTES);
      const battle: PvPBattleState = {
        battleId,
        attributeOrder,
        player1: {
          ...player1Data,
          cards: player1Data.cards.map(createPvPCard),
        },
        player2: {
          ...player2Data,
          cards: player2Data.cards.map(createPvPCard),
        },
        round: 1,
        player1Score: 0,
        player2Score: 0,
        player1Choice: null,
        player2Choice: null,
        player1UsedCardIds: new Set(),
        player2UsedCardIds: new Set(),
        roundHistory: [],
        status: 'in_progress',
        timer: null,
      };

      activeBattles.set(battleId, battle);

      io.to(battleId).emit('battle:start', {
        battleId,
        round: 1,
        totalRounds: TOTAL_ROUNDS,
        attribute: attributeOrder[0] || 'batting',
        attributeOrder,
      });

      return battle;
    },

    handleSelectCard(socket: AuthenticatedSocket, battleId: string, cardId: string) {
      const battle = activeBattles.get(battleId);
      if (!battle) {
        socket.emit('error', { message: 'Battle not found' });
        return;
      }

      if (battle.status === 'completed') {
        socket.emit('error', { message: 'Battle already completed' });
        return;
      }

      const isPlayer1 = socket.userId === battle.player1.userId;
      const usedSet = isPlayer1 ? battle.player1UsedCardIds : battle.player2UsedCardIds;
      const cards = isPlayer1 ? battle.player1.cards : battle.player2.cards;

      if (usedSet.has(cardId)) {
        socket.emit('error', { message: 'Card already used this battle' });
        return;
      }

      if ((isPlayer1 && battle.player1Choice) || (!isPlayer1 && battle.player2Choice)) {
        socket.emit('error', { message: 'Already selected a card for this round' });
        return;
      }

      const card = cards.find((c) => c.userCardId === cardId);
      if (!card) {
        socket.emit('error', { message: 'Card not found in your squad' });
        return;
      }

      if (isPlayer1) {
        battle.player1Choice = card;
      } else {
        battle.player2Choice = card;
      }
      usedSet.add(cardId);

      socket.to(battleId).emit('battle:opponent-selected');

      if (battle.timer) {
        clearTimeout(battle.timer);
        battle.timer = null;
      }

      startRoundTimer(battle);
      checkRoundComplete(battle);
    },

    handleDisconnect(socket: AuthenticatedSocket) {
      for (const [battleId, battle] of activeBattles) {
        if (battle.player1.userId === socket.userId || battle.player2.userId === socket.userId) {
          const opponentId =
            battle.player1.userId === socket.userId
              ? battle.player2.socketId
              : battle.player1.socketId;

          const opponentSocket = io.sockets.sockets.get(opponentId);
          if (opponentSocket) {
            opponentSocket.emit('battle:opponent-disconnected');
          }

          const reconnectKey = `reconnect:${battleId}:${socket.userId}`;

          setTimeout(async () => {
            const stillDisconnected = !io.sockets.sockets.get(socket.id)?.connected;
            if (stillDisconnected && battle.status === 'in_progress') {
              const disconnectedPlayer =
                battle.player1.userId === socket.userId ? 'player1' : 'player2';
              const winner = disconnectedPlayer === 'player1' ? 'player2' : 'player1';

              battle.status = 'completed';

              io.to(battleId).emit('battle:opponent-forfeit', {
                winner,
                reason: 'opponent_disconnected',
              });

              try {
                const UserModel = (await import('../models/User')).default;
                const winnerUserId =
                  winner === 'player1' ? battle.player1.userId : battle.player2.userId;

                await UserModel.findByIdAndUpdate(winnerUserId, {
                  $inc: { coins: 100, xp: 50, trophies: 20, battlesPlayed: 1, wins: 1 },
                });

                await updateLeaderboardForUser(winnerUserId);
              } catch (err) {
                console.error('Failed to save forfeit:', err);
              }

              setTimeout(() => activeBattles.delete(battleId), 30000);
            }
          }, 30000);
        }
      }
    },

    handleReconnect(socket: AuthenticatedSocket, battleId: string) {
      const battle = activeBattles.get(battleId);
      if (!battle) {
        socket.emit('error', { message: 'Battle no longer active' });
        return;
      }

      if (socket.userId !== battle.player1.userId && socket.userId !== battle.player2.userId) {
        socket.emit('error', { message: 'Not part of this battle' });
        return;
      }

      socket.join(battleId);

      if (battle.player1.userId === socket.userId) {
        battle.player1.socketId = socket.id;
      } else {
        battle.player2.socketId = socket.id;
      }

      const opponentId =
        battle.player1.userId === socket.userId
          ? battle.player2.socketId
          : battle.player1.socketId;

      const opponentSocket = io.sockets.sockets.get(opponentId);
      if (opponentSocket?.connected) {
        opponentSocket.emit('battle:opponent-reconnected');
      }

      socket.emit('battle:reconnected', {
        battleId: battle.battleId,
        round: battle.round,
        totalRounds: TOTAL_ROUNDS,
        attribute: battle.attributeOrder[battle.round - 1] || 'batting',
        attributeOrder: battle.attributeOrder,
        player1Score: battle.player1Score,
        player2Score: battle.player2Score,
        roundHistory: battle.roundHistory,
        status: battle.status,
        yourCards: socket.userId === battle.player1.userId ? battle.player1.cards : battle.player2.cards,
        usedCardIds: Array.from(
          socket.userId === battle.player1.userId ? battle.player1UsedCardIds : battle.player2UsedCardIds
        ),
      });
    },
  };
}
