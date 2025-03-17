import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    console.log('Dashboard stats API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('Unauthorized access attempt to dashboard stats');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', session.user.email);

    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get previous week date
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Get yesterday date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get total sales
    const totalSalesResult = await db.order.aggregate({
      _sum: {
        grandTotal: true
      },
      where: {
        status: {
          in: ['COMPLETED', 'DELIVERED']
        }
      }
    });
    
    // Get total sales from last week
    const lastWeekSalesResult = await db.order.aggregate({
      _sum: {
        grandTotal: true
      },
      where: {
        status: {
          in: ['COMPLETED', 'DELIVERED']
        },
        createdAt: {
          gte: lastWeek,
          lt: today
        }
      }
    });
    
    // Calculate sales change percentage
    const totalSales = totalSalesResult._sum.grandTotal || 0;
    const lastWeekSales = lastWeekSalesResult._sum.grandTotal || 0;
    const salesChange = lastWeekSales > 0 
      ? Math.round(((totalSales - lastWeekSales) / lastWeekSales) * 100) 
      : 0;
    
    // Get total orders
    const totalOrders = await db.order.count();
    
    // Get total orders from last week
    const lastWeekOrders = await db.order.count({
      where: {
        createdAt: {
          gte: lastWeek,
          lt: today
        }
      }
    });
    
    // Calculate orders change percentage
    const ordersChange = lastWeekOrders > 0 
      ? Math.round(((totalOrders - lastWeekOrders) / lastWeekOrders) * 100) 
      : 0;
    
    // Get active orders
    const activeOrders = await db.order.count({
      where: {
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      }
    });
    
    // Get customers today
    const customersToday = await db.order.findMany({
      where: {
        createdAt: {
          gte: today
        },
        customerId: {
          not: null
        }
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    });
    
    // Get customers yesterday
    const customersYesterday = await db.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        },
        customerId: {
          not: null
        }
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    });
    
    // Calculate customers change percentage
    const customersTodayCount = customersToday.length;
    const customersYesterdayCount = customersYesterday.length;
    const customersChange = customersYesterdayCount > 0 
      ? Math.round(((customersTodayCount - customersYesterdayCount) / customersYesterdayCount) * 100) 
      : 0;
    
    // Get recent orders
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: true
      }
    });
    
    // Format recent orders
    let formattedRecentOrders = [];
    
    if (recentOrders.length === 0) {
      console.log('No recent orders found');
      // Return empty array for recent orders
      formattedRecentOrders = [];
    } else {
      formattedRecentOrders = recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name || 'Guest',
        status: order.status,
        amount: order.grandTotal
      }));
    }
    
    // Get popular items
    const popularItems = await db.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });
    
    // If no popular items found from orders, get some recent menu items as fallback
    let menuItemIds = popularItems.map(item => item.menuItemId);
    let popularItemsWithDetails = [];
    
    if (menuItemIds.length === 0) {
      console.log('No popular items found, using recent menu items as fallback');
      
      // Get recent menu items as fallback
      const recentMenuItems = await db.menuItem.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          category: true
        }
      });
      
      popularItemsWithDetails = recentMenuItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category?.name || 'Uncategorized',
        price: Number(item.price) || 0,
        quantity: 0
      }));
    } else {
      // Get menu item details for popular items
      const menuItems = await db.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds
          }
        },
        include: {
          category: true
        }
      });
      
      // Combine popular items with menu item details
      popularItemsWithDetails = popularItems.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return {
          id: menuItem?.id || '',
          name: menuItem?.name || 'Unknown Item',
          category: menuItem?.category?.name || 'Uncategorized',
          price: menuItem?.price || 0,
          quantity: item._sum.quantity || 0
        };
      });
    }
    
    // Return dashboard stats
    return NextResponse.json({
      stats: {
        totalSales,
        salesChange,
        totalOrders,
        ordersChange,
        activeOrders,
        customers: customersTodayCount,
        customersChange
      },
      recentOrders: formattedRecentOrders,
      popularItems: popularItemsWithDetails
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to fetch dashboard statistics';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      console.error('Error stack:', error.stack);
      
      // Check for specific error types
      if (error.name === 'PrismaClientValidationError') {
        errorMessage = 'Invalid database query in dashboard statistics';
      } else if (error.name === 'PrismaClientKnownRequestError') {
        errorMessage = 'Database error in dashboard statistics';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 