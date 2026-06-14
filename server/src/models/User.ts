import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  coins: number;
  xp: number;
  level: number;
  trophies: number;
  ownedCards: mongoose.Types.ObjectId[];
  packsOpened: number;
  battlesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  eloRating: number;
  highestElo: number;
  rankTier: string;
  dailyPackOpenedAt: Date | null;
  dailyRewardClaimedAt: Date | null;
  battleStreak: number;
  longestStreak: number;
  firstLoginBonusClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    coins: {
      type: Number,
      default: 2500,
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    trophies: {
      type: Number,
      default: 0,
    },
    ownedCards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    packsOpened: {
      type: Number,
      default: 0,
    },
    battlesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
    eloRating: {
      type: Number,
      default: 1000,
    },
    highestElo: {
      type: Number,
      default: 1000,
    },
    rankTier: {
      type: String,
      default: 'Bronze',
    },
    dailyPackOpenedAt: {
      type: Date,
      default: null,
    },
    dailyRewardClaimedAt: {
      type: Date,
      default: null,
    },
    battleStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    firstLoginBonusClaimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.index({ eloRating: -1 });
userSchema.index({ wins: -1 });
userSchema.index({ rankTier: 1, eloRating: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
