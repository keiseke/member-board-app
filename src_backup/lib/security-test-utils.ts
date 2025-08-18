// src/lib/security-test-utils.ts
import { sanitizeInput, sanitizeHtml, validateInput } from './sanitizer'
import { RateLimiter } from './rate-limiter'
import { CSRFProtection } from './csrf'

export interface SecurityTestResult {
  test: string
  input: any
  output: any
  passed: boolean
  expected: any
  notes?: string
}

export class SecurityTestSuite {
  private results: SecurityTestResult[] = []

  /**
   * 入力サニタイゼーションテスト
   */
  testInputSanitization(): SecurityTestResult[] {
    const testCases = [
      {
        name: 'XSS Script Tag',
        input: '<script>alert("XSS")</script>Hello',
        expected: 'Hello',
        sanitizer: sanitizeInput
      },
      {
        name: 'JavaScript Protocol',
        input: 'javascript:alert("XSS")',
        expected: 'alert("XSS")',
        sanitizer: sanitizeInput
      },
      {
        name: 'HTML Iframe',
        input: '<iframe src="evil.com"></iframe>Normal text',
        expected: 'Normal text',
        sanitizer: sanitizeInput
      },
      {
        name: 'Event Handler',
        input: 'onclick="alert(1)" onmouseover="alert(2)"',
        expected: '',
        sanitizer: sanitizeInput
      },
      {
        name: 'Data Protocol',
        input: 'data:text/html,<script>alert("XSS")</script>',
        expected: '',
        sanitizer: sanitizeInput
      },
      {
        name: 'Normal Text',
        input: 'This is normal text with 123 numbers!',
        expected: 'This is normal text with 123 numbers!',
        sanitizer: sanitizeInput
      }
    ]

    const results: SecurityTestResult[] = []

    testCases.forEach(testCase => {
      const output = testCase.sanitizer(testCase.input)
      const passed = output === testCase.expected

      results.push({
        test: `Input Sanitization - ${testCase.name}`,
        input: testCase.input,
        output,
        expected: testCase.expected,
        passed,
        notes: passed ? 'Sanitization successful' : 'Sanitization failed'
      })
    })

    this.results.push(...results)
    return results
  }

  /**
   * HTMLサニタイゼーションテスト
   */
  testHtmlSanitization(): SecurityTestResult[] {
    const testCases = [
      {
        name: 'Safe HTML',
        input: '<p>Safe <strong>HTML</strong> content</p>',
        expectedToContain: ['<p>', '<strong>', 'Safe', 'HTML', 'content'],
        shouldNotContain: ['<script>', 'javascript:', 'onerror']
      },
      {
        name: 'Malicious Script',
        input: '<p>Content</p><script>alert("XSS")</script>',
        expectedToContain: ['<p>', 'Content'],
        shouldNotContain: ['<script>', 'alert']
      },
      {
        name: 'Event Handlers',
        input: '<div onclick="alert(1)" onmouseover="steal()">Click me</div>',
        expectedToContain: ['Click me'],
        shouldNotContain: ['onclick', 'onmouseover', 'alert', 'steal']
      },
      {
        name: 'Iframe Injection',
        input: '<p>Text</p><iframe src="//evil.com"></iframe>',
        expectedToContain: ['<p>', 'Text'],
        shouldNotContain: ['<iframe>', 'evil.com']
      }
    ]

    const results: SecurityTestResult[] = []

    testCases.forEach(testCase => {
      const output = sanitizeHtml(testCase.input)
      
      const containsExpected = testCase.expectedToContain.every(item => 
        output.includes(item)
      )
      const doesNotContainMalicious = testCase.shouldNotContain.every(item => 
        !output.includes(item)
      )
      
      const passed = containsExpected && doesNotContainMalicious

      results.push({
        test: `HTML Sanitization - ${testCase.name}`,
        input: testCase.input,
        output,
        expected: `Should contain: ${testCase.expectedToContain.join(', ')} | Should NOT contain: ${testCase.shouldNotContain.join(', ')}`,
        passed,
        notes: passed ? 'HTML sanitization successful' : 'HTML sanitization failed'
      })
    })

    this.results.push(...results)
    return results
  }

  /**
   * バリデーションテスト
   */
  testValidation(): SecurityTestResult[] {
    const testCases = [
      // Text validation
      { type: 'text' as const, input: 'Valid text', expected: true, name: 'Valid Text' },
      { type: 'text' as const, input: '', expected: false, name: 'Empty Text' },
      { type: 'text' as const, input: 'a'.repeat(1001), expected: false, name: 'Too Long Text' },
      
      // Email validation
      { type: 'email' as const, input: 'user@example.com', expected: true, name: 'Valid Email' },
      { type: 'email' as const, input: 'invalid-email', expected: false, name: 'Invalid Email' },
      { type: 'email' as const, input: 'user@', expected: false, name: 'Incomplete Email' },
      
      // URL validation
      { type: 'url' as const, input: 'https://example.com', expected: true, name: 'Valid HTTPS URL' },
      { type: 'url' as const, input: 'http://example.com', expected: true, name: 'Valid HTTP URL' },
      { type: 'url' as const, input: 'not-a-url', expected: false, name: 'Invalid URL' },
      { type: 'url' as const, input: 'javascript:alert(1)', expected: false, name: 'JavaScript URL' },
      
      // Filename validation
      { type: 'filename' as const, input: 'document.pdf', expected: true, name: 'Valid Filename' },
      { type: 'filename' as const, input: 'file with spaces.txt', expected: false, name: 'Filename with Spaces' },
      { type: 'filename' as const, input: '../../../etc/passwd', expected: false, name: 'Path Traversal Filename' }
    ]

    const results: SecurityTestResult[] = []

    testCases.forEach(testCase => {
      const output = validateInput(testCase.input, testCase.type)
      const passed = output === testCase.expected

      results.push({
        test: `Validation - ${testCase.name}`,
        input: testCase.input,
        output,
        expected: testCase.expected,
        passed,
        notes: passed ? 'Validation correct' : 'Validation failed'
      })
    })

    this.results.push(...results)
    return results
  }

  /**
   * レート制限テスト（シミュレーション）
   */
  async testRateLimit(): Promise<SecurityTestResult[]> {
    const rateLimiter = new RateLimiter({
      windowMs: 60000, // 1分
      maxRequests: 3   // テスト用に少なく設定
    })

    const testKey = 'test-user-123'
    const results: SecurityTestResult[] = []

    // 制限内のリクエスト
    for (let i = 1; i <= 3; i++) {
      const isLimited = await rateLimiter.isRateLimited(testKey)
      results.push({
        test: `Rate Limit - Request ${i}`,
        input: `Request ${i}`,
        output: isLimited,
        expected: false,
        passed: !isLimited,
        notes: isLimited ? 'Unexpectedly rate limited' : 'Request allowed'
      })
    }

    // 制限を超えるリクエスト
    const isLimitedAfterMax = await rateLimiter.isRateLimited(testKey)
    results.push({
      test: 'Rate Limit - Exceeded',
      input: 'Request 4 (should be limited)',
      output: isLimitedAfterMax,
      expected: true,
      passed: isLimitedAfterMax,
      notes: isLimitedAfterMax ? 'Correctly rate limited' : 'Rate limit not enforced'
    })

    this.results.push(...results)
    return results
  }

  /**
   * CSRFトークンテスト
   */
  testCSRFProtection(): SecurityTestResult[] {
    const results: SecurityTestResult[] = []

    // トークン生成テスト
    const tokenData = CSRFProtection.generateToken('session-123')
    results.push({
      test: 'CSRF - Token Generation',
      input: 'session-123',
      output: tokenData.token.length,
      expected: 64, // 32 bytes * 2 (hex)
      passed: tokenData.token.length === 64 && typeof tokenData.token === 'string',
      notes: 'Token should be 64-character hex string'
    })

    // トークン検証テスト - 有効なトークン
    const isValidSame = CSRFProtection.verifyToken(tokenData.token, tokenData.token)
    results.push({
      test: 'CSRF - Valid Token Verification',
      input: { session: tokenData.token, request: tokenData.token },
      output: isValidSame,
      expected: true,
      passed: isValidSame,
      notes: 'Same tokens should verify successfully'
    })

    // トークン検証テスト - 無効なトークン
    const differentToken = CSRFProtection.generateToken().token
    const isValidDifferent = CSRFProtection.verifyToken(tokenData.token, differentToken)
    results.push({
      test: 'CSRF - Invalid Token Verification',
      input: { session: tokenData.token, request: differentToken },
      output: isValidDifferent,
      expected: false,
      passed: !isValidDifferent,
      notes: 'Different tokens should fail verification'
    })

    // Double Submit Tokenテスト
    const { cookieToken, formToken } = CSRFProtection.generateDoubleSubmitToken()
    const isDoubleSubmitValid = CSRFProtection.verifyDoubleSubmitToken(cookieToken, formToken)
    results.push({
      test: 'CSRF - Double Submit Token',
      input: { cookieToken, formToken },
      output: isDoubleSubmitValid,
      expected: true,
      passed: isDoubleSubmitValid,
      notes: 'Double submit tokens should verify successfully'
    })

    this.results.push(...results)
    return results
  }

  /**
   * 全てのテストを実行
   */
  async runAllTests(): Promise<SecurityTestResult[]> {
    console.log('🔍 セキュリティテストスイート開始...\n')

    this.results = []

    console.log('1. 入力サニタイゼーションテスト...')
    this.testInputSanitization()

    console.log('2. HTMLサニタイゼーションテスト...')
    this.testHtmlSanitization()

    console.log('3. バリデーションテスト...')
    this.testValidation()

    console.log('4. レート制限テスト...')
    await this.testRateLimit()

    console.log('5. CSRF保護テスト...')
    this.testCSRFProtection()

    return this.results
  }

  /**
   * テスト結果の詳細レポート
   */
  generateDetailedReport(): string {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    let report = '📊 セキュリティテスト詳細レポート\n'
    report += '=' .repeat(50) + '\n\n'
    report += `総テスト数: ${totalTests}\n`
    report += `✅ 成功: ${passedTests}\n`
    report += `❌ 失敗: ${failedTests}\n`
    report += `成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%\n\n`

    if (failedTests > 0) {
      report += '❌ 失敗したテスト:\n'
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          report += `  • ${result.test}\n`
          report += `    入力: ${JSON.stringify(result.input)}\n`
          report += `    出力: ${JSON.stringify(result.output)}\n`
          report += `    期待値: ${JSON.stringify(result.expected)}\n`
          report += `    備考: ${result.notes}\n\n`
        })
    }

    report += '✅ 成功したテスト:\n'
    this.results
      .filter(r => r.passed)
      .forEach(result => {
        report += `  • ${result.test}\n`
      })

    return report
  }

  /**
   * テスト結果のサマリー
   */
  generateSummary(): string {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const successRate = ((passedTests / totalTests) * 100).toFixed(2)

    return `🔒 セキュリティテスト結果: ${passedTests}/${totalTests} (${successRate}%) 成功`
  }
}

// テスト実行用のヘルパー関数
export async function runSecurityTests(): Promise<void> {
  const testSuite = new SecurityTestSuite()
  const results = await testSuite.runAllTests()
  
  console.log('\n' + testSuite.generateDetailedReport())
  console.log('\n' + testSuite.generateSummary())
}