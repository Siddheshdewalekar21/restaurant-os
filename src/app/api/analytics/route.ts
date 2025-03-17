import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to get date range
const getDateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // day, week, month, year
    
    // Determine date range based on period
    let dateRange;
    switch (period) {
      case 'day':
        dateRange = getDateRange(1);
        break;
      case 'week':
        dateRange = getDateRange(7);
        break;
      case 'month':
        dateRange = getDateRange(30);
        break;
      case 'year':
        dateRange = getDateRange(365);
        break;
      default:
        dateRange = getDateRange(30); // Default to month
    }

    // Fetch analytics data in parallel
    const [
      // Sales metrics
      salesData,
      
      // Order metrics
      orderData,
      
      // Customer metrics
      customerData,
      
      // Top selling items
      topSellingItems,
      
      // Payment method distribution
      paymentMethodDistribution,
      
      // Order type distribution
      orderTypeDistribution,
      
      // Staff performance
      staffPerformance,
      
      // Inventory metrics
      inventoryMetrics
    ] = await Promise.all([
      // Sales metrics
      prisma.order.aggregate({
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: { not: 'CANCELLED' }
        },
        _sum: { 
          grandTotal: true,
          taxAmount: true,
          discountAmount: true 
        },
        _count: true,
      }),
      
      // Order metrics
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
        _count: true,
      }),
      
      // Customer metrics
      prisma.$transaction([
        // New customers
        prisma.customer.count({
          where: {
            createdAt: { gte: dateRange.start, lte: dateRange.end },
          },
        }),
        // Returning customers (customers with more than one order)
        prisma.customer.count({
          where: {
            orders: {
              some: {
                createdAt: { gte: dateRange.start, lte: dateRange.end },
              },
            },
            _count: {
              orders: {
                gt: 1
              }
            }
          },
        }),
        // Average loyalty points
        prisma.customer.aggregate({
          _avg: {
            loyaltyPoints: true
          }
        }),
      ]),
      
      // Top selling items
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: dateRange.start, lte: dateRange.end },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: {
          quantity: true,
          subtotal: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      }).then(async (items) => {
        const itemIds = items.map(item => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: itemIds }
          }
        });
        
        return items.map(item => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          return {
            id: item.menuItemId,
            name: menuItem?.name || 'Unknown Item',
            category: menuItem?.category || 'Unknown Category',
            quantity: item._sum.quantity || 0,
            revenue: item._sum.subtotal || 0,
          };
        });
      }),
      
      // Payment method distribution
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: 'COMPLETED'
        },
        _count: true,
        _sum: {
          grandTotal: true
        }
      }),
      
      // Order type distribution
      prisma.order.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: { not: 'CANCELLED' }
        },
        _count: true,
        _sum: {
          grandTotal: true
        }
      }),
      
      // Staff performance
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: { not: 'CANCELLED' }
        },
        _count: true,
        _sum: {
          grandTotal: true
        }
      }).then(async (staffData) => {
        const userIds = staffData.map(item => item.userId).filter(Boolean) as string[];
        
        if (userIds.length === 0) return [];
        
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds }
          },
          select: {
            id: true,
            name: true,
            role: true
          }
        });
        
        return staffData.map(item => {
          const user = users.find(u => u.id === item.userId);
          return {
            userId: item.userId,
            name: user?.name || 'Unknown User',
            role: user?.role || 'STAFF',
            orderCount: item._count,
            totalSales: item._sum.grandTotal || 0,
          };
        });
      }),
      
      // Inventory metrics
      prisma.inventoryItem.findMany({
        where: {
          quantity: { lt: 10 } // Low stock items
        },
        orderBy: {
          quantity: 'asc'
        },
        take: 10,
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          reorderLevel: true
        }
      })
    ]);

    // Calculate additional metrics
    const totalSales = salesData._sum.grandTotal || 0;
    const totalOrders = salesData._count || 0;
    const averageOrderValue = totalOrders > 0 ? Number(totalSales) / totalOrders : 0;
    
    const orderStatusCounts = orderData.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
    
    const [newCustomers, returningCustomers, avgLoyaltyPoints] = customerData;
    const customerRetentionRate = newCustomers > 0 ? (returningCustomers / newCustomers) * 100 : 0;

    // Format response
    const analyticsData = {
      period,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      sales: {
        total: totalSales,
        tax: salesData._sum.taxAmount || 0,
        discount: salesData._sum.discountAmount || 0,
        net: Number(totalSales) - Number(salesData._sum.taxAmount || 0)
      },
      orders: {
        total: totalOrders,
        averageValue: averageOrderValue,
        byStatus: orderStatusCounts,
        byType: orderTypeDistribution.reduce((acc, curr) => {
          acc[curr.type] = {
            count: curr._count,
            amount: curr._sum.grandTotal || 0
          };
          return acc;
        }, {} as Record<string, { count: number, amount: number | null }>)
      },
      customers: {
        new: newCustomers,
        returning: returningCustomers,
        retentionRate: customerRetentionRate,
        averageLoyaltyPoints: avgLoyaltyPoints._avg.loyaltyPoints || 0
      },
      products: {
        topSelling: topSellingItems
      },
      payments: {
        byMethod: paymentMethodDistribution.reduce((acc, curr) => {
          acc[curr.method] = {
            count: curr._count,
            amount: curr._sum.grandTotal || 0
          };
          return acc;
        }, {} as Record<string, { count: number, amount: number | null }>)
      },
      staff: {
        performance: staffPerformance
      },
      inventory: {
        lowStock: inventoryMetrics
      }
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 