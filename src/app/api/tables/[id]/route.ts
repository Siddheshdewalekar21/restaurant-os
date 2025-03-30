import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating a table
const updateTableSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING']).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  shape: z.enum(['CIRCLE', 'RECTANGLE', 'SQUARE']).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// GET /api/tables/[id] - Get a specific table
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const table = await db.table.findUnique({
      where: { id: params.id },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}

// PATCH /api/tables/[id] - Update a table
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if table exists
    const table = await db.table.findUnique({
      where: { id: params.id },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateTableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If tableNumber is being updated, check for duplicates
    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existingTable = await db.table.findFirst({
        where: {
          tableNumber: data.tableNumber,
          branchId: table.branchId,
          id: { not: params.id },
        },
      });

      if (existingTable) {
        return NextResponse.json(
          { error: 'Table number already exists in this branch' },
          { status: 400 }
        );
      }
    }

    // Update table
    const updatedTable = await db.table.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Delete a table
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or manager role
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if table exists
    const table = await db.table.findUnique({
      where: { id: params.id },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Check if table has active orders
    const activeOrders = await db.order.count({
      where: {
        tableId: params.id,
        status: { in: ['PENDING', 'IN_PROGRESS', 'READY'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with active orders' },
        { status: 400 }
      );
    }

    // Delete table
    await db.table.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
