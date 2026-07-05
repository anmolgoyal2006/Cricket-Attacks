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
exports.cardCooldowns = void 0;
exports.setCardCooldowns = setCardCooldowns;
exports.getActiveCooldowns = getActiveCooldowns;
exports.isCardOnCooldown = isCardOnCooldown;
exports.setupBattleRooms = setupBattleRooms;
const mongoose_1 = __importDefault(require("mongoose"));
const Battle_1 = __importDefault(require("../models/Battle"));
const MatchHistory_1 = __importDefault(require("../models/MatchHistory"));
const leaderboardService_1 = require("../services/leaderboardService");
const eloService_1 = require("../services/eloService");
const rewardsService_1 = require("../services/rewardsService");
const ROUND_TIMEOUT = 30000;
const TOTAL_ROUNDS = 5;
const CARD_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const ATTRIBUTES = ['batting', 'bowling', 'fielding', 'captaincy', 'pressure'];
// userId -> Map<cardId, cooldownExpiresAt>
exports.cardCooldowns = new Map();
function setCardCooldowns(userId, cardIds) {
    if (!exports.cardCooldowns.has(userId)) {
        exports.cardCooldowns.set(userId, new Map());
    }
    const userCooldowns = exports.cardCooldowns.get(userId);
    const expiresAt = Date.now() + CARD_COOLDOWN_MS;
    for (const cardId of cardIds) {
        userCooldowns.set(cardId, expiresAt);
    }
}
function getActiveCooldowns(userId) {
    const userCooldowns = exports.cardCooldowns.get(userId);
    if (!userCooldowns)
        return {};
    const now = Date.now();
    const result = {};
    for (const [cardId, expiresAt] of userCooldowns) {
        if (expiresAt > now) {
            result[cardId] = expiresAt;
        }
        else {
            userCooldowns.delete(cardId); // clean up expired
        }
    }
    return result;
}
function isCardOnCooldown(userId, cardId) {
    const userCooldowns = exports.cardCooldowns.get(userId);
    if (!userCooldowns)
        return false;
    const expiresAt = userCooldowns.get(cardId);
    if (!expiresAt)
        return false;
    if (Date.now() >= expiresAt) {
        userCooldowns.delete(cardId);
        return false;
    }
    return true;
}
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
const activeBattles = new Map();
function getAttr(card, attr) {
    return card[attr] ?? 80;
}
function createPvPCard(card) {
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
        const attribute = battle.attributeOrder[battle.round - 1] || 'batting';
        const p1Stat = getAttr(p1Card, attribute);
        const p2Stat = getAttr(p2Card, attribute);
        let winner;
        if (p1Stat > p2Stat) {
            winner = 'player1';
            battle.player1Score++;
        }
        else if (p2Stat > p1Stat) {
            winner = 'player2';
            battle.player2Score++;
        }
        else {
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
        }
        else {
            battle.round++;
            // Alternate picker each round
            battle.roundPicker = battle.roundPicker === 'player1' ? 'player2' : 'player1';
            const nextAttribute = battle.attributeOrder[battle.round - 1] || 'batting';
            const pickerSocket = battle.roundPicker === 'player1'
                ? io.sockets.sockets.get(battle.player1.socketId)
                : io.sockets.sockets.get(battle.player2.socketId);
            const responderSocket = battle.roundPicker === 'player1'
                ? io.sockets.sockets.get(battle.player2.socketId)
                : io.sockets.sockets.get(battle.player1.socketId);
            // Tell each player whether they're picking first or responding
            pickerSocket?.emit('battle:round-start', {
                round: battle.round,
                totalRounds: TOTAL_ROUNDS,
                attribute: nextAttribute,
                yourTurn: true,
                opponentPickedCard: null,
            });
            responderSocket?.emit('battle:round-start', {
                round: battle.round,
                totalRounds: TOTAL_ROUNDS,
                attribute: nextAttribute,
                yourTurn: false,
                opponentPickedCard: null,
            });
        }
    }
    function startRoundTimer(battle) {
        battle.timer = setTimeout(() => {
            const p1Socket = io.sockets.sockets.get(battle.player1.socketId);
            const p2Socket = io.sockets.sockets.get(battle.player2.socketId);
            // Auto-select only for whoever hasn't picked yet (respects turn order)
            if (!battle.player1Choice && p1Socket?.connected) {
                const fallback = battle.player1.cards.find((c) => !battle.player1UsedCardIds.has(c.userCardId));
                if (fallback) {
                    battle.player1Choice = fallback;
                    battle.player1UsedCardIds.add(fallback.userCardId);
                    p1Socket.emit('battle:auto-selected', { card: fallback });
                    // If player1 was the picker, notify player2 their card was auto-chosen
                    if (battle.roundPicker === 'player1' && !battle.player2Choice) {
                        p2Socket?.emit('battle:picker-chose', { cardName: fallback.name, cardRole: fallback.role });
                    }
                }
            }
            if (!battle.player2Choice && p2Socket?.connected) {
                const fallback = battle.player2.cards.find((c) => !battle.player2UsedCardIds.has(c.userCardId));
                if (fallback) {
                    battle.player2Choice = fallback;
                    battle.player2UsedCardIds.add(fallback.userCardId);
                    p2Socket.emit('battle:auto-selected', { card: fallback });
                    // If player2 was the picker, notify player1 their card was auto-chosen
                    if (battle.roundPicker === 'player2' && !battle.player1Choice) {
                        p1Socket?.emit('battle:picker-chose', { cardName: fallback.name, cardRole: fallback.role });
                    }
                }
            }
            if (battle.player1Choice && battle.player2Choice) {
                checkRoundComplete(battle);
            }
        }, ROUND_TIMEOUT);
    }
    async function endBattle(io, battle) {
        battle.status = 'completed';
        // Apply 10-minute cooldown on used cards for both players
        const p1CardIds = battle.player1.cards.map((c) => c.userCardId);
        const p2CardIds = battle.player2.cards.map((c) => c.userCardId);
        setCardCooldowns(battle.player1.userId, p1CardIds);
        setCardCooldowns(battle.player2.userId, p2CardIds);
        let overallWinner = 'tie';
        if (battle.player1Score > battle.player2Score) {
            overallWinner = 'player1';
        }
        else if (battle.player2Score > battle.player1Score) {
            overallWinner = 'player2';
        }
        const player1Won = overallWinner === 'player1';
        const player2Won = overallWinner === 'player2';
        const isDraw = overallWinner === 'tie';
        try {
            const UserModel = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            const [player1Doc, player2Doc] = await Promise.all([
                UserModel.findById(battle.player1.userId),
                UserModel.findById(battle.player2.userId),
            ]);
            if (player1Doc && player2Doc) {
                const eloResult = (0, eloService_1.calculateElo)(player1Doc.eloRating, player2Doc.eloRating, player1Won ? 1 : isDraw ? 0.5 : 0, player2Won ? 1 : isDraw ? 0.5 : 0);
                const p1NewTier = (0, eloService_1.getTier)(eloResult.newRatingA);
                const p2NewTier = (0, eloService_1.getTier)(eloResult.newRatingB);
                const p1Streak = player1Won ? (player1Doc.battleStreak || 0) + 1 : 0;
                const p2Streak = player2Won ? (player2Doc.battleStreak || 0) + 1 : 0;
                const p1Rewards = (0, rewardsService_1.getWinRewards)(player1Won, isDraw, p1Streak);
                const p2Rewards = (0, rewardsService_1.getWinRewards)(player2Won, isDraw, p2Streak);
                await Promise.all([
                    UserModel.findByIdAndUpdate(battle.player1.userId, {
                        $set: {
                            eloRating: eloResult.newRatingA,
                            rankTier: p1NewTier,
                            battleStreak: p1Streak,
                            highestElo: Math.max(player1Doc.highestElo || 1000, eloResult.newRatingA),
                        },
                        $inc: {
                            coins: p1Rewards.coins,
                            xp: p1Rewards.xp,
                            battlesPlayed: 1,
                            wins: player1Won ? 1 : 0,
                            losses: player2Won ? 1 : 0,
                            draws: isDraw ? 1 : 0,
                            pvpPlayed: 1,
                            pvpWins: player1Won ? 1 : 0,
                            pvpLosses: player2Won ? 1 : 0,
                            pvpDraws: isDraw ? 1 : 0,
                        },
                    }),
                    UserModel.findByIdAndUpdate(battle.player2.userId, {
                        $set: {
                            eloRating: eloResult.newRatingB,
                            rankTier: p2NewTier,
                            battleStreak: p2Streak,
                            highestElo: Math.max(player2Doc.highestElo || 1000, eloResult.newRatingB),
                        },
                        $inc: {
                            coins: p2Rewards.coins,
                            xp: p2Rewards.xp,
                            battlesPlayed: 1,
                            wins: player2Won ? 1 : 0,
                            losses: player1Won ? 1 : 0,
                            draws: isDraw ? 1 : 0,
                            pvpPlayed: 1,
                            pvpWins: player2Won ? 1 : 0,
                            pvpLosses: player1Won ? 1 : 0,
                            pvpDraws: isDraw ? 1 : 0,
                        },
                    }),
                ]);
                const mongoBattle = await Battle_1.default.create({
                    user: new mongoose_1.default.Types.ObjectId(battle.player1.userId),
                    attributeOrder: battle.attributeOrder,
                    playerSquad: battle.player1.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
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
                await Battle_1.default.create({
                    user: new mongoose_1.default.Types.ObjectId(battle.player2.userId),
                    attributeOrder: battle.attributeOrder,
                    playerSquad: battle.player2.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
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
                await Promise.all([
                    MatchHistory_1.default.create({
                        user: new mongoose_1.default.Types.ObjectId(battle.player1.userId),
                        opponentId: new mongoose_1.default.Types.ObjectId(battle.player2.userId),
                        opponentName: battle.player2.username,
                        result: player1Won ? 'win' : isDraw ? 'draw' : 'loss',
                        eloChange: eloResult.changeA,
                        eloBefore: player1Doc.eloRating,
                        eloAfter: eloResult.newRatingA,
                        playerScore: battle.player1Score,
                        opponentScore: battle.player2Score,
                        attributeOrder: battle.attributeOrder,
                        type: 'ranked',
                        season: 1,
                    }),
                    MatchHistory_1.default.create({
                        user: new mongoose_1.default.Types.ObjectId(battle.player2.userId),
                        opponentId: new mongoose_1.default.Types.ObjectId(battle.player1.userId),
                        opponentName: battle.player1.username,
                        result: player2Won ? 'win' : isDraw ? 'draw' : 'loss',
                        eloChange: eloResult.changeB,
                        eloBefore: player2Doc.eloRating,
                        eloAfter: eloResult.newRatingB,
                        playerScore: battle.player2Score,
                        opponentScore: battle.player1Score,
                        attributeOrder: battle.attributeOrder,
                        type: 'ranked',
                        season: 1,
                    }),
                ]);
                await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player1.userId);
                await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player2.userId);
                io.to(battle.battleId).emit('battle:over', {
                    winner: overallWinner,
                    player1Score: battle.player1Score,
                    player2Score: battle.player2Score,
                    player1Rewards: { ...p1Rewards, eloChange: eloResult.changeA, newElo: eloResult.newRatingA, newTier: p1NewTier },
                    player2Rewards: { ...p2Rewards, eloChange: eloResult.changeB, newElo: eloResult.newRatingB, newTier: p2NewTier },
                    roundHistory: battle.roundHistory,
                });
                return;
            }
            // fallback for missing user docs (same as before)
            await fallbackBattleSave(io, battle, player1Won, player2Won, isDraw);
        }
        catch (err) {
            console.error('Failed to persist PvP battle:', err);
            try {
                await fallbackBattleSave(io, battle, player1Won, player2Won, isDraw);
            }
            catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }
        }
        io.to(battle.battleId).emit('battle:over', {
            winner: overallWinner,
            player1Score: battle.player1Score,
            player2Score: battle.player2Score,
            player1Rewards: (0, rewardsService_1.getWinRewards)(player1Won, isDraw, 0),
            player2Rewards: (0, rewardsService_1.getWinRewards)(player2Won, isDraw, 0),
            roundHistory: battle.roundHistory,
        });
        setTimeout(() => {
            activeBattles.delete(battle.battleId);
        }, 60000);
    }
    async function fallbackBattleSave(io, battle, player1Won, player2Won, isDraw) {
        const UserModel = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
        const p1Reward = player1Won ? { coins: 150, xp: 75 } : isDraw ? { coins: 75, xp: 40 } : { coins: 30, xp: 20 };
        const p2Reward = player2Won ? { coins: 150, xp: 75 } : isDraw ? { coins: 75, xp: 40 } : { coins: 30, xp: 20 };
        const mongoBattle = await Battle_1.default.create({
            user: new mongoose_1.default.Types.ObjectId(battle.player1.userId),
            attributeOrder: battle.attributeOrder,
            playerSquad: battle.player1.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
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
        const mongoBattle2 = await Battle_1.default.create({
            user: new mongoose_1.default.Types.ObjectId(battle.player2.userId),
            attributeOrder: battle.attributeOrder,
            playerSquad: battle.player2.cards.map((c) => new mongoose_1.default.Types.ObjectId(c.userCardId)),
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
        await UserModel.findByIdAndUpdate(battle.player1.userId, {
            $inc: {
                coins: p1Reward.coins,
                xp: p1Reward.xp,
                battlesPlayed: 1,
                wins: player1Won ? 1 : 0,
                losses: player2Won ? 1 : 0,
                pvpPlayed: 1,
                pvpWins: player1Won ? 1 : 0,
                pvpLosses: player2Won ? 1 : 0,
                pvpDraws: isDraw ? 1 : 0,
            },
        });
        await UserModel.findByIdAndUpdate(battle.player2.userId, {
            $inc: {
                coins: p2Reward.coins,
                xp: p2Reward.xp,
                battlesPlayed: 1,
                wins: player2Won ? 1 : 0,
                losses: player1Won ? 1 : 0,
                pvpPlayed: 1,
                pvpWins: player2Won ? 1 : 0,
                pvpLosses: player1Won ? 1 : 0,
                pvpDraws: isDraw ? 1 : 0,
            },
        });
        await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player1.userId);
        await (0, leaderboardService_1.updateLeaderboardForUser)(battle.player2.userId);
    }
    return {
        initializeBattle(socket, io, battleId, player1Data, player2Data) {
            const attributeOrder = shuffleArray(ATTRIBUTES);
            // Randomly decide who picks first in round 1
            const firstPicker = Math.random() < 0.5 ? 'player1' : 'player2';
            const battle = {
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
                roundPicker: firstPicker,
            };
            activeBattles.set(battleId, battle);
            // Tell each player individually whether they pick first
            const p1Socket = io.sockets.sockets.get(player1Data.socketId);
            const p2Socket = io.sockets.sockets.get(player2Data.socketId);
            p1Socket?.emit('battle:start', {
                battleId,
                round: 1,
                totalRounds: TOTAL_ROUNDS,
                attribute: attributeOrder[0] || 'batting',
                attributeOrder,
                yourTurn: firstPicker === 'player1',
                opponentPickedCard: null,
            });
            p2Socket?.emit('battle:start', {
                battleId,
                round: 1,
                totalRounds: TOTAL_ROUNDS,
                attribute: attributeOrder[0] || 'batting',
                attributeOrder,
                yourTurn: firstPicker === 'player2',
                opponentPickedCard: null,
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
            const myRole = isPlayer1 ? 'player1' : 'player2';
            const usedSet = isPlayer1 ? battle.player1UsedCardIds : battle.player2UsedCardIds;
            const cards = isPlayer1 ? battle.player1.cards : battle.player2.cards;
            // Enforce turn order
            const myChoice = isPlayer1 ? battle.player1Choice : battle.player2Choice;
            const opponentChoice = isPlayer1 ? battle.player2Choice : battle.player1Choice;
            const isPicker = battle.roundPicker === myRole;
            // Responder can only pick after the picker has picked
            if (!isPicker && !opponentChoice) {
                socket.emit('error', { message: "Wait for your opponent to pick first" });
                return;
            }
            if (usedSet.has(cardId)) {
                socket.emit('error', { message: 'Card already used this battle' });
                return;
            }
            if (myChoice) {
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
            // If this was the picker's selection, notify the responder (name + role only)
            if (isPicker) {
                const responderSocketId = isPlayer1 ? battle.player2.socketId : battle.player1.socketId;
                const responderSocket = io.sockets.sockets.get(responderSocketId);
                responderSocket?.emit('battle:picker-chose', {
                    cardName: card.name,
                    cardRole: card.role,
                });
                // Start the full-round timer now (responder has ROUND_TIMEOUT to respond)
                if (battle.timer)
                    clearTimeout(battle.timer);
                startRoundTimer(battle);
            }
            else {
                // Responder picked — resolve round immediately
                checkRoundComplete(battle);
            }
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
                                const loserUserId = winner === 'player1' ? battle.player2.userId : battle.player1.userId;
                                const [winnerDoc, loserDoc] = await Promise.all([
                                    UserModel.findById(winnerUserId),
                                    UserModel.findById(loserUserId),
                                ]);
                                if (winnerDoc && loserDoc) {
                                    const eloResult = (0, eloService_1.calculateElo)(winnerDoc.eloRating, loserDoc.eloRating, 1, 0);
                                    const newTier = (0, eloService_1.getTier)(eloResult.newRatingA);
                                    await UserModel.findByIdAndUpdate(winnerUserId, {
                                        $set: { eloRating: eloResult.newRatingA, rankTier: newTier, battleStreak: (winnerDoc.battleStreak || 0) + 1 },
                                        $inc: { coins: 100, xp: 50, battlesPlayed: 1, wins: 1, pvpPlayed: 1, pvpWins: 1 },
                                    });
                                    await UserModel.findByIdAndUpdate(loserUserId, {
                                        $set: { eloRating: eloResult.newRatingB, rankTier: (0, eloService_1.getTier)(eloResult.newRatingB), battleStreak: 0 },
                                        $inc: { battlesPlayed: 1, losses: 1, pvpPlayed: 1, pvpLosses: 1 },
                                    });
                                }
                                else {
                                    await UserModel.findByIdAndUpdate(winnerUserId, {
                                        $inc: { coins: 100, xp: 50, battlesPlayed: 1, wins: 1, pvpPlayed: 1, pvpWins: 1 },
                                    });
                                }
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
                attribute: battle.attributeOrder[battle.round - 1] || 'batting',
                attributeOrder: battle.attributeOrder,
                player1Score: battle.player1Score,
                player2Score: battle.player2Score,
                roundHistory: battle.roundHistory,
                status: battle.status,
                yourCards: socket.userId === battle.player1.userId ? battle.player1.cards : battle.player2.cards,
                usedCardIds: Array.from(socket.userId === battle.player1.userId ? battle.player1UsedCardIds : battle.player2UsedCardIds),
                yourTurn: (socket.userId === battle.player1.userId && battle.roundPicker === 'player1') ||
                    (socket.userId === battle.player2.userId && battle.roundPicker === 'player2'),
                opponentPickedCard: (() => {
                    const isP1 = socket.userId === battle.player1.userId;
                    const opponentChoice = isP1 ? battle.player2Choice : battle.player1Choice;
                    return opponentChoice ? { cardName: opponentChoice.name, cardRole: opponentChoice.role } : null;
                })(),
            });
        },
    };
}
//# sourceMappingURL=battleRoom.js.map