import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/api';

// Feedback validation schema
const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  customerId: z.string(),
  orderId: z.string().optional(),
});

// GET /api/feedback - Get all feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    // Build where clause based on query params
    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    
    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return successResponse(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return errorResponse('Failed to fetch feedback', 500);
  }
}

// POST /api/feedback - Create new feedback
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    const { rating, comment, customerId, orderId } = result.data;
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      return errorResponse('Customer not found', 404);
    }
    
    // Check if order exists (if provided)
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      
      if (!order) {
        return errorResponse('Order not found', 404);
      }
      
      // Check if order belongs to customer
      if (order.customerId !== customerId) {
        return errorResponse('Order does not belong to this customer', 400);
      }
    }
    
    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        rating,
        comment,
        customer: {
          connect: { id: customerId },
        },
        ...(orderId && {
          order: {
            connect: { id: orderId },
          },
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Add loyalty points for providing feedback
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: 5, // Add 5 points for feedback
        },
      },
    });
    
    return successResponse(feedback, 'Feedback submitted successfully');
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return errorResponse('Failed to submit feedback', 500);
  }
} 