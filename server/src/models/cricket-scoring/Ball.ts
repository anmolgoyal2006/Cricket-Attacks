import mongoose, { Document, Schema } from 'mongoose';

export interface IBall extends Document {
  matchId: mongoose.Types.ObjectId;
  inningsId: mongoose.Types.ObjectId;
  over: number;
  ballNumber: number;
  bowlerId: mongoose.Types.ObjectId;
  batsmanOnStrikeId: mongoose.Types.ObjectId;
  nonStrikerId: mongoose.Types.ObjectId;
  runsScored: number;
  extraType: 'wide' | 'noball' | 'bye' | 'legbye' | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'other' | null;
  dismissedPlayerId: mongoose.Types.ObjectId | null;
  fielderId: mongoose.Types.ObjectId | null;
  isLegalDelivery: boolean;
  commentaryText: string | null;
  timestamp: Date;
}

const ballSchema = new Schema<IBall>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'ScoringMatch',
      required: true,
    },
    inningsId: {
      type: Schema.Types.ObjectId,
      ref: 'Innings',
      required: true,
    },
    over: { type: Number, required: true },
    ballNumber: { type: Number, required: true },
    bowlerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    batsmanOnStrikeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nonStrikerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    runsScored: { type: Number, default: 0 },
    extraType: {
      type: String,
      enum: ['wide', 'noball', 'bye', 'legbye', null],
      default: null,
    },
    extraRuns: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    wicketType: {
      type: String,
      enum: ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'other', null],
      default: null,
    },
    dismissedPlayerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fielderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isLegalDelivery: { type: Boolean, required: true },
    commentaryText: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // using explicit timestamp field above
  }
);

ballSchema.index({ matchId: 1 });
ballSchema.index({ inningsId: 1 });
ballSchema.index({ matchId: 1, inningsId: 1, over: 1, ballNumber: 1 });

export default mongoose.model<IBall>('Ball', ballSchema);
