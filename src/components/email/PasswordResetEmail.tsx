// src/components/email/PasswordResetEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  userName?: string
  resetUrl: string
  supportEmail: string
  appName: string
}

export const PasswordResetEmail = ({
  userName,
  resetUrl,
  supportEmail,
  appName = '会員制掲示板'
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {appName} - パスワードリセットのご案内
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔑 パスワードリセットのご案内</Heading>
        
        <Section style={contentSection}>
          {userName ? (
            <Text style={text}>{userName} さん</Text>
          ) : (
            <Text style={text}>こんにちは</Text>
          )}
          
          <Text style={text}>
            {appName}でパスワードリセットのリクエストを受け付けました。
          </Text>
          
          <Text style={text}>
            以下のボタンをクリックして、新しいパスワードを設定してください。
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={resetUrl}>
            新しいパスワードを設定する
          </Button>
        </Section>

        <Section style={securitySection}>
          <Text style={securityTitle}>🛡️ セキュリティに関する重要な情報:</Text>
          <ul style={securityList}>
            <li style={securityItem}>このリンクは1時間後に無効になります</li>
            <li style={securityItem}>パスワードリセット後、全てのセッションが無効になります</li>
            <li style={securityItem}>心当たりがない場合は、このメールを無視してください</li>
            <li style={securityItem}>不審な活動を発見した場合は、すぐにサポートにご連絡ください</li>
          </ul>
        </Section>

        <Hr style={hr} />

        <Section style={alternativeSection}>
          <Text style={alternativeText}>
            リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：
          </Text>
          <Text style={urlText}>
            {resetUrl}
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={supportSection}>
          <Text style={supportTitle}>💡 サポートが必要ですか？</Text>
          <Text style={supportText}>
            パスワードリセットに関してご不明な点や、アカウントのセキュリティについて心配な点がございましたら、
            <a href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </a>
            まで今すぐお問い合わせください。
          </Text>
          
          <Text style={supportText}>
            私たちのサポートチームが迅速に対応いたします。
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={footerSection}>
          <Text style={footerText}>
            このメールに心当たりがない場合は、すぐに管理者にお知らせください。
          </Text>
          
          <Text style={footerText}>
            &copy; {appName}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// スタイル定義
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const contentSection = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '30px',
  margin: '30px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
  margin: '0 auto',
}

const securitySection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '25px',
  margin: '30px 0',
}

const securityTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px',
}

const securityList = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  paddingLeft: '20px',
}

const securityItem = {
  margin: '10px 0',
}

const alternativeSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '30px 0',
}

const alternativeText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 15px',
}

const urlText = {
  color: '#6b7280',
  fontSize: '12px',
  fontFamily: 'monospace',
  backgroundColor: '#f3f4f6',
  padding: '10px',
  borderRadius: '4px',
  wordBreak: 'break-all' as const,
  margin: '0',
}

const supportSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '25px',
  margin: '30px 0',
}

const supportTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px',
}

const supportText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
}

const footerSection = {
  margin: '30px 0',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#f59e0b',
  textDecoration: 'underline',
}

export default PasswordResetEmail