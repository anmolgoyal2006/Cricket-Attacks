import User from '../models/User';

const DAILY_REWARD_COINS = 200;
const DAILY_REWARD_XP = 50;

const STREAK_BONUS = [0, 0, 50, 75, 100, 150, 200, 300, 500];
const STREAK_XP_BONUS = [0, 0, 20, 30, 40, 50, 60, 80, 100];

export async function claimDailyReward(userId: string): Promise<{
  coins: number;
  xp: number;
  streak: number;
  streakBonusCoins: number;
  streakBonusXp: number;
  totalCoins: number;
  totalXp: number;
}> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const lastClaim = user.dailyRewardClaimedAt ? new Date(user.dailyRewardClaimedAt) : null;

  let streak = 1;
  if (lastClaim) {
    const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      throw new Error('Daily reward already claimed today');
    }
    streak = diffHours < 48 ? (user.battleStreak || 0) + 1 : 1;
  }

  const streakIdx = Math.min(streak, STREAK_BONUS.length - 1);
  const streakBonusCoins = STREAK_BONUS[streakIdx];
  const streakBonusXp = STREAK_XP_BONUS[streakIdx];
  const totalCoins = DAILY_REWARD_COINS + streakBonusCoins;
  const totalXp = DAILY_REWARD_XP + streakBonusXp;

  await User.findByIdAndUpdate(userId, {
    $set: { dailyRewardClaimedAt: now, battleStreak: streak },
    $inc: { coins: totalCoins, xp: totalXp },
  });

  if (streak > (user.longestStreak || 0)) {
    await User.findByIdAndUpdate(userId, { longestStreak: streak });
  }

  return {
    coins: DAILY_REWARD_COINS,
    xp: DAILY_REWARD_XP,
    streak,
    streakBonusCoins,
    streakBonusXp,
    totalCoins,
    totalXp,
  };
}

export function getWinRewards(isWin: boolean, isDraw: boolean, streak: number): { coins: number; xp: number } {
  if (isDraw) {
    return { coins: 50, xp: 25 };
  }
  if (!isWin) {
    return { coins: 20, xp: 10 };
  }
  const streakBonus = Math.min(streak, 10) * 5;
  return {
    coins: 100 + streakBonus,
    xp: 50 + Math.floor(streakBonus / 2),
  };
}
