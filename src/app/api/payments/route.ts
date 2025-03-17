import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';

// Payment validation schema
const paymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'ONLINE']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).default('COMPLETED'),
  paymentReference: z.string().optional(),
});

// GET /api/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    // Build where clause based on query params
    const whereClause: any = {};
    if (orderId) whereClause.orderId = orderId;
    
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            type: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return successResponse(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return errorResponse('Failed to fetch payments', 500);
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = paymentSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    const { orderId, amount, paymentMethod, paymentStatus, paymentReference } = result.data;
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });
    
    if (!order) {
      return errorResponse('Order not found', 404);
    }
    
    // Check if payment already exists for this order
    if (order.payment) {
      return errorResponse('Payment already exists for this order', 409);
    }
    
    // Create payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod,
        paymentStatus,
        paymentReference,
        order: {
          connect: { id: orderId },
        },
      },
      include: {
        order: true,
      },
    });
    
    // If payment is completed, update order status to COMPLETED
    if (paymentStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });
      
      // If it's a dine-in order, update table status to AVAILABLE
      if (order.type === 'DINE_IN' && order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }
    
    // Generate transaction ID if not provided
    if (!paymentReference) {
      const transactionId = `TXN-${Date.now().toString().slice(-6)}`;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentReference: transactionId },
      });
      payment.paymentReference = transactionId;
    }
    
    return successResponse(payment, 'Payment processed successfully');
  } catch (error) {
    console.error('Error processing payment:', error);
    return errorResponse('Failed to process payment', 500);
  }
} 