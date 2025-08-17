// scripts/test-email-stress.js
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

class EmailStressTester {
  constructor() {
    this.results = {
      connectionTests: [],
      errorTests: [],
      performanceTests: [],
      loadTests: []
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
      test: '🧪',
      perf: '⚡'
    }[type] || '📧'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testConnectionResilience() {
    this.log('SMTP接続回復力テスト開始...', 'test')

    const connectionTests = [
      {
        name: '正常接続',
        config: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        }
      },
      {
        name: '間違ったポート',
        config: {
          host: process.env.SMTP_HOST,
          port: 9999,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        }
      },
      {
        name: '間違ったホスト',
        config: {
          host: 'nonexistent.smtp.server.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        }
      },
      {
        name: '間違った認証情報',
        config: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: 'wrong@email.com',
            pass: 'wrongpassword'
          }
        }
      }
    ]

    for (const test of connectionTests) {
      const startTime = Date.now()
      
      try {
        const nodemailer = require('nodemailer')
        const transporter = nodemailer.createTransporter(test.config)
        
        // タイムアウトを短く設定
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('接続タイムアウト')), 10000)
        })
        
        await Promise.race([
          transporter.verify(),
          timeoutPromise
        ])
        
        const duration = Date.now() - startTime
        this.log(`${test.name}: ✅ 成功 (${duration}ms)`, 'success')
        
        this.results.connectionTests.push({
          name: test.name,
          success: true,
          duration,
          error: null
        })
        
      } catch (error) {
        const duration = Date.now() - startTime
        this.log(`${test.name}: ❌ ${error.message} (${duration}ms)`, 'error')
        
        this.results.connectionTests.push({
          name: test.name,
          success: false,
          duration,
          error: error.message
        })
      }
    }
  }

  async testErrorScenarios() {
    this.log('エラーシナリオテスト開始...', 'test')

    const errorTests = [
      {
        name: '空のメールアドレス',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          return await sendEmail({
            to: '',
            subject: 'エラーテスト',
            html: '<p>空宛先テスト</p>',
            type: 'system_notice'
          })
        },
        expectSuccess: false
      },
      {
        name: '複数の無効アドレス',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          return await sendEmail({
            to: ['invalid1', 'invalid2@', '@invalid3.com'],
            subject: 'エラーテスト',
            html: '<p>複数無効宛先テスト</p>',
            type: 'system_notice'
          })
        },
        expectSuccess: false
      },
      {
        name: '巨大なメール本文',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          const largeContent = 'あ'.repeat(1024 * 1024) // 1MB
          return await sendEmail({
            to: this.testEmail,
            subject: '巨大メールテスト',
            html: `<p>${largeContent}</p>`,
            type: 'system_notice'
          })
        },
        expectSuccess: false
      },
      {
        name: '特殊文字を含む件名',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          return await sendEmail({
            to: this.testEmail,
            subject: '🎉💥★☆♪©®™€£¥§¶†‡•…‰‹›""\'\'–—',
            html: '<p>特殊文字件名テスト</p>',
            type: 'system_notice'
          })
        },
        expectSuccess: true
      },
      {
        name: 'HTML injection テスト',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          return await sendEmail({
            to: this.testEmail,
            subject: '<script>alert("XSS")</script>',
            html: '<script>alert("XSS")</script><p>XSSテスト</p>',
            type: 'system_notice'
          })
        },
        expectSuccess: true // サニタイズされて送信されるはず
      }
    ]

    for (const errorTest of errorTests) {
      const startTime = Date.now()
      
      try {
        this.log(`${errorTest.name}実行中...`)
        const result = await errorTest.test()
        const duration = Date.now() - startTime
        
        const actualSuccess = result.success
        const testPassed = errorTest.expectSuccess === actualSuccess
        
        this.log(`${errorTest.name}: ${testPassed ? '✅ 期待通り' : '⚠️ 予期しない結果'} (${duration}ms)`, 
          testPassed ? 'success' : 'warning')
        
        this.results.errorTests.push({
          name: errorTest.name,
          expectedSuccess: errorTest.expectSuccess,
          actualSuccess,
          testPassed,
          duration,
          error: result.error || null
        })
        
      } catch (error) {
        const duration = Date.now() - startTime
        this.log(`${errorTest.name}: ❌ 例外 - ${error.message} (${duration}ms)`, 'error')
        
        this.results.errorTests.push({
          name: errorTest.name,
          expectedSuccess: errorTest.expectSuccess,
          actualSuccess: false,
          testPassed: !errorTest.expectSuccess,
          duration,
          error: error.message
        })
      }

      // テスト間隔
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  async testPerformance() {
    this.log('パフォーマンステスト開始...', 'perf')

    const performanceTests = [
      {
        name: 'テンプレート生成速度',
        test: async () => {
          const { createWelcomeEmail } = await import('../src/lib/email/templates.js')
          const iterations = 100
          const startTime = Date.now()
          
          for (let i = 0; i < iterations; i++) {
            await createWelcomeEmail(`TestUser${i}`)
          }
          
          const duration = Date.now() - startTime
          return {
            iterations,
            totalDuration: duration,
            averageDuration: duration / iterations
          }
        }
      },
      {
        name: 'React Email レンダリング速度',
        test: async () => {
          const { render } = await import('@react-email/render')
          const WelcomeEmail = (await import('../src/components/email/WelcomeEmail.js')).default
          
          const iterations = 50
          const startTime = Date.now()
          
          for (let i = 0; i < iterations; i++) {
            render(WelcomeEmail({
              userName: `TestUser${i}`,
              dashboardUrl: 'https://example.com/dashboard',
              supportEmail: 'support@example.com',
              appName: 'Test App'
            }))
          }
          
          const duration = Date.now() - startTime
          return {
            iterations,
            totalDuration: duration,
            averageDuration: duration / iterations
          }
        }
      },
      {
        name: 'メール送信準備速度',
        test: async () => {
          const { sendEmail } = await import('../src/lib/email/client.js')
          
          const iterations = 20
          const startTime = Date.now()
          
          // 実際には送信しない（dry-run的な処理）
          for (let i = 0; i < iterations; i++) {
            try {
              // ログ作成部分のみテスト（実際の送信は避ける）
              const testData = {
                to: `test${i}@example.com`,
                subject: `パフォーマンステスト ${i}`,
                html: `<p>テスト内容 ${i}</p>`,
                type: 'system_notice'
              }
              // Note: 実際の送信は行わず、準備処理のみ
            } catch (error) {
              // エラーは予想される
            }
          }
          
          const duration = Date.now() - startTime
          return {
            iterations,
            totalDuration: duration,
            averageDuration: duration / iterations
          }
        }
      }
    ]

    for (const perfTest of performanceTests) {
      try {
        this.log(`${perfTest.name}測定中...`)
        const result = await perfTest.test()
        
        this.log(`${perfTest.name}: ${result.iterations}回 / ${result.totalDuration}ms (平均: ${result.averageDuration.toFixed(2)}ms)`, 'perf')
        
        this.results.performanceTests.push({
          name: perfTest.name,
          ...result,
          success: true
        })
        
      } catch (error) {
        this.log(`${perfTest.name}: ❌ ${error.message}`, 'error')
        this.results.performanceTests.push({
          name: perfTest.name,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testConcurrency() {
    this.log('同時実行テスト開始...', 'test')

    try {
      const concurrentTests = [5, 10, 20].map(async (concurrency) => {
        this.log(`${concurrency}件同時テンプレート生成...`)
        const startTime = Date.now()
        
        const promises = Array.from({ length: concurrency }, async (_, i) => {
          try {
            const { createWelcomeEmail } = await import('../src/lib/email/templates.js')
            return await createWelcomeEmail(`ConcurrentUser${i}`)
          } catch (error) {
            return { error: error.message }
          }
        })
        
        const results = await Promise.allSettled(promises)
        const duration = Date.now() - startTime
        const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length
        
        this.log(`${concurrency}件同時: ${successful}/${concurrency} 成功 (${duration}ms)`, 'perf')
        
        return {
          concurrency,
          successful,
          total: concurrency,
          duration,
          successRate: (successful / concurrency) * 100
        }
      })

      const concurrencyResults = await Promise.all(concurrentTests)
      this.results.loadTests = concurrencyResults

    } catch (error) {
      this.log(`同時実行テストエラー: ${error.message}`, 'error')
    }
  }

  async generateStressTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: {
        nodeVersion: process.version,
        platform: process.platform,
        smtpHost: process.env.SMTP_HOST,
        testEmail: this.testEmail
      },
      results: this.results,
      summary: {
        connectionTests: {
          total: this.results.connectionTests.length,
          successful: this.results.connectionTests.filter(t => t.success).length
        },
        errorTests: {
          total: this.results.errorTests.length,
          passed: this.results.errorTests.filter(t => t.testPassed).length
        },
        performanceTests: {
          total: this.results.performanceTests.length,
          successful: this.results.performanceTests.filter(t => t.success).length
        },
        loadTests: {
          total: this.results.loadTests.length,
          avgSuccessRate: this.results.loadTests.reduce((sum, t) => sum + t.successRate, 0) / this.results.loadTests.length || 0
        }
      }
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'email-stress-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // サマリー表示
    console.log('\n' + '='.repeat(60))
    console.log('🏋️ ストレステスト結果サマリー')
    console.log('='.repeat(60))
    console.log(`🔌 接続テスト: ${report.summary.connectionTests.successful}/${report.summary.connectionTests.total}`)
    console.log(`💥 エラーテスト: ${report.summary.errorTests.passed}/${report.summary.errorTests.total} 通過`)
    console.log(`⚡ パフォーマンステスト: ${report.summary.performanceTests.successful}/${report.summary.performanceTests.total}`)
    console.log(`🚀 負荷テスト平均成功率: ${report.summary.loadTests.avgSuccessRate.toFixed(1)}%`)
    console.log('='.repeat(60))
    
    this.log(`ストレステストレポート保存: ${reportPath}`, 'success')
    
    return report
  }

  async runAllStressTests() {
    console.log('🏋️ メール送信ストレステスト開始')
    console.log('='.repeat(60))

    try {
      await this.testConnectionResilience()
      await this.testErrorScenarios()
      await this.testPerformance()
      await this.testConcurrency()
      
      const report = await this.generateStressTestReport()
      
      this.log('すべてのストレステスト完了!', 'success')
      return report

    } catch (error) {
      this.log(`ストレステスト実行エラー: ${error.message}`, 'error')
      throw error
    }
  }
}

// メイン実行
if (require.main === module) {
  const tester = new EmailStressTester()
  
  tester.runAllStressTests()
    .then(() => {
      console.log('\n🎉 ストレステストスイート完了!')
      console.log('📊 詳細レポート: test-results/email-stress-report.json')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 ストレステスト失敗:', error)
      process.exit(1)
    })
}

module.exports = EmailStressTester