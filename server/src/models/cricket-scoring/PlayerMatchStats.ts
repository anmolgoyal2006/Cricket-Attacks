import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerMatchStats extends Document {
  matchId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId | null;  // null for guest players
  guestName: string | null;                  // set when playerId is null
  battingStats: {
    runs: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    dismissalType: string | null;
    strikeRate: number;
  };
  bowlingStats: {
    oversBowled: number;
    ballsBowled: number;
    runsConceded: number;
    wickets: number;
    maidens: number;
    economy: number;
  };
  fieldingStats: {
    catches: number;
    runOuts: number;
    stumpings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const playerMatchStatsSchema = new Schema<IPlayerMatchStats>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'ScoringMatch',
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,       // null for guests
    },
    guestName: {
      type: String,
      default: null,       // set when playerId is null
    },
    battingStats: {
      runs: { type: Number, default: 0 },
      ballsFaced: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      isOut: { type: Boolean, default: false },
      dismissalType: { type: String, default: null },
      strikeRate: { type: Number, default: 0 },
    },
    bowlingStats: {
      oversBowled: { type: Number, default: 0 },
      ballsBowled: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
    },
    fieldingStats: {
      catches: { type: Number, default: 0 },
      runOuts: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

playerMatchStatsSchema.index({ matchId: 1 });
// Removed standalone playerId index — it's a duplicate; the compound index below covers it
playerMatchStatsSchema.index({ matchId: 1, playerId: 1 }, { unique: true, sparse: true });
// Guest player index — keyed by guestName when no userId
playerMatchStatsSchema.index({ matchId: 1, guestName: 1 }, { unique: true, sparse: true });

export default mongoose.model<IPlayerMatchStats>('PlayerMatchStats', playerMatchStatsSchema);
