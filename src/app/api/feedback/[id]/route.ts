import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/utils/api';

// GET /api/feedback/[id] - Get a specific feedback
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });
    
    if (!feedback) {
      return notFoundResponse('Feedback not found');
    }
    
    return successResponse(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return errorResponse('Failed to fetch feedback', 500);
  }
}

// DELETE /api/feedback/[id] - Delete a specific feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Only admin and manager can delete feedback
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return errorResponse('You do not have permission to delete feedback', 403);
    }
    
    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
    
    if (!feedback) {
      return notFoundResponse('Feedback not found');
    }
    
    // Delete feedback
    await prisma.feedback.delete({
      where: { id },
    });
    
    // Deduct loyalty points that were awarded for the feedback
    await prisma.customer.update({
      where: { id: feedback.customerId },
      data: {
        loyaltyPoints: {
          decrement: 5, // Remove the 5 points that were awarded
        },
      },
    });
    
    return successResponse(null, 'Feedback deleted successfully');
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return errorResponse('Failed to delete feedback', 500);
  }
} 