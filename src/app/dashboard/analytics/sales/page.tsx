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

// Helper function to get month name
const getMonthName = (monthIndex: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

export default async function SalesReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  // Get date ranges
  const lastMonth = getDateRange(30);
  const lastYear = getDateRange(365);

  // Get current date info for monthly and daily reports
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch sales data
  const [
    // Daily sales for the last 30 days
    dailySales,
    
    // Monthly sales for the last 12 months
    monthlySales,
    
    // Sales by payment method
    salesByPaymentMethod,
    
    // Sales by order type
    salesByOrderType,
    
    // Top customers by sales
    topCustomers,
    
    // Top selling categories
    topCategories
  ] = await Promise.all([
    // Daily sales for the last 30 days
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(grandTotal) as total
      FROM \`Order\`
      WHERE 
        createdAt >= ${lastMonth.start} 
        AND createdAt <= ${lastMonth.end}
        AND status != 'CANCELLED'
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    ` as Promise<{ date: Date; total: Decimal }[]>,
    
    // Monthly sales for the last 12 months
    prisma.$queryRaw`
      SELECT 
        YEAR(createdAt) as year,
        MONTH(createdAt) as month,
        SUM(grandTotal) as total
      FROM \`Order\`
      WHERE 
        createdAt >= ${lastYear.start} 
        AND createdAt <= ${lastYear.end}
        AND status != 'CANCELLED'
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY year DESC, month DESC
    ` as Promise<{ year: number; month: number; total: Decimal }[]>,
    
    // Sales by payment method
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true,
      },
    }),
    
    // Sales by order type
    prisma.order.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        grandTotal: true,
      },
    }),
    
    // Top customers by sales
    prisma.order.groupBy({
      by: ['customerId'],
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status: { not: 'CANCELLED' },
        customerId: { not: null }
      },
      _sum: {
        grandTotal: true,
      },
      orderBy: {
        _sum: {
          grandTotal: 'desc',
        },
      },
      take: 10,
    }).then(async (customers) => {
      const customerIds = customers
        .filter(c => c.customerId !== null)
        .map(c => c.customerId as string);
      
      const customerDetails = await prisma.customer.findMany({
        where: {
          id: { in: customerIds }
        }
      });
      
      return customers
        .filter(c => c.customerId !== null)
        .map(customer => {
          const details = customerDetails.find(c => c.id === customer.customerId);
          return {
            id: customer.customerId,
            name: details?.name || 'Unknown Customer',
            total: customer._sum.grandTotal,
          };
        });
    }),
    
    // Top selling categories
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: lastMonth.start, lte: lastMonth.end },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      }
    }).then((items) => {
      const categoryMap = new Map<string, { id: string; name: string; total: number }>();
      
      items.forEach(item => {
        const categoryId = item.menuItem.categoryId;
        const categoryName = item.menuItem.category.name;
        const itemTotal = Number(item.price) * item.quantity;
        
        if (categoryMap.has(categoryId)) {
          const category = categoryMap.get(categoryId)!;
          category.total += itemTotal;
        } else {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            total: itemTotal
          });
        }
      });
      
      return Array.from(categoryMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    })
  ]);

  // Calculate total sales for the period
  const totalSales = dailySales.reduce((sum, day) => sum + Number(day.total), 0);
  
  // Format daily sales for display
  const formattedDailySales = dailySales.map(day => ({
    date: new Date(day.date).toLocaleDateString(),
    total: Number(day.total),
    formattedTotal: formatCurrency(day.total)
  }));
  
  // Format monthly sales for display
  const formattedMonthlySales = monthlySales.map(month => ({
    month: `${getMonthName(Number(month.month) - 1)} ${month.year}`,
    total: Number(month.total),
    formattedTotal: formatCurrency(month.total)
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <Link 
          href="/dashboard/analytics" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Analytics
        </Link>
      </div>
      
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Summary (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Average Daily Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSales / dailySales.length)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Total Orders</p>
            <p className="text-2xl font-bold">{dailySales.length} days</p>
          </div>
        </div>
      </div>
      
      {/* Daily Sales Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Sales (Last 30 Days)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedDailySales.map((day, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.formattedTotal}</td>
                </tr>
              ))}
              {formattedDailySales.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No sales data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Monthly Sales Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Sales (Last 12 Months)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedMonthlySales.map((month, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.formattedTotal}</td>
                </tr>
              ))}
              {formattedMonthlySales.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No sales data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Sales Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sales by Payment Method</h2>
          <div className="space-y-4">
            {salesByPaymentMethod.map((method) => {
              const total = salesByPaymentMethod.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
              const percentage = total > 0 ? (Number(method._sum.amount || 0) / total) * 100 : 0;
              
              return (
                <div key={method.method} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{method.method}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(method._sum.amount || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
            {salesByPaymentMethod.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">No payment data available</div>
            )}
          </div>
        </div>
        
        {/* Sales by Order Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sales by Order Type</h2>
          <div className="space-y-4">
            {salesByOrderType.map((type) => {
              const total = salesByOrderType.reduce((sum, item) => sum + Number(item._sum.grandTotal || 0), 0);
              const percentage = total > 0 ? (Number(type._sum.grandTotal || 0) / total) * 100 : 0;
              
              return (
                <div key={type.type} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{type.type.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(type._sum.grandTotal || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
            {salesByOrderType.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">No order type data available</div>
            )}
          </div>
        </div>
        
        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Customers by Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCustomers.map((customer, index) => (
                  <tr key={customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/customers/${customer.id}`} className="text-indigo-600 hover:text-indigo-900">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(customer.total || 0)}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No customer data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Categories by Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCategories.map((category, index) => (
                  <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(category.total)}</td>
                  </tr>
                ))}
                {topCategories.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No category data available</td>
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