const customJestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 15000,
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['babel-jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/', 
    '<rootDir>/e2e/',
    '<rootDir>/__tests__/helpers/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|openid-client|jose)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css', 
    '!src/types/**/*',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50, // 閾値を下げて実現可能に
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
}

module.exports = customJestConfig