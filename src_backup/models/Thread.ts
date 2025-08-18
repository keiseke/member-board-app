import mongoose, { Schema, Document } from 'mongoose';

export interface IThread extends Document {
  title: string;
  description: string;
  category: string;
  creator: mongoose.Types.ObjectId;
  creatorName: string;
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    required: true,
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