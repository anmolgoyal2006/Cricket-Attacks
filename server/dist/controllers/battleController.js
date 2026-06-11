"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPvE = startPvE;
exports.playRoundHandler = playRoundHandler;
exports.getBattleById = getBattleById;
exports.getBattleHistory = getBattleHistory;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Player_1 = __importDefault(require("../models/Player"));
const Battle_1 = __importDefault(require("../models/Battle"));
const errors_1 = require("../utils/errors");
const battleService_1 = require("../services/battleService");
const leaderboardService_1 = require("../services/leaderboardService");
const helpers_1 = require("../utils/helpers");
async function startPvE(req, res, next) {
    try {
        const { squadCardIds } = req.body;
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        const playerCards = await Player_1.default.find({ _id: { $in: squadCardIds } });
        if (playerCards.length !== 5) {
            throw new errors_1.BadRequestError('Some selected cards were not found');
        }
        for (const cardId of squadCardIds) {
            if (!user.ownedCards.some((c) => c.toString() === cardId)) {
                throw new errors_1.BadRequestError('You do not own all selected cards');
            }
        }
        const { aiCards, playerHand } = (0, battleService_1.startBattle)(playerCards);
        const battle = await Battle_1.default.create({
            user: user._id,
            playerSquad: squadCardIds,
            aiSquad: aiCards,
            playerScore: 0,
            computerScore: 0,
            type: 'pve',
            status: 'in_progress',
        });
        res.json({
            battleId: battle._id,
            playerCards: playerHand,
            aiCards,
            currentRound: 0,
            totalRounds: 5,
        });
    }
    catch (error) {
        next(error);
    }
}
async function playRoundHandler(req, res, next) {
    try {
        const { battleId } = req.params;
        const { playerCardId } = req.body;
        const battle = await Battle_1.default.findById(battleId).populate('playerSquad');
        if (!battle) {
            throw new errors_1.NotFoundError('Battle');
        }
        if (battle.user.toString() !== req.userId) {
            throw new errors_1.BadRequestError('This is not your battle');
        }
        if (battle.status === 'completed') {
            throw new errors_1.BadRequestError('Battle is already completed');
        }
        const aiCards = battle.aiSquad.filter((ai) => !battle.rounds.some((r) => (r.aiId ? r.aiId === ai.aiId : r.computerCardName === ai.name)));
        if (aiCards.length === 0) {
            throw new errors_1.BadRequestError('No AI cards remaining');
        }
        const result = (0, battleService_1.playRound)(battle, aiCards, playerCardId);
        if (result.computerCard) {
            battle.aiSquad = battle.aiSquad.map((ai) => ({
                ...ai,
                used: result.computerCard.aiId
                    ? ai.aiId === result.computerCard.aiId || ai.used
                    : ai.name === result.computerCard.name || ai.used,
            }));
        }
        const roundResult = {
            roundNumber: result.roundNumber,
            playerCardId: new mongoose_1.default.Types.ObjectId(playerCardId),
            playerCardName: result.playerCard.name,
            playerStat: result.playerCard.stat,
            aiId: result.computerCard.aiId,
            computerCardName: result.computerCard.name,
            computerStat: result.computerCard.stat,
            winner: result.winner,
        };
        battle.rounds.push(roundResult);
        battle.playerScore = result.playerScore;
        battle.computerScore = result.computerScore;
        if (result.isOver) {
            battle.status = 'completed';
            if (result.battleResult) {
                battle.winner = result.battleResult;
                if (result.battleResult === 'player') {
                    battle.rewards.coins = result.trophiesEarned * 5;
                    battle.rewards.xp = result.xpEarned;
                    battle.rewards.trophies = result.trophiesEarned;
                }
                else if (result.battleResult === 'computer') {
                    battle.rewards.coins = result.trophiesEarned * 5;
                    battle.rewards.xp = result.xpEarned;
                    battle.rewards.trophies = result.trophiesEarned;
                }
                else {
                    battle.rewards.coins = result.trophiesEarned * 5;
                    battle.rewards.xp = result.xpEarned;
                    battle.rewards.trophies = result.trophiesEarned;
                }
                const rewards = await (0, battleService_1.calculateRewards)(result.battleResult);
                await User_1.default.findByIdAndUpdate(req.userId, {
                    $inc: {
                        coins: rewards.coins,
                        xp: rewards.xp,
                        trophies: result.battleResult === 'player' ? rewards.trophies : 0,
                        battlesPlayed: 1,
                        wins: result.battleResult === 'player' ? 1 : 0,
                        losses: result.battleResult === 'computer' ? 1 : 0,
                    },
                });
                await (0, leaderboardService_1.updateLeaderboardForUser)(req.userId);
                result.trophiesEarned = rewards.trophies;
                result.xpEarned = rewards.xp;
            }
        }
        await battle.save();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function getBattleById(req, res, next) {
    try {
        const battle = await Battle_1.default.findById(req.params.id)
            .populate('playerSquad')
            .populate('rewards.cardDrops')
            .lean();
        if (!battle) {
            throw new errors_1.NotFoundError('Battle');
        }
        if (battle.user.toString() !== req.userId) {
            throw new errors_1.BadRequestError('This is not your battle');
        }
        res.json({ battle });
    }
    catch (error) {
        next(error);
    }
}
async function getBattleHistory(req, res, next) {
    try {
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const [battles, total] = await Promise.all([
            Battle_1.default.find({ user: req.userId, status: 'completed' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Battle_1.default.countDocuments({ user: req.userId, status: 'completed' }),
        ]);
        res.json({
            battles: battles.map((b) => ({
                ...b,
                winner: b.winner,
                playerScore: b.playerScore,
                computerScore: b.computerScore,
                trophiesEarned: b.rewards?.trophies || 0,
                xpEarned: b.rewards?.xp || 0,
                createdAt: b.createdAt,
                type: b.type,
            })),
            pagination: (0, helpers_1.paginationResponse)(total, page, limit),
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=battleController.js.map