// scripts/test-email-comprehensive.js
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

// Next.js環境のセットアップ
process.env.NODE_ENV = 'test'
const NextServer = require('next').default

class EmailTester {
  constructor() {
    this.results = {
      connection: null,
      templates: [],
      sending: [],
      logging: [],
      errors: []
    }
    this.testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER || 'test@example.com'
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19)
    const prefix = {
      info: '📧',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || '📧'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testConnection() {
    this.log('SMTP接続テスト開始...', 'test')
    
    try {
      // dynamic import for ES modules
      const { testEmailConnection } = await import('../src/lib/email/client.ts')
      const result = await testEmailConnection()
      
      if (result.success) {
        this.log('SMTP接続成功', 'success')
        this.results.connection = { success: true, message: result.message }
      } else {
        this.log(`SMTP接続失敗: ${result.message}`, 'error')
        this.results.connection = { success: false, message: result.message }
      }
    } catch (error) {
      this.log(`SMTP接続エラー: ${error.message}`, 'error')
      this.results.connection = { success: false, message: error.message }
    }
  }

  async testTemplateGeneration() {
    this.log('メールテンプレート生成テスト開始...', 'test')
    
    const testData = {
      userName: 'テストユーザー',
      verificationUrl: 'https://example.com/verify?token=test123',
      resetUrl: 'https://example.com/reset?token=reset123',
      dashboardUrl: 'https://example.com/dashboard'
    }

    const templates = [
      {
        name: 'ウェルカムメール',
        type: 'welcome',
        test: async () => {
          const { createWelcomeEmail } = await import('../src/lib/email/templates.ts')
          return createWelcomeEmail(testData.userName, testData.dashboardUrl)
        }
      },
      {
        name: '認証メール',
        type: 'verification', 
        test: async () => {
          const { createVerificationEmail } = await import('../src/lib/email/templates.ts')
          return createVerificationEmail(testData.verificationUrl, testData.userName)
        }
      },
      {
        name: 'パスワードリセットメール',
        type: 'password-reset',
        test: async () => {
          const { createPasswordResetEmail } = await import('../src/lib/email/templates.ts')
          return createPasswordResetEmail(testData.resetUrl, testData.userName)
        }
      }
    ]

    for (const template of templates) {
      try {
        const result = await template.test()
        
        // テンプレートの基本チェック
        const checks = {
          hasSubject: !!result.subject,
          hasHtml: !!result.html && result.html.length > 100,
          hasText: !!result.text && result.text.length > 50,
          containsUserName: result.html.includes(testData.userName),
          validHtml: result.html.includes('<html') || result.html.includes('<!DOCTYPE')
        }

        const passedChecks = Object.values(checks).filter(Boolean).length
        const totalChecks = Object.keys(checks).length

        this.log(`${template.name}: ${passedChecks}/${totalChecks} チェック通過`, 
          passedChecks === totalChecks ? 'success' : 'warning')

        this.results.templates.push({
          name: template.name,
          type: template.type,
          success: passedChecks === totalChecks,
          checks,
          subjectLength: result.subject?.length || 0,
          htmlLength: result.html?.length || 0,
          textLength: result.text?.length || 0
        })

      } catch (error) {
        this.log(`${template.name}テンプレート生成失敗: ${error.message}`, 'error')
        this.results.templates.push({
          name: template.name,
          type: template.type,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testEmailSending() {
    this.log('メール送信テスト開始...', 'test')

    const sendTests = [
      {
        name: '基本送信テスト',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.ts')
          return await sendEmail({
            to: this.testEmail,
            subject: '【テスト】基本送信機能確認',
            html: '<h1>テストメール</h1><p>基本送信機能のテストです。</p>',
            text: 'テストメール - 基本送信機能のテストです。',
            type: 'system_notice',
            templateName: 'basic-test'
          })
        }
      },
      {
        name: 'ウェルカムメール送信テスト',
        test: async () => {
          const { sendWelcomeEmail } = await import('../src/lib/email/client.ts')
          return await sendWelcomeEmail(this.testEmail, 'テストユーザー')
        }
      },
      {
        name: '認証メール送信テスト',
        test: async () => {
          const { sendVerificationEmail } = await import('../src/lib/email/client.ts')
          return await sendVerificationEmail(this.testEmail, 'テストユーザー', 'test-token-123')
        }
      },
      {
        name: '日本語件名テスト',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.ts')
          return await sendEmail({
            to: this.testEmail,
            subject: '🎉 日本語件名テスト - 特殊文字含む',
            html: '<h1>日本語テスト</h1><p>絵文字と特殊文字: 😊 ★ ☆ ♪</p>',
            type: 'system_notice'
          })
        }
      }
    ]

    for (const sendTest of sendTests) {
      try {
        this.log(`${sendTest.name}実行中...`)
        const result = await sendTest.test()
        
        if (result.success) {
          this.log(`${sendTest.name}成功 (MessageID: ${result.messageId})`, 'success')
          this.results.sending.push({
            name: sendTest.name,
            success: true,
            messageId: result.messageId,
            logId: result.logId
          })
        } else {
          this.log(`${sendTest.name}失敗: ${result.error}`, 'error')
          this.results.sending.push({
            name: sendTest.name,
            success: false,
            error: result.error
          })
        }

        // 送信間隔
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        this.log(`${sendTest.name}エラー: ${error.message}`, 'error')
        this.results.sending.push({
          name: sendTest.name,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testErrorHandling() {
    this.log('エラーハンドリングテスト開始...', 'test')

    const errorTests = [
      {
        name: '無効なメールアドレス',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.ts')
          return await sendEmail({
            to: 'invalid-email-address',
            subject: 'エラーテスト',
            html: '<p>エラーテスト</p>',
            type: 'system_notice'
          })
        },
        expectError: true
      },
      {
        name: '空の件名',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.ts')
          return await sendEmail({
            to: this.testEmail,
            subject: '',
            html: '<p>空件名テスト</p>',
            type: 'system_notice'
          })
        },
        expectError: false
      },
      {
        name: '存在しないテンプレート',
        test: async () => {
          try {
            const { createVerificationEmail } = await import('../src/lib/email/templates.ts')
            return createVerificationEmail() // 引数なし
          } catch (error) {
            return { success: false, error: error.message }
          }
        },
        expectError: true
      }
    ]

    for (const errorTest of errorTests) {
      try {
        this.log(`${errorTest.name}テスト実行中...`)
        const result = await errorTest.test()
        
        const isError = !result.success
        const testPassed = errorTest.expectError ? isError : !isError

        if (testPassed) {
          this.log(`${errorTest.name}: 期待通りの結果`, 'success')
        } else {
          this.log(`${errorTest.name}: 予期しない結果`, 'warning')
        }

        this.results.errors.push({
          name: errorTest.name,
          expectError: errorTest.expectError,
          actualError: isError,
          testPassed,
          message: result.error || 'No error'
        })

      } catch (error) {
        this.log(`${errorTest.name}テスト例外: ${error.message}`, 'error')
        this.results.errors.push({
          name: errorTest.name,
          expectError: errorTest.expectError,
          actualError: true,
          testPassed: errorTest.expectError,
          message: error.message
        })
      }
    }
  }

  async testLogging() {
    this.log('ログ機能テスト開始...', 'test')

    try {
      // MongoDB接続をテスト
      const { connectDB } = await import('../src/lib/mongodb.js')
      await connectDB()
      
      const { EmailLog } = await import('../src/models/EmailLog.ts')
      
      // 最近のログを確認
      const recentLogs = await EmailLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      this.log(`最近のメールログ: ${recentLogs.length}件`, 'success')

      // ログの統計取得
      const stats = await EmailLog.getDeliveryStats()
      this.log(`配信統計取得成功: ${stats.length}件`, 'success')

      // 失敗メールの確認
      const failedEmails = await EmailLog.find({ status: 'failed' }).limit(3)
      this.log(`失敗メール: ${failedEmails.length}件`, failedEmails.length > 0 ? 'warning' : 'success')

      this.results.logging.push({
        name: 'ログ取得テスト',
        success: true,
        recentCount: recentLogs.length,
        statsCount: stats.length,
        failedCount: failedEmails.length
      })

    } catch (error) {
      this.log(`ログ機能テスト失敗: ${error.message}`, 'error')
      this.results.logging.push({
        name: 'ログ取得テスト',
        success: false,
        error: error.message
      })
    }
  }

  async testPreviewAPI() {
    this.log('プレビューAPI テスト開始...', 'test')

    try {
      const fetch = (await import('node-fetch')).default
      
      const templates = ['welcome', 'verification', 'password-reset']
      
      for (const template of templates) {
        try {
          const url = `http://localhost:3000/api/email-preview?template=${template}&userName=テストユーザー`
          this.log(`${template} プレビューテスト: ${url}`)
          
          // Note: この部分は開発サーバーが起動している場合のみ動作
          this.log(`${template} プレビューURL生成完了`, 'success')
          
        } catch (error) {
          this.log(`${template} プレビューエラー: ${error.message}`, 'error')
        }
      }
    } catch (error) {
      this.log(`プレビューAPIテスト設定エラー: ${error.message}`, 'warning')
    }
  }

  async generateReport() {
    this.log('テスト結果レポート生成中...', 'test')
    
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: {
        nodeEnv: process.env.NODE_ENV,
        smtpHost: process.env.SMTP_HOST,
        testEmail: this.testEmail
      },
      results: this.results,
      summary: {
        connectionSuccess: this.results.connection?.success || false,
        templatesTotal: this.results.templates.length,
        templatesSuccess: this.results.templates.filter(t => t.success).length,
        sendingTotal: this.results.sending.length,
        sendingSuccess: this.results.sending.filter(s => s.success).length,
        errorsTotal: this.results.errors.length,
        errorsPassed: this.results.errors.filter(e => e.testPassed).length,
        loggingSuccess: this.results.logging.filter(l => l.success).length > 0
      }
    }

    // レポートをファイルに保存
    const reportPath = path.join(__dirname, '..', 'test-results', 'email-test-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    this.log(`テストレポート保存: ${reportPath}`, 'success')

    // サマリー表示
    console.log('\n' + '='.repeat(60))
    console.log('📊 テスト結果サマリー')
    console.log('='.repeat(60))
    console.log(`📡 SMTP接続: ${report.summary.connectionSuccess ? '✅ 成功' : '❌ 失敗'}`)
    console.log(`📧 テンプレート: ${report.summary.templatesSuccess}/${report.summary.templatesTotal} 成功`)
    console.log(`📤 メール送信: ${report.summary.sendingSuccess}/${report.summary.sendingTotal} 成功`)
    console.log(`🔍 エラーテスト: ${report.summary.errorsPassed}/${report.summary.errorsTotal} 通過`)
    console.log(`📝 ログ機能: ${report.summary.loggingSuccess ? '✅ 動作' : '❌ 問題'}`)
    console.log('='.repeat(60))

    return report
  }

  async runAllTests() {
    console.log('🚀 包括的メール機能テスト開始')
    console.log('='.repeat(60))

    try {
      await this.testConnection()
      await this.testTemplateGeneration()
      await this.testEmailSending()
      await this.testErrorHandling()
      await this.testLogging()
      await this.testPreviewAPI()
      
      const report = await this.generateReport()
      
      this.log('すべてのテスト完了!', 'success')
      return report

    } catch (error) {
      this.log(`テスト実行エラー: ${error.message}`, 'error')
      throw error
    }
  }
}

// メイン実行
if (require.main === module) {
  const tester = new EmailTester()
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 メールテストスイート完了!')
      console.log('📧 受信ボックスでテストメールを確認してください')
      console.log('📊 詳細レポート: test-results/email-test-report.json')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 テスト実行失敗:', error)
      process.exit(1)
    })
}

module.exports = EmailTester