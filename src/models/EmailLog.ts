// src/models/EmailLog.ts
import mongoose from 'mongoose'

export interface IEmailLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId
  to: string[]
  from: string
  subject: string
  type: string
  status: 'sent' | 'failed' | 'pending'
  messageId?: string
  errorMessage?: string
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
  // 統計用フィールド
  userId?: mongoose.Types.ObjectId
  templateName?: string
  deliveryAttempts: number
}

const EmailLogSchema = new mongoose.Schema<IEmailLog>({
  to: [{
    type: String,
    required: true
  }],
  from: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: false,
    default: '(件名なし)'
  },
  type: {
    type: String,
    required: true,
    enum: ['verification', 'password_reset', 'welcome', 'system_notice', 'support_request'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
    index: true
  },
  messageId: {
    type: String,
    sparse: true // メッセージIDがある場合のみインデックス
  },
  errorMessage: {
    type: String
  },
  sentAt: {
    type: Date,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  templateName: {
    type: String,
    index: true
  },
  deliveryAttempts: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// インデックス定義
EmailLogSchema.index({ createdAt: -1 }) // 時系列ソート用
EmailLogSchema.index({ type: 1, status: 1 }) // 種別・ステータス別検索
EmailLogSchema.index({ userId: 1, createdAt: -1 }) // ユーザー別履歴
EmailLogSchema.index({ status: 1, deliveryAttempts: 1 }) // 再送処理用

// 統計メソッド
EmailLogSchema.statics.getDeliveryStats = async function(
  dateFrom?: Date,
  dateTo?: Date
) {
  const matchConditions: Record<string, unknown> = {}
  
  if (dateFrom || dateTo) {
    matchConditions.createdAt = {}
    if (dateFrom) matchConditions.createdAt.$gte = dateFrom
    if (dateTo) matchConditions.createdAt.$lte = dateTo
  }

  return await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalAttempts: { $sum: '$deliveryAttempts' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalAttempts: '$totalAttempts'
          }
        }
      }
    }
  ])
}

// 失敗メール再送対象取得
EmailLogSchema.statics.getRetryableEmails = async function(
  maxAttempts: number = 3,
  olderThanMinutes: number = 15
) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000)
  
  return await this.find({
    status: 'failed',
    deliveryAttempts: { $lt: maxAttempts },
    updatedAt: { $lt: cutoffTime }
  }).limit(50) // 一度に50件まで
}

// メールログクリーンアップ (古いログを削除)
EmailLogSchema.statics.cleanup = async function(daysToKeep: number = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: 'sent' // 送信成功したもののみ削除
  })
}

export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema)