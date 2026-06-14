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

// Enforce at most one active season at the DB level.
// A sparse unique index on a boolean field only works if we store the field
// exclusively on the active document, so we use a partial filter expression.
seasonSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_season',
  }
);

export default mongoose.model<ISeason>('Season', seasonSchema);
