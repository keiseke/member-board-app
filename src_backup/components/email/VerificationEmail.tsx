// src/components/email/VerificationEmail.tsx
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

interface VerificationEmailProps {
  userName?: string
  verificationUrl: string
  supportEmail: string
  appName: string
}

export const VerificationEmail = ({
  userName,
  verificationUrl,
  supportEmail,
  appName = '会員制掲示板'
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {appName} - メールアドレスの確認をお願いします
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 会員登録ありがとうございます</Heading>
        
        <Section style={welcomeSection}>
          <Heading style={h2}>メールアドレスの確認をお願いします</Heading>
          
          {userName ? (
            <Text style={text}>{userName} さん</Text>
          ) : (
            <Text style={text}>こんにちは！</Text>
          )}
          
          <Text style={text}>
            {appName}へのご登録ありがとうございます。<br />
            以下のボタンをクリックして、メールアドレスの確認を完了してください。
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={verificationUrl}>
            メールアドレスを確認する
          </Button>
        </Section>

        <Section style={infoSection}>
          <Text style={warningTitle}>⚠️ 重要:</Text>
          <ul style={infoList}>
            <li style={infoItem}>このリンクは24時間後に無効になります</li>
            <li style={infoItem}>メール確認が完了するまで、一部機能が制限されます</li>
            <li style={infoItem}>このメールに心当たりがない場合は、無視してください</li>
          </ul>
        </Section>

        <Hr style={hr} />

        <Section style={alternativeSection}>
          <Text style={alternativeText}>
            リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：
          </Text>
          <Text style={urlText}>
            {verificationUrl}
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={footerSection}>
          <Text style={footerText}>
            ご不明な点がございましたら、{' '}
            <a href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </a>{' '}
            までお気軽にお問い合わせください。
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

const h2 = {
  color: '#333',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '30px 0 20px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const welcomeSection = {
  backgroundColor: '#fdf2f8',
  borderRadius: '8px',
  padding: '30px',
  margin: '30px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#ec4899',
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

const infoSection = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #fecaca',
  padding: '20px',
  margin: '30px 0',
}

const warningTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px',
}

const infoList = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  paddingLeft: '20px',
}

const infoItem = {
  margin: '8px 0',
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
  color: '#ec4899',
  textDecoration: 'underline',
}

export default VerificationEmail