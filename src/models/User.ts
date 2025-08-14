// src/models/User.ts
import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, '名前を入力してください'],
    trim: true,
    maxlength: [50, '名前は50文字以内で入力してください']
  },
  email: {
    type: String,
    required: [true, 'メールアドレスを入力してください'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '正しいメールアドレスを入力してください']
  },
  password: {
    type: String,
    required: [true, 'パスワードを入力してください'],
    minlength: [6, 'パスワードは6文字以上で入力してください'],
    select: false // デフォルトでは取得しない
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
})

// インデックス
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ emailVerificationToken: 1 })
UserSchema.index({ resetPasswordToken: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)