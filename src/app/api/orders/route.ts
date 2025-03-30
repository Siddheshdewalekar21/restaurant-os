import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true,
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, tableId, customerName, items } = body;

    // Validate required fields
    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If it's a dine-in order, validate table
    if (type === 'DINE_IN' && !tableId) {
      return NextResponse.json(
        { error: 'Table ID is required for dine-in orders' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        type,
        status: 'PENDING',
        tableId: tableId || null,
        customerName: customerName || null,
        userId: session.user.id,
        branchId: session.user.branchId || 'branch-main-01', // Default to main branch if not specified
      }
    });

    // Get menu items to validate prices
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } }
    });

    // Create a map of menu item prices
    const menuItemPrices = new Map(
      menuItems.map(item => [item.id, Number(item.price)])
    );

    // Create order items
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const price = menuItemPrices.get(item.menuItemId);
        if (!price) {
          throw new Error(`Invalid menu item: ${item.menuItemId}`);
        }

        return prisma.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: price,
            notes: item.notes || ''
          }
        });
      })
    );

    // Calculate total
    const totalAmount = orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // Update order with totals
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        total: totalAmount,
        grandTotal: totalAmount + (totalAmount * 0.1), // Adding 10% tax
        tax: totalAmount * 0.1
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    // If it's a dine-in order, update table status
    if (type === 'DINE_IN' && tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
} 