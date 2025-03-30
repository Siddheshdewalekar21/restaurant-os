import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before destructuring
    const tableId = params.tableId;
    console.log('Fetching details for table:', tableId);
    
    const includeCurrentOrder = request.nextUrl.searchParams.get('includeCurrentOrder') === 'true';

    // First, get the table to check its status
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      console.log('Table not found:', tableId);
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    console.log('Table status:', table.status);

    // If table is occupied, fetch the table with its current order
    if (includeCurrentOrder) {
      const tableWithOrder = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          orders: {
            where: {
              OR: [
                // Active orders
                { status: { in: ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED'] } },
                // Completed orders that haven't been paid
                {
                  AND: [
                    { status: 'COMPLETED' },
                    {
                      payment: {
                        is: null
                      }
                    }
                  ]
                }
              ]
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              items: {
                include: {
                  menuItem: {
                    select: {
                      name: true,
                      price: true
                    }
                  }
                }
              },
              customer: {
                select: {
                  name: true
                }
              },
              payment: true
            }
          }
        }
      });

      console.log('Found table with orders:', JSON.stringify(tableWithOrder, null, 2));

      if (!tableWithOrder) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }

      const currentOrder = tableWithOrder.orders?.[0];
      console.log('Current order:', currentOrder ? {
        id: currentOrder.id,
        status: currentOrder.status,
        paymentStatus: currentOrder.payment ? 'PAID' : 'PENDING'
      } : 'No current order');

      // Transform the data to match the expected format
      const response = {
        ...tableWithOrder,
        currentOrder: currentOrder ? {
          id: currentOrder.id,
          orderNumber: currentOrder.orderNumber,
          status: currentOrder.status,
          customerName: currentOrder.customer?.name,
          items: currentOrder.items.map(item => ({
            quantity: item.quantity,
            menuItem: {
              name: item.menuItem.name,
              price: item.menuItem.price
            }
          })),
          totalAmount: currentOrder.total,
          createdAt: currentOrder.createdAt,
          paymentStatus: currentOrder.payment ? 'PAID' : 'PENDING'
        } : undefined
      };

      // Remove the orders array since we've transformed it
      if ('orders' in response) {
        delete response.orders;
      }

      console.log('Final response:', JSON.stringify(response, null, 2));
      return NextResponse.json(response);
    }

    // If no order details requested, return just the table
    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 