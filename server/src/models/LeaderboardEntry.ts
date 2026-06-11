import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  user: mongoose.Types.ObjectId;
  username: string;
  trophies: number;
  battlesPlayed: number;
  battlesWon: number;
  winRate: number;
  xp: number;
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
    winRate: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
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

leaderboardEntrySchema.index({ trophies: -1 });
leaderboardEntrySchema.index({ winRate: -1 });

export default mongoose.model<ILeaderboardEntry>('LeaderboardEntry', leaderboardEntrySchema);
