"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeRankedBattle = completeRankedBattle;
const User_1 = __importDefault(require("../models/User"));
const Battle_1 = __importDefault(require("../models/Battle"));
const MatchHistory_1 = __importDefault(require("../models/MatchHistory"));
const Season_1 = __importDefault(require("../models/Season"));
const errors_1 = require("../utils/errors");
const eloService_1 = require("../services/eloService");
const rewardsService_1 = require("../services/rewardsService");
const leaderboardService_1 = require("../services/leaderboardService");
async function completeRankedBattle(req, res, next) {
    try {
        // Only trust battleId and opponentId from the request body.
        // Scores and winner are derived from the authoritative battle record.
        const { battleId, opponentId } = req.body;
        const battle = await Battle_1.default.findById(battleId);
        if (!battle)
            throw new errors_1.NotFoundError('Battle');
        // 1. Ownership check — ensure this battle belongs to the requesting user
        if (battle.user.toString() !== req.userId) {
            throw new errors_1.BadRequestError('This is not your battle');
        }
        // 2. Idempotency guard — prevent double-processing a completed battle
        if (battle.status === 'completed') {
            throw new errors_1.BadRequestError('Battle is already completed');
        }
        // 3. Derive scores from the authoritative battle record, not the request body
        const playerScore = battle.playerScore;
        const opponentScore = battle.computerScore; // computerScore stores the opponent's score in PvP battles
        let winner;
        if (playerScore === opponentScore)
            winner = 'draw';
        else if (playerScore > opponentScore)
            winner = 'player';
        else
            winner = 'opponent';
        const [player, opponent] = await Promise.all([
            User_1.default.findById(req.userId),
            User_1.default.findById(opponentId),
        ]);
        if (!player || !opponent)
            throw new errors_1.NotFoundError('User');
        // 4. Fetch current active season number (falls back to 1 if none found)
        const currentSeason = await Season_1.default.findOne({ isActive: true }).sort({ seasonNumber: -1 }).lean();
        const seasonNumber = currentSeason?.seasonNumber ?? 1;
        const eloResult = (0, eloService_1.calculateElo)(player.eloRating, opponent.eloRating, winner === 'player' ? 1 : winner === 'draw' ? 0.5 : 0, winner === 'opponent' ? 1 : winner === 'draw' ? 0.5 : 0);
        const playerNewTier = (0, eloService_1.getTier)(eloResult.newRatingA);
        const opponentNewTier = (0, eloService_1.getTier)(eloResult.newRatingB);
        const streak = player.battleStreak || 0;
        const newStreak = winner === 'player' ? streak + 1 : 0;
        const rewards = (0, rewardsService_1.getWinRewards)(winner === 'player', winner === 'draw', newStreak);
        // NOTE: These updates and the battle.save() below are not wrapped in a Mongoose
        // transaction because this deployment uses a standalone MongoDB instance without
        // a replica set. A partial failure here could leave ELO/rewards applied without
        // the battle marked completed. Consider enabling a replica set and wrapping these
        // in a session/transaction when the infrastructure supports it.
        await Promise.all([
            User_1.default.findByIdAndUpdate(player._id, {
                $set: {
                    eloRating: eloResult.newRatingA,
                    rankTier: playerNewTier,
                    battleStreak: newStreak,
                    highestElo: Math.max(player.highestElo, eloResult.newRatingA),
                },
                $inc: {
                    coins: rewards.coins,
                    xp: rewards.xp,
                    battlesPlayed: 1,
                    wins: winner === 'player' ? 1 : 0,
                    losses: winner === 'opponent' ? 1 : 0,
                    draws: winner === 'draw' ? 1 : 0,
                },
            }),
            User_1.default.findByIdAndUpdate(opponent._id, {
                $set: {
                    eloRating: eloResult.newRatingB,
                    rankTier: opponentNewTier,
                    battleStreak: winner === 'opponent' ? (opponent.battleStreak || 0) + 1 : 0,
                    highestElo: Math.max(opponent.highestElo, eloResult.newRatingB),
                },
                $inc: {
                    battlesPlayed: 1,
                    wins: winner === 'opponent' ? 1 : 0,
                    losses: winner === 'player' ? 1 : 0,
                    draws: winner === 'draw' ? 1 : 0,
                },
            }),
        ]);
        await Promise.all([
            (0, leaderboardService_1.updateLeaderboardForUser)(player._id.toString()),
            (0, leaderboardService_1.updateLeaderboardForUser)(opponent._id.toString()),
        ]);
        // 5. Create both history records in parallel using the dynamic season number
        const [historyPlayer] = await Promise.all([
            MatchHistory_1.default.create({
                user: player._id,
                opponentId: opponent._id,
                opponentName: opponent.username,
                result: winner === 'player' ? 'win' : winner === 'draw' ? 'draw' : 'loss',
                eloChange: eloResult.changeA,
                eloBefore: player.eloRating,
                eloAfter: eloResult.newRatingA,
                playerScore,
                opponentScore,
                attributeOrder: battle.attributeOrder,
                type: 'ranked',
                season: seasonNumber,
            }),
            MatchHistory_1.default.create({
                user: opponent._id,
                opponentId: player._id,
                opponentName: player.username,
                result: winner === 'opponent' ? 'win' : winner === 'draw' ? 'draw' : 'loss',
                eloChange: eloResult.changeB,
                eloBefore: opponent.eloRating,
                eloAfter: eloResult.newRatingB,
                playerScore: opponentScore,
                opponentScore: playerScore,
                attributeOrder: battle.attributeOrder,
                type: 'ranked',
                season: seasonNumber,
            }),
        ]);
        // 6. Use 'opponent' for the PvP loss case (schema now includes this enum value)
        battle.status = 'completed';
        battle.winner = winner === 'player' ? 'player' : winner === 'opponent' ? 'opponent' : 'tie';
        await battle.save();
        res.json({
            winner,
            eloChange: eloResult.changeA,
            newElo: eloResult.newRatingA,
            newTier: playerNewTier,
            playerScore,
            opponentScore,
            rewards,
            historyId: historyPlayer._id,
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=rankedController.js.map