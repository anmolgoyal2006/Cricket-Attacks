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
        // Extract actual player IDs from cardIds (cardId may be "playerId_index" or just "playerId")
        const actualPlayerIds = squadCardIds.map((cardId) => {
            if (!cardId)
                throw new errors_1.BadRequestError('Invalid card ID in squad');
            const raw = cardId.includes('_') ? cardId.split('_')[0] : cardId;
            if (!mongoose_1.default.isValidObjectId(raw)) {
                throw new errors_1.BadRequestError(`Invalid card ID format: ${cardId}`);
            }
            return raw;
        });
        // Fetch unique player documents (duplicates allowed in squad — fetch by unique IDs)
        const uniquePlayerIds = [...new Set(actualPlayerIds)];
        const foundPlayers = await Player_1.default.find({ _id: { $in: uniquePlayerIds } });
        const playerMap = new Map(foundPlayers.map((p) => [p._id.toString(), p]));
        // Build the ordered playerCards array preserving duplicates
        const playerCards = actualPlayerIds.map((id) => playerMap.get(id)).filter(Boolean);
        if (playerCards.length !== 5) {
            const missing = actualPlayerIds.filter((id) => !playerMap.has(id));
            throw new errors_1.BadRequestError(`Some selected cards were not found (IDs: ${missing.join(', ')})`);
        }
        // Verify ownership — each selected playerId must appear in ownedCards
        const ownedSet = new Set(user.ownedCards.map((c) => c.toString()));
        for (const playerId of actualPlayerIds) {
            if (!ownedSet.has(playerId)) {
                throw new errors_1.BadRequestError('You do not own all selected cards');
            }
        }
        // Create playerHand with original cardIds as userCardId
        const { aiCards, playerHand: rawPlayerHand, attributeOrder } = (0, battleService_1.startBattle)(playerCards);
        // Add the original cardId to each playerHand entry
        const playerHand = rawPlayerHand.map((card, index) => ({
            ...card,
            userCardId: squadCardIds[index]
        }));
        const battle = await Battle_1.default.create({
            user: user._id,
            playerSquad: actualPlayerIds, // Store actual player IDs in DB
            aiSquad: aiCards,
            attributeOrder,
            playerScore: 0,
            computerScore: 0,
            type: 'pve',
            status: 'in_progress',
        });
        res.json({
            battleId: battle._id,
            playerCards: playerHand,
            aiCards,
            attributeOrder,
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
        let { playerCardId } = req.body;
        // Extract actual player ID from userCardId if needed
        const actualPlayerId = playerCardId.includes('_') ? playerCardId.split('_')[0] : playerCardId;
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
        const result = (0, battleService_1.playRound)(battle, aiCards, actualPlayerId);
        let rewards = null;
        if (result.computerCard) {
            battle.aiSquad = battle.aiSquad.map((ai) => ({
                ...ai,
                used: result.computerCard.aiId
                    ? ai.aiId === result.computerCard.aiId || ai.used
                    : ai.name === result.computerCard.name || ai.used,
            }));
        }
        if (!result.computerCard || !result.computerCard.name) {
            console.error('Missing computerCard.name in playRound result:', JSON.stringify(result.computerCard));
        }
        const roundResult = {
            roundNumber: result.roundNumber,
            playerCardId: new mongoose_1.default.Types.ObjectId(actualPlayerId),
            playerCardName: result.playerCard.name,
            playerStat: result.playerCard.stat,
            attribute: result.attribute,
            aiId: result.computerCard?.aiId,
            computerCardName: result.computerCard?.name || 'Unknown AI',
            computerStat: result.computerCard?.stat ?? 0,
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
                rewards = await (0, battleService_1.calculateRewards)(result.battleResult);
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
        res.json({
            ...result,
            coinsEarned: rewards?.coins ?? 0,
        });
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