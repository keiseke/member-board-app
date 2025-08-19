// src/components/email/WelcomeEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  userName: string
  dashboardUrl: string
  supportEmail: string
  appName: string
}

export const WelcomeEmail = ({
  userName,
  dashboardUrl,
  supportEmail,
  appName = '会員制掲示板'
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {appName}へようこそ！ログインしてご利用ください。
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 {appName}へようこそ！</Heading>
        
        <Text style={text}>
          {userName} さん
        </Text>
        
        <Text style={text}>
          メール認証が完了し、{appName}のメンバーになりました！
          これからコミュニティでの交流をお楽しみください。
        </Text>

        <Section style={featuresSection}>
          <Heading style={h2}>✨ ご利用いただける機能</Heading>
          
          <div style={featureItem}>
            <Text style={featureTitle}>💬 掲示板投稿</Text>
            <Text style={featureDescription}>
              スレッドを作成して、他のメンバーと情報交換ができます
            </Text>
          </div>
          
          <div style={featureItem}>
            <Text style={featureTitle}>👥 コミュニティ参加</Text>
            <Text style={featureDescription}>
              様々なトピックのディスカッションに参加できます
            </Text>
          </div>
          
          <div style={featureItem}>
            <Text style={featureTitle}>🔔 通知機能</Text>
            <Text style={featureDescription}>
              重要な更新やお知らせをメールで受け取れます
            </Text>
          </div>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={dashboardUrl}>
            ダッシュボードにアクセス
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={tipsSection}>
          <Heading style={h3}>💡 始め方のヒント</Heading>
          
          <Text style={tipText}>
            <strong>1. プロフィールを設定</strong><br />
            ダッシュボードでプロフィール情報を更新して、他のメンバーに自己紹介しましょう。
          </Text>
          
          <Text style={tipText}>
            <strong>2. 興味のあるトピックを探す</strong><br />
            様々なスレッドを閲覧して、興味のある話題に参加してください。
          </Text>
          
          <Text style={tipText}>
            <strong>3. 積極的に交流</strong><br />
            コメントや新しいスレッドを作成して、コミュニティを盛り上げましょう。
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={footerSection}>
          <Text style={footerText}>
            ご不明な点がございましたら、{' '}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>{' '}
            までお気軽にお問い合わせください。
          </Text>
          
          <Text style={footerText}>
            今後ともよろしくお願いいたします。<br />
            {appName}チーム一同
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

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '25px 0 15px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const featuresSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '30px',
  margin: '30px 0',
}

const featureItem = {
  marginBottom: '20px',
}

const featureTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const featureDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
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

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
}

const tipsSection = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '25px',
  margin: '30px 0',
}

const tipText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
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

export default WelcomeEmail