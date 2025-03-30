import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { orderSchema } from '@/utils/validation';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const customerId = searchParams.get('customerId');
    
    // Build where clause based on query params
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (tableId) whereClause.tableId = tableId;
    if (customerId) whereClause.customerId = customerId;
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
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

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Received order data:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body
    try {
      const result = orderSchema.safeParse(body);
      
      if (!result.success) {
        console.error('Validation error:', result.error.flatten());
        return NextResponse.json(
          { error: 'Validation error', errors: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      
      const { type, tableId, items, customerId } = result.data;
      
      // Check if table exists and is available (if table order)
      if (tableId) {
        const table = await prisma.table.findUnique({
          where: { id: tableId },
        });
        
        if (!table) {
          return NextResponse.json(
            { error: `Table not found with ID: ${tableId}` },
            { status: 404 }
          );
        }
        
        if (table.status !== 'AVAILABLE' && type === 'DINE_IN') {
          return NextResponse.json(
            { error: `Table is not available. Current status: ${table.status}` },
            { status: 400 }
          );
        }
      }
      
      // Check if customer exists (if customer order)
      if (customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        
        if (!customer) {
          return NextResponse.json(
            { error: `Customer not found with ID: ${customerId}` },
            { status: 404 }
          );
        }
      }
      
      // Check if menu items exist and are available
      const menuItemIds = items.map(item => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
        },
      });
      
      if (menuItems.length !== menuItemIds.length) {
        const foundIds = menuItems.map(item => item.id);
        const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
        return NextResponse.json(
          { error: `Menu items not found: ${missingIds.join(', ')}` },
          { status: 404 }
        );
      }
      
      const unavailableItems = menuItems.filter(item => !item.isAvailable);
      if (unavailableItems.length > 0) {
        const unavailableNames = unavailableItems.map(item => item.name).join(', ');
        return NextResponse.json(
          { error: `Some items are not available: ${unavailableNames}` },
          { status: 400 }
        );
      }
      
      // Calculate order totals
      const menuItemsMap = new Map(menuItems.map(item => [item.id, item]));
      let totalAmount = 0;
      
      const orderItems = items.map(item => {
        const menuItem = menuItemsMap.get(item.menuItemId)!;
        const price = Number(menuItem.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;
        
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: price,
          notes: item.notes || ''
        };
      });

      // Generate order number
      const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      // Create the order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          type,
          status: 'PENDING',
          tableId: tableId || null,
          customerId: customerId || null,
          userId: session.user.id,
          branchId: session.user.branchId || 'branch-main-01', // Default to main branch if not specified
          total: totalAmount,
          tax: totalAmount * 0.1, // 10% tax
          grandTotal: totalAmount + (totalAmount * 0.1),
          items: {
            create: orderItems
          }
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

      return NextResponse.json(order);
    } catch (error: any) {
      console.error('Error validating order data:', error);
      return NextResponse.json(
        { error: error.message || 'Validation error' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
} 