import mongoose, { Document, Schema } from 'mongoose';

export interface ISeason extends Document {
  seasonNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seasonSchema = new Schema<ISeason>(
  {
    seasonNumber: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

seasonSchema.index({ isActive: 1, seasonNumber: -1 });

export default mongoose.model<ISeason>('Season', seasonSchema);
