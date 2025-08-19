import { NextRequest, NextResponse } from 'next/server'
import { auditLogger } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  // Vercel Cron認証チェック
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting audit log cleanup...')
    
    // 90日以上前のログを削除
    await auditLogger.cleanup(90)
    
    // 成功ログを記録
    await auditLogger.log({
      action: 'AUDIT_LOG_CLEANUP',
      resource: 'system',
      success: true,
      details: { retentionDays: 90 },
      ip: 'system',
      userAgent: 'cron-job'
    })

    console.log('Audit log cleanup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Audit logs cleanup completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Audit log cleanup failed:', error)
    
    // エラーログを記録
    await auditLogger.log({
      action: 'AUDIT_LOG_CLEANUP_FAILED',
      resource: 'system',
      success: false,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        retentionDays: 90 
      },
      ip: 'system',
      userAgent: 'cron-job'
    })

    return NextResponse.json({
      success: false,
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}