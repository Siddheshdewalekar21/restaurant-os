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

// Helper function to format decimal
const formatDecimal = (value: Decimal | number) => {
  return Number(value).toFixed(2);
};

export default async function InventoryReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  // Fetch inventory data
  const [
    // All inventory items
    inventoryItems,
    
    // Low stock items
    lowStockItems,
    
    // Inventory value
    inventoryValue,
    
    // Most used ingredients
    mostUsedIngredients,
    
    // Inventory usage by category
    inventoryUsageByCategory
  ] = await Promise.all([
    // All inventory items
    prisma.inventory.findMany({
      orderBy: {
        name: 'asc'
      }
    }),
    
    // Low stock items
    prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.minLevel
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    }),
    
    // Inventory value
    prisma.inventory.aggregate({
      _sum: {
        quantity: true,
        costPerUnit: true
      }
    }).then(result => {
      const items = prisma.inventory.findMany();
      return items.then(inventoryItems => {
        return inventoryItems.reduce((total, item) => {
          return total + (Number(item.quantity) * Number(item.costPerUnit));
        }, 0);
      });
    }),
    
    // Most used ingredients
    prisma.inventoryUsage.groupBy({
      by: ['inventoryId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    }).then(async (usages) => {
      const inventoryIds = usages.map(usage => usage.inventoryId);
      const inventoryItems = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds }
        }
      });
      
      return usages.map(usage => {
        const item = inventoryItems.find(i => i.id === usage.inventoryId);
        return {
          id: usage.inventoryId,
          name: item?.name || 'Unknown Item',
          unit: item?.unit || '',
          quantity: usage._sum.quantity || new Decimal(0)
        };
      });
    }),
    
    // Inventory usage by category
    prisma.inventoryUsage.findMany({
      include: {
        menuItem: {
          include: {
            category: true
          }
        },
        inventory: true
      }
    }).then((usages) => {
      const categoryMap = new Map<string, { 
        id: string; 
        name: string; 
        totalQuantity: number;
        totalCost: number;
      }>();
      
      usages.forEach(usage => {
        const categoryId = usage.menuItem.categoryId;
        const categoryName = usage.menuItem.category.name;
        const usageQuantity = Number(usage.quantity);
        const costPerUnit = Number(usage.inventory.costPerUnit);
        const usageCost = usageQuantity * costPerUnit;
        
        if (categoryMap.has(categoryId)) {
          const category = categoryMap.get(categoryId)!;
          category.totalQuantity += usageQuantity;
          category.totalCost += usageCost;
        } else {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            totalQuantity: usageQuantity,
            totalCost: usageCost
          });
        }
      });
      
      return Array.from(categoryMap.values())
        .sort((a, b) => b.totalCost - a.totalCost);
    })
  ]);

  // Calculate inventory statistics
  const totalItems = inventoryItems.length;
  const lowStockPercentage = totalItems > 0 
    ? (lowStockItems.length / totalItems) * 100 
    : 0;
  
  // Calculate average cost per item
  const averageCost = totalItems > 0 
    ? inventoryValue / totalItems 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Reports</h1>
        <Link 
          href="/dashboard/analytics" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Analytics
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 h-2"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Items</h3>
            <p className="text-3xl font-bold mt-2">{totalItems}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-500 h-2"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Low Stock Items</h3>
            <p className="text-3xl font-bold mt-2">{lowStockItems.length}</p>
            <p className="text-sm text-gray-500 mt-1">{lowStockPercentage.toFixed(1)}% of inventory</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-500 h-2"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Inventory Value</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(inventoryValue)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-500 h-2"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Avg. Cost Per Item</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(averageCost)}</p>
          </div>
        </div>
      </div>
      
      {/* Low Stock Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Low Stock Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.map((item, index) => {
                const deficit = Number(item.minLevel) - Number(item.quantity);
                const percentageOfMin = (Number(item.quantity) / Number(item.minLevel)) * 100;
                
                let statusColor;
                if (percentageOfMin <= 25) {
                  statusColor = 'bg-red-100 text-red-800';
                } else if (percentageOfMin <= 50) {
                  statusColor = 'bg-orange-100 text-orange-800';
                } else if (percentageOfMin <= 75) {
                  statusColor = 'bg-yellow-100 text-yellow-800';
                } else {
                  statusColor = 'bg-blue-100 text-blue-800';
                }
                
                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/inventory/${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDecimal(item.quantity)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDecimal(item.minLevel)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {deficit > 0 ? `Need ${formatDecimal(deficit)} more` : 'At minimum level'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No low stock items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Most Used Ingredients */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Most Used Ingredients</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mostUsedIngredients.map((ingredient, index) => (
                <tr key={ingredient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link href={`/dashboard/inventory/${ingredient.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {ingredient.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDecimal(ingredient.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingredient.unit}</td>
                </tr>
              ))}
              {mostUsedIngredients.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No usage data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Inventory Usage by Category */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Usage by Category</h2>
        <div className="space-y-4">
          {inventoryUsageByCategory.map((category) => {
            const totalCost = inventoryUsageByCategory.reduce((sum, cat) => sum + cat.totalCost, 0);
            const percentage = totalCost > 0 ? (category.totalCost / totalCost) * 100 : 0;
            
            return (
              <div key={category.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-gray-500">{formatCurrency(category.totalCost)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{percentage.toFixed(1)}% of total cost</p>
              </div>
            );
          })}
          {inventoryUsageByCategory.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-8">No category usage data available</div>
          )}
        </div>
      </div>
      
      {/* All Inventory Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Inventory Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item, index) => {
                const totalValue = Number(item.quantity) * Number(item.costPerUnit);
                const isLowStock = Number(item.quantity) <= Number(item.minLevel);
                
                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/inventory/${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                        {item.name}
                      </Link>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {formatDecimal(item.quantity)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDecimal(item.minLevel)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.costPerUnit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(totalValue)}</td>
                  </tr>
                );
              })}
              {inventoryItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No inventory items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 