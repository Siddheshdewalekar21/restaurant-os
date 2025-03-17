import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a reservation
const createReservationSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  contactNumber: z.string().min(10, 'Valid contact number is required'),
  email: z.string().email().optional().nullable(),
  partySize: z.number().int().positive('Party size must be a positive number'),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  tableId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid(),
  specialRequests: z.string().optional().nullable(),
});

// GET /api/reservations - Get all reservations with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    // Build where clause based on query params
    const whereClause: any = {};
    
    if (branchId) {
      whereClause.branchId = branchId;
    }
    
    if (date) {
      whereClause.reservationDate = date;
    }
    
    if (status) {
      // Handle comma-separated status values
      const statusValues = status.split(',');
      if (statusValues.length > 1) {
        whereClause.status = { in: statusValues };
      } else {
        whereClause.status = status;
      }
    }
    
    if (tableId) {
      whereClause.tableId = tableId;
    }

    const reservations = await db.reservation.findMany({
      where: whereClause,
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
          },
        },
      },
      orderBy: [
        { reservationDate: 'asc' },
        { reservationTime: 'asc' },
      ],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

// POST /api/reservations - Create a new reservation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createReservationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if branch exists
    const branch = await db.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // If tableId is provided, check if table exists and is available
    if (data.tableId) {
      const table = await db.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        );
      }

      if (table.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'Table is not available' },
          { status: 400 }
        );
      }

      // Check if table capacity is sufficient
      if (table.capacity < data.partySize) {
        return NextResponse.json(
          { error: 'Table capacity is not sufficient for the party size' },
          { status: 400 }
        );
      }

      // Check if table is already reserved for the same time
      const existingReservation = await db.reservation.findFirst({
        where: {
          tableId: data.tableId,
          reservationDate: data.reservationDate,
          reservationTime: data.reservationTime,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (existingReservation) {
        return NextResponse.json(
          { error: 'Table is already reserved for this time' },
          { status: 400 }
        );
      }
    }

    // Create reservation
    const reservation = await db.reservation.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });

    // If tableId is provided, update table status to RESERVED
    if (data.tableId) {
      await db.table.update({
        where: { id: data.tableId },
        data: { status: 'RESERVED' },
      });
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 