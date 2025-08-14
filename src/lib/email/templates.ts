// src/lib/email/templates.ts
import { emailConfig } from './config'

// メール認証テンプレート
export function createVerificationEmail(verificationUrl: string, userName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #ec4899; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #fdf2f8; }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #ec4899; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 会員登録ありがとうございます</h1>
        </div>
        <div class="content">
          <h2>メールアドレスの確認をお願いします</h2>
          ${userName ? `<p>${userName} 様</p>` : '<p>こんにちは！</p>'}
          <p>会員登録ありがとうございます。<br>
          以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">メールアドレスを確認する</a>
          </div>
          
          <p><strong>⚠️ 重要:</strong></p>
          <ul>
            <li>このリンクは24時間後に無効になります</li>
            <li>メール確認が完了するまで、一部機能が制限されます</li>
          </ul>
          
          <p>リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
          <code>${verificationUrl}</code></p>
        </div>
        <div class="footer">
          <p>このメールに心当たりがない場合は、無視してください。</p>
          <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
          <p>&copy; ${emailConfig.app.name}</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return {
    subject: '【重要】メールアドレスの確認をお願いします',
    html,
    text: `
会員登録ありがとうございます。

以下のリンクをクリックして、メールアドレスの確認を完了してください：
${verificationUrl}

※このリンクは24時間後に無効になります。

お問い合わせ: ${emailConfig.addresses.support}
    `.trim()
  }
}

// パスワードリセットテンプレート
export function createPasswordResetEmail(resetUrl: string, userName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #fffbeb; }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #f59e0b; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 パスワードリセットのご案内</h1>
        </div>
        <div class="content">
          ${userName ? `<p>${userName} 様</p>` : '<p>こんにちは</p>'}
          <p>パスワードリセットのリクエストを受け付けました。</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">新しいパスワードを設定する</a>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ セキュリティに関する重要な情報:</strong></p>
            <ul>
              <li>このリンクは1時間後に無効になります</li>
              <li>パスワードリセット後、全てのセッションが無効になります</li>
              <li>心当たりがない場合は、このメールを無視してください</li>
            </ul>
          </div>
          
          <p>リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
          <code>${resetUrl}</code></p>
        </div>
        <div class="footer">
          <p>このメールに心当たりがない場合は、すぐに管理者にお知らせください。</p>
          <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
          <p>&copy; ${emailConfig.app.name}</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return {
    subject: '【重要】パスワードリセットのご案内',
    html,
    text: `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
${resetUrl}

※このリンクは1時間後に無効になります。
※心当たりがない場合は、このメールを無視してください。

お問い合わせ: ${emailConfig.addresses.support}
    `.trim()
  }
}

// システム通知テンプレート
export function createSystemNoticeEmail(
  title: string, 
  content: string, 
  actionUrl?: string,
  actionLabel?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8fafc; }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #3b82f6; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 ${title}</h1>
        </div>
        <div class="content">
          <div style="white-space: pre-line;">${content}</div>
          
          ${actionUrl && actionLabel ? `
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">${actionLabel}</a>
          </div>
          ` : ''}
          
          <p>詳細はウェブサイトをご確認ください：<br>
          <a href="${emailConfig.app.baseUrl}">${emailConfig.app.baseUrl}</a></p>
        </div>
        <div class="footer">
          <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
          <p>&copy; ${emailConfig.app.name}</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return {
    subject: `【お知らせ】${title}`,
    html,
    text: `
${title}

${content}

詳細: ${emailConfig.app.baseUrl}
お問い合わせ: ${emailConfig.addresses.support}
    `.trim()
  }
}