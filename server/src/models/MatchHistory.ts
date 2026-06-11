import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchHistory extends Document {
  user: mongoose.Types.ObjectId;
  opponentId: mongoose.Types.ObjectId;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  eloChange: number;
  eloBefore: number;
  eloAfter: number;
  playerScore: number;
  opponentScore: number;
  attributeOrder: string[];
  type: 'ranked' | 'casual';
  season: number;
  createdAt: Date;
  updatedAt: Date;
}

const matchHistorySchema = new Schema<IMatchHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opponentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponentName: { type: String, required: true },
    result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
    eloChange: { type: Number, default: 0 },
    eloBefore: { type: Number, default: 1000 },
    eloAfter: { type: Number, default: 1000 },
    playerScore: { type: Number, default: 0 },
    opponentScore: { type: Number, default: 0 },
    attributeOrder: { type: [String], default: [] },
    type: { type: String, enum: ['ranked', 'casual'], default: 'ranked' },
    season: { type: Number, default: 1 },
  },
  { timestamps: true }
);

matchHistorySchema.index({ user: 1, createdAt: -1 });
matchHistorySchema.index({ user: 1, type: 1, createdAt: -1 });

export default mongoose.model<IMatchHistory>('MatchHistory', matchHistorySchema);
