// scripts/check-env.js
require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT', 
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_ADMIN',
  'EMAIL_SUPPORT',
  'JWT_SECRET'
]

console.log('🔍 環境変数確認テスト\n')
console.log('=' .repeat(50))

let allConfigured = true

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = varName.includes('PASSWORD') 
    ? (value ? '*'.repeat(8) : 'NOT SET')
    : (value || 'NOT SET')
    
  console.log(`${status} ${varName}: ${displayValue}`)
  
  if (!value) allConfigured = false
})

console.log('\n' + '=' .repeat(50))
console.log(allConfigured ? '✅ 全ての環境変数が設定されています' : '❌ 不足している環境変数があります')

// SMTP設定サマリー
if (allConfigured) {
  console.log('\n📧 メール設定サマリー:')
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`)
  console.log(`SMTP Port: ${process.env.SMTP_PORT}`)
  console.log(`SMTP User: ${process.env.SMTP_USER}`)
  console.log(`From: ${process.env.EMAIL_FROM}`)
  console.log(`Admin: ${process.env.EMAIL_ADMIN}`)
  console.log(`Support: ${process.env.EMAIL_SUPPORT}`)
  
  // JWT_SECRET強度チェック
  const jwtSecret = process.env.JWT_SECRET
  console.log('\n🔐 JWT_SECRET強度チェック:')
  console.log(`長さ: ${jwtSecret?.length}文字 ${jwtSecret?.length >= 64 ? '✅' : '⚠️ (推奨64文字以上)'}`)
  console.log(`文字種: ${/^[a-fA-F0-9]+$/.test(jwtSecret) ? 'HEX ✅' : '混合文字 ⚠️'}`)
}