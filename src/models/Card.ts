import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  title: string;
  description: string;
  status: string;
  userId: mongoose.Types.ObjectId; 
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['todo', 'doing', 'done'],
      default: 'todo'
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// Index for better query performance
CardSchema.index({ userId: 1 });

export default mongoose.model<ICard>('Card', CardSchema);
