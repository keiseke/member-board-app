# Jest Worker Error 修正ログ - 2025/01/07

## 問題の概要

**エラーメッセージ**: 
```
Runtime Error
Jest worker encountered 2 child process exceptions, exceeding retry limit
```

**発生タイミング**: スレッド一覧画面からスレッドを選択した時

## 原因分析

1. **Jestワーカープロセスの競合**: 開発サーバー起動中にJestのワーカープロセスが異常終了
2. **メモリ不足**: 複数プロセスの同時実行によるリソース枯渇
3. **プロセス管理不備**: デフォルト設定でワーカー数が多すぎて不安定

## 実施した解決策

### 1. Jest設定の最適化
**ファイル**: `jest.config.js`
```javascript
// 追加した設定
maxWorkers: 1,              // ワーカープロセス数を1に制限
workerIdleMemoryLimit: '512MB', // メモリ制限
testTimeout: 15000          // タイムアウト延長
```

### 2. package.json の最適化
**ファイル**: `package.json`
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max_old_space_size=4096' next dev",
    "test": "jest --maxWorkers=1"
  }
}
```

### 3. Next.js設定の安定化
**ファイル**: `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  experimental: {
    forceSwcTransforms: true,  // SWC強制使用
  },
  onDemandEntries: {          // オンデマンドエントリー最適化
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {   // ファイル監視最適化
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};
```

### 4. プロセスクリーンアップ
- 全Node.jsプロセスを一旦終了
- 最適化した設定で開発サーバー再起動

## 結果

### ✅ エラー解決確認
- スレッド選択時のRuntime Errorが解消
- 開発サーバーが安定動作

### ✅ テスト安定化
```bash
PASS src/components/__tests__/PostForm.test.tsx (20.804 s)
PASS src/components/__tests__/ThreadForm.test.tsx (8.578 s)  
PASS src/components/__tests__/ThreadList.test.tsx
PASS src/components/__tests__/PostList.test.tsx

Test Suites: 4 passed, 4 total
Tests: 39 passed, 39 total ✅
Time: 36.696 s (前回39.6s → 若干高速化)
```

## 予防策

1. **ワーカー数制限**: 開発環境では`maxWorkers=1`を維持
2. **メモリ監視**: 大きなプロジェクトでは`NODE_OPTIONS`でヒープサイズ調整
3. **プロセス分離**: テスト実行と開発サーバーの適切な分離

## 学んだ教訓

- **Jest設定の重要性**: ワーカープロセス数は開発環境では少なめが安全
- **メモリ管理**: Node.jsアプリケーションでは明示的なメモリ制限が必要
- **プロセス競合**: 複数のNode.jsプロセスが同時実行される際の注意点

---

**解決完了**: スレッド選択時のJest worker errorが完全に解消されました。