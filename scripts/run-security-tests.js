// scripts/run-security-tests.js
const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🔐 対話的セキュリティテストツール\n')

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

async function testRateLimit() {
  console.log('\n🚦 レート制限テストを開始します...')
  
  const sessionToken = await askQuestion('セッショントークンを入力してください: ')
  const threadId = await askQuestion('スレッドIDを入力してください: ')
  
  console.log('\n6回のリクエストを送信します...')
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = execSync(`curl -s -w "Status: %{http_code}" -X POST http://localhost:3000/api/posts \
        -H "Content-Type: application/json" \
        -H "Cookie: next-auth.session-token=${sessionToken}" \
        -d '{"title":"テスト投稿 ${i}","content":"レート制限テスト用コンテンツ","threadId":"${threadId}"}'`, 
        { encoding: 'utf8' }
      )
      
      console.log(`リクエスト ${i}: ${response.includes('Status: 201') ? '✅ 成功' : '❌ 失敗'}`)
      if (response.includes('Status: 429')) {
        console.log(`🎯 レート制限が${i}回目で作動しました！`)
        break
      }
    } catch (error) {
      console.log(`リクエスト ${i}: ❌ エラー - ${error.message}`)
    }
    
    if (i < 6) await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function testXSS() {
  console.log('\n🧹 XSS対策テストを開始します...')
  
  const sessionToken = await askQuestion('セッショントークンを入力してください: ')
  const threadId = await askQuestion('スレッドIDを入力してください: ')
  
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ]
  
  for (let i = 0; i < xssPayloads.length; i++) {
    const payload = xssPayloads[i]
    console.log(`\nテスト ${i + 1}: ${payload}`)
    
    try {
      const response = execSync(`curl -s -X POST http://localhost:3000/api/posts \
        -H "Content-Type: application/json" \
        -H "Cookie: next-auth.session-token=${sessionToken}" \
        -d '{"title":"XSS Test ${i + 1}","content":"${payload.replace(/"/g, '\\"')}","threadId":"${threadId}"}'`, 
        { encoding: 'utf8' }
      )
      
      if (response.includes(payload)) {
        console.log('❌ XSS脆弱性の可能性があります！')
      } else {
        console.log('✅ XSSペイロードが適切にサニタイズされました')
      }
    } catch (error) {
      console.log(`❌ エラー: ${error.message}`)
    }
  }
}

async function checkSecurityHeaders() {
  console.log('\n🛡️ セキュリティヘッダーをチェックします...')
  
  const expectedHeaders = {
    'content-security-policy': 'CSP設定確認',
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'x-xss-protection': '1; mode=block',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'Permissions Policy設定',
    'x-dns-prefetch-control': 'off'
  }
  
  const ports = [3000, 3001, 3002]
  let serverFound = false
  
  for (const port of ports) {
    try {
      console.log(`\n📡 ポート${port}でサーバーをチェック中...`)
      const response = execSync(`curl -s -I --connect-timeout 5 http://localhost:${port}/`, { encoding: 'utf8' })
      
      if (response.includes('200 OK') || response.includes('HTTP')) {
        serverFound = true
        console.log(`✅ ポート${port}でサーバーが稼働中`)
        
        Object.entries(expectedHeaders).forEach(([header, description]) => {
          const headerLine = response.split('\n').find(line => 
            line.toLowerCase().startsWith(header.toLowerCase() + ':')
          )
          
          if (headerLine) {
            const value = headerLine.split(':')[1].trim()
            console.log(`✅ ${header}: ${value}`)
          } else {
            console.log(`❌ ${header}: 設定されていません`)
          }
        })
        break
      }
    } catch (error) {
      console.log(`❌ ポート${port}: 接続できません`)
    }
  }
  
  if (!serverFound) {
    console.log('❌ 利用可能なサーバーが見つかりません。サーバーを起動してください:')
    console.log('   npm run dev')
  }
}

async function checkAuditLogs() {
  console.log('\n📊 監査ログをチェックします...')
  console.log('MongoDBに接続して audit_logs コレクションを確認してください:')
  console.log(`
  mongosh mongodb://localhost:27017/member_board
  
  # 最新のログを表示
  db.audit_logs.find().sort({timestamp: -1}).limit(5).pretty()
  
  # 失敗したアクションを確認
  db.audit_logs.find({success: false}).pretty()
  
  # アクション別統計
  db.audit_logs.aggregate([
    {$group: {_id: "$action", count: {$sum: 1}}},
    {$sort: {count: -1}}
  ])
  `)
}

async function runInteractiveTests() {
  while (true) {
    console.log('\n📋 実行したいテストを選択してください:')
    console.log('1. レート制限テスト')
    console.log('2. XSS対策テスト') 
    console.log('3. セキュリティヘッダーチェック')
    console.log('4. 監査ログチェック')
    console.log('5. 全テスト実行')
    console.log('0. 終了')
    
    const choice = await askQuestion('\n選択 (0-5): ')
    
    switch (choice) {
      case '1':
        await testRateLimit()
        break
      case '2':
        await testXSS()
        break
      case '3':
        await checkSecurityHeaders()
        break
      case '4':
        await checkAuditLogs()
        break
      case '5':
        await testRateLimit()
        await testXSS()
        await checkSecurityHeaders()
        await checkAuditLogs()
        break
      case '0':
        console.log('\n👋 テストを終了します')
        rl.close()
        return
      default:
        console.log('❌ 無効な選択です')
    }
    
    await askQuestion('\nEnterキーを押して続行...')
  }
}

// メイン実行
runInteractiveTests().catch(console.error)