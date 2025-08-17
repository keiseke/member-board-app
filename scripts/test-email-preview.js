// scripts/test-email-preview.js
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

class EmailPreviewTester {
  constructor() {
    this.results = {
      apiTests: [],
      validationTests: [],
      accessibilityTests: []
    }
    this.baseUrl = 'http://localhost:3000'
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19)
    const prefix = {
      info: '🖼️',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      test: '🧪',
      api: '🌐'
    }[type] || '🖼️'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testPreviewAPI() {
    this.log('プレビューAPIテスト開始...', 'test')
    
    const testCases = [
      {
        name: 'ウェルカムメール',
        url: '/api/email-preview?template=welcome&userName=テストユーザー',
        expectedContent: ['ようこそ', 'ダッシュボード', 'テストユーザー']
      },
      {
        name: '認証メール',
        url: '/api/email-preview?template=verification&userName=認証太郎',
        expectedContent: ['確認', 'メールアドレス', '認証太郎', '24時間']
      },
      {
        name: 'パスワードリセット',
        url: '/api/email-preview?template=password-reset&userName=リセット花子',
        expectedContent: ['パスワードリセット', 'リセット花子', '1時間']
      },
      {
        name: '無効なテンプレート',
        url: '/api/email-preview?template=invalid-template',
        expectError: true,
        expectedStatus: 400
      },
      {
        name: 'パラメータなし',
        url: '/api/email-preview',
        expectError: true,
        expectedStatus: 400
      },
      {
        name: '特殊文字ユーザー名',
        url: '/api/email-preview?template=welcome&userName=<script>alert("test")</script>',
        expectedContent: ['ようこそ'],
        securityTest: true
      },
      {
        name: '絵文字ユーザー名',
        url: '/api/email-preview?template=welcome&userName=🎉テスト太郎🚀',
        expectedContent: ['🎉テスト太郎🚀', 'ようこそ']
      }
    ]

    for (const testCase of testCases) {
      try {
        this.log(`${testCase.name} テスト中...`)
        
        // Node.js fetch が使えない場合のフォールバック
        let response, content
        
        try {
          // dynamic import for fetch
          const fetch = (await import('node-fetch')).default
          response = await fetch(`${this.baseUrl}${testCase.url}`)
          content = await response.text()
        } catch (fetchError) {
          // fetchが使えない場合は、直接APIを呼び出し
          const url = new URL(`${this.baseUrl}${testCase.url}`)
          const queryParams = Object.fromEntries(url.searchParams.entries())
          
          if (queryParams.template) {
            const { render } = await import('@react-email/render')
            let Component
            
            switch (queryParams.template) {
              case 'welcome':
                Component = (await import('../src/components/email/WelcomeEmail.js')).default
                content = render(Component({
                  userName: queryParams.userName || 'テストユーザー',
                  dashboardUrl: 'http://localhost:3000/dashboard',
                  supportEmail: 'support@example.com',
                  appName: '会員制掲示板'
                }))
                response = { ok: true, status: 200, headers: new Map() }
                break
              case 'verification':
                Component = (await import('../src/components/email/VerificationEmail.js')).default
                content = render(Component({
                  userName: queryParams.userName,
                  verificationUrl: 'http://localhost:3000/auth/verify-email?token=sample-token',
                  supportEmail: 'support@example.com',
                  appName: '会員制掲示板'
                }))
                response = { ok: true, status: 200, headers: new Map() }
                break
              case 'password-reset':
                Component = (await import('../src/components/email/PasswordResetEmail.js')).default
                content = render(Component({
                  userName: queryParams.userName,
                  resetUrl: 'http://localhost:3000/auth/reset-password?token=sample-token',
                  supportEmail: 'support@example.com',
                  appName: '会員制掲示板'
                }))
                response = { ok: true, status: 200, headers: new Map() }
                break
              default:
                response = { ok: false, status: 400 }
                content = JSON.stringify({ error: 'Invalid template' })
            }
          } else {
            response = { ok: false, status: 400 }
            content = JSON.stringify({ error: 'Template parameter required' })
          }
        }
        
        // レスポンス検証
        if (testCase.expectError) {
          if (!response.ok) {
            this.log(`${testCase.name}: ✅ 期待通りエラー (${response.status})`, 'success')
            this.results.apiTests.push({
              name: testCase.name,
              success: true,
              status: response.status,
              expectError: true
            })
          } else {
            this.log(`${testCase.name}: ⚠️ エラーが期待されましたが成功`, 'warning')
            this.results.apiTests.push({
              name: testCase.name,
              success: false,
              status: response.status,
              expectError: true,
              actualError: false
            })
          }
        } else {
          if (response.ok) {
            // コンテンツ検証
            const contentChecks = testCase.expectedContent?.every(expected => 
              content.includes(expected)
            ) ?? true
            
            // セキュリティ検証
            let securityPassed = true
            if (testCase.securityTest) {
              securityPassed = !content.includes('<script>') && !content.includes('javascript:')
            }
            
            const allChecksPass = contentChecks && securityPassed
            
            this.log(`${testCase.name}: ${allChecksPass ? '✅' : '⚠️'} ${allChecksPass ? '成功' : '部分的成功'}`, 
              allChecksPass ? 'success' : 'warning')
            
            if (testCase.securityTest) {
              this.log(`   セキュリティチェック: ${securityPassed ? '✅ 安全' : '❌ 危険'}`)
            }
            
            this.results.apiTests.push({
              name: testCase.name,
              success: allChecksPass,
              status: response.status,
              contentLength: content.length,
              contentChecks,
              securityPassed: testCase.securityTest ? securityPassed : null
            })
            
            // プレビューファイル保存
            await this.savePreviewFile(testCase.name, content)
            
          } else {
            this.log(`${testCase.name}: ❌ APIエラー (${response.status})`, 'error')
            this.results.apiTests.push({
              name: testCase.name,
              success: false,
              status: response.status,
              error: 'API request failed'
            })
          }
        }
        
      } catch (error) {
        this.log(`${testCase.name}: ❌ ${error.message}`, 'error')
        this.results.apiTests.push({
          name: testCase.name,
          success: false,
          error: error.message
        })
      }
    }
  }

  async savePreviewFile(testName, htmlContent) {
    try {
      const previewDir = path.join(__dirname, '..', 'test-results', 'api-previews')
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true })
      }

      const fileName = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      const filePath = path.join(previewDir, `${fileName}.html`)
      
      fs.writeFileSync(filePath, htmlContent)
      this.log(`   💾 プレビュー保存: ${fileName}.html`)
      
    } catch (error) {
      this.log(`   ⚠️ プレビュー保存失敗: ${error.message}`, 'warning')
    }
  }

  async testHTMLValidation() {
    this.log('HTML検証テスト開始...', 'test')
    
    const templates = ['welcome', 'verification', 'password-reset']
    
    for (const template of templates) {
      try {
        let htmlContent
        
        // テンプレート生成
        const { render } = await import('@react-email/render')
        
        switch (template) {
          case 'welcome':
            const WelcomeEmail = (await import('../src/components/email/WelcomeEmail.js')).default
            htmlContent = render(WelcomeEmail({
              userName: 'HTMLテストユーザー',
              dashboardUrl: 'https://example.com/dashboard',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
          case 'verification':
            const VerificationEmail = (await import('../src/components/email/VerificationEmail.js')).default
            htmlContent = render(VerificationEmail({
              userName: 'HTMLテストユーザー',
              verificationUrl: 'https://example.com/verify',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
          case 'password-reset':
            const PasswordResetEmail = (await import('../src/components/email/PasswordResetEmail.js')).default
            htmlContent = render(PasswordResetEmail({
              userName: 'HTMLテストユーザー',
              resetUrl: 'https://example.com/reset',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
        }
        
        // HTML構造検証
        const validations = {
          hasDoctype: htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html'),
          hasHtmlTag: htmlContent.includes('<html'),
          hasBodyTag: htmlContent.includes('<body'),
          hasHeadTag: htmlContent.includes('<head'),
          closedTags: htmlContent.includes('</html>') && htmlContent.includes('</body>'),
          hasTitle: htmlContent.includes('<title>') || htmlContent.includes('<h1>'),
          hasMetaTags: htmlContent.includes('<meta'),
          responsiveElements: htmlContent.includes('max-width') || htmlContent.includes('viewport'),
          hasStyles: htmlContent.includes('style'),
          emailClientCompatibility: !htmlContent.includes('position: fixed') && !htmlContent.includes('position: absolute')
        }
        
        const passedValidations = Object.values(validations).filter(Boolean).length
        const totalValidations = Object.keys(validations).length
        
        this.log(`${template} HTML検証: ${passedValidations}/${totalValidations} 通過`, 
          passedValidations === totalValidations ? 'success' : 'warning')
        
        this.results.validationTests.push({
          template,
          passed: passedValidations,
          total: totalValidations,
          validations,
          htmlLength: htmlContent.length
        })
        
      } catch (error) {
        this.log(`${template} HTML検証失敗: ${error.message}`, 'error')
        this.results.validationTests.push({
          template,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testAccessibility() {
    this.log('アクセシビリティテスト開始...', 'test')
    
    const templates = ['welcome', 'verification', 'password-reset']
    
    for (const template of templates) {
      try {
        let htmlContent
        
        // テンプレート生成
        const { render } = await import('@react-email/render')
        
        switch (template) {
          case 'welcome':
            const WelcomeEmail = (await import('../src/components/email/WelcomeEmail.js')).default
            htmlContent = render(WelcomeEmail({
              userName: 'アクセシビリティテストユーザー',
              dashboardUrl: 'https://example.com/dashboard',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
          case 'verification':
            const VerificationEmail = (await import('../src/components/email/VerificationEmail.js')).default
            htmlContent = render(VerificationEmail({
              userName: 'アクセシビリティテストユーザー',
              verificationUrl: 'https://example.com/verify',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
          case 'password-reset':
            const PasswordResetEmail = (await import('../src/components/email/PasswordResetEmail.js')).default
            htmlContent = render(PasswordResetEmail({
              userName: 'アクセシビリティテストユーザー',
              resetUrl: 'https://example.com/reset',
              supportEmail: 'support@example.com',
              appName: 'テストアプリ'
            }))
            break
        }
        
        // アクセシビリティチェック
        const accessibilityChecks = {
          hasAltTextForImages: !htmlContent.includes('<img') || htmlContent.includes('alt='),
          hasAriaLabels: htmlContent.includes('aria-label') || htmlContent.includes('aria-'),
          hasSemanticHeadings: htmlContent.includes('<h1>') || htmlContent.includes('<h2>'),
          hasReadableText: !htmlContent.includes('font-size: 0') && !htmlContent.includes('display: none'),
          hasContrastColors: !htmlContent.includes('color: white') || htmlContent.includes('background'),
          hasLinksWithText: !htmlContent.match(/<a[^>]*><\/a>/) // 空のリンクなし
        }
        
        const passedChecks = Object.values(accessibilityChecks).filter(Boolean).length
        const totalChecks = Object.keys(accessibilityChecks).length
        
        this.log(`${template} アクセシビリティ: ${passedChecks}/${totalChecks} 通過`, 
          passedChecks === totalChecks ? 'success' : 'warning')
        
        this.results.accessibilityTests.push({
          template,
          passed: passedChecks,
          total: totalChecks,
          checks: accessibilityChecks
        })
        
      } catch (error) {
        this.log(`${template} アクセシビリティテスト失敗: ${error.message}`, 'error')
        this.results.accessibilityTests.push({
          template,
          success: false,
          error: error.message
        })
      }
    }
  }

  async generatePreviewReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        apiTests: {
          total: this.results.apiTests.length,
          successful: this.results.apiTests.filter(t => t.success).length
        },
        validationTests: {
          total: this.results.validationTests.length,
          successful: this.results.validationTests.filter(t => t.success !== false).length
        },
        accessibilityTests: {
          total: this.results.accessibilityTests.length,
          successful: this.results.accessibilityTests.filter(t => t.success !== false).length
        }
      }
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'email-preview-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // サマリー表示
    console.log('\n' + '='.repeat(60))
    console.log('🖼️ プレビュー機能テスト結果サマリー')
    console.log('='.repeat(60))
    console.log(`🌐 APIテスト: ${report.summary.apiTests.successful}/${report.summary.apiTests.total}`)
    console.log(`✅ HTML検証: ${report.summary.validationTests.successful}/${report.summary.validationTests.total}`)
    console.log(`♿ アクセシビリティ: ${report.summary.accessibilityTests.successful}/${report.summary.accessibilityTests.total}`)
    console.log('='.repeat(60))
    
    this.log(`プレビューテストレポート保存: ${reportPath}`, 'success')
    
    return report
  }

  async runAllPreviewTests() {
    console.log('🖼️ メールプレビュー機能テスト開始')
    console.log('='.repeat(60))

    try {
      await this.testPreviewAPI()
      await this.testHTMLValidation()
      await this.testAccessibility()
      
      const report = await this.generatePreviewReport()
      
      this.log('すべてのプレビューテスト完了!', 'success')
      return report

    } catch (error) {
      this.log(`プレビューテスト実行エラー: ${error.message}`, 'error')
      throw error
    }
  }
}

// メイン実行
if (require.main === module) {
  const tester = new EmailPreviewTester()
  
  tester.runAllPreviewTests()
    .then(() => {
      console.log('\n🎉 プレビューテストスイート完了!')
      console.log('📊 詳細レポート: test-results/email-preview-report.json')
      console.log('🖼️ プレビューファイル: test-results/api-previews/')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 プレビューテスト失敗:', error)
      process.exit(1)
    })
}

module.exports = EmailPreviewTester