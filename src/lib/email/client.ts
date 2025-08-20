// src/lib/email/client.ts
import nodemailer from 'nodemailer'
import { emailConfig, EmailType, getEmailSender } from './config'
import { connectDB } from '@/lib/mongodb'
import { EmailLog } from '@/models/EmailLog'

// トランスポーター作成
const transporter = nodemailer.createTransport(emailConfig.smtp as any)

// メール送信オプション型定義
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  type?: EmailType
  replyTo?: string
  userId?: string // ログ用ユーザーID
  templateName?: string // ログ用テンプレート名
}

// メール送信関数
export async function sendEmail(options: SendEmailOptions) {
  let emailLogId: string | undefined
  
  try {
    // 送信者情報を取得
    const sender = getEmailSender(options.type || 'verification')
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    // メールログを作成
    await connectDB()
    const finalSubject = options.subject || '(件名なし)'
    const emailLog = await EmailLog.create({
      to: recipients,
      from: sender.address,
      subject: finalSubject,
      type: options.type || 'verification',
      status: 'pending',
      userId: options.userId,
      templateName: options.templateName,
      deliveryAttempts: 1
    })
    emailLogId = emailLog._id.toString()
    
    const mailOptions = {
      from: {
        name: sender.name,
        address: sender.address
      },
      to: options.to,
      subject: finalSubject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // HTMLからテキスト生成
      replyTo: options.replyTo || emailConfig.addresses.support // デフォルトでサポートに返信
    }

    const result = await transporter.sendMail(mailOptions)
    
    // 送信成功時にログを更新
    await EmailLog.findByIdAndUpdate(emailLogId, {
      status: 'sent',
      messageId: result.messageId,
      sentAt: new Date()
    })
    
    console.log('📧 メール送信成功:', {
      logId: emailLogId,
      messageId: result.messageId,
      to: options.to,
      subject: finalSubject,
      from: sender.address
    })

    return {
      success: true,
      messageId: result.messageId,
      sender: sender.address,
      logId: emailLogId
    }
  } catch (error) {
    console.error('❌ メール送信エラー:', error)
    
    // 送信失敗時にログを更新
    if (emailLogId) {
      await EmailLog.findByIdAndUpdate(emailLogId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sender: null,
      logId: emailLogId
    }
  }
}

// 接続テスト関数
export async function testEmailConnection() {
  try {
    await transporter.verify()
    return { success: true, message: 'SMTP接続成功' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 複数のメールアドレスに一括送信
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  options?: {
    type?: EmailType
    text?: string
    batchSize?: number
    delay?: number
  }
) {
  const batchSize = options?.batchSize || 10
  const delay = options?.delay || 1000 // 1秒間隔
  const results = []

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    const batchPromises = batch.map(email => 
      sendEmail({
        to: email,
        subject,
        html,
        text: options?.text,
        type: options?.type
      })
    )

    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults)

    // 次のバッチまで待機
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return results
}

// メール認証送信関数
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const { createVerificationEmail } = await import('./templates')
  
  const verificationUrl = `${emailConfig.app.baseUrl}/auth/verify-email?token=${token}`
  const template = await createVerificationEmail(verificationUrl, name)
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'verification'
  })
}

// パスワードリセット送信関数
export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const { createPasswordResetEmail } = await import('./templates')
  
  const resetUrl = `${emailConfig.app.baseUrl}/auth/reset-password?token=${token}`
  const template = await createPasswordResetEmail(resetUrl, name)
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'password_reset'
  })
}

// ウェルカムメール送信関数
export async function sendWelcomeEmail(email: string, name: string) {
  const { createWelcomeEmail } = await import('./templates')
  
  const template = await createWelcomeEmail(name)
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'welcome'
  })
}