import Player, { IPlayer } from '../models/Player';

interface PackResult {
  cards: IPlayer[];
  cost: number;
}

const PACK_CONFIG = {
  basic: { cost: 0, cards: 3, rarities: { Common: 0.6, Rare: 0.25, Epic: 0.12, Legend: 0.03 } },
  premium: { cost: 500, cards: 5, rarities: { Common: 0.3, Rare: 0.35, Epic: 0.25, Legend: 0.1 } },
  legendary: { cost: 1000, cards: 7, rarities: { Common: 0.1, Rare: 0.2, Epic: 0.4, Legend: 0.3 } },
};

function pickRarity(config: { rarities: Record<string, number> }): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const [rarity, probability] of Object.entries(config.rarities)) {
    cumulative += probability;
    if (rand <= cumulative) return rarity;
  }
  return 'Common';
}

export async function openPack(packType: 'basic' | 'premium' | 'legendary'): Promise<PackResult> {
  const config = PACK_CONFIG[packType];
  if (!config) {
    throw new Error('Invalid pack type');
  }

  // Pick a rarity for each card slot
  const rarityPicks: string[] = [];
  for (let i = 0; i < config.cards; i++) {
    rarityPicks.push(pickRarity(config));
  }

  // Group picks by rarity so we fetch the right number per rarity
  const rarityCounts: Record<string, number> = {};
  for (const rarity of rarityPicks) {
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
  }

  // Fetch one random card per rarity slot independently
  const cardPromises = Object.entries(rarityCounts).map(([rarity, count]) =>
    Player.aggregate([
      { $match: { rarity } },
      { $sample: { size: count } },
    ])
  );

  const cardGroups = await Promise.all(cardPromises);
  const allCardDocs = cardGroups.flat();

  // Fetch full Mongoose documents to preserve model methods/virtuals
  const playerCards = await Player.find({ _id: { $in: allCardDocs.map((c: any) => c._id) } });

  return { cards: playerCards, cost: config.cost };
}
