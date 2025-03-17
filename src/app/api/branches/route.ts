import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';
import { getCache, setCache, invalidateCachePattern } from '@/lib/redis';

// Schema for creating a branch
const createBranchSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/branches - Get all branches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branches = await db.branch.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create a new branch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validationResult = createBranchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if branch with same name already exists
    const existingBranch = await db.branch.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingBranch) {
      return NextResponse.json(
        { error: 'Branch with this name already exists' },
        { status: 400 }
      );
    }

    // Create branch
    const branch = await db.branch.create({
      data,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
} 