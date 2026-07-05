import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerMatchStats extends Document {
  matchId: mongoose.Types.ObjectId;
  playerId?: mongoose.Types.ObjectId | null;  // absent for guest players
  guestName?: string | null;                  // set when playerId is absent
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
      // No default — field is intentionally absent for guests so it doesn't
      // participate in any index. Setting default: null would store null and
      // trigger the { matchId, playerId } unique index for every guest doc.
    },
    guestName: {
      type: String,
      // No default — absent for registered players
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
// sparse:true means documents where playerId is absent are excluded from this index entirely
playerMatchStatsSchema.index({ matchId: 1, playerId: 1 }, { unique: true, sparse: true });
// Guest player uniqueness — only documents that have a guestName field participate
playerMatchStatsSchema.index({ matchId: 1, guestName: 1 }, { unique: true, sparse: true });

export default mongoose.model<IPlayerMatchStats>('PlayerMatchStats', playerMatchStatsSchema);
