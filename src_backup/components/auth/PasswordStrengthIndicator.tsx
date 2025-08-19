'use client'

interface PasswordStrengthIndicatorProps {
  password: string
}

interface StrengthCriteria {
  label: string
  test: (password: string) => boolean
}

const strengthCriteria: StrengthCriteria[] = [
  { label: '8文字以上', test: (p) => p.length >= 8 },
  { label: '小文字を含む', test: (p) => /[a-z]/.test(p) },
  { label: '大文字を含む', test: (p) => /[A-Z]/.test(p) },
  { label: '数字を含む', test: (p) => /\d/.test(p) },
  { label: '特殊文字を含む', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) }
]

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const passedCriteria = strengthCriteria.filter(criteria => criteria.test(password))
  const strength = passedCriteria.length
  const percentage = (strength / strengthCriteria.length) * 100

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    if (strength <= 4) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength <= 2) return '弱い'
    if (strength <= 3) return '普通'
    if (strength <= 4) return '強い'
    return '非常に強い'
  }

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">パスワード強度</span>
        <span className={`font-medium ${
          strength <= 2 ? 'text-red-600' :
          strength <= 3 ? 'text-yellow-600' :
          strength <= 4 ? 'text-orange-600' :
          'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-1">
        {strengthCriteria.map((criteria, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
              criteria.test(password) ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {criteria.test(password) && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={criteria.test(password) ? 'text-green-600' : 'text-gray-500'}>
              {criteria.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}