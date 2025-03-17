import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/utils/api';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'ok';
    let dbError = null;
    try {
      // Simple query to check database connection
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'error';
      dbError = String(error);
    }
    
    // Check Redis connection if available
    let redisStatus = 'unknown';
    let redisError = null;
    try {
      if (redis) {
        await redis.ping();
        redisStatus = 'ok';
      } else {
        redisStatus = 'not_configured';
      }
    } catch (error) {
      redisStatus = 'error';
      redisError = String(error);
    }
    
    // Get environment info
    const environment = process.env.NODE_ENV || 'development';
    const serverTime = new Date().toISOString();
    const responseTime = Date.now() - startTime;
    
    return successResponse({
      status: 'online',
      environment,
      serverTime,
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        redis: {
          status: redisStatus,
          error: redisError,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    console.error('Error checking server status:', error);
    return errorResponse('Failed to check server status', 500);
  }
} 