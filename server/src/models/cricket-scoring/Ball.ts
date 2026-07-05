import mongoose, { Document, Schema } from 'mongoose';

export interface IBall extends Document {
  matchId: mongoose.Types.ObjectId;
  inningsId: mongoose.Types.ObjectId;
  over: number;
  ballNumber: number;
  // Player references — null when the player is a guest (no account)
  bowlerId: mongoose.Types.ObjectId | null;
  batsmanOnStrikeId: mongoose.Types.ObjectId | null;
  nonStrikerId: mongoose.Types.ObjectId | null;
  // Guest display names — set when corresponding ObjectId field is null
  guestBowler: string | null;
  guestBatsman: string | null;
  guestNonStriker: string | null;
  runsScored: number;
  extraType: 'wide' | 'noball' | 'bye' | 'legbye' | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'other' | null;
  dismissedPlayerId: mongoose.Types.ObjectId | null;
  guestDismissed: string | null;
  fielderId: mongoose.Types.ObjectId | null;
  guestFielder: string | null;
  isLegalDelivery: boolean;
  commentaryText: string | null;
  timestamp: Date;
}

const ballSchema = new Schema<IBall>(
  {
    matchId:   { type: Schema.Types.ObjectId, ref: 'ScoringMatch', required: true },
    inningsId: { type: Schema.Types.ObjectId, ref: 'Innings',      required: true },
    over:       { type: Number, required: true },
    ballNumber: { type: Number, required: true },

    bowlerId:          { type: Schema.Types.ObjectId, ref: 'User', default: null },
    batsmanOnStrikeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    nonStrikerId:      { type: Schema.Types.ObjectId, ref: 'User', default: null },

    guestBowler:     { type: String, default: null },
    guestBatsman:    { type: String, default: null },
    guestNonStriker: { type: String, default: null },

    runsScored: { type: Number, default: 0 },
    extraType: {
      type: String,
      enum: ['wide', 'noball', 'bye', 'legbye', null],
      default: null,
    },
    extraRuns: { type: Number, default: 0 },
    isWicket:  { type: Boolean, default: false },
    wicketType: {
      type: String,
      enum: ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'other', null],
      default: null,
    },
    dismissedPlayerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestDismissed:    { type: String, default: null },
    fielderId:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestFielder:      { type: String, default: null },

    isLegalDelivery: { type: Boolean, required: true },
    commentaryText:  { type: String, default: null },
    timestamp:       { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ballSchema.index({ matchId: 1 });
ballSchema.index({ inningsId: 1 });
// NOTE: No unique index on { matchId, inningsId, over, ballNumber } —
// illegal deliveries (wides, no-balls) share the same over+ballNumber as
// the next legal ball, so uniqueness cannot be enforced on this combination.

export default mongoose.model<IBall>('Ball', ballSchema);
