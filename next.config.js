/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Basic webpack configuration
  webpack: (config, { dev }) => {
    // Disable filesystem cache to avoid permission issues
    config.cache = false;
    
    if (dev) {
      // Development optimizations
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
        ignored: /node_modules/,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;