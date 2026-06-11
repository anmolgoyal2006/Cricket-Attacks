import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  user: mongoose.Types.ObjectId;
  username: string;
  eloRating: number;
  rankTier: string;
  trophies: number;
  battlesPlayed: number;
  battlesWon: number;
  battlesLost: number;
  battlesDrawn: number;
  winRate: number;
  xp: number;
  streak: number;
  season: number;
  avatar: string;
  updatedAt: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    eloRating: {
      type: Number,
      default: 1000,
    },
    rankTier: {
      type: String,
      default: 'Bronze',
    },
    trophies: {
      type: Number,
      default: 0,
    },
    battlesPlayed: {
      type: Number,
      default: 0,
    },
    battlesWon: {
      type: Number,
      default: 0,
    },
    battlesLost: {
      type: Number,
      default: 0,
    },
    battlesDrawn: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    season: {
      type: Number,
      default: 1,
    },
    avatar: {
      type: String,
      default: '🏏',
    },
  },
  {
    timestamps: true,
  }
);

leaderboardEntrySchema.index({ season: 1, eloRating: -1 });
leaderboardEntrySchema.index({ season: 1, winRate: -1 });
leaderboardEntrySchema.index({ eloRating: -1 });
leaderboardEntrySchema.index({ winRate: -1 });

export default mongoose.model<ILeaderboardEntry>('LeaderboardEntry', leaderboardEntrySchema);
