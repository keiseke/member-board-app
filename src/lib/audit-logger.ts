import mongoose from 'mongoose'
import crypto from 'crypto'

export interface AuditEvent {
  userId?: string
  sessionId?: string
  action: string
  resource: string
  resourceId?: string
  ip: string
  userAgent: string
  success: boolean
  timestamp?: Date
  details?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  method?: string
  endpoint?: string
  statusCode?: number
  duration?: number
}

interface AuditLogDocument extends AuditEvent {
  _id: mongoose.Types.ObjectId
  eventId: string
  fingerprint: string
}

// 監査ログスキーマ
const auditLogSchema = new mongoose.Schema<AuditLogDocument>({
  eventId: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: String, index: true },
  ip: { type: String, required: true, index: true },
  userAgent: { type: String, required: true },
  success: { type: Boolean, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  details: { type: mongoose.Schema.Types.Mixed },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  method: { type: String },
  endpoint: { type: String },
  statusCode: { type: Number },
  duration: { type: Number },
  fingerprint: { type: String, required: true, index: true }
}, {
  timestamps: true,
  collection: 'audit_logs'
})

// インデックス設定
auditLogSchema.index({ timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ severity: 1, timestamp: -1 })

const AuditLog = mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema)

export class AuditLogger {
  private static instance: AuditLogger
  private criticalActions = new Set([
    'LOGIN_FAILED',
    'LOGIN_SUCCESS',
    'LOGOUT',
    'ADMIN_ACCESS',
    'USER_ROLE_CHANGE',
    'PASSWORD_CHANGE',
    'EMAIL_CHANGE',
    'DATA_EXPORT',
    'SYSTEM_CONFIG_CHANGE',
    'RATE_LIMIT_EXCEEDED',
    'CSRF_VIOLATION',
    'XSS_ATTEMPT',
    'SQL_INJECTION_ATTEMPT',
    'UNAUTHORIZED_ACCESS'
  ])

  constructor() {
    if (AuditLogger.instance) {
      return AuditLogger.instance
    }
    AuditLogger.instance = this
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * 監査ログを記録
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      const eventId = crypto.randomUUID()
      const fingerprint = this.generateFingerprint(event)
      const severity = this.determineSeverity(event)

      const auditLog: AuditLogDocument = {
        ...event,
        _id: new mongoose.Types.ObjectId(),
        eventId,
        fingerprint,
        severity,
        timestamp: event.timestamp || new Date()
      }

      // データベースに保存
      await AuditLog.create(auditLog)

      // 重要なイベントの場合は追加処理
      if (this.isCriticalEvent(event) || severity === 'critical') {
        await this.handleCriticalEvent(auditLog)
      }

      // コンソールログも出力（開発環境）
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${event.action}: ${event.resource} by ${event.userId || 'anonymous'}`)
      }

    } catch (error) {
      console.error('Audit logging failed:', error)
      // 監査ログが失敗してもアプリケーションは継続
    }
  }

  /**
   * 複数の監査ログを一括記録
   */
  async logBatch(events: AuditEvent[]): Promise<void> {
    try {
      const auditLogs = events.map(event => ({
        ...event,
        _id: new mongoose.Types.ObjectId(),
        eventId: crypto.randomUUID(),
        fingerprint: this.generateFingerprint(event),
        severity: this.determineSeverity(event),
        timestamp: event.timestamp || new Date()
      }))

      await AuditLog.insertMany(auditLogs)
    } catch (error) {
      console.error('Batch audit logging failed:', error)
    }
  }

  /**
   * 監査ログの検索
   */
  async search(filters: {
    userId?: string
    action?: string
    resource?: string
    severity?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<AuditLogDocument[]> {
    const query: any = {}

    if (filters.userId) query.userId = filters.userId
    if (filters.action) query.action = new RegExp(filters.action, 'i')
    if (filters.resource) query.resource = filters.resource
    if (filters.severity) query.severity = filters.severity

    if (filters.startDate || filters.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = filters.startDate
      if (filters.endDate) query.timestamp.$lte = filters.endDate
    }

    return await AuditLog
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .skip(filters.offset || 0)
      .exec() as AuditLogDocument[]
  }

  /**
   * 統計情報の取得
   */
  async getStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const now = new Date()
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const since = new Date(now.getTime() - timeframes[timeframe])

    const [totalEvents, failedEvents, severityStats, actionStats] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: since } }),
      AuditLog.countDocuments({ timestamp: { $gte: since }, success: false }),
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    return {
      timeframe,
      totalEvents,
      failedEvents,
      successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents * 100).toFixed(2) : 0,
      severityBreakdown: severityStats,
      topActions: actionStats
    }
  }

  /**
   * イベントの重要度を判定
   */
  private determineSeverity(event: AuditEvent): 'low' | 'medium' | 'high' | 'critical' {
    if (event.severity) return event.severity

    // アクションベースの判定
    if ([
      'LOGIN_FAILED',
      'RATE_LIMIT_EXCEEDED',
      'CSRF_VIOLATION',
      'XSS_ATTEMPT',
      'UNAUTHORIZED_ACCESS'
    ].includes(event.action)) {
      return 'high'
    }

    if ([
      'ADMIN_ACCESS',
      'USER_ROLE_CHANGE',
      'SYSTEM_CONFIG_CHANGE',
      'PASSWORD_CHANGE'
    ].includes(event.action)) {
      return 'critical'
    }

    if ([
      'LOGIN_SUCCESS',
      'DATA_MODIFICATION',
      'EMAIL_CHANGE'
    ].includes(event.action)) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 重要なイベントかどうか判定
   */
  private isCriticalEvent(event: AuditEvent): boolean {
    return this.criticalActions.has(event.action)
  }

  /**
   * イベントのフィンガープリントを生成
   */
  private generateFingerprint(event: AuditEvent): string {
    const data = `${event.action}:${event.resource}:${event.userId || 'anonymous'}:${event.ip}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
  }

  /**
   * 重要なイベントの追加処理
   */
  private async handleCriticalEvent(event: AuditLogDocument): Promise<void> {
    try {
      // アラート送信やリアルタイム通知などの実装
      console.warn(`[CRITICAL AUDIT EVENT] ${event.action}: ${event.resource}`, {
        eventId: event.eventId,
        userId: event.userId,
        ip: event.ip,
        timestamp: event.timestamp
      })

      // 必要に応じて外部システムへの通知
      // await this.sendAlert(event)
    } catch (error) {
      console.error('Critical event handling failed:', error)
    }
  }

  /**
   * 古い監査ログのクリーンアップ
   */
  async cleanup(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      })

      console.log(`Cleaned up ${result.deletedCount} old audit logs`)
    } catch (error) {
      console.error('Audit log cleanup failed:', error)
    }
  }
}

// シングルトンインスタンス
export const auditLogger = AuditLogger.getInstance()