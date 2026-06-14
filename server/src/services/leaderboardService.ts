import User from '../models/User';
import LeaderboardEntry from '../models/LeaderboardEntry';

const AVATARS = ['👑', '🏆', '🥇', '💥', '🌀', '⚡', '🧊', '🎯', '🎳', '⭐'];

export async function updateLeaderboardForUser(userId: string, season: number = 1): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // Leaderboard stats are PvP-only
  const battlesWon = user.pvpWins ?? 0;
  const battlesLost = user.pvpLosses ?? 0;
  const battlesDrawn = user.pvpDraws ?? 0;
  const battlesPlayed = user.pvpPlayed ?? 0;
  const winRate = battlesPlayed > 0 ? Math.round((battlesWon / battlesPlayed) * 100) : 0;

  await LeaderboardEntry.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      username: user.username,
      eloRating: user.eloRating,
      rankTier: user.rankTier,
      trophies: user.trophies,
      battlesPlayed,
      battlesWon,
      battlesLost,
      battlesDrawn,
      winRate,
      xp: user.xp,
      streak: user.battleStreak,
      season,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    },
    { upsert: true, new: true }
  );
}

export async function getLeaderboard(limit: number = 50, season?: number) {
  const filter: any = {};
  if (season !== undefined) filter.season = season;

  const entries = await LeaderboardEntry.find(filter)
    .sort({ eloRating: -1, battlesWon: -1 })
    .limit(limit)
    .lean();

  return entries.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user,
    username: entry.username,
    eloRating: entry.eloRating,
    rankTier: entry.rankTier,
    battlesWon: entry.battlesWon,
    battlesPlayed: entry.battlesPlayed,
    battlesLost: entry.battlesLost || 0,
    battesDrawn: entry.battlesDrawn || 0,
    trophies: entry.trophies || 0,
    winRate: entry.winRate,
    streak: entry.streak || 0,
    avatar: entry.avatar,
    season: entry.season,
    xp: entry.xp,
  }));
}

export async function getMyRank(userId: string, season?: number) {
  const filter: any = {};
  if (season !== undefined) filter.season = season;

  const allEntries = await LeaderboardEntry.find(filter)
    .sort({ eloRating: -1, battlesWon: -1 })
    .lean();

  const myEntry = allEntries.find((e) => e.user.toString() === userId);
  const rank = allEntries.findIndex((e) => e.user.toString() === userId) + 1;

  if (!myEntry) {
    const user = await User.findById(userId);
    if (!user) return null;
    return {
      rank: allEntries.length + 1,
      userId,
      username: user.username,
      eloRating: user.eloRating,
      rankTier: user.rankTier,
      trophies: user.trophies,
      battlesWon: user.pvpWins ?? 0,
      battlesPlayed: user.pvpPlayed ?? 0,
      winRate: (user.pvpPlayed ?? 0) > 0 ? Math.round(((user.pvpWins ?? 0) / (user.pvpPlayed ?? 0)) * 100) : 0,
      streak: user.battleStreak,
    };
  }

  return {
    rank,
    userId: myEntry.user,
    username: myEntry.username,
    eloRating: myEntry.eloRating,
    rankTier: myEntry.rankTier,
    trophies: myEntry.trophies,
    battlesWon: myEntry.battlesWon,
    battlesPlayed: myEntry.battlesPlayed,
    winRate: myEntry.winRate,
    streak: myEntry.streak || 0,
  };
}

export async function getLeaderboardAggregated(limit: number = 50) {
  return LeaderboardEntry.aggregate([
    { $sort: { eloRating: -1, battlesWon: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData',
      },
    },
    { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        rank: { $add: [{ $indexOfArray: [{ $map: { input: { $slice: [{ $sortArray: { input: '$eloRating', sortBy: -1 } }, limit] }, as: 'e', in: '$$e._id' } }, '$user'] }, 1] },
        username: 1,
        eloRating: 1,
        rankTier: 1,
        battlesPlayed: 1,
        battlesWon: 1,
        battlesLost: 1,
        winRate: 1,
        streak: 1,
        season: 1,
        avatar: 1,
        createdAt: '$userData.createdAt',
      },
    },
  ]);
}

export async function getLeaderboardBySeason(season: number, limit: number = 50) {
  return LeaderboardEntry.find({ season })
    .sort({ eloRating: -1 })
    .limit(limit)
    .lean();
}
