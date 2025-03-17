import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/utils/api';

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            type: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        feedback: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            feedback: true,
          },
        },
      },
    });
    
    if (!customer) {
      return notFoundResponse('Customer not found');
    }
    
    // Calculate total spent
    const totalSpent = await prisma.order.aggregate({
      where: {
        customerId: id,
        status: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // Calculate average rating
    const averageRating = await prisma.feedback.aggregate({
      where: {
        customerId: id,
      },
      _avg: {
        rating: true,
      },
    });
    
    const customerData = {
      ...customer,
      totalSpent: totalSpent._sum.totalAmount || 0,
      averageRating: averageRating._avg.rating || 0,
    };
    
    return successResponse(customerData);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return errorResponse('Failed to fetch customer', 500);
  }
}

// PATCH /api/customers/[id] - Update a specific customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    
    if (!customer) {
      return notFoundResponse('Customer not found');
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Create a schema for partial updates
    const updateSchema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').optional(),
      email: z.string().email('Invalid email address').optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      loyaltyPoints: z.number().int().optional(),
    });
    
    const result = updateSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    // If changing email, check if it already exists
    if (result.data.email && result.data.email !== customer.email) {
      const existingCustomerByEmail = await prisma.customer.findFirst({
        where: {
          email: result.data.email,
          id: { not: id },
        },
      });
      
      if (existingCustomerByEmail) {
        return errorResponse('Customer with this email already exists', 409);
      }
    }
    
    // If changing phone, check if it already exists
    if (result.data.phone && result.data.phone !== customer.phone) {
      const existingCustomerByPhone = await prisma.customer.findFirst({
        where: {
          phone: result.data.phone,
          id: { not: id },
        },
      });
      
      if (existingCustomerByPhone) {
        return errorResponse('Customer with this phone number already exists', 409);
      }
    }
    
    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: result.data,
    });
    
    return successResponse(updatedCustomer, 'Customer updated successfully');
  } catch (error) {
    console.error('Error updating customer:', error);
    return errorResponse('Failed to update customer', 500);
  }
}

// DELETE /api/customers/[id] - Delete a specific customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Only admin and manager can delete customers
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return errorResponse('You do not have permission to delete customers', 403);
    }
    
    const { id } = params;
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
    
    if (!customer) {
      return notFoundResponse('Customer not found');
    }
    
    // Check if customer has orders
    if (customer.orders.length > 0) {
      return errorResponse('Cannot delete customer with existing orders', 400);
    }
    
    // Delete customer feedback first
    await prisma.feedback.deleteMany({
      where: { customerId: id },
    });
    
    // Delete customer
    await prisma.customer.delete({
      where: { id },
    });
    
    return successResponse(null, 'Customer deleted successfully');
  } catch (error) {
    console.error('Error deleting customer:', error);
    return errorResponse('Failed to delete customer', 500);
  }
} 