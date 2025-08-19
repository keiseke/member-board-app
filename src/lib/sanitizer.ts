import DOMPurify from 'isomorphic-dompurify'

export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: string[]
  maxLength?: number
}

const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
]

const DEFAULT_ALLOWED_ATTRIBUTES = ['class']

export function sanitizeHtml(
  dirty: string, 
  options: SanitizeOptions = {}
): string {
  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    maxLength = 10000
  } = options

  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  // 長さ制限
  const truncated = dirty.length > maxLength 
    ? dirty.substring(0, maxLength) + '...'
    : dirty

  return DOMPurify.sanitize(truncated, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    USE_PROFILES: { html: true }
  })
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/[<>]/g, '') // HTMLタグ除去
    .replace(/javascript:/gi, '') // JavaScriptプロトコル除去
    .replace(/data:/gi, '') // Dataプロトコル除去
    .replace(/vbscript:/gi, '') // VBScriptプロトコル除去
    .replace(/on\w+=/gi, '') // イベントハンドラー除去
    .trim()
    .substring(0, maxLength)
}

export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9@._-]/g, '') // メールアドレスで許可された文字のみ
    .substring(0, 320) // RFC 5321 制限
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  try {
    const parsed = new URL(url)
    
    // 許可されたプロトコルのみ
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return ''
    }

    return parsed.toString()
  } catch {
    return ''
  }
}

export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 安全な文字のみ
    .replace(/_{2,}/g, '_') // 連続アンダースコア除去
    .substring(0, 255) // ファイル名長制限
}

export function validateInput(input: string, type: 'text' | 'email' | 'url' | 'filename'): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  switch (type) {
    case 'text':
      return input.length > 0 && input.length <= 1000
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(input) && input.length <= 320
    case 'url':
      try {
        new URL(input)
        return true
      } catch {
        return false
      }
    case 'filename':
      return /^[a-zA-Z0-9._-]+$/.test(input) && input.length <= 255
    default:
      return false
  }
}

// よく使用される検証とサニタイズのコンボ
export function sanitizeAndValidatePost(data: {
  title?: string
  content?: string
}): { title: string; content: string; isValid: boolean } {
  const title = sanitizeInput(data.title || '', 200)
  const content = sanitizeHtml(data.content || '', { maxLength: 10000 })
  
  const isValid = title.length >= 3 && title.length <= 200 &&
                  content.length >= 10 && content.length <= 10000

  return { title, content, isValid }
}

export function sanitizeAndValidateThread(data: {
  title?: string
  description?: string
}): { title: string; description: string; isValid: boolean } {
  const title = sanitizeInput(data.title || '', 200)
  const description = sanitizeHtml(data.description || '', { maxLength: 1000 })
  
  const isValid = title.length >= 3 && title.length <= 200 &&
                  description.length >= 10 && description.length <= 1000

  return { title, description, isValid }
}