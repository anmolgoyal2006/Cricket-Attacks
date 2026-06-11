import mongoose, { Document, Schema } from 'mongoose';

export interface IRoundResult {
  roundNumber: number;
  playerCardId: mongoose.Types.ObjectId;
  playerCardName: string;
  playerStat: number;
  attribute: string;
  aiId: string;
  computerCardName: string;
  computerStat: number;
  winner: 'player' | 'computer' | 'tie';
}

export interface IBattle extends Document {
  user: mongoose.Types.ObjectId;
  playerSquad: mongoose.Types.ObjectId[];
  aiSquad: { aiId: string; name: string; role: string; batting: number; bowling: number; fielding: number; captaincy: number; pressure: number; overall: number }[];
  rounds: IRoundResult[];
  attributeOrder: string[];
  playerScore: number;
  computerScore: number;
  winner: 'player' | 'computer' | 'tie';
  rewards: {
    coins: number;
    xp: number;
    trophies: number;
    cardDrops: mongoose.Types.ObjectId[];
  };
  type: 'pve' | 'pvp';
  status: 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const roundResultSchema = new Schema<IRoundResult>(
  {
    roundNumber: { type: Number, required: true },
    playerCardId: { type: Schema.Types.ObjectId, ref: 'Player' },
    playerCardName: { type: String, required: true },
    playerStat: { type: Number, required: true },
    attribute: { type: String, required: true },
    aiId: { type: String },
    computerCardName: { type: String, required: true },
    computerStat: { type: Number, required: true },
    winner: {
      type: String,
      enum: ['player', 'computer', 'tie'],
      required: true,
    },
  },
  { _id: false }
);

const battleSchema = new Schema<IBattle>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    playerSquad: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    aiSquad: [
      {
        aiId: String,
        name: String,
        role: String,
        batting: Number,
        bowling: Number,
        fielding: Number,
        captaincy: Number,
        pressure: Number,
        overall: Number,
      },
    ],
    rounds: [roundResultSchema],
    attributeOrder: { type: [String], default: [] },
    playerScore: { type: Number, default: 0 },
    computerScore: { type: Number, default: 0 },
    winner: {
      type: String,
      enum: ['player', 'computer', 'tie'],
      default: 'tie',
    },
    rewards: {
      coins: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
      trophies: { type: Number, default: 0 },
      cardDrops: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    },
    type: {
      type: String,
      enum: ['pve', 'pvp'],
      default: 'pve',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

battleSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IBattle>('Battle', battleSchema);
