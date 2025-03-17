'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataVisualization from '@/components/DataVisualization';

export default function DataVisualizationsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Sample data for visualizations
  const getVisualizationData = () => {
    // Daily sales data
    const dailySalesLabels = timeRange === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : timeRange === 'month'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dailySalesData = timeRange === 'week'
      ? [1250, 1420, 1350, 1650, 2100, 2400, 1950]
      : timeRange === 'month'
        ? [6500, 7200, 8100, 7800]
        : [18500, 17200, 19800, 21500, 23000, 24500, 26000, 25800, 24200, 22500, 21000, 23500];
    
    // Order type distribution
    const orderTypeLabels = ['Dine-in', 'Takeaway', 'Delivery', 'Online'];
    const orderTypeData = timeRange === 'week'
      ? [45, 25, 20, 10]
      : timeRange === 'month'
        ? [42, 23, 25, 10]
        : [40, 20, 30, 10];
    
    // Customer traffic by hour
    const hourlyTrafficLabels = ['10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm'];
    const hourlyTrafficData = [15, 25, 45, 55, 40, 30, 25, 35, 55, 60, 50, 30];
    
    // Top selling categories
    const topCategoriesLabels = ['Main Course', 'Appetizers', 'Desserts', 'Beverages', 'Sides'];
    const topCategoriesData = timeRange === 'week'
      ? [45, 20, 15, 12, 8]
      : timeRange === 'month'
        ? [42, 22, 16, 12, 8]
        : [40, 25, 15, 12, 8];
    
    // Revenue by payment method
    const paymentMethodLabels = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Online'];
    const paymentMethodData = timeRange === 'week'
      ? [15, 40, 20, 15, 10]
      : timeRange === 'month'
        ? [12, 42, 18, 18, 10]
        : [10, 45, 15, 20, 10];
    
    // Customer satisfaction ratings
    const satisfactionLabels = ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];
    const satisfactionData = [45, 35, 15, 4, 1];
    
    return {
      dailySales: {
        labels: dailySalesLabels,
        datasets: [{
          label: 'Daily Sales',
          data: dailySalesData,
          backgroundColor: '#4F46E5',
          borderColor: '#4F46E5',
        }]
      },
      orderType: {
        labels: orderTypeLabels,
        datasets: [{
          label: 'Order Type Distribution',
          data: orderTypeData,
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
        }]
      },
      hourlyTraffic: {
        labels: hourlyTrafficLabels,
        datasets: [{
          label: 'Customer Traffic',
          data: hourlyTrafficData,
          backgroundColor: '#10B981',
          borderColor: '#10B981',
        }]
      },
      topCategories: {
        labels: topCategoriesLabels,
        datasets: [{
          label: 'Top Selling Categories',
          data: topCategoriesData,
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        }]
      },
      paymentMethod: {
        labels: paymentMethodLabels,
        datasets: [{
          label: 'Revenue by Payment Method',
          data: paymentMethodData,
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        }]
      },
      satisfaction: {
        labels: satisfactionLabels,
        datasets: [{
          label: 'Customer Satisfaction',
          data: satisfactionData,
          backgroundColor: ['#10B981', '#34D399', '#F59E0B', '#F97316', '#EF4444'],
        }]
      }
    };
  };
  
  const visualizationData = getVisualizationData();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Visualizations</h1>
        <Link 
          href="/dashboard/analytics" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Analytics
        </Link>
      </div>
      
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Time Range</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'year' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
        </div>
      </div>
      
      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <DataVisualization 
          title="Sales Trend"
          description={`Sales trend for ${timeRange === 'week' ? 'the current week' : timeRange === 'month' ? 'the current month' : 'the current year'}`}
          type="line"
          labels={visualizationData.dailySales.labels}
          datasets={visualizationData.dailySales.datasets}
          height={300}
        />
        
        {/* Order Type Distribution */}
        <DataVisualization 
          title="Order Type Distribution"
          description="Breakdown of orders by type"
          type="doughnut"
          labels={visualizationData.orderType.labels}
          datasets={visualizationData.orderType.datasets}
          height={300}
        />
        
        {/* Hourly Customer Traffic */}
        <DataVisualization 
          title="Customer Traffic by Hour"
          description="Average number of customers by hour of day"
          type="bar"
          labels={visualizationData.hourlyTraffic.labels}
          datasets={visualizationData.hourlyTraffic.datasets}
          height={300}
        />
        
        {/* Top Selling Categories */}
        <DataVisualization 
          title="Top Selling Categories"
          description="Sales distribution by menu category"
          type="pie"
          labels={visualizationData.topCategories.labels}
          datasets={visualizationData.topCategories.datasets}
          height={300}
        />
        
        {/* Revenue by Payment Method */}
        <DataVisualization 
          title="Revenue by Payment Method"
          description="Sales distribution by payment method"
          type="doughnut"
          labels={visualizationData.paymentMethod.labels}
          datasets={visualizationData.paymentMethod.datasets}
          height={300}
        />
        
        {/* Customer Satisfaction */}
        <DataVisualization 
          title="Customer Satisfaction Ratings"
          description="Distribution of customer feedback ratings"
          type="bar"
          labels={visualizationData.satisfaction.labels}
          datasets={visualizationData.satisfaction.datasets}
          height={300}
        />
      </div>
      
      {/* Insights Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Sales Patterns</h3>
            <p className="mt-2 text-sm text-blue-600">
              {timeRange === 'week' 
                ? 'Weekend sales are significantly higher than weekday sales, with Saturday being the peak sales day. Consider optimizing staffing and inventory for weekend rushes.'
                : timeRange === 'month'
                  ? 'Sales show a steady increase through the month, with a slight decline in the final week. This pattern suggests promotional activities in the first half of the month are effective.'
                  : 'Sales show seasonal patterns with peaks during summer months and December. Consider seasonal menu items and promotions to maximize these high-traffic periods.'}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Customer Behavior</h3>
            <p className="mt-2 text-sm text-green-600">
              Peak customer traffic occurs during lunch (12-1pm) and dinner (6-8pm) hours. The restaurant experiences approximately 60% of daily traffic during these peak periods. Consider express menu options during lunch to improve table turnover.
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-800">Menu Performance</h3>
            <p className="mt-2 text-sm text-purple-600">
              Main courses account for {visualizationData.topCategories.datasets[0].data[0]}% of sales, followed by appetizers at {visualizationData.topCategories.datasets[0].data[1]}%. Desserts and beverages show potential for growth through targeted promotions and upselling strategies.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Payment Trends</h3>
            <p className="mt-2 text-sm text-yellow-600">
              Credit card payments dominate at {visualizationData.paymentMethod.datasets[0].data[1]}% of transactions, while digital payments (UPI and Online) account for {visualizationData.paymentMethod.datasets[0].data[3] + visualizationData.paymentMethod.datasets[0].data[4]}% and are growing. Consider optimizing digital payment experiences to encourage this trend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 