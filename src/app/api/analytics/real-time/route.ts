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

    // Get current date
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Get 30 minutes ago for recent activity
    const thirtyMinutesAgo = new Date(now);
    thirtyMinutesAgo.setMinutes(now.getMinutes() - 30);

    // Fetch real-time data in parallel
    const [
      // Active orders (not completed or cancelled)
      activeOrders,
      
      // Orders in the kitchen (preparing)
      ordersInKitchen,
      
      // Orders ready for pickup/serving
      ordersReady,
      
      // Tables currently occupied
      tablesOccupied,
      
      // Total tables
      totalTables,
      
      // Sales today
      salesToday,
      
      // Sales yesterday (for comparison)
      salesYesterday,
      
      // Recent order activity
      recentOrders,
      
      // Staff currently active
      activeStaff
    ] = await Promise.all([
      // Active orders
      prisma.order.count({
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED']
          }
        }
      }),
      
      // Orders in kitchen
      prisma.order.count({
        where: {
          status: 'PREPARING'
        }
      }),
      
      // Orders ready
      prisma.order.count({
        where: {
          status: 'READY'
        }
      }),
      
      // Tables occupied
      prisma.table.count({
        where: {
          status: 'OCCUPIED'
        }
      }),
      
      // Total tables
      prisma.table.count(),
      
      // Sales today
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfDay },
          status: { not: 'CANCELLED' }
        },
        _sum: { grandTotal: true },
        _count: true
      }),
      
      // Sales yesterday (for comparison)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000),
            lt: startOfDay
          },
          status: { not: 'CANCELLED' }
        },
        _sum: { grandTotal: true },
        _count: true
      }),
      
      // Recent order activity
      prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyMinutesAgo }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          table: {
            select: {
              tableNumber: true
            }
          },
          items: {
            select: {
              quantity: true
            }
          }
        }
      }),
      
      // Active staff
      prisma.user.findMany({
        where: {
          lastActive: { gte: thirtyMinutesAgo }
        },
        select: {
          id: true,
          name: true,
          role: true,
          lastActive: true
        },
        take: 10
      })
    ]);

    // Calculate average wait time (mock data for now)
    // In a real implementation, this would be calculated from actual order timestamps
    const averageWaitTime = Math.floor(Math.random() * 10) + 5; // 5-15 minutes

    // Calculate percentage changes
    const salesChange = salesYesterday._sum.grandTotal && salesToday._sum.grandTotal
      ? ((Number(salesToday._sum.grandTotal) - Number(salesYesterday._sum.grandTotal)) / Number(salesYesterday._sum.grandTotal)) * 100
      : 0;
    
    const ordersChange = salesYesterday._count && salesToday._count
      ? ((salesToday._count - salesYesterday._count) / salesYesterday._count) * 100
      : 0;

    // Format response
    const realTimeData = {
      timestamp: now,
      metrics: {
        activeOrders: {
          value: activeOrders,
          change: Math.round(Math.random() * 20) - 10, // Mock change percentage
          changeLabel: 'vs 30m ago'
        },
        kitchenQueue: {
          value: ordersInKitchen,
          change: Math.round(Math.random() * 20) - 10, // Mock change percentage
          changeLabel: 'vs 30m ago'
        },
        averageWaitTime: {
          value: `${averageWaitTime}m`,
          change: Math.round(Math.random() * 20) - 10, // Mock change percentage
          changeLabel: 'vs 30m ago'
        },
        tablesOccupied: {
          value: `${tablesOccupied}/${totalTables}`,
          change: Math.round(Math.random() * 20) - 10, // Mock change percentage
          changeLabel: 'vs 30m ago'
        },
        salesToday: {
          value: salesToday._sum.grandTotal || 0,
          change: salesChange,
          changeLabel: 'vs yesterday'
        },
        ordersToday: {
          value: salesToday._count || 0,
          change: ordersChange,
          changeLabel: 'vs yesterday'
        }
      },
      activity: {
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          status: order.status,
          createdAt: order.createdAt,
          tableNumber: order.table?.tableNumber || null,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          amount: order.grandTotal
        })),
        activeStaff: activeStaff.map(staff => ({
          id: staff.id,
          name: staff.name,
          role: staff.role,
          lastActive: staff.lastActive,
          status: Math.random() > 0.3 ? 'BUSY' : 'AVAILABLE' // Mock status
        }))
      },
      performance: {
        kitchenEfficiency: Math.round(75 + Math.random() * 20), // Mock percentage
        tableTurnover: Math.round(60 + Math.random() * 30), // Mock percentage
        staffEfficiency: Math.round(70 + Math.random() * 25), // Mock percentage
        customerSatisfaction: Math.round(85 + Math.random() * 15) // Mock percentage
      }
    };

    return NextResponse.json(realTimeData);
  } catch (error) {
    console.error('Real-time analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time analytics data' },
      { status: 500 }
    );
  }
} 