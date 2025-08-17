# Page snapshot

```yaml
- main:
  - heading "ログイン" [level=1]
  - alert: メールアドレスまたはパスワードが正しくありません
  - text: メールアドレス
  - textbox "メールアドレス": test@example.com
  - text: パスワード
  - textbox "パスワード": password123
  - button "ログイン"
  - link "アカウントをお持ちでない方はこちら":
    - /url: /auth/register
  - link "パスワードを忘れた方はこちら":
    - /url: /auth/forgot-password
- alert
```