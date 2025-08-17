import mongoose, { Document, Schema } from 'mongoose';

export interface IPost {
  title: string;
  content: string;
  threadId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostDocument extends IPost, Document {}

// クライアント用の型（_idをstringで持つ）
export interface IPostWithId extends IPost {
  _id: string;
}

const PostSchema = new Schema<IPostDocument>({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  threadId: {
    type: Schema.Types.ObjectId,
    ref: 'Thread',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true,
    maxlength: 50,
  },
}, {
  timestamps: true,
});

const Post = mongoose.models.Post || mongoose.model<IPostDocument>('Post', PostSchema);

export default Post;