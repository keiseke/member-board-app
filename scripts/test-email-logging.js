// scripts/test-email-logging.js
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

class EmailLoggingTester {
  constructor() {
    this.results = {
      connectionTests: [],
      loggingTests: [],
      statisticsTests: [],
      cleanupTests: []
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19)
    const prefix = {
      info: '📝',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      test: '🧪',
      db: '🗄️'
    }[type] || '📝'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testDatabaseConnection() {
    this.log('MongoDB接続テスト開始...', 'test')
    
    try {
      const { connectDB } = await import('../src/lib/mongodb.js')
      await connectDB()
      
      this.log('MongoDB接続成功', 'success')
      this.results.connectionTests.push({
        name: 'MongoDB接続',
        success: true,
        timestamp: new Date()
      })
      
      return true
      
    } catch (error) {
      this.log(`MongoDB接続失敗: ${error.message}`, 'error')
      this.results.connectionTests.push({
        name: 'MongoDB接続',
        success: false,
        error: error.message,
        timestamp: new Date()
      })
      
      return false
    }
  }

  async testEmailLogModel() {
    this.log('EmailLogモデルテスト開始...', 'test')
    
    try {
      const { EmailLog } = await import('../src/models/EmailLog.js')
      
      // テストログエントリ作成
      const testLog = await EmailLog.create({
        to: ['test@example.com'],
        from: 'noreply@example.com',
        subject: 'テストメール - ログ機能確認',
        type: 'system_notice',
        status: 'pending',
        templateName: 'test-template',
        deliveryAttempts: 1
      })
      
      this.log(`テストログ作成成功: ${testLog._id}`, 'success')
      
      // ログ更新テスト（送信成功シミュレート）
      await EmailLog.findByIdAndUpdate(testLog._id, {
        status: 'sent',
        messageId: `test-${Date.now()}@localhost`,
        sentAt: new Date()
      })
      
      this.log('ログ更新成功', 'success')
      
      // ログ検索テスト
      const retrievedLog = await EmailLog.findById(testLog._id)
      if (retrievedLog && retrievedLog.status === 'sent') {
        this.log('ログ取得・確認成功', 'success')
        
        this.results.loggingTests.push({
          name: '基本CRUD操作',
          success: true,
          logId: testLog._id.toString()
        })
      } else {
        throw new Error('ログの更新が正しく反映されていません')
      }
      
      // テストデータ削除
      await EmailLog.findByIdAndDelete(testLog._id)
      this.log('テストデータ削除完了', 'success')
      
    } catch (error) {
      this.log(`EmailLogモデルテスト失敗: ${error.message}`, 'error')
      this.results.loggingTests.push({
        name: '基本CRUD操作',
        success: false,
        error: error.message
      })
    }
  }

  async testLogStatistics() {
    this.log('ログ統計機能テスト開始...', 'test')
    
    try {
      const { EmailLog } = await import('../src/models/EmailLog.js')
      
      // テストデータ作成
      const testLogs = [
        {
          to: ['user1@example.com'],
          from: 'noreply@example.com',
          subject: 'テスト1',
          type: 'welcome',
          status: 'sent',
          sentAt: new Date(),
          templateName: 'welcome-template',
          deliveryAttempts: 1
        },
        {
          to: ['user2@example.com'],
          from: 'noreply@example.com',
          subject: 'テスト2',
          type: 'verification',
          status: 'failed',
          errorMessage: 'テストエラー',
          templateName: 'verification-template',
          deliveryAttempts: 2
        },
        {
          to: ['user3@example.com'],
          from: 'noreply@example.com',
          subject: 'テスト3',
          type: 'welcome',
          status: 'sent',
          sentAt: new Date(),
          templateName: 'welcome-template',
          deliveryAttempts: 1
        }
      ]
      
      const createdLogs = await EmailLog.insertMany(testLogs)
      this.log(`テストログ ${createdLogs.length}件作成`, 'success')
      
      // 統計取得テスト
      const stats = await EmailLog.getDeliveryStats()
      this.log(`統計データ取得成功: ${stats.length}種類`, 'success')
      
      // 再送対象メール取得テスト
      const retryableEmails = await EmailLog.getRetryableEmails(3, 0)
      this.log(`再送対象メール取得: ${retryableEmails.length}件`, 'success')
      
      // 基本的な統計計算
      const totalLogs = await EmailLog.countDocuments()
      const sentLogs = await EmailLog.countDocuments({ status: 'sent' })
      const failedLogs = await EmailLog.countDocuments({ status: 'failed' })
      
      this.log(`総メール数: ${totalLogs}, 成功: ${sentLogs}, 失敗: ${failedLogs}`, 'db')
      
      this.results.statisticsTests.push({
        name: '配信統計機能',
        success: true,
        stats: {
          total: totalLogs,
          sent: sentLogs,
          failed: failedLogs,
          retryable: retryableEmails.length
        }
      })
      
      // テストデータ削除
      await EmailLog.deleteMany({ _id: { $in: createdLogs.map(log => log._id) } })
      this.log('テストデータ削除完了', 'success')
      
    } catch (error) {
      this.log(`統計機能テスト失敗: ${error.message}`, 'error')
      this.results.statisticsTests.push({
        name: '配信統計機能',
        success: false,
        error: error.message
      })
    }
  }

  async testLogCleanup() {
    this.log('ログクリーンアップ機能テスト開始...', 'test')
    
    try {
      const { EmailLog } = await import('../src/models/EmailLog.js')
      
      // 古いテストログ作成（削除対象）
      const oldDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) // 95日前
      const oldLog = await EmailLog.create({
        to: ['old@example.com'],
        from: 'noreply@example.com',
        subject: '古いテストメール',
        type: 'system_notice',
        status: 'sent',
        sentAt: oldDate,
        createdAt: oldDate,
        templateName: 'old-template',
        deliveryAttempts: 1
      })
      
      // 新しいテストログ作成（保持対象）
      const newLog = await EmailLog.create({
        to: ['new@example.com'],
        from: 'noreply@example.com',
        subject: '新しいテストメール',
        type: 'system_notice',
        status: 'sent',
        sentAt: new Date(),
        templateName: 'new-template',
        deliveryAttempts: 1
      })
      
      this.log('クリーンアップテスト用ログ作成完了', 'success')
      
      // クリーンアップ実行（90日より古いもの）
      const cleanupResult = await EmailLog.cleanup(90)
      this.log(`クリーンアップ実行: ${cleanupResult.deletedCount}件削除`, 'success')
      
      // 結果確認
      const oldLogExists = await EmailLog.findById(oldLog._id)
      const newLogExists = await EmailLog.findById(newLog._id)
      
      if (!oldLogExists && newLogExists) {
        this.log('クリーンアップ正常動作確認', 'success')
        this.results.cleanupTests.push({
          name: 'ログクリーンアップ',
          success: true,
          deletedCount: cleanupResult.deletedCount
        })
      } else {
        throw new Error('クリーンアップが期待通りに動作していません')
      }
      
      // 残ったテストデータ削除
      await EmailLog.findByIdAndDelete(newLog._id)
      this.log('テストデータ削除完了', 'success')
      
    } catch (error) {
      this.log(`クリーンアップテスト失敗: ${error.message}`, 'error')
      this.results.cleanupTests.push({
        name: 'ログクリーンアップ',
        success: false,
        error: error.message
      })
    }
  }

  async testLogIntegrationWithEmail() {
    this.log('メール送信連携テスト開始...', 'test')
    
    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com'
      
      // メール送信前のログ数
      const { EmailLog } = await import('../src/models/EmailLog.js')
      const logCountBefore = await EmailLog.countDocuments()
      
      // テストメール送信（実際には送信エラーになる可能性があるが、ログは作成される）
      try {
        const { sendEmail } = await import('../src/lib/email/client.js')
        const result = await sendEmail({
          to: testEmail,
          subject: 'ログ連携テスト',
          html: '<p>ログ機能との連携テストです</p>',
          text: 'ログ機能との連携テストです',
          type: 'system_notice',
          templateName: 'integration-test',
          userId: 'test-user-123'
        })
        
        this.log(`メール送信実行: ${result.success ? '成功' : '失敗'}`, result.success ? 'success' : 'warning')
        
        // ログ作成確認
        const logCountAfter = await EmailLog.countDocuments()
        
        if (logCountAfter > logCountBefore) {
          this.log('メール送信によるログ作成確認', 'success')
          
          // 最新のログを確認
          const latestLog = await EmailLog.findOne().sort({ createdAt: -1 })
          
          if (latestLog && latestLog.subject === 'ログ連携テスト') {
            this.log('ログ内容確認: 正常', 'success')
            
            this.results.loggingTests.push({
              name: 'メール送信連携',
              success: true,
              logCreated: true,
              logId: latestLog._id.toString()
            })
            
            // テストログ削除
            await EmailLog.findByIdAndDelete(latestLog._id)
            
          } else {
            throw new Error('ログの内容が正しくありません')
          }
        } else {
          throw new Error('メール送信時にログが作成されませんでした')
        }
        
      } catch (emailError) {
        // メール送信自体が失敗してもログは作成されるはず
        this.log(`メール送信エラー（予想される）: ${emailError.message}`, 'warning')
        
        // ログ作成は確認
        const logCountAfter = await EmailLog.countDocuments()
        if (logCountAfter > logCountBefore) {
          this.log('送信失敗時でもログ作成確認', 'success')
          
          this.results.loggingTests.push({
            name: 'メール送信連携（エラー時）',
            success: true,
            logCreated: true,
            emailFailed: true
          })
        }
      }
      
    } catch (error) {
      this.log(`連携テスト失敗: ${error.message}`, 'error')
      this.results.loggingTests.push({
        name: 'メール送信連携',
        success: false,
        error: error.message
      })
    }
  }

  async generateLoggingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: {
        nodeVersion: process.version,
        mongodbUri: process.env.MONGODB_URI ? '設定済み' : '未設定'
      },
      results: this.results,
      summary: {
        connectionTests: {
          total: this.results.connectionTests.length,
          successful: this.results.connectionTests.filter(t => t.success).length
        },
        loggingTests: {
          total: this.results.loggingTests.length,
          successful: this.results.loggingTests.filter(t => t.success).length
        },
        statisticsTests: {
          total: this.results.statisticsTests.length,
          successful: this.results.statisticsTests.filter(t => t.success).length
        },
        cleanupTests: {
          total: this.results.cleanupTests.length,
          successful: this.results.cleanupTests.filter(t => t.success).length
        }
      }
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'email-logging-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // サマリー表示
    console.log('\n' + '='.repeat(60))
    console.log('🗄️ ログ機能テスト結果サマリー')
    console.log('='.repeat(60))
    console.log(`🔌 接続テスト: ${report.summary.connectionTests.successful}/${report.summary.connectionTests.total}`)
    console.log(`📝 ログテスト: ${report.summary.loggingTests.successful}/${report.summary.loggingTests.total}`)
    console.log(`📊 統計テスト: ${report.summary.statisticsTests.successful}/${report.summary.statisticsTests.total}`)
    console.log(`🧹 クリーンアップテスト: ${report.summary.cleanupTests.successful}/${report.summary.cleanupTests.total}`)
    console.log('='.repeat(60))
    
    this.log(`ログテストレポート保存: ${reportPath}`, 'success')
    
    return report
  }

  async runAllLoggingTests() {
    console.log('🗄️ メールログ機能テスト開始')
    console.log('='.repeat(60))

    try {
      const connected = await this.testDatabaseConnection()
      
      if (!connected) {
        throw new Error('データベース接続に失敗したため、テストを中止します')
      }
      
      await this.testEmailLogModel()
      await this.testLogStatistics()
      await this.testLogCleanup()
      await this.testLogIntegrationWithEmail()
      
      const report = await this.generateLoggingReport()
      
      this.log('すべてのログテスト完了!', 'success')
      return report

    } catch (error) {
      this.log(`ログテスト実行エラー: ${error.message}`, 'error')
      throw error
    }
  }
}

// メイン実行
if (require.main === module) {
  const tester = new EmailLoggingTester()
  
  tester.runAllLoggingTests()
    .then(() => {
      console.log('\n🎉 ログテストスイート完了!')
      console.log('📊 詳細レポート: test-results/email-logging-report.json')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 ログテスト失敗:', error)
      process.exit(1)
    })
}

module.exports = EmailLoggingTester