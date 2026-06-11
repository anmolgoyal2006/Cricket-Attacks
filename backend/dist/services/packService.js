"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPack = openPack;
const Player_1 = __importDefault(require("../models/Player"));
const PACK_CONFIG = {
    basic: { cost: 0, cards: 3, rarities: { Common: 0.6, Rare: 0.25, Epic: 0.12, Legend: 0.03 } },
    premium: { cost: 500, cards: 5, rarities: { Common: 0.3, Rare: 0.35, Epic: 0.25, Legend: 0.1 } },
    legendary: { cost: 1000, cards: 7, rarities: { Common: 0.1, Rare: 0.2, Epic: 0.4, Legend: 0.3 } },
};
function pickRarity(config) {
    const rand = Math.random();
    let cumulative = 0;
    for (const [rarity, probability] of Object.entries(config.rarities)) {
        cumulative += probability;
        if (rand <= cumulative)
            return rarity;
    }
    return 'Common';
}
async function openPack(packType) {
    const config = PACK_CONFIG[packType];
    if (!config) {
        throw new Error('Invalid pack type');
    }
    const rarityPicks = [];
    for (let i = 0; i < config.cards; i++) {
        rarityPicks.push(pickRarity(config));
    }
    const cards = await Player_1.default.aggregate([
        { $match: { rarity: { $in: rarityPicks } } },
        { $sample: { size: config.cards } },
    ]);
    const playerCards = await Player_1.default.find({ _id: { $in: cards.map((c) => c._id) } });
    return { cards: playerCards, cost: config.cost };
}
//# sourceMappingURL=packService.js.map