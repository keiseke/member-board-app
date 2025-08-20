// src/app/api/admin/email-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { EmailLog } from '../../../../models/EmailLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 管理者権限チェック（必要に応じて実装）
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    // 配信統計を取得
    const stats = await EmailLog.getDeliveryStats(dateFrom)
    
    // 最近の失敗メール
    const recentFailures = await (EmailLog as any).find({
      status: 'failed',
      createdAt: { $gte: dateFrom }
    })
    .select('to subject type errorMessage createdAt deliveryAttempts')
    .sort({ createdAt: -1 })
    .limit(20)
    
    // 日別配信数
    const dailyStats = await (EmailLog as any).aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])

    // 再送対象メール
    const retryableEmails = await EmailLog.getRetryableEmails()

    return NextResponse.json({
      period: `${days}日間`,
      stats,
      recentFailures,
      dailyStats,
      retryableCount: retryableEmails.length
    })

  } catch (error) {
    console.error('メール統計取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}