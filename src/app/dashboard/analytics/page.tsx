import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import Link from 'next/link';

// Helper function to format currency
const formatCurrency = (amount: Decimal | number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount));
};

// Helper function to get date range
const getDateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  // Get date ranges
  const today = getDateRange(0);
  const yesterday = getDateRange(1);
  const lastWeek = getDateRange(7);
  const lastMonth = getDateRange(30);

  // Fetch analytics data
  const [
    // Sales metrics
    todaySales,
    yesterdaySales,
    weekSales,
    monthSales,
    
    // Order metrics
    todayOrders,
    yesterdayOrders,
    weekOrders,
    monthOrders,
    
    // Customer metrics
    newCustomersToday,
    newCustomersYesterday,
    newCustomersWeek,
    newCustomersMonth,
    
    // Top selling items
    topSellingItems,
    
    // Payment method distribution
    paymentMethodDistribution,
    
    // Order type distribution
    orderTypeDistribution,
    
    // Recent orders
    recentOrders
  ] = await Promise.all([
    // Sales metrics
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today.start, lte: today.end },
        status: { not: 'CANCELLED' }
      },
      _sum: { grandTotal: true },
    }),
    
    prisma.order.aggregate({
      where: {
        createdAt: { gte: yesterday.start, lte: yesterday.end },
        status: { not: 'CANCELLED' }
      },
      _sum: { grandTotal: true },
    }),
    
    prisma.order.aggregate({
      where: {
        createdAt: { gte: lastWeek.start, lte: lastWeek.end },
        status: { not: 'CANCELLED' }
      },
      _sum: { grandTotal: true },
    }),
    
    prisma.order.aggregate({
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: { not: 'CANCELLED' }
      },
      _sum: { grandTotal: true },
    }),
    
    // Order metrics
    prisma.order.count({
      where: {
        createdAt: { gte: today.start, lte: today.end },
      },
    }),
    
    prisma.order.count({
      where: {
        createdAt: { gte: yesterday.start, lte: yesterday.end },
      },
    }),
    
    prisma.order.count({
      where: {
        createdAt: { gte: lastWeek.start, lte: lastWeek.end },
      },
    }),
    
    prisma.order.count({
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
      },
    }),
    
    // Customer metrics
    prisma.customer.count({
      where: {
        createdAt: { gte: today.start, lte: today.end },
      },
    }),
    
    prisma.customer.count({
      where: {
        createdAt: { gte: yesterday.start, lte: yesterday.end },
      },
    }),
    
    prisma.customer.count({
      where: {
        createdAt: { gte: lastWeek.start, lte: lastWeek.end },
      },
    }),
    
    prisma.customer.count({
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
      },
    }),
    
    // Top selling items
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: { gte: lastMonth.start, lte: lastMonth.end },
          status: { not: 'CANCELLED' }
        }
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
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
          quantity: item._sum.quantity || 0,
        };
      });
    }),
    
    // Payment method distribution
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: 'COMPLETED'
      },
      _count: true,
    }),
    
    // Order type distribution
    prisma.order.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: { not: 'CANCELLED' }
      },
      _count: true,
    }),
    
    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        table: {
          select: {
            tableNumber: true
          }
        },
        customer: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  // Calculate percentage changes
  const salesYesterdayChange = yesterdaySales._sum.grandTotal && todaySales._sum.grandTotal
    ? ((Number(todaySales._sum.grandTotal) - Number(yesterdaySales._sum.grandTotal)) / Number(yesterdaySales._sum.grandTotal)) * 100
    : 0;
  
  const ordersYesterdayChange = yesterdayOrders && todayOrders
    ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
    : 0;
  
  const customersYesterdayChange = newCustomersYesterday && newCustomersToday
    ? ((newCustomersToday - newCustomersYesterday) / newCustomersYesterday) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/analytics/sales" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Sales Reports
          </Link>
          <Link 
            href="/dashboard/analytics/inventory" 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Inventory Reports
          </Link>
          <Link 
            href="/dashboard/analytics/performance" 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Performance Optimization
          </Link>
          <Link 
            href="/dashboard/analytics/visualizations" 
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Data Visualizations
          </Link>
          <Link 
            href="/dashboard/analytics/real-time" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Real-Time Analytics
          </Link>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Metric */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 h-2"></div>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
                <p className="text-3xl font-bold mt-2">{formatCurrency(todaySales._sum.grandTotal || 0)}</p>
              </div>
              <div className={`text-sm font-medium ${salesYesterdayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesYesterdayChange >= 0 ? '↑' : '↓'} {Math.abs(salesYesterdayChange).toFixed(1)}%
                <p className="text-gray-500">vs yesterday</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">This Week</p>
                <p className="font-semibold">{formatCurrency(weekSales._sum.grandTotal || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">{formatCurrency(monthSales._sum.grandTotal || 0)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders Metric */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-500 h-2"></div>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
                <p className="text-3xl font-bold mt-2">{todayOrders}</p>
              </div>
              <div className={`text-sm font-medium ${ordersYesterdayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ordersYesterdayChange >= 0 ? '↑' : '↓'} {Math.abs(ordersYesterdayChange).toFixed(1)}%
                <p className="text-gray-500">vs yesterday</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">This Week</p>
                <p className="font-semibold">{weekOrders}</p>
              </div>
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">{monthOrders}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* New Customers Metric */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-500 h-2"></div>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">New Customers</h3>
                <p className="text-3xl font-bold mt-2">{newCustomersToday}</p>
              </div>
              <div className={`text-sm font-medium ${customersYesterdayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customersYesterdayChange >= 0 ? '↑' : '↓'} {Math.abs(customersYesterdayChange).toFixed(1)}%
                <p className="text-gray-500">vs yesterday</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">This Week</p>
                <p className="font-semibold">{newCustomersWeek}</p>
              </div>
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">{newCustomersMonth}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Selling Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topSellingItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                  </tr>
                ))}
                {topSellingItems.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Payment Method Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
          <div className="grid grid-cols-2 gap-4">
            {paymentMethodDistribution.map((method) => {
              const total = paymentMethodDistribution.reduce((sum, item) => sum + item._count, 0);
              const percentage = total > 0 ? (method._count / total) * 100 : 0;
              
              return (
                <div key={method.method} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{method.method}</span>
                    <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{method._count} orders</p>
                </div>
              );
            })}
            {paymentMethodDistribution.length === 0 && (
              <div className="col-span-2 text-center text-sm text-gray-500 py-8">No payment data available</div>
            )}
          </div>
        </div>
        
        {/* Order Type Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Order Types</h2>
          <div className="grid grid-cols-2 gap-4">
            {orderTypeDistribution.map((type) => {
              const total = orderTypeDistribution.reduce((sum, item) => sum + item._count, 0);
              const percentage = total > 0 ? (type._count / total) * 100 : 0;
              
              return (
                <div key={type.type} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{type.type.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{type._count} orders</p>
                </div>
              );
            })}
            {orderTypeDistribution.length === 0 && (
              <div className="col-span-2 text-center text-sm text-gray-500 py-8">No order type data available</div>
            )}
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer ? order.customer.name : 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.grandTotal)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Status Badge Component
function OrderStatusBadge({ status }: { status: string }) {
  let color;
  
  switch (status) {
    case 'PENDING':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'CONFIRMED':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'PREPARING':
      color = 'bg-purple-100 text-purple-800';
      break;
    case 'READY':
      color = 'bg-indigo-100 text-indigo-800';
      break;
    case 'DELIVERED':
      color = 'bg-green-100 text-green-800';
      break;
    case 'COMPLETED':
      color = 'bg-green-100 text-green-800';
      break;
    case 'CANCELLED':
      color = 'bg-red-100 text-red-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
} 