import { NextRequest } from 'next/server';
import { hash } from 'bcrypt';
import prisma from '@/lib/prisma';
import { userRegisterSchema } from '@/utils/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = userRegisterSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    const { name, email, password, role, branchId } = result.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });
    
    return successResponse(user, 'User registered successfully');
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Failed to register user', 500);
  }
} 