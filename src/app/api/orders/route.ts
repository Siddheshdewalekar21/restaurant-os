import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { orderSchema } from '@/utils/validation';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse } from '@/utils/api';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
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
    
    return successResponse(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return errorResponse('Failed to fetch orders', 500);
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Received order data:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return validationErrorResponse({ _error: ['Invalid JSON in request body'] });
    }
    
    // Validate request body
    try {
      const result = orderSchema.safeParse(body);
      
      if (!result.success) {
        console.error('Validation error:', result.error.flatten());
        return validationErrorResponse(result.error.flatten().fieldErrors);
      }
      
      const { type, tableId, items, customerId } = result.data;
      
      // Check if table exists and is available (if table order)
      if (tableId) {
        const table = await prisma.table.findUnique({
          where: { id: tableId },
        });
        
        if (!table) {
          console.error(`Table not found with ID: ${tableId}`);
          return errorResponse(`Table not found with ID: ${tableId}`, 404);
        }
        
        if (table.status !== 'AVAILABLE' && type === 'DINE_IN') {
          console.error(`Table ${tableId} is not available. Current status: ${table.status}`);
          return errorResponse(`Table is not available. Current status: ${table.status}`, 400);
        }
      }
      
      // Check if customer exists (if customer order)
      if (customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        
        if (!customer) {
          console.error(`Customer not found with ID: ${customerId}`);
          return errorResponse(`Customer not found with ID: ${customerId}`, 404);
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
        console.error(`Menu items not found: ${missingIds.join(', ')}`);
        return errorResponse(`Menu items not found: ${missingIds.join(', ')}`, 404);
      }
      
      const unavailableItems = menuItems.filter(item => !item.isAvailable);
      if (unavailableItems.length > 0) {
        const unavailableNames = unavailableItems.map(item => item.name).join(', ');
        console.error(`Some items are not available: ${unavailableNames}`);
        return errorResponse(`Some items are not available: ${unavailableNames}`, 400);
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
          notes: item.notes || '',
        };
      });
      
      // Apply tax (assuming 10% tax)
      const tax = totalAmount * 0.1;
      const grandTotal = totalAmount + tax;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      console.log('Creating order with data:', {
        orderNumber,
        status: 'PENDING',
        type,
        total: totalAmount,
        tax,
        discount: 0,
        grandTotal,
        tableId,
        userId: session.user.id,
        branchId: session.user.branchId || 'main-branch',
        customerId,
        items: orderItems
      });
      
      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          status: 'PENDING',
          type,
          total: totalAmount,
          tax,
          discount: 0,
          grandTotal,
          tableId,
          userId: session.user.id,
          branchId: session.user.branchId || 'main-branch', // Default to main branch if not specified
          customerId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
      
      // If it's a dine-in order, update table status
      if (type === 'DINE_IN' && tableId) {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });
      }
      
      return successResponse(order, 'Order created successfully');
    } catch (error) {
      console.error('Error validating or processing order:', error);
      return serverErrorResponse('Failed to process order: ' + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return serverErrorResponse('Failed to create order: ' + (error instanceof Error ? error.message : String(error)));
  }
} 