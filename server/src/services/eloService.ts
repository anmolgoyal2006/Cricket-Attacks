export const TIERS = [
  { name: 'Bronze', min: 0, max: 1099 },
  { name: 'Silver', min: 1100, max: 1299 },
  { name: 'Gold', min: 1300, max: 1499 },
  { name: 'Platinum', min: 1500, max: 1699 },
  { name: 'Diamond', min: 1700, max: 1899 },
  { name: 'Master', min: 1900, max: 9999 },
];

export function getTier(elo: number): string {
  for (const tier of TIERS) {
    if (elo >= tier.min && elo <= tier.max) return tier.name;
  }
  return 'Bronze';
}

export function getTierIndex(tierName: string): number {
  return TIERS.findIndex((t) => t.name === tierName);
}

export function getNextTierProgress(elo: number): { currentTier: string; nextTier: string | null; progress: number; eloToNext: number } {
  const currentTier = getTier(elo);
  const currentIdx = getTierIndex(currentTier);
  const currentTierDef = TIERS[currentIdx];

  if (currentIdx >= TIERS.length - 1) {
    return { currentTier, nextTier: null, progress: 100, eloToNext: 0 };
  }

  const nextTier = TIERS[currentIdx + 1];
  const range = nextTier.min - currentTierDef.min;
  const progress = Math.min(100, Math.round(((elo - currentTierDef.min) / range) * 100));
  const eloToNext = Math.max(0, nextTier.min - elo);

  return { currentTier, nextTier: nextTier.name, progress, eloToNext };
}

const K = 32;

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number
): { newRatingA: number; newRatingB: number; changeA: number; changeB: number } {
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
