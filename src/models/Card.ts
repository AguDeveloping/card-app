import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  title: string;
  description: string;
  status: string;
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
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo'
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ICard>('Card', CardSchema);
