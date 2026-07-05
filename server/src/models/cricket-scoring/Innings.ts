import mongoose, { Document, Schema } from 'mongoose';

export interface IInnings extends Document {
  matchId: mongoose.Types.ObjectId;
  inningsNumber: 1 | 2;
  battingTeam: 'teamA' | 'teamB';
  bowlingTeam: 'teamA' | 'teamB';
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  target?: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inningsSchema = new Schema<IInnings>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'ScoringMatch',
      required: true,
    },
    inningsNumber: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    battingTeam: {
      type: String,
      enum: ['teamA', 'teamB'],
      required: true,
    },
    bowlingTeam: {
      type: String,
      enum: ['teamA', 'teamB'],
      required: true,
    },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    oversCompleted: { type: Number, default: 0 },
    ballsInCurrentOver: { type: Number, default: 0 },
    extras: {
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      byes: { type: Number, default: 0 },
      legByes: { type: Number, default: 0 },
    },
    target: { type: Number, default: null },
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

inningsSchema.index({ matchId: 1, inningsNumber: 1 }, { unique: true });

export default mongoose.model<IInnings>('Innings', inningsSchema);
