import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating order status
const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
});

// Schema for updating payment status
const orderPaymentUpdateSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'ONLINE']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
  paymentReference: z.string().optional(),
});

// GET /api/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
        user: true,
        customer: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const body = await request.json();

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle status update
    if (body.status) {
      try {
        const { status } = orderStatusUpdateSchema.parse(body);
        
        // Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status },
        });

        // If order is completed or cancelled and it's a dine-in order, update table status
        if ((status === 'COMPLETED' || status === 'CANCELLED') && existingOrder.type === 'DINE_IN' && existingOrder.tableId) {
          await prisma.table.update({
            where: { id: existingOrder.tableId },
            data: { status: 'AVAILABLE' },
          });
        }

        return NextResponse.json({
          success: true,
          data: updatedOrder,
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid status update data' },
          { status: 400 }
        );
      }
    }

    // Handle payment update
    if (body.paymentMethod || body.paymentStatus) {
      try {
        const paymentData = orderPaymentUpdateSchema.parse(body);
        
        // Check if payment exists
        const existingPayment = await prisma.payment.findFirst({
          where: { orderId },
        });

        if (existingPayment) {
          // Update existing payment
          const updatedPayment = await prisma.payment.update({
            where: { id: existingPayment.id },
            data: paymentData,
          });

          return NextResponse.json({
            success: true,
            data: updatedPayment,
          });
        } else {
          // Create new payment
          const newPayment = await prisma.payment.create({
            data: {
              ...paymentData,
              amount: existingOrder.totalAmount,
              order: { connect: { id: orderId } },
            },
          });

          return NextResponse.json({
            success: true,
            data: newPayment,
          });
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid payment update data' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and manager can delete orders
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const orderId = params.id;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order has payment and is completed
    if (existingOrder.payment && existingOrder.payment.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete an order with completed payment' },
        { status: 400 }
      );
    }

    // Delete order items first
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // Delete payment if exists
    if (existingOrder.payment) {
      await prisma.payment.delete({
        where: { id: existingOrder.payment.id },
      });
    }

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId },
    });

    // If it's a dine-in order, update table status
    if (existingOrder.type === 'DINE_IN' && existingOrder.tableId) {
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 