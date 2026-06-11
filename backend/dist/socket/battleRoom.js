"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBattleRooms = setupBattleRooms;
const mongoose_1 = __importDefault(require("mongoose"));
const Battle_1 = __importDefault(require("../models/Battle"));
const leaderboardService_1 = require("../services/leaderboardService");
const ROUND_TIMEOUT = 30000;
const TOTAL_ROUNDS = 5;
const activeBattles = new Map();
function getCardStat(card) {
    if (card.role === 'Batsman' || card.role === 'Wicketkeeper-Batsman')
        return card.batting || card.stat || 80;
    if (card.role === 'Bowler')
        return card.bowling || card.stat || 80;
    return Math.round(((card.batting || 80) + (card.bowling || 80)) / 2);
}
function createPvPCard(card) {
    return {
        userCardId: card._id || card.userCardId,
        name: card.name,
        role: card.role,
        stat: getCardStat(card),
    };
}
function setupBattleRooms(io) {
    function getBattleState(battleId) {
        return activeBattles.get(battleId);
    }
    function checkRoundComplete(battle) {
        if (!battle.player1Choice || !battle.player2Choice)
            return;
        if (battle.timer) {
            clearTimeout(battle.timer);
            battle.timer = null;
        }
        const p1Card = battle.player1Choice;
        const p2Card = battle.player2Choice;
        let winner;
        if (p1Card.stat > p2Card.stat) {
            winner = 'player1';
            battle.player1Score++;
        }
        else if (p2Card.stat > p1Card.stat) {
            winner = 'player2';
            battle.player2Score++;
        }
        else {
            winner = 'tie';
        }
        const roundResult = {
            roundNumber: battle.round,
            player1Card: { name: p1Card.name, stat: p1Card.stat },
            player2Card: { name: p2Card.name, stat: p2Card.stat },
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
        }
        else {
            battle.round++;
            io.to(battle.battleId).emit('battle:round-start', {
                round: battle.round,
                totalRounds: TOTAL_ROUNDS,
            });
        }
    }
    function startRoundTimer(battle) {
        battle.timer = setTimeout(() => {
            const p1Socket = io.sockets.sockets.get(battle.player1.socketId);
            const p2Socket = io.sockets.sockets.get(battle.player2.socketId);
            if (!battle.player1Choice && p1Socket?.connected) {
                const fallback = battle.player1.cards.find((c) => !battle.player1UsedCardIds.has(c.userCardId));
                if (fallback) {
                    battle.player1Choice = fallback;
                    battle.player1UsedCardIds.add(fallback.userCardId);
                    p1Socket.emit('battle:auto-selected', { card: fallback });
                }
            }
            if (!battle.player2Choice && p2Socket?.connected) {
                const fallback = battle.player2.cards.find((c) => !battle.player2UsedCardIds.has(c.userCardId));
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
    async function endBattle(io, battle) {
        battle.status = 'completed';
        let overallWinner = 'tie';
        if (battle.player1Score > battle.player2Score) {
            overallWinner = 'player1';
        }
        else if (battle.player2Score > battle.player1Score) {
            overallWinner = 'player2';
        }
        const player1Won = overallWinner === 'player1';
        const player2Won = overallWinner === 'player2';
        const p1Reward = player1Won ? { coins: 150, xp: 75, trophies: 30 } : overallWinner === 'tie' ? { coins: 75, xp: 40, trophies: 15 } : { coins: 30, xp: 20, trophies: 5 };
        const p2Reward = player2Won ? { coins: 150, xp: 75, trophies: 30 } : overallWinner === 'tie' ? { coins: 75, xp: 40, trophies: 15 } : { coins: 30, xp: 20, trophies: 5 };
        try {
            const mongoBattle = await Battle_1.default.create({
                user: new mongoose_1.default.Types.ObjectId(battle.player1.userId),
                playerSquad: battle.player1.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
                aiSquad: battle.player2.cards.map((c) => ({ name: c.name, role: c.role, stat: c.stat })),
                rounds: battle.roundHistory.map((r) => ({
                    roundNumber: r.roundNumber,
                    playerCardId: r.player1Card ? battle.player1.cards[0]?.userCardId : undefined,
                    playerCardName: r.player1Card?.name || '',
                    playerStat: r.player1Card?.stat || 0,
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
            const mongoBattle2 = await Battle_1.default.create({
                user: new mongoose_1.default.Types.ObjectId(battle.player2.userId),
                playerSquad: battle.player2.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
                aiSquad: battle.player1.cards.map((c) => ({ name: c.name, role: c.role, stat: c.stat })),
                rounds: battle.roundHistory.map((r) => ({
                    roundNumber: r.roundNumber,
                    playerCardId: r.player2Card ? battle.player2.cards[0]?.userCardId : undefined,
                    playerCardName: r.player2Card?.name || '',
                    playerStat: r.player2Card?.stat || 0,
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
            const UserModel = await Promise.resolve().then(() => __importStar(require('../models/User'))).then((m) => m.default);
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
            await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player1.userId);
            await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player2.userId);
        }
        catch (err) {
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
        initializeBattle(socket, io, battleId, player1Data, player2Data) {
            const battle = {
                battleId,
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
            });
            return battle;
        },
        handleSelectCard(socket, battleId, cardId) {
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
            }
            else {
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
        handleDisconnect(socket) {
            for (const [battleId, battle] of activeBattles) {
                if (battle.player1.userId === socket.userId || battle.player2.userId === socket.userId) {
                    const opponentId = battle.player1.userId === socket.userId
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
                            const disconnectedPlayer = battle.player1.userId === socket.userId ? 'player1' : 'player2';
                            const winner = disconnectedPlayer === 'player1' ? 'player2' : 'player1';
                            battle.status = 'completed';
                            io.to(battleId).emit('battle:opponent-forfeit', {
                                winner,
                                reason: 'opponent_disconnected',
                            });
                            try {
                                const UserModel = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
                                const winnerUserId = winner === 'player1' ? battle.player1.userId : battle.player2.userId;
                                await UserModel.findByIdAndUpdate(winnerUserId, {
                                    $inc: { coins: 100, xp: 50, trophies: 20, battlesPlayed: 1, wins: 1 },
                                });
                                await (0, leaderboardService_1.updateLeaderboardForUser)(winnerUserId);
                            }
                            catch (err) {
                                console.error('Failed to save forfeit:', err);
                            }
                            setTimeout(() => activeBattles.delete(battleId), 30000);
                        }
                    }, 30000);
                }
            }
        },
        handleReconnect(socket, battleId) {
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
            }
            else {
                battle.player2.socketId = socket.id;
            }
            const opponentId = battle.player1.userId === socket.userId
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
                player1Score: battle.player1Score,
                player2Score: battle.player2Score,
                roundHistory: battle.roundHistory,
                status: battle.status,
                yourCards: socket.userId === battle.player1.userId ? battle.player1.cards : battle.player2.cards,
                usedCardIds: Array.from(socket.userId === battle.player1.userId ? battle.player1UsedCardIds : battle.player2UsedCardIds),
            });
        },
    };
}
//# sourceMappingURL=battleRoom.js.map