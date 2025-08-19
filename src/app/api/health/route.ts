import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

interface HealthCheck {
  timestamp: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  version: string
  uptime: number
  checks: {
    database: 'healthy' | 'unhealthy' | 'checking...'
    memory: 'healthy' | 'warning' | 'critical' | 'checking...'
    environment: 'healthy' | 'unhealthy' | 'checking...'
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    responseTime: number
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  const healthCheck: HealthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: 'checking...',
      memory: 'checking...',
      environment: 'checking...'
    },
    metrics: {
      memoryUsage: process.memoryUsage(),
      responseTime: 0
    }
  }

  try {
    // Database health check
    if (mongoose.connection.readyState === 1) {
      // Already connected
      healthCheck.checks.database = 'healthy'
    } else {
      // Test connection
      await mongoose.connect(process.env.MONGODB_URI as string)
      await mongoose.connection.db?.admin().ping()
      healthCheck.checks.database = 'healthy'
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    healthCheck.checks.database = 'unhealthy'
    healthCheck.status = 'unhealthy'
  }

  // Memory health check
  const memUsage = healthCheck.metrics.memoryUsage
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024
  
  if (heapUsedMB > 400) {
    healthCheck.checks.memory = 'critical'
    healthCheck.status = 'degraded'
  } else if (heapUsedMB > 300) {
    healthCheck.checks.memory = 'warning'
    if (healthCheck.status === 'healthy') {
      healthCheck.status = 'degraded'
    }
  } else {
    healthCheck.checks.memory = 'healthy'
  }

  // Environment health check
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingEnvVars.length > 0) {
    healthCheck.checks.environment = 'unhealthy'
    healthCheck.status = 'unhealthy'
    console.error('Missing environment variables:', missingEnvVars)
  } else {
    healthCheck.checks.environment = 'healthy'
  }

  // Calculate response time
  healthCheck.metrics.responseTime = Date.now() - startTime

  // Log health check for monitoring
  if (process.env.NODE_ENV === 'production') {
    console.log('Health check:', {
      status: healthCheck.status,
      database: healthCheck.checks.database,
      memory: `${Math.round(heapUsedMB)}MB`,
      responseTime: `${healthCheck.metrics.responseTime}ms`
    })
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 500

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  })
}