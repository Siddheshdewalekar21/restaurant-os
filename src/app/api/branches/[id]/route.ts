import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating a branch
const updateBranchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/branches/[id] - Get a specific branch
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branch = await db.branch.findUnique({
      where: { id: params.id },
      include: {
        tables: true,
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PATCH /api/branches/[id] - Update a branch
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if branch exists
    const branch = await db.branch.findUnique({
      where: { id: params.id },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateBranchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If name is being updated, check for duplicates
    if (data.name && data.name !== branch.name) {
      const existingBranch = await db.branch.findFirst({
        where: {
          name: data.name,
          id: { not: params.id },
        },
      });

      if (existingBranch) {
        return NextResponse.json(
          { error: 'Branch with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update branch
    const updatedBranch = await db.branch.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/[id] - Delete a branch
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if branch exists
    const branch = await db.branch.findUnique({
      where: { id: params.id },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Check if branch has tables
    const tablesCount = await db.table.count({
      where: { branchId: params.id },
    });

    if (tablesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete branch with tables. Remove all tables first.' },
        { status: 400 }
      );
    }

    // Check if branch has users
    const usersCount = await db.user.count({
      where: { branchId: params.id },
    });

    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete branch with users. Reassign all users first.' },
        { status: 400 }
      );
    }

    // Delete branch
    await db.branch.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
} 