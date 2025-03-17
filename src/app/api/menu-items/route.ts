import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { menuItemSchema } from '@/utils/validation';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';

// GET /api/menu-items - Get all menu items
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/menu-items - Request received');
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    
    let whereClause: any = {};
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    console.log('Query parameters:', { categoryId, search, whereClause });
    
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`Found ${menuItems.length} menu items`);
    
    // Log the first item for debugging (if available)
    if (menuItems.length > 0) {
      console.log('Sample menu item:', JSON.stringify(menuItems[0]));
    }
    
    return successResponse(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return errorResponse('Failed to fetch menu items', 500);
  }
}

// POST /api/menu-items - Create a new menu item
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Only admin and manager can create menu items
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return errorResponse('You do not have permission to create menu items', 403);
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = menuItemSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: result.data.categoryId },
    });
    
    if (!category) {
      return errorResponse('Category not found', 404);
    }
    
    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: result.data,
    });
    
    return successResponse(menuItem, 'Menu item created successfully');
  } catch (error) {
    console.error('Error creating menu item:', error);
    return errorResponse('Failed to create menu item', 500);
  }
} 