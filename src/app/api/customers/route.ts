import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { customerSchema } from '@/utils/validation';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Build where clause based on query params
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            orders: true,
            feedback: true,
          },
        },
      },
    });
    
    return successResponse(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return errorResponse('Failed to fetch customers', 500);
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log('Customer creation request body:', body);
    
    const result = customerSchema.safeParse(body);
    
    if (!result.success) {
      console.error('Validation error:', result.error.flatten());
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    // Check if customer with same email or phone already exists
    if (result.data.email) {
      const existingCustomerByEmail = await prisma.customer.findFirst({
        where: { email: result.data.email },
      });
      
      if (existingCustomerByEmail) {
        return errorResponse('Customer with this email already exists', 409);
      }
    }
    
    if (result.data.phone) {
      const existingCustomerByPhone = await prisma.customer.findFirst({
        where: { phone: result.data.phone },
      });
      
      if (existingCustomerByPhone) {
        return errorResponse('Customer with this phone number already exists', 409);
      }
    }
    
    // Create customer
    const customer = await prisma.customer.create({
      data: result.data,
      include: {
        _count: {
          select: {
            orders: true,
            feedback: true,
          },
        },
      },
    });
    
    console.log('Customer created successfully:', customer);
    return successResponse(customer, 'Customer created successfully');
  } catch (error) {
    console.error('Error creating customer:', error);
    return errorResponse('Failed to create customer', 500);
  }
} 