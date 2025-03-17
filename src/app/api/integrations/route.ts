import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';
import { getCache, setCache, invalidateCachePattern } from '@/lib/redis';

// Integration validation schema
const integrationSchema = z.object({
  type: z.enum(['SWIGGY', 'ZOMATO', 'GOOGLE_MAPS', 'WHATSAPP']),
  apiKey: z.string().min(1, 'API Key is required'),
  secretKey: z.string().optional(),
  merchantId: z.string().optional(),
  webhookUrl: z.string().url('Invalid webhook URL').optional(),
});

// GET /api/integrations - Get all integrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    const cacheKey = 'integrations:all';
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return successResponse(cachedData);
    }
    
    const integrations = await prisma.integration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    await setCache(cacheKey, integrations, 300); // Cache for 5 minutes
    
    return successResponse(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return errorResponse('Failed to fetch integrations', 500);
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    if (session.user.role !== 'ADMIN') {
      return errorResponse('You do not have permission to manage integrations', 403);
    }
    
    const body = await request.json();
    const result = integrationSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    // Map integration type to name and category
    let name, category;
    switch (result.data.type) {
      case 'SWIGGY':
        name = 'Swiggy';
        category = 'DELIVERY';
        break;
      case 'ZOMATO':
        name = 'Zomato';
        category = 'DELIVERY';
        break;
      case 'GOOGLE_MAPS':
        name = 'Google Maps';
        category = 'MAPS';
        break;
      case 'WHATSAPP':
        name = 'WhatsApp Business';
        category = 'MESSAGING';
        break;
    }
    
    // Check if integration already exists
    const existingIntegration = await prisma.integration.findFirst({
      where: { name },
    });
    
    let integration;
    
    if (existingIntegration) {
      // Update existing integration
      integration = await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          apiKey: result.data.apiKey,
          secretKey: result.data.secretKey,
          merchantId: result.data.merchantId,
          webhookUrl: result.data.webhookUrl,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new integration
      integration = await prisma.integration.create({
        data: {
          name,
          type: category,
          status: 'ACTIVE',
          apiKey: result.data.apiKey,
          secretKey: result.data.secretKey,
          merchantId: result.data.merchantId,
          webhookUrl: result.data.webhookUrl,
        },
      });
    }
    
    await invalidateCachePattern('integrations:*');
    
    return successResponse(integration, existingIntegration ? 'Integration updated successfully' : 'Integration created successfully');
  } catch (error) {
    console.error('Error creating/updating integration:', error);
    return errorResponse('Failed to save integration', 500);
  }
}

// PATCH /api/integrations/:id/toggle-status - Toggle integration status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    if (session.user.role !== 'ADMIN') {
      return errorResponse('You do not have permission to manage integrations', 403);
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const integrationId = pathParts[pathParts.length - 2]; // Extract ID from URL
    
    if (!integrationId) {
      return errorResponse('Integration ID is required', 400);
    }
    
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });
    
    if (!integration) {
      return errorResponse('Integration not found', 404);
    }
    
    const updatedIntegration = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: integration.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    
    await invalidateCachePattern('integrations:*');
    
    return successResponse(updatedIntegration, 'Integration status updated successfully');
  } catch (error) {
    console.error('Error toggling integration status:', error);
    return errorResponse('Failed to update integration status', 500);
  }
} 