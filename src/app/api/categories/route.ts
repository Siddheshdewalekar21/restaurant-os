import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/utils/validation';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return successResponse(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Only admin and manager can create categories
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return errorResponse('You do not have permission to create categories', 403);
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = categorySchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    // Create category
    const category = await prisma.category.create({
      data: result.data,
    });
    
    return successResponse(category, 'Category created successfully');
  } catch (error) {
    console.error('Error creating category:', error);
    return errorResponse('Failed to create category', 500);
  }
} 