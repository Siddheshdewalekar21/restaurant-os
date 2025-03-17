import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating a reservation
const updateReservationSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').optional(),
  contactNumber: z.string().min(10, 'Valid contact number is required').optional(),
  email: z.string().email().optional().nullable(),
  partySize: z.number().int().positive('Party size must be a positive number').optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  tableId: z.string().uuid().optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  specialRequests: z.string().optional().nullable(),
});

// GET /api/reservations/[id] - Get a specific reservation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservation = await db.reservation.findUnique({
      where: { id: params.id },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            capacity: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

// PATCH /api/reservations/[id] - Update a reservation
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if reservation exists
    const reservation = await db.reservation.findUnique({
      where: { id: params.id },
      include: {
        table: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateReservationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const oldTableId = reservation.tableId;
    const newTableId = data.tableId;
    const oldStatus = reservation.status;
    const newStatus = data.status;

    // If tableId is changing, check if new table exists and is available
    if (newTableId && newTableId !== oldTableId) {
      const table = await db.table.findUnique({
        where: { id: newTableId },
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
      const partySize = data.partySize || reservation.partySize;
      if (table.capacity < partySize) {
        return NextResponse.json(
          { error: 'Table capacity is not sufficient for the party size' },
          { status: 400 }
        );
      }

      // Check if table is already reserved for the same time
      const reservationDate = data.reservationDate || reservation.reservationDate;
      const reservationTime = data.reservationTime || reservation.reservationTime;
      
      const existingReservation = await db.reservation.findFirst({
        where: {
          id: { not: params.id },
          tableId: newTableId,
          reservationDate,
          reservationTime,
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

    // Update reservation
    const updatedReservation = await db.reservation.update({
      where: { id: params.id },
      data,
      include: {
        table: true,
      },
    });

    // Handle table status changes
    if (newTableId !== oldTableId) {
      // If old table exists, set it back to AVAILABLE
      if (oldTableId) {
        await db.table.update({
          where: { id: oldTableId },
          data: { status: 'AVAILABLE' },
        });
      }

      // If new table exists, set it to RESERVED
      if (newTableId) {
        await db.table.update({
          where: { id: newTableId },
          data: { status: 'RESERVED' },
        });
      }
    }

    // Handle reservation status changes
    if (newStatus && newStatus !== oldStatus) {
      // If status changed to SEATED, update table status
      if (newStatus === 'SEATED' && updatedReservation.tableId) {
        await db.table.update({
          where: { id: updatedReservation.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // If status changed to COMPLETED or CANCELLED or NO_SHOW, update table status
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(newStatus) && updatedReservation.tableId) {
        await db.table.update({
          where: { id: updatedReservation.tableId },
          data: { status: 'CLEANING' },
        });
      }
    }

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/[id] - Delete a reservation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if reservation exists
    const reservation = await db.reservation.findUnique({
      where: { id: params.id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Delete reservation
    await db.reservation.delete({
      where: { id: params.id },
    });

    // If reservation had a table, update table status
    if (reservation.tableId) {
      await db.table.update({
        where: { id: reservation.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    );
  }
} 