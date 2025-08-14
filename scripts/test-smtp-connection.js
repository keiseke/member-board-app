// scripts/test-smtp-connection.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSMTPConnection() {
  console.log('🔗 SMTP接続テスト開始\n')
  console.log('=' .repeat(50))

  // トランスポーター設定パターン1: STARTTLS (推奨)
  const transporter1 = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // STARTTLS用
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  // トランスポーター設定パターン2: SSL/TLS
  const transporter2 = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // SSL/TLS用
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  // パターン1テスト
  console.log('🧪 パターン1: STARTTLS (ポート587)')
  try {
    await transporter1.verify()
    console.log('✅ STARTTLS接続成功!')
    return transporter1
  } catch (error) {
    console.log('❌ STARTTLS接続失敗:', error.message)
  }

  // パターン2テスト
  console.log('\n🧪 パターン2: SSL/TLS (ポート465)')
  try {
    await transporter2.verify()
    console.log('✅ SSL/TLS接続成功!')
    return transporter2
  } catch (error) {
    console.log('❌ SSL/TLS接続失敗:', error.message)
  }

  console.log('\n❌ 全ての接続パターンが失敗しました')
  return null
}

// テスト実行
testSMTPConnection()
  .then((transporter) => {
    if (transporter) {
      console.log('\n🎉 SMTP接続テスト完了: 接続成功')
      process.exit(0)
    } else {
      console.log('\n💥 SMTP接続テスト完了: 接続失敗')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 予期しないエラー:', error)
    process.exit(1)
  })