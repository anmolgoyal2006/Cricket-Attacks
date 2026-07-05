import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerCareerStats extends Document {
  playerId: mongoose.Types.ObjectId;
  matchesPlayed: number;
  totalRuns: number;
  totalBallsFaced: number;
  highestScore: number;
  totalFours: number;
  totalSixes: number;
  battingAverage: number;
  battingStrikeRate: number;
  timesOut: number;
  totalWickets: number;
  totalOversBowled: number;
  totalRunsConceded: number;
  bestBowlingFigures: {
    wickets: number;
    runs: number;
  };
  bowlingAverage: number;
  economyRate: number;
  totalCatches: number;
  totalRunOuts: number;
  totalStumpings: number;
  lastUpdated: Date;
}

const playerCareerStatsSchema = new Schema<IPlayerCareerStats>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    matchesPlayed: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalBallsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    totalFours: { type: Number, default: 0 },
    totalSixes: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    battingStrikeRate: { type: Number, default: 0 },
    timesOut: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOversBowled: { type: Number, default: 0 },
    totalRunsConceded: { type: Number, default: 0 },
    bestBowlingFigures: {
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
    },
    bowlingAverage: { type: Number, default: 0 },
    economyRate: { type: Number, default: 0 },
    totalCatches: { type: Number, default: 0 },
    totalRunOuts: { type: Number, default: 0 },
    totalStumpings: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // using explicit lastUpdated field
  }
);

playerCareerStatsSchema.index({ playerId: 1 }, { unique: true });

export default mongoose.model<IPlayerCareerStats>('PlayerCareerStats', playerCareerStatsSchema);
