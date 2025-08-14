#!/usr/bin/env node

// Simple build script to bypass Next.js caching issues
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

// Clean .next directory if it exists
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Cleaned .next directory');
  } catch (error) {
    console.log('⚠️  Could not clean .next directory:', error.message);
  }
}

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Run the build
const buildProcess = exec('npx next build', {
  env: {
    ...process.env,
    NODE_OPTIONS: '--max_old_space_size=4096'
  }
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!');
    
    // Check build output
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      console.log('\n📊 Build output:');
      const stats = fs.statSync(buildDir);
      console.log(`Build directory size: ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
      
      // List key files
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        console.log('\n📁 Static files generated');
      }
      
      const standaloneDir = path.join(buildDir, 'standalone');
      if (fs.existsSync(standaloneDir)) {
        console.log('📁 Standalone deployment ready');
      }
    }
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
  }
  process.exit(code);
});

// Handle timeout
setTimeout(() => {
  buildProcess.kill();
  console.error('❌ Build timed out after 5 minutes');
  process.exit(1);
}, 5 * 60 * 1000);