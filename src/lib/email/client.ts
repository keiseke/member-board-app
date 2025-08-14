// src/lib/email/client.ts
import nodemailer from 'nodemailer'
import { emailConfig, EmailType, getEmailSender } from './config'

// トランスポーター作成
const transporter = nodemailer.createTransport(emailConfig.smtp)

// メール送信オプション型定義
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  type?: EmailType
  replyTo?: string
}

// メール送信関数
export async function sendEmail(options: SendEmailOptions) {
  try {
    // 送信者情報を取得
    const sender = getEmailSender(options.type || 'verification')
    
    const mailOptions = {
      from: {
        name: sender.name,
        address: sender.address
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // HTMLからテキスト生成
      replyTo: options.replyTo || emailConfig.addresses.support // デフォルトでサポートに返信
    }

    const result = await transporter.sendMail(mailOptions)
    
    console.log('📧 メール送信成功:', {
      messageId: result.messageId,
      to: options.to,
      subject: options.subject,
      from: sender.address
    })

    return {
      success: true,
      messageId: result.messageId,
      sender: sender.address
    }
  } catch (error) {
    console.error('❌ メール送信エラー:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sender: null
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