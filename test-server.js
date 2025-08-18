// test-server.js - 簡単なテストサーバー
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Member Board App - Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { padding: 10px; background: #e8f5e8; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Member Board App</h1>
          <div class="status">
            <h2>✅ テストサーバーが正常に動作しています</h2>
            <p>Next.jsの依存関係問題を解決中です。</p>
            <h3>🔐 実装済みセキュリティ機能:</h3>
            <ul>
              <li>✅ レート制限システム</li>
              <li>✅ 入力サニタイゼーション</li>
              <li>✅ CSRF対策</li>
              <li>✅ セキュリティヘッダー</li>
              <li>✅ 監査ログシステム</li>
            </ul>
            <h3>📋 次のステップ:</h3>
            <ol>
              <li>新しいNext.jsプロジェクト作成</li>
              <li>既存コードの移行</li>
              <li>セキュリティ機能の再適用</li>
            </ol>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 テストサーバーが起動しました: http://localhost:${PORT}`);
  console.log('Ctrl+C で停止');
});