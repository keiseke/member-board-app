// scripts/test-sakura-alternative.js
const nodemailer = require('nodemailer')
const net = require('net')
require('dotenv').config({ path: '.env.local' })

async function testSakuraAlternative() {
  console.log('🔧 さくらインターネット代替テスト\n')
  console.log('=' .repeat(60))

  const host = 'mkpapa.sakura.ne.jp'
  const ports = [587, 465, 25, 993, 995, 143, 110]
  
  console.log('🔌 1. ポート接続テスト')
  console.log('-'.repeat(40))
  
  // 基本的なポート接続テスト
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket()
        const timeout = setTimeout(() => {
          socket.destroy()
          reject(new Error('timeout'))
        }, 5000)
        
        socket.connect(port, host, () => {
          clearTimeout(timeout)
          socket.destroy()
          resolve()
        })
        
        socket.on('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
      
      console.log(`✅ ポート ${port}: 接続可能`)
    } catch (error) {
      console.log(`❌ ポート ${port}: ${error.message}`)
    }
  }

  console.log('\n🌐 2. DNS・ネットワーク情報')
  console.log('-'.repeat(40))
  
  try {
    const dns = require('dns').promises
    const addresses = await dns.resolve4(host)
    console.log(`✅ DNS解決: ${host} → ${addresses.join(', ')}`)
    
    // WHOIS風の追加情報
    console.log(`📍 IPアドレス: ${addresses[0]}`)
  } catch (error) {
    console.log(`❌ DNS解決エラー: ${error.message}`)
  }

  console.log('\n📧 3. 代替SMTP設定テスト')
  console.log('-'.repeat(40))
  
  // さくらインターネットの代替設定パターン
  const alternativeConfigs = [
    {
      name: 'さくら標準（POP before SMTP風）',
      config: {
        host: host,
        port: 25,
        secure: false,
        ignoreTLS: true,
        requireTLS: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      }
    },
    {
      name: 'さくら（認証なし送信テスト）',
      config: {
        host: host,
        port: 25,
        secure: false,
        ignoreTLS: true,
        // 認証なしでテスト
      }
    },
    {
      name: 'さくら（CRAM-MD5認証）',
      config: {
        host: host,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        authMethod: 'CRAM-MD5'
      }
    }
  ]

  for (const { name, config } of alternativeConfigs) {
    console.log(`\n🧪 ${name}`)
    try {
      const transporter = nodemailer.createTransport(config)
      await transporter.verify()
      console.log(`✅ ${name}: 接続成功!`)
      
      // 成功した場合は詳細を表示
      console.log(`   推奨設定: ホスト=${config.host}, ポート=${config.port}`)
      return { success: true, config, name }
      
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
      
      if (error.message.includes('ETIMEDOUT')) {
        console.log('   💡 タイムアウト → ファイアウォール/制限の可能性')
      } else if (error.message.includes('authentication failed')) {
        console.log('   💡 認証エラー → パスワード/設定の問題')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 接続拒否 → サービス停止/制限')
      }
    }
  }

  console.log('\n🏥 4. 診断結果')
  console.log('-'.repeat(40))
  console.log('🔍 推奨確認事項:')
  console.log('1. さくらコントロールパネル → 「セキュリティ設定」')
  console.log('2. 「アクセス制限」でIP制限確認')
  console.log('3. 「送信制限」で時間帯制限確認')  
  console.log('4. 「スパム対策」設定確認')
  console.log('5. メールアドレスごとの個別設定確認')
  
  return { success: false }
}

testSakuraAlternative()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 動作する設定が見つかりました!')
      console.log(`使用設定: ${result.name}`)
    } else {
      console.log('\n📞 サポートへの問い合わせを推奨します')
      console.log('さくらインターネットサポート: 0120-775-664')
    }
  })
  .catch(console.error)