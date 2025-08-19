// src/lib/email/templates.ts
import { render } from '@react-email/render'
import { emailConfig } from './config'
import WelcomeEmail from '@/components/email/WelcomeEmail'
import VerificationEmail from '@/components/email/VerificationEmail'
import PasswordResetEmail from '@/components/email/PasswordResetEmail'

// メール認証テンプレート (React Email版)
export async function createVerificationEmail(verificationUrl: string, userName?: string) {
  let html: string
  
  try {
    html = await render(
      VerificationEmail({
        userName,
        verificationUrl,
        supportEmail: emailConfig.addresses.support,
        appName: emailConfig.app.name
      })
    )
  } catch (error) {
    // テスト環境やReactが利用できない場合のフォールバック
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 メールアドレスの確認</h1>
          </div>
          <div class="content">
            <p>${userName ? `${userName} さん、` : ''}会員登録ありがとうございます。</p>
            <p>以下のボタンをクリックして、メールアドレスの確認を完了してください：</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">メールアドレスを確認</a>
            </div>
            <p>※このリンクは24時間後に無効になります。</p>
          </div>
          <div class="footer">
            <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
            <p>&copy; ${emailConfig.app.name}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  const text = `
会員登録ありがとうございます。

以下のリンクをクリックして、メールアドレスの確認を完了してください：
${verificationUrl}

※このリンクは24時間後に無効になります。

お問い合わせ: ${emailConfig.addresses.support}
  `.trim()
  
  return {
    subject: '【重要】メールアドレスの確認をお願いします',
    html,
    text
  }
}

// パスワードリセットテンプレート (React Email版)
export async function createPasswordResetEmail(resetUrl: string, userName?: string) {
  let html: string
  
  try {
    html = await render(
      PasswordResetEmail({
        userName,
        resetUrl,
        supportEmail: emailConfig.addresses.support,
        appName: emailConfig.app.name
      })
    )
  } catch (error) {
    // テスト環境やReactが利用できない場合のフォールバック
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 パスワードリセット</h1>
          </div>
          <div class="content">
            <p>${userName ? `${userName} さん、` : ''}パスワードリセットのリクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">パスワードをリセット</a>
            </div>
            <p>※このリンクは1時間後に無効になります。</p>
            <p>※心当たりがない場合は、このメールを無視してください。</p>
          </div>
          <div class="footer">
            <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
            <p>&copy; ${emailConfig.app.name}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  const text = `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
${resetUrl}

※このリンクは1時間後に無効になります。
※心当たりがない場合は、このメールを無視してください。

お問い合わせ: ${emailConfig.addresses.support}
  `.trim()
  
  return {
    subject: '【重要】パスワードリセットのご案内',
    html,
    text
  }
}

// ウェルカムメールテンプレート (React Email版)
export async function createWelcomeEmail(userName: string, dashboardUrl?: string) {
  let html: string
  
  try {
    html = await render(
      WelcomeEmail({
        userName,
        dashboardUrl: dashboardUrl || `${emailConfig.app.baseUrl}/dashboard`,
        supportEmail: emailConfig.addresses.support,
        appName: emailConfig.app.name
      })
    )
  } catch (error) {
    // テスト環境やReactが利用できない場合のフォールバック
    const finalDashboardUrl = dashboardUrl || `${emailConfig.app.baseUrl}/dashboard`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
          .feature { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ${emailConfig.app.name}へようこそ！</h1>
          </div>
          <div class="content">
            <p><strong>${userName}</strong> さん</p>
            <p>メール認証が完了し、${emailConfig.app.name}のメンバーになりました！<br>
            これからコミュニティでの交流をお楽しみください。</p>
            
            <h3>ご利用いただける機能：</h3>
            <div class="feature">📝 掲示板投稿 - スレッドを作成して、他のメンバーと情報交換</div>
            <div class="feature">💬 コミュニティ参加 - 様々なトピックのディスカッション</div>
            <div class="feature">📱 通知機能 - 重要な更新やお知らせをメール受信</div>
            
            <div style="text-align: center;">
              <a href="${finalDashboardUrl}" class="button">ダッシュボードへ</a>
            </div>
            
            <h3>始め方のヒント：</h3>
            <ol>
              <li>プロフィールを設定して他のメンバーに自己紹介</li>
              <li>興味のあるトピックを探して話題に参加</li>
              <li>積極的に交流してコミュニティを盛り上げる</li>
            </ol>
          </div>
          <div class="footer">
            <p>お問い合わせ: <a href="mailto:${emailConfig.addresses.support}">${emailConfig.addresses.support}</a></p>
            <p>&copy; ${emailConfig.app.name}チーム一同</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  const text = `
${emailConfig.app.name}へようこそ！

${userName} さん

メール認証が完了し、${emailConfig.app.name}のメンバーになりました！
これからコミュニティでの交流をお楽しみください。

ご利用いただける機能：
• 掲示板投稿 - スレッドを作成して、他のメンバーと情報交換
• コミュニティ参加 - 様々なトピックのディスカッション
• 通知機能 - 重要な更新やお知らせをメール受信

ダッシュボード: ${dashboardUrl || `${emailConfig.app.baseUrl}/dashboard`}

始め方のヒント：
1. プロフィールを設定して他のメンバーに自己紹介
2. 興味のあるトピックを探して話題に参加
3. 積極的に交流してコミュニティを盛り上げる

ご不明な点: ${emailConfig.addresses.support}
${emailConfig.app.name}チーム一同
  `.trim()
  
  return {
    subject: `🎉 ${emailConfig.app.name}へようこそ！`,
    html,
    text
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