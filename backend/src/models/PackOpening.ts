import mongoose, { Document, Schema } from 'mongoose';

export interface IPackOpening extends Document {
  user: mongoose.Types.ObjectId;
  packType: 'basic' | 'premium' | 'legendary';
  cards: mongoose.Types.ObjectId[];
  cost: number;
  createdAt: Date;
}

const packOpeningSchema = new Schema<IPackOpening>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packType: {
      type: String,
      enum: ['basic', 'premium', 'legendary'],
      required: true,
    },
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    cost: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

packOpeningSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IPackOpening>('PackOpening', packOpeningSchema);
