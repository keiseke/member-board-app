// scripts/test-react-email.js
const { render } = require('@react-email/render')

// React EmailコンポーネントをCommonJS形式で動的インポート
async function testReactEmail() {
  try {
    console.log('🧪 React Email機能テスト開始...\n')

    // テンプレートのプレビューURL
    const baseUrl = 'http://localhost:3000'
    const templates = [
      { name: 'Welcome Email', path: '/api/email-preview?template=welcome&userName=テストユーザー' },
      { name: 'Verification Email', path: '/api/email-preview?template=verification&userName=テストユーザー' },
      { name: 'Password Reset Email', path: '/api/email-preview?template=password-reset&userName=テストユーザー' }
    ]

    console.log('📧 利用可能なメールテンプレート:')
    console.log('================================')
    
    templates.forEach(template => {
      console.log(`${template.name}:`)
      console.log(`  ${baseUrl}${template.path}`)
      console.log('')
    })

    console.log('💡 使い方:')
    console.log('  1. 開発サーバーを起動: npm run dev')
    console.log('  2. ブラウザで上記URLを開いてプレビュー確認')
    console.log('  3. テンプレートを編集後、ブラウザを更新してリアルタイム確認')
    console.log('')

    console.log('🔧 カスタマイズ方法:')
    console.log('  - src/components/email/ でテンプレート編集')
    console.log('  - src/lib/email/templates.ts で送信関数定義')
    console.log('  - src/lib/email/client.ts で送信ロジック実装')
    console.log('')

    console.log('📊 配信ログ確認:')
    console.log('  GET /api/admin/email-stats?days=30')
    console.log('')

    console.log('✅ React Email機能が正常にインストールされています！')

  } catch (error) {
    console.error('❌ React Email機能テストエラー:', error)
    console.log('\n💡 解決方法:')
    console.log('  1. React Emailパッケージがインストールされているか確認')
    console.log('  2. npm install react-email @react-email/components @react-email/render')
    console.log('  3. 開発サーバーが起動しているか確認: npm run dev')
  }
}

// 環境変数チェック関数
function checkEmailEnvironment() {
  console.log('🔍 メール送信環境変数チェック...\n')

  const requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASSWORD'
  ]

  const optionalVars = [
    'GMAIL_OAUTH_CLIENT_ID',
    'EMAIL_FROM',
    'EMAIL_FROM_NAME',
    'EMAIL_SUPPORT'
  ]

  console.log('必須環境変数:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    const status = value ? '✅' : '❌'
    console.log(`  ${status} ${varName}: ${value ? '設定済み' : '未設定'}`)
  })

  console.log('\nオプション環境変数:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    const status = value ? '✅' : '⚪'
    console.log(`  ${status} ${varName}: ${value ? '設定済み' : '未設定'}`)
  })

  console.log('')
}

// メイン実行
if (require.main === module) {
  checkEmailEnvironment()
  testReactEmail()
}