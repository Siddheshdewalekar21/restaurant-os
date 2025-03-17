import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a table
const createTableSchema = z.object({
  tableNumber: z.number().int().positive(),
  capacity: z.number().int().positive(),
  branchId: z.string(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  shape: z.enum(['CIRCLE', 'RECTANGLE', 'SQUARE']).default('CIRCLE'),
  width: z.number().positive().default(100),
  height: z.number().positive().default(100),
});

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

// GET /api/tables - Get all tables or filter by branchId
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    const tables = await db.table.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { tableNumber: 'asc' },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// POST /api/tables - Create a new table
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    console.log('Table creation request body:', body);
    
    // Ensure all required fields are present and of the correct type
    const tableData = {
      tableNumber: Number(body.tableNumber),
      capacity: Number(body.capacity),
      branchId: String(body.branchId),
      positionX: Number(body.positionX || 0),
      positionY: Number(body.positionY || 0),
      shape: body.shape || 'CIRCLE',
      width: Number(body.width || 100),
      height: Number(body.height || 100),
    };
    
    console.log('Processed table data:', tableData);
    
    // Check if table number already exists in the branch
    const existingTable = await db.table.findFirst({
      where: {
        tableNumber: tableData.tableNumber,
        branchId: tableData.branchId,
      },
    });

    if (existingTable) {
      console.log('Table number already exists:', existingTable);
      return NextResponse.json(
        { error: 'Table number already exists in this branch' },
        { status: 400 }
      );
    }

    // Create the table
    const table = await db.table.create({
      data: {
        ...tableData,
        status: 'AVAILABLE',
      },
    });

    console.log('Table created successfully:', table);
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/tables - Update multiple tables (for floor plan)
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Expected an array of tables' },
        { status: 400 }
      );
    }

    // Update tables in a transaction
    const results = await db.$transaction(
      body.map(table => {
        if (!table.id) {
          throw new Error('Table ID is required');
        }
        
        // Only update position and size
        return db.table.update({
          where: { id: table.id },
          data: {
            positionX: table.positionX,
            positionY: table.positionY,
            width: table.width,
            height: table.height,
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating tables:', error);
    return NextResponse.json(
      { error: 'Failed to update tables' },
      { status: 500 }
    );
  }
} 