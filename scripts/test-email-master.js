// scripts/test-email-master.js
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
require('dotenv').config({ path: '.env.local' })

class EmailMasterTester {
  constructor() {
    this.testSuites = [
      {
        name: '包括的機能テスト',
        script: 'test-email-comprehensive.js',
        description: 'SMTP接続、テンプレート生成、メール送信、ログ機能の総合テスト'
      },
      {
        name: 'テンプレート詳細テスト',
        script: 'test-email-templates-advanced.js',
        description: 'React Emailテンプレートの検証、多言語対応、境界値テスト'
      },
      {
        name: 'ストレステスト',
        script: 'test-email-stress.js',
        description: 'エラーハンドリング、パフォーマンス、負荷テスト'
      },
      {
        name: 'ログ機能テスト',
        script: 'test-email-logging.js',
        description: 'MongoDB連携、統計機能、クリーンアップ機能のテスト'
      },
      {
        name: 'プレビュー機能テスト',
        script: 'test-email-preview.js',
        description: 'APIプレビュー、HTML検証、アクセシビリティテスト'
      },
      {
        name: 'React Email機能テスト',
        script: 'test-react-email.js',
        description: 'React Email環境確認、プレビューURL生成'
      }
    ]
    
    this.results = {
      suites: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19)
    const prefix = {
      info: '🧪',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      test: '🔬',
      master: '👑'
    }[type] || '🧪'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async checkEnvironment() {
    this.log('テスト環境チェック...', 'master')
    
    const checks = {
      nodeVersion: process.version,
      platform: process.platform,
      envFile: fs.existsSync('.env.local'),
      smtpHost: !!process.env.SMTP_HOST,
      smtpUser: !!process.env.SMTP_USER,
      smtpPassword: !!process.env.SMTP_PASSWORD,
      mongoUri: !!process.env.MONGODB_URI,
      testEmail: !!process.env.TEST_EMAIL
    }

    this.log(`Node.js: ${checks.nodeVersion}`, 'info')
    this.log(`プラットフォーム: ${checks.platform}`, 'info')
    this.log(`環境変数ファイル: ${checks.envFile ? '✅ 有' : '❌ 無'}`)
    
    const envChecks = [
      { key: 'SMTP_HOST', exists: checks.smtpHost },
      { key: 'SMTP_USER', exists: checks.smtpUser },
      { key: 'SMTP_PASSWORD', exists: checks.smtpPassword },
      { key: 'MONGODB_URI', exists: checks.mongoUri },
      { key: 'TEST_EMAIL', exists: checks.testEmail }
    ]

    envChecks.forEach(check => {
      this.log(`${check.key}: ${check.exists ? '✅' : '⚪'}`)
    })

    const criticalMissing = !checks.smtpHost || !checks.smtpUser || !checks.smtpPassword
    
    if (criticalMissing) {
      this.log('⚠️ 重要: SMTP設定が不完全です。一部テストが失敗する可能性があります。', 'warning')
    }

    return checks
  }

  async runTestSuite(suite, options = {}) {
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, suite.script)
      
      if (!fs.existsSync(scriptPath)) {
        this.log(`${suite.name}: ❌ スクリプトファイルが見つかりません`, 'error')
        resolve({
          name: suite.name,
          success: false,
          error: 'Script file not found',
          duration: 0
        })
        return
      }

      this.log(`${suite.name} 実行中...`, 'test')
      
      const startTime = Date.now()
      const child = spawn('node', [scriptPath], {
        stdio: options.verbose ? 'inherit' : 'pipe',
        cwd: path.join(__dirname, '..')
      })

      let stdout = ''
      let stderr = ''

      if (!options.verbose) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })

        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
      }

      child.on('close', (code) => {
        const duration = Date.now() - startTime
        const success = code === 0

        this.log(`${suite.name}: ${success ? '✅ 完了' : '❌ 失敗'} (${duration}ms)`, 
          success ? 'success' : 'error')

        if (!success && !options.verbose) {
          console.log('--- STDOUT ---')
          console.log(stdout)
          console.log('--- STDERR ---')
          console.log(stderr)
          console.log('-------------')
        }

        resolve({
          name: suite.name,
          script: suite.script,
          success,
          code,
          duration,
          stdout: options.verbose ? null : stdout,
          stderr: options.verbose ? null : stderr
        })
      })

      child.on('error', (error) => {
        const duration = Date.now() - startTime
        this.log(`${suite.name}: ❌ 実行エラー - ${error.message}`, 'error')
        
        resolve({
          name: suite.name,
          script: suite.script,
          success: false,
          error: error.message,
          duration
        })
      })
    })
  }

  async runAllTests(options = {}) {
    this.log('メール送信機能 統合テストスイート開始', 'master')
    console.log('='.repeat(70))

    const envCheck = await this.checkEnvironment()
    console.log('='.repeat(70))

    const suitesToRun = options.suites || this.testSuites

    for (let i = 0; i < suitesToRun.length; i++) {
      const suite = suitesToRun[i]
      
      this.log(`\n[${i + 1}/${suitesToRun.length}] ${suite.name}`, 'master')
      this.log(`説明: ${suite.description}`)
      
      if (options.interactive) {
        // インタラクティブモードでは確認を求める
        const proceed = await this.promptUser(`${suite.name} を実行しますか？ (y/n): `)
        if (!proceed) {
          this.log(`${suite.name}: スキップ`, 'warning')
          this.results.suites.push({
            name: suite.name,
            skipped: true
          })
          this.results.summary.skipped++
          continue
        }
      }

      const result = await this.runTestSuite(suite, options)
      this.results.suites.push(result)
      
      if (result.success) {
        this.results.summary.passed++
      } else {
        this.results.summary.failed++
      }
      
      this.results.summary.total++

      // テスト間の待機時間
      if (i < suitesToRun.length - 1 && !options.fast) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return await this.generateMasterReport(envCheck)
  }

  async promptUser(question) {
    // 簡易的なプロンプト（実際のプロジェクトでは readline を使用）
    return true // デフォルトでは全て実行
  }

  async generateMasterReport(envCheck) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      testSuites: this.testSuites,
      results: this.results,
      summary: {
        ...this.results.summary,
        successRate: this.results.summary.total > 0 ? 
          (this.results.summary.passed / this.results.summary.total) * 100 : 0,
        totalDuration: this.results.suites.reduce((sum, suite) => sum + (suite.duration || 0), 0)
      }
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'email-master-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // 最終結果表示
    console.log('\n' + '='.repeat(70))
    console.log('👑 メール機能テスト 最終結果')
    console.log('='.repeat(70))
    console.log(`📊 テストスイート: ${report.summary.total}`)
    console.log(`✅ 成功: ${report.summary.passed}`)
    console.log(`❌ 失敗: ${report.summary.failed}`)
    console.log(`⚪ スキップ: ${report.summary.skipped}`)
    console.log(`📈 成功率: ${report.summary.successRate.toFixed(1)}%`)
    console.log(`⏱️ 総実行時間: ${(report.summary.totalDuration / 1000).toFixed(1)}秒`)
    console.log('='.repeat(70))

    // 個別結果
    this.results.suites.forEach(suite => {
      const status = suite.skipped ? '⚪ スキップ' : 
                    suite.success ? '✅ 成功' : '❌ 失敗'
      const duration = suite.duration ? ` (${(suite.duration / 1000).toFixed(1)}s)` : ''
      console.log(`${status} ${suite.name}${duration}`)
    })

    console.log('\n📁 生成されたレポートファイル:')
    console.log(`   📄 統合レポート: ${reportPath}`)
    console.log(`   📊 個別レポート: test-results/`)
    console.log(`   🖼️ プレビュー: test-results/api-previews/`)
    
    this.log(`統合テストレポート保存: ${reportPath}`, 'success')
    
    return report
  }
}

// コマンドライン引数処理
function parseArguments() {
  const args = process.argv.slice(2)
  const options = {
    verbose: false,
    fast: false,
    interactive: false,
    suites: null
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--fast':
      case '-f':
        options.fast = true
        break
      case '--interactive':
      case '-i':
        options.interactive = true
        break
      case '--suite':
      case '-s':
        // 特定のテストスイートのみ実行
        options.suites = args[i + 1] ? [args[i + 1]] : null
        i++
        break
      case '--help':
      case '-h':
        console.log(`
メール機能統合テストスイート

使用方法:
  node test-email-master.js [オプション]

オプション:
  --verbose, -v      詳細ログを表示
  --fast, -f         テスト間の待機時間をスキップ
  --interactive, -i  各テストの実行前に確認
  --suite, -s <name> 特定のテストスイートのみ実行
  --help, -h         このヘルプを表示

例:
  npm run test:email:master
  npm run test:email:master -- --verbose
  npm run test:email:master -- --fast --suite comprehensive
        `)
        process.exit(0)
    }
  }

  return options
}

// メイン実行
if (require.main === module) {
  const options = parseArguments()
  const tester = new EmailMasterTester()
  
  tester.runAllTests(options)
    .then((report) => {
      const success = report.summary.failed === 0
      console.log(`\n🎉 統合テストスイート${success ? '完了' : '完了（一部失敗）'}!`)
      console.log('📧 実際のメール送信テストの場合は受信ボックスを確認してください')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('\n💥 統合テスト実行エラー:', error)
      process.exit(1)
    })
}

module.exports = EmailMasterTester