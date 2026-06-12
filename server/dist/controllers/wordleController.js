"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyWordle = getDailyWordle;
exports.submitWordleGuess = submitWordleGuess;
const Player_1 = __importDefault(require("../models/Player"));
const errors_1 = require("../utils/errors");
// Deterministically pick a player for today using a date-based seed
function getDailyIndex(total) {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    // Simple LCG hash
    let hash = seed;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = (hash >>> 16) ^ hash;
    return Math.abs(hash) % total;
}
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
// Build clue array for a player (excluding name)
function buildClues(player) {
    const batting = player.batting;
    const bowling = player.bowling;
    const overall = player.overall;
    return [
        { id: 1, category: 'country', label: 'Country', value: player.country, emoji: '🌍' },
        { id: 2, category: 'role', label: 'Role', value: player.role, emoji: '🏏' },
        { id: 3, category: 'rarity', label: 'Rarity', value: player.rarity, emoji: '⭐' },
        {
            id: 4,
            category: 'batting',
            label: 'Batting Rating',
            value: `${Math.floor(batting / 10) * 10}–${Math.floor(batting / 10) * 10 + 9}`,
            emoji: '🏏',
        },
        {
            id: 5,
            category: 'bowling',
            label: 'Bowling Rating',
            value: `${Math.floor(bowling / 10) * 10}–${Math.floor(bowling / 10) * 10 + 9}`,
            emoji: '🎯',
        },
        { id: 6, category: 'specialty', label: 'Specialty', value: player.specialty, emoji: '⚡' },
        {
            id: 7,
            category: 'overall',
            label: 'Overall Rating',
            value: `${Math.floor(overall / 10) * 10}–${Math.floor(overall / 10) * 10 + 9}`,
            emoji: '📊',
        },
    ];
}
// GET /api/wordle/daily  — returns daily player clues + list of all player names for autocomplete
async function getDailyWordle(req, res, next) {
    try {
        const allPlayers = await Player_1.default.find({}).select('name').lean();
        const total = allPlayers.length;
        if (total === 0) {
            return res.status(404).json({ error: 'No players found' });
        }
        const idx = getDailyIndex(total);
        // Fetch the full daily player
        const allFull = await Player_1.default.find({}).sort({ _id: 1 }).lean();
        const dailyPlayer = allFull[idx % allFull.length];
        const clues = buildClues(dailyPlayer);
        const playerNames = allPlayers.map((p) => p.name);
        res.json({
            date: getTodayKey(),
            clues,
            playerNames,
            totalClues: clues.length,
        });
    }
    catch (error) {
        next(error);
    }
}
// POST /api/wordle/guess  — { guess: string, guessNumber: number }
async function submitWordleGuess(req, res, next) {
    try {
        const { guess, guessNumber } = req.body;
        if (!guess || typeof guess !== 'string') {
            throw new errors_1.BadRequestError('guess is required');
        }
        if (!guessNumber || guessNumber < 1 || guessNumber > 6) {
            throw new errors_1.BadRequestError('guessNumber must be 1–6');
        }
        const allFull = await Player_1.default.find({}).sort({ _id: 1 }).lean();
        const total = allFull.length;
        if (total === 0)
            return res.status(404).json({ error: 'No players found' });
        const idx = getDailyIndex(total);
        const dailyPlayer = allFull[idx % allFull.length];
        const isCorrect = dailyPlayer.name.toLowerCase().trim() === guess.toLowerCase().trim();
        const isLastGuess = guessNumber >= 6;
        const guessedPlayer = allFull.find((p) => p.name.toLowerCase().trim() === guess.toLowerCase().trim());
        // Build hint row comparing guess to answer
        let hintRow = {};
        if (guessedPlayer) {
            hintRow = {
                country: {
                    value: guessedPlayer.country,
                    match: guessedPlayer.country === dailyPlayer.country ? 'correct' : 'wrong',
                },
                role: {
                    value: guessedPlayer.role,
                    match: guessedPlayer.role === dailyPlayer.role ? 'correct' : 'wrong',
                },
                rarity: {
                    value: guessedPlayer.rarity,
                    match: guessedPlayer.rarity === dailyPlayer.rarity ? 'correct' : 'wrong',
                },
                batting: {
                    value: guessedPlayer.batting,
                    match: guessedPlayer.batting === dailyPlayer.batting
                        ? 'correct'
                        : Math.abs(guessedPlayer.batting - dailyPlayer.batting) <= 10
                            ? 'close'
                            : guessedPlayer.batting > dailyPlayer.batting
                                ? 'higher'
                                : 'lower',
                },
                bowling: {
                    value: guessedPlayer.bowling,
                    match: guessedPlayer.bowling === dailyPlayer.bowling
                        ? 'correct'
                        : Math.abs(guessedPlayer.bowling - dailyPlayer.bowling) <= 10
                            ? 'close'
                            : guessedPlayer.bowling > dailyPlayer.bowling
                                ? 'higher'
                                : 'lower',
                },
                overall: {
                    value: guessedPlayer.overall,
                    match: guessedPlayer.overall === dailyPlayer.overall
                        ? 'correct'
                        : Math.abs(guessedPlayer.overall - dailyPlayer.overall) <= 5
                            ? 'close'
                            : guessedPlayer.overall > dailyPlayer.overall
                                ? 'higher'
                                : 'lower',
                },
                specialty: {
                    value: guessedPlayer.specialty,
                    match: guessedPlayer.specialty === dailyPlayer.specialty ? 'correct' : 'wrong',
                },
            };
        }
        const response = {
            isCorrect,
            guessNumber,
            hintRow: guessedPlayer ? hintRow : null,
            playerFound: !!guessedPlayer,
        };
        // Reveal answer if correct or last guess
        if (isCorrect || isLastGuess) {
            response.answer = {
                name: dailyPlayer.name,
                country: dailyPlayer.country,
                role: dailyPlayer.role,
                rarity: dailyPlayer.rarity,
                overall: dailyPlayer.overall,
                batting: dailyPlayer.batting,
                bowling: dailyPlayer.bowling,
                specialty: dailyPlayer.specialty,
                image: dailyPlayer.image,
            };
        }
        res.json(response);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=wordleController.js.map