import mongoose, { Document, Schema } from 'mongoose';

export interface IScoringMatch extends Document {
  teamA: {
    name: string;
    players: mongoose.Types.ObjectId[];
  };
  teamB: {
    name: string;
    players: mongoose.Types.ObjectId[];
  };
  oversFormat: number;
  tossWonBy: 'teamA' | 'teamB';
  tossDecision: 'bat' | 'bowl';
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  currentInnings: number;
  result: {
    winner: string;
    margin: string;
    method: string;
  } | null;
  scorers: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  venue?: string;
  statsProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scoringMatchSchema = new Schema<IScoringMatch>(
  {
    teamA: {
      name: { type: String, required: true },
      players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    teamB: {
      name: { type: String, required: true },
      players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    oversFormat: { type: Number, required: true },
    tossWonBy: {
      type: String,
      enum: ['teamA', 'teamB'],
      required: true,
    },
    tossDecision: {
      type: String,
      enum: ['bat', 'bowl'],
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'innings_break', 'completed'],
      default: 'upcoming',
    },
    currentInnings: {
      type: Number,
      default: 1,
    },
    result: {
      type: new Schema(
        {
          winner: { type: String, default: null },
          margin: { type: String, default: null },
          method: { type: String, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    scorers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    venue: { type: String, default: null },
    statsProcessed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

scoringMatchSchema.index({ status: 1 });
scoringMatchSchema.index({ createdBy: 1 });

export default mongoose.model<IScoringMatch>('ScoringMatch', scoringMatchSchema);
