// scripts/test-email-templates-advanced.js
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

class EmailTemplateValidator {
  constructor() {
    this.results = []
    this.validationRules = {
      subject: {
        minLength: 5,
        maxLength: 100,
        required: true
      },
      html: {
        minLength: 100,
        required: true,
        mustContain: ['<html', '<body', '</body>', '</html>']
      },
      text: {
        minLength: 50,
        required: true
      }
    }
  }

  log(message, type = 'info') {
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || '📝'
    
    console.log(`${prefix} ${message}`)
  }

  validateTemplate(template, templateName) {
    const validation = {
      name: templateName,
      passed: 0,
      failed: 0,
      warnings: [],
      errors: [],
      details: {}
    }

    // Subject validation
    if (template.subject) {
      const subjectLen = template.subject.length
      validation.details.subject = {
        length: subjectLen,
        valid: subjectLen >= this.validationRules.subject.minLength && 
               subjectLen <= this.validationRules.subject.maxLength
      }
      
      if (validation.details.subject.valid) {
        validation.passed++
      } else {
        validation.failed++
        validation.errors.push(`件名の長さが不適切: ${subjectLen}文字`)
      }
    } else {
      validation.failed++
      validation.errors.push('件名が存在しません')
    }

    // HTML validation
    if (template.html) {
      const htmlLen = template.html.length
      const containsRequired = this.validationRules.html.mustContain.every(tag => 
        template.html.includes(tag)
      )
      
      validation.details.html = {
        length: htmlLen,
        hasRequiredTags: containsRequired,
        valid: htmlLen >= this.validationRules.html.minLength && containsRequired
      }
      
      if (validation.details.html.valid) {
        validation.passed++
      } else {
        validation.failed++
        validation.errors.push(`HTML形式が不正: 長さ${htmlLen}, 必須タグ${containsRequired ? '有' : '無'}`)
      }

      // 追加のHTMLチェック
      const htmlChecks = {
        hasTitle: template.html.includes('<title>') || template.html.includes('<h1>'),
        hasLinks: template.html.includes('<a '),
        hasButtons: template.html.includes('button') || template.html.includes('btn'),
        hasStyles: template.html.includes('style'),
        responsive: template.html.includes('max-width') || template.html.includes('mobile')
      }

      Object.entries(htmlChecks).forEach(([check, result]) => {
        if (result) {
          validation.warnings.push(`✓ ${check}`)
        } else {
          validation.warnings.push(`- ${check}`)
        }
      })

    } else {
      validation.failed++
      validation.errors.push('HTMLコンテンツが存在しません')
    }

    // Text validation
    if (template.text) {
      const textLen = template.text.length
      validation.details.text = {
        length: textLen,
        valid: textLen >= this.validationRules.text.minLength
      }
      
      if (validation.details.text.valid) {
        validation.passed++
      } else {
        validation.failed++
        validation.errors.push(`テキスト版が短すぎます: ${textLen}文字`)
      }
    } else {
      validation.failed++
      validation.errors.push('テキスト版が存在しません')
    }

    return validation
  }

  async testAllTemplates() {
    this.log('全メールテンプレートの詳細テスト開始...', 'test')

    const testData = {
      userName: 'テストユーザー太郎',
      email: 'test@example.com',
      verificationUrl: 'https://example.com/auth/verify-email?token=abcd1234efgh5678',
      resetUrl: 'https://example.com/auth/reset-password?token=reset5678abcd1234',
      dashboardUrl: 'https://example.com/dashboard',
      supportEmail: 'support@example.com'
    }

    const templates = [
      {
        name: 'ウェルカムメール',
        generate: async () => {
          const { createWelcomeEmail } = await import('../src/lib/email/templates.js')
          return createWelcomeEmail(testData.userName, testData.dashboardUrl)
        }
      },
      {
        name: '認証メール',
        generate: async () => {
          const { createVerificationEmail } = await import('../src/lib/email/templates.js')
          return createVerificationEmail(testData.verificationUrl, testData.userName)
        }
      },
      {
        name: 'パスワードリセットメール',
        generate: async () => {
          const { createPasswordResetEmail } = await import('../src/lib/email/templates.js')
          return createPasswordResetEmail(testData.resetUrl, testData.userName)
        }
      },
      {
        name: 'システム通知メール',
        generate: async () => {
          const { createSystemNoticeEmail } = await import('../src/lib/email/templates.js')
          return createSystemNoticeEmail(
            '重要なお知らせ',
            'システムメンテナンスのお知らせです。\\n\\n明日午前2時からメンテナンスを実施いたします。',
            testData.dashboardUrl,
            'ダッシュボードを見る'
          )
        }
      }
    ]

    console.log('\n' + '='.repeat(60))

    for (const templateInfo of templates) {
      this.log(`\n🧪 ${templateInfo.name} テスト中...`)
      
      try {
        const template = await templateInfo.generate()
        const validation = this.validateTemplate(template, templateInfo.name)
        
        // 結果表示
        console.log(`   ✅ 成功チェック: ${validation.passed}`)
        console.log(`   ❌ 失敗チェック: ${validation.failed}`)
        
        if (validation.errors.length > 0) {
          console.log('   🚨 エラー:')
          validation.errors.forEach(error => console.log(`      - ${error}`))
        }
        
        if (validation.warnings.length > 0) {
          console.log('   💡 詳細チェック:')
          validation.warnings.slice(0, 5).forEach(warning => console.log(`      ${warning}`))
        }

        // HTML/テキストサンプル表示
        console.log(`   📏 サイズ: HTML(${template.html.length}) / Text(${template.text.length})`)
        console.log(`   📧 件名: "${template.subject}"`)

        this.results.push(validation)

        // プレビューファイル生成
        await this.generatePreviewFile(templateInfo.name, template)

      } catch (error) {
        this.log(`${templateInfo.name} 生成エラー: ${error.message}`, 'error')
        this.results.push({
          name: templateInfo.name,
          passed: 0,
          failed: 1,
          errors: [error.message],
          warnings: []
        })
      }
    }

    await this.generateDetailedReport()
  }

  async generatePreviewFile(templateName, template) {
    try {
      const previewDir = path.join(__dirname, '..', 'test-results', 'email-previews')
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true })
      }

      const fileName = templateName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      
      // HTML プレビュー
      const htmlPath = path.join(previewDir, `${fileName}.html`)
      fs.writeFileSync(htmlPath, template.html)
      
      // テキスト プレビュー
      const textPath = path.join(previewDir, `${fileName}.txt`)
      fs.writeFileSync(textPath, `件名: ${template.subject}\n\n${template.text}`)
      
      this.log(`   💾 プレビューファイル生成: ${fileName}.html/.txt`)
      
    } catch (error) {
      this.log(`   ⚠️ プレビューファイル生成失敗: ${error.message}`, 'warning')
    }
  }

  async generateDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTemplates: this.results.length,
        passedTemplates: this.results.filter(r => r.failed === 0).length,
        totalChecks: this.results.reduce((sum, r) => sum + r.passed + r.failed, 0),
        passedChecks: this.results.reduce((sum, r) => sum + r.passed, 0)
      },
      templates: this.results,
      validationRules: this.validationRules
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'template-validation-report.json')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // サマリー表示
    console.log('\n' + '='.repeat(60))
    console.log('📊 テンプレートテスト結果サマリー')
    console.log('='.repeat(60))
    console.log(`📧 テストしたテンプレート: ${report.summary.totalTemplates}`)
    console.log(`✅ 完全に通過: ${report.summary.passedTemplates}`)
    console.log(`🧪 総チェック項目: ${report.summary.totalChecks}`)
    console.log(`✅ 通過したチェック: ${report.summary.passedChecks}`)
    console.log(`📊 成功率: ${((report.summary.passedChecks / report.summary.totalChecks) * 100).toFixed(1)}%`)
    console.log('='.repeat(60))
    
    console.log('\n💾 生成されたファイル:')
    console.log(`   📄 詳細レポート: ${reportPath}`)
    console.log(`   🖼️  プレビューファイル: test-results/email-previews/`)
    
    this.log(`詳細レポート保存完了: ${reportPath}`, 'success')
    
    return report
  }

  async testMultipleLanguages() {
    this.log('多言語対応テスト...', 'test')
    
    const testNames = [
      'テストユーザー',
      'John Doe',
      '山田太郎',
      'María García',
      '이순신',
      'محمد عبدالله'
    ]

    for (const userName of testNames) {
      try {
        const { createWelcomeEmail } = await import('../src/lib/email/templates.js')
        const template = await createWelcomeEmail(userName)
        
        const encodingTest = {
          subjectEncoding: template.subject.includes(userName),
          htmlEncoding: template.html.includes(userName),
          textEncoding: template.text.includes(userName)
        }

        const passed = Object.values(encodingTest).every(Boolean)
        this.log(`   ${userName}: ${passed ? '✅' : '❌'} エンコーディング`, passed ? 'success' : 'error')
        
      } catch (error) {
        this.log(`   ${userName}: ❌ エラー - ${error.message}`, 'error')
      }
    }
  }

  async testEdgeCases() {
    this.log('境界値テスト...', 'test')

    const edgeCases = [
      { name: '空文字ユーザー名', userName: '', expectError: false },
      { name: '非常に長いユーザー名', userName: 'あ'.repeat(100), expectError: false },
      { name: '特殊文字ユーザー名', userName: '<script>alert("test")</script>', expectError: false },
      { name: 'null ユーザー名', userName: null, expectError: false },
      { name: 'undefined ユーザー名', userName: undefined, expectError: false }
    ]

    for (const testCase of edgeCases) {
      try {
        const { createWelcomeEmail } = await import('../src/lib/email/templates.js')
        const template = await createWelcomeEmail(testCase.userName)
        
        const hasXSS = template.html.includes('<script>') || template.html.includes('javascript:')
        const sanitized = !hasXSS
        
        this.log(`   ${testCase.name}: ${sanitized ? '✅ 安全' : '❌ XSS検出'}`, sanitized ? 'success' : 'error')
        
      } catch (error) {
        const errorExpected = testCase.expectError
        this.log(`   ${testCase.name}: ${errorExpected ? '✅' : '❌'} ${error.message}`, 
          errorExpected ? 'success' : 'warning')
      }
    }
  }
}

// メイン実行
if (require.main === module) {
  const validator = new EmailTemplateValidator()
  
  async function runTemplateTests() {
    try {
      console.log('🎨 メールテンプレート詳細テスト開始')
      console.log('='.repeat(60))
      
      await validator.testAllTemplates()
      await validator.testMultipleLanguages()
      await validator.testEdgeCases()
      
      console.log('\n🎉 テンプレートテスト完了!')
      console.log('📁 test-results/ フォルダーで結果を確認してください')
      
    } catch (error) {
      console.error('💥 テンプレートテストエラー:', error)
      process.exit(1)
    }
  }

  runTemplateTests()
}

module.exports = EmailTemplateValidator