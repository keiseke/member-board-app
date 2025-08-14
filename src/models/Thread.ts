import mongoose, { Schema, Document } from 'mongoose';

export interface IThread extends Document {
  title: string;
  description: string;
  category: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  postCount: number;
}

const ThreadSchema = new Schema<IThread>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  creator: {
    type: String,
    required: true,
    default: '匿名',
    maxlength: 50
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);