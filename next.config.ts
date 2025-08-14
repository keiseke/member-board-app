import type { NextConfig } from "next";
import path from "path";

// Bundle analyzerの設定
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Performance optimization for development
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // Disable tracing to avoid file permission issues on OneDrive
  trailingSlash: false,
  
  // Production output configuration
  output: 'standalone',
  distDir: '.next',
  // Webpack optimization for faster builds
  webpack: (config, { dev, isServer }) => {
    // Always disable filesystem cache to avoid permission issues on OneDrive
    config.cache = false;
    
    if (dev) {
      // Optimize development builds
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
        ignored: /node_modules/,
      };
      
      // Optimize resolve for faster module resolution
      config.resolve = {
        ...config.resolve,
        symlinks: false,
        cacheWithContext: false,
      };
      
      // Reduce bundle analysis overhead
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    } else {
      // Production build optimizations
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
      };
    }
    return config;
  },
  
};

export default withBundleAnalyzer(nextConfig);
