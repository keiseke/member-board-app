// scripts/test-security-implementation.js
const crypto = require('crypto')

async function testSecurityImplementation() {
  console.log('🔐 セキュリティ実装テスト開始\n')
  console.log('=' .repeat(60))

  // 1. レート制限テスト
  console.log('\n🚦 1. レート制限テスト')
  console.log('   ℹ️  手動テスト: 1分間に6回のPOSTリクエストを送信してください')
  console.log('   📍 エンドポイント: /api/posts')
  console.log('   ✅ 期待結果: 6回目で429エラーが返される')
  
  // 2. 入力サニタイゼーションテスト
  console.log('\n🧹 2. 入力サニタイゼーションテスト')
  const testInputs = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<iframe src="evil.com"></iframe>',
    'data:text/html,<script>alert("XSS")</script>',
    'vbscript:msgbox("XSS")',
    'onclick="alert(1)"',
    '"><script>alert("XSS")</script>',
    'Normal text content'
  ]
  
  console.log('   テスト対象入力:')
  testInputs.forEach((input, index) => {
    console.log(`   ${index + 1}. ${input}`)
  })
  console.log('   ✅ 期待結果: スクリプトタグやJavaScriptプロトコルが除去される')

  // 3. セキュリティヘッダーテスト
  console.log('\n🛡️  3. セキュリティヘッダーテスト')
  console.log('   📍 確認方法: ブラウザのDevTools > Network > Response Headers')
  const expectedHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options: DENY',
    'X-Content-Type-Options: nosniff',
    'X-XSS-Protection: 1; mode=block',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy',
    'X-DNS-Prefetch-Control: off'
  ]
  
  expectedHeaders.forEach(header => {
    console.log(`   ✅ ${header}`)
  })

  // 4. CSRF保護テスト
  console.log('\n🔒 4. CSRF保護テスト')
  console.log('   📍 テスト方法:')
  console.log('   1. ログイン状態でPOSTリクエストを送信')
  console.log('   2. CSRFトークンを含めない、または無効なトークンを使用')
  console.log('   3. 外部サイトからのリクエストをシミュレート')
  console.log('   ✅ 期待結果: 403 Forbidden エラーが返される')

  // 5. 監査ログテスト
  console.log('\n📊 5. 監査ログテスト')
  console.log('   📍 確認方法: MongoDBのaudit_logsコレクションを確認')
  const loggedActions = [
    'POST_CREATE_SUCCESS',
    'POST_CREATE_FAILED', 
    'RATE_LIMIT_EXCEEDED',
    'CSRF_VIOLATION',
    'UNAUTHORIZED_ACCESS',
    'PAGE_ACCESS'
  ]
  
  console.log('   記録されるべきアクション:')
  loggedActions.forEach(action => {
    console.log(`   ✅ ${action}`)
  })

  // 6. テスト用のcurlコマンド生成
  console.log('\n🧪 6. 手動テスト用コマンド')
  console.log('\n   📍 レート制限テスト:')
  console.log(`   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/posts \\
       -H "Content-Type: application/json" \\
       -d '{"title":"Test $i","content":"Test content","threadId":"THREAD_ID"}' \\
       -b "next-auth.session-token=YOUR_SESSION_TOKEN"
     echo "Request $i completed"
     sleep 1
   done`)

  console.log('\n   📍 XSSテスト:')
  console.log(`   curl -X POST http://localhost:3000/api/posts \\
     -H "Content-Type: application/json" \\
     -d '{"title":"<script>alert(\\"XSS\\")</script>","content":"<iframe src=\\"evil.com\\"></iframe>","threadId":"THREAD_ID"}' \\
     -b "next-auth.session-token=YOUR_SESSION_TOKEN"`)

  console.log('\n   📍 CSRF テスト:')
  console.log(`   curl -X POST http://localhost:3000/api/posts \\
     -H "Content-Type: application/json" \\
     -H "Origin: http://evil.com" \\
     -d '{"title":"CSRF Test","content":"CSRF attack attempt","threadId":"THREAD_ID"}' \\
     -b "next-auth.session-token=YOUR_SESSION_TOKEN"`)

  // 7. セキュリティチェックリスト
  console.log('\n📋 7. セキュリティチェックリスト')
  const checklist = [
    '✅ レート制限: 1分間に5回まで',
    '✅ 入力サニタイゼーション: HTMLタグ、JSプロトコル除去', 
    '✅ XSS対策: DOMPurifyによるサニタイゼーション',
    '✅ CSRF対策: トークン検証',
    '✅ セキュリティヘッダー: CSP, Frame Options等',
    '✅ 監査ログ: 全てのセキュリティイベントを記録',
    '✅ セッション管理: NextAuth + JWT',
    '✅ 認証・認可: ミドルウェアレベルでの保護'
  ]
  
  checklist.forEach(item => {
    console.log(`   ${item}`)
  })

  // 8. パフォーマンス考慮事項
  console.log('\n⚡ 8. パフォーマンス考慮事項')
  console.log('   📊 LRUキャッシュ: レート制限データの効率的な管理')
  console.log('   🗄️  MongoDB: 監査ログのインデックス最適化')
  console.log('   🔄 非同期処理: ログ記録がレスポンス時間に影響しない設計')
  console.log('   💾 メモリ使用量: キャッシュサイズ制限（1000エントリ）')

  // 9. 本番環境への移行チェックリスト
  console.log('\n🚀 9. 本番環境チェックリスト')
  const productionChecklist = [
    '🔐 NEXTAUTH_SECRET: 強力なランダム文字列に設定',
    '🌐 CSRF設定: 本番ドメインに対応',
    '📊 ログレベル: 本番用に調整（DEBUGログ無効化）',
    '🗄️  DB接続: 本番MongoDB接続文字列',
    '📈 モニタリング: セキュリティイベントのアラート設定',
    '🔄 ログローテーション: 古い監査ログの自動削除',
    '🛡️  WAF設定: 追加の外部保護レイヤー',
    '📋 セキュリティテスト: ペネトレーションテスト実施'
  ]
  
  productionChecklist.forEach(item => {
    console.log(`   ${item}`)
  })

  console.log('\n' + '=' .repeat(60))
  console.log('🔒 セキュリティ実装テスト完了')
  console.log('\n📝 次のステップ:')
  console.log('1. 手動テストを実行してセキュリティ機能を確認')
  console.log('2. 監査ログが正しく記録されているかMongoDB で確認') 
  console.log('3. ブラウザでセキュリティヘッダーが設定されているか確認')
  console.log('4. 本番環境前に追加のセキュリティテストを実施')
}

// CSRFトークン生成例
function generateCSRFExample() {
  const token = crypto.randomBytes(32).toString('hex')
  console.log('\n🔑 CSRF トークン例:')
  console.log(`   Token: ${token}`)
  console.log(`   Length: ${token.length} characters`)
}

testSecurityImplementation()
  .then(() => generateCSRFExample())
  .catch(console.error)