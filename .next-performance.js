// Next.js Performance Configuration
// This file optimizes Next.js development server startup time

const { existsSync, mkdirSync } = require('fs');
const path = require('path');

// Ensure cache directory exists
const cacheDir = path.join(__dirname, '.next', 'cache');
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

// Pre-warm cache for common modules
const commonModules = [
  'react',
  'react-dom',
  'next',
  '@mui/material',
  '@emotion/react',
  '@emotion/styled'
];

module.exports = {
  cacheDirectory: cacheDir,
  commonModules
};