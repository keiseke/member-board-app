import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userName = searchParams.get('userName') || 'テストユーザー'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>テストメール</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #ec4899; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 テストメールプレビュー</h1>
    </div>
    <div class="content">
      <p><strong>${userName}</strong> さん、こんにちは！</p>
      <p>これはメールプレビューのテストです。</p>
      <p>このメッセージが表示されていれば、APIは正常に動作しています。</p>
    </div>
  </div>
</body>
</html>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  })
}