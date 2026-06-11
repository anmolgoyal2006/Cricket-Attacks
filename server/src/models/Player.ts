import mongoose, { Document, Schema } from 'mongoose';

export interface IFormatStats {
  matches: number;
  runs: number;
  avg: number;
  sr: number;
  hundreds: number;
  fifties: number;
  wickets: number;
  economy: number;
  bestScore?: string;
}

export interface IPlayer extends Document {
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
  overall: number;
  specialty: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legend';
  image: string;
  formats: {
    odi: IFormatStats;
    test: IFormatStats;
    t20: IFormatStats;
    worldCup: IFormatStats;
    knockouts: IFormatStats;
    bilateral: IFormatStats;
  };
  createdAt: Date;
  updatedAt: Date;
}

const formatStatsSchema = new Schema<IFormatStats>(
  {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    avg: { type: Number, default: 0 },
    sr: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    bestScore: { type: String, default: '' },
  },
  { _id: false }
);

const playerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    batting: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bowling: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    fielding: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    captaincy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    pressure: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    specialty: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['Common', 'Rare', 'Epic', 'Legend'],
      required: true,
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/300x400/1e3a8a/ffffff?text=Player',
    },
    formats: {
      odi: { type: formatStatsSchema, default: () => ({}) },
      test: { type: formatStatsSchema, default: () => ({}) },
      t20: { type: formatStatsSchema, default: () => ({}) },
      worldCup: { type: formatStatsSchema, default: () => ({}) },
      knockouts: { type: formatStatsSchema, default: () => ({}) },
      bilateral: { type: formatStatsSchema, default: () => ({}) },
    },
  },
  {
    timestamps: true,
  }
);

playerSchema.index({ overall: -1 });
playerSchema.index({ rarity: 1, overall: -1 });
playerSchema.index({ role: 1 });
playerSchema.index({ name: 'text', specialty: 'text', country: 'text' });

export default mongoose.model<IPlayer>('Player', playerSchema);
