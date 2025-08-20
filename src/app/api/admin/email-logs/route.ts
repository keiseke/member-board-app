// src/app/api/admin/email-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { EmailLog } from '@/models/EmailLog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'pending', 'sent', 'failed'
    const type = searchParams.get('type') // 'verification', 'password_reset', etc.

    await connectDB()

    // フィルター構築
    const filter: any = {}
    if (status) filter.status = status
    if (type) filter.type = type

    const logs = await (EmailLog as any)
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('to from subject type status createdAt sentAt errorMessage deliveryAttempts')

    // 統計情報
    const stats = await Promise.all([
      (EmailLog as any).countDocuments({ status: 'sent' }),
      (EmailLog as any).countDocuments({ status: 'failed' }),
      (EmailLog as any).countDocuments({ status: 'pending' }),
      (EmailLog as any).countDocuments({ type: 'verification' }),
    ])

    return NextResponse.json({
      logs,
      stats: {
        sent: stats[0],
        failed: stats[1],
        pending: stats[2],
        verification: stats[3]
      },
      total: logs.length
    })

  } catch (error) {
    console.error('❌ メールログ取得エラー:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}