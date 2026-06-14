"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIERS = void 0;
exports.getTier = getTier;
exports.getTierIndex = getTierIndex;
exports.getNextTierProgress = getNextTierProgress;
exports.calculateElo = calculateElo;
exports.TIERS = [
    { name: 'Bronze', min: 0, max: 1099 },
    { name: 'Silver', min: 1100, max: 1299 },
    { name: 'Gold', min: 1300, max: 1499 },
    { name: 'Platinum', min: 1500, max: 1699 },
    { name: 'Diamond', min: 1700, max: 1899 },
    { name: 'Master', min: 1900, max: 9999 },
];
function getTier(elo) {
    for (const tier of exports.TIERS) {
        if (elo >= tier.min && elo <= tier.max)
            return tier.name;
    }
    return 'Bronze';
}
function getTierIndex(tierName) {
    return exports.TIERS.findIndex((t) => t.name === tierName);
}
function getNextTierProgress(elo) {
    const currentTier = getTier(elo);
    const currentIdx = getTierIndex(currentTier);
    const currentTierDef = exports.TIERS[currentIdx];
    if (currentIdx >= exports.TIERS.length - 1) {
        return { currentTier, nextTier: null, progress: 100, eloToNext: 0 };
    }
    const nextTier = exports.TIERS[currentIdx + 1];
    const range = nextTier.min - currentTierDef.min;
    const progress = Math.min(100, Math.round(((elo - currentTierDef.min) / range) * 100));
    const eloToNext = Math.max(0, nextTier.min - elo);
    return { currentTier, nextTier: nextTier.name, progress, eloToNext };
}
const K = 32;
function calculateElo(ratingA, ratingB, scoreA, scoreB) {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
    const actualA = scoreA > scoreB ? 1 : scoreA === scoreB ? 0.5 : 0;
    const actualB = scoreB > scoreA ? 1 : scoreB === scoreA ? 0.5 : 0;
    const diff = Math.abs(ratingA - ratingB);
    const kAdj = diff > 200 ? K * 0.75 : K;
    const changeA = Math.round(kAdj * (actualA - expectedA));
    const changeB = Math.round(kAdj * (actualB - expectedB));
    return {
        newRatingA: Math.max(0, ratingA + changeA),
        newRatingB: Math.max(0, ratingB + changeB),
        changeA,
        changeB,
    };
}
//# sourceMappingURL=eloService.js.map