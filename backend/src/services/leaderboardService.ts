import User from '../models/User';
import LeaderboardEntry from '../models/LeaderboardEntry';

const AVATARS = ['👑', '🏆', '🥇', '💥', '🌀', '⚡', '🧊', '🎯', '🎳', '⭐'];

export async function updateLeaderboardForUser(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const battlesWon = user.wins;
  const battlesPlayed = user.battlesPlayed;
  const winRate = battlesPlayed > 0 ? Math.round((battlesWon / battlesPlayed) * 100) : 0;

  await LeaderboardEntry.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      username: user.username,
      trophies: user.trophies,
      battlesPlayed,
      battlesWon,
      winRate,
      xp: user.xp,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    },
    { upsert: true, new: true }
  );
}

export async function getLeaderboard(limit: number = 10) {
  const entries = await LeaderboardEntry.find()
    .sort({ trophies: -1, winRate: -1 })
    .limit(limit)
    .lean();

  return entries.map((entry, index) => ({
    rank: index + 1,
    username: entry.username,
    battlesWon: entry.battlesWon,
    trophies: entry.trophies,
    winRate: entry.winRate,
    avatar: entry.avatar,
  }));
}

export async function getMyRank(userId: string) {
  const allEntries = await LeaderboardEntry.find()
    .sort({ trophies: -1, winRate: -1 })
    .lean();

  const myEntry = allEntries.find((e) => e.user.toString() === userId);
  const rank = allEntries.findIndex((e) => e.user.toString() === userId) + 1;

  if (!myEntry) {
    const user = await User.findById(userId);
    if (!user) return null;
    return {
      rank: allEntries.length + 1,
      username: user.username,
      trophies: user.trophies,
      battlesWon: user.wins,
      battlesPlayed: user.battlesPlayed,
      winRate: user.battlesPlayed > 0 ? Math.round((user.wins / user.battlesPlayed) * 100) : 0,
    };
  }

  return {
    rank,
    username: myEntry.username,
    trophies: myEntry.trophies,
    battlesWon: myEntry.battlesWon,
    battlesPlayed: myEntry.battlesPlayed,
    winRate: myEntry.winRate,
  };
}
