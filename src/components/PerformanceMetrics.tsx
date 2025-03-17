import { useState, useEffect } from 'react';
import axios from 'axios';

interface PerformanceMetricsProps {
  timeRange?: 'day' | 'week' | 'month' | 'year';
  showLoading?: boolean;
}

interface MetricData {
  averageOrderValue: number;
  averageOrdersPerDay: number;
  averagePreparationTime: number;
  tableOccupancyRate: number;
  customerRetentionRate: number;
  employeeEfficiency: number;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  timeRange = 'month',
  showLoading = true
}) => {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, this would be an API call to fetch actual metrics
        // For now, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data based on time range
        let mockData: MetricData;
        
        switch (timeRange) {
          case 'day':
            mockData = {
              averageOrderValue: 28.75,
              averageOrdersPerDay: 42,
              averagePreparationTime: 12,
              tableOccupancyRate: 65,
              customerRetentionRate: 72,
              employeeEfficiency: 88
            };
            break;
          case 'week':
            mockData = {
              averageOrderValue: 32.50,
              averageOrdersPerDay: 38,
              averagePreparationTime: 14,
              tableOccupancyRate: 58,
              customerRetentionRate: 68,
              employeeEfficiency: 82
            };
            break;
          case 'year':
            mockData = {
              averageOrderValue: 35.25,
              averageOrdersPerDay: 45,
              averagePreparationTime: 15,
              tableOccupancyRate: 72,
              customerRetentionRate: 65,
              employeeEfficiency: 79
            };
            break;
          case 'month':
          default:
            mockData = {
              averageOrderValue: 33.80,
              averageOrdersPerDay: 40,
              averagePreparationTime: 13,
              tableOccupancyRate: 62,
              customerRetentionRate: 70,
              employeeEfficiency: 85
            };
        }
        
        setMetrics(mockData);
      } catch (err) {
        setError('Failed to load performance metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  if (loading && showLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Helper function to determine color based on value
  const getColorClass = (value: number, threshold1: number, threshold2: number) => {
    if (value >= threshold2) return 'text-green-600';
    if (value >= threshold1) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Average Order Value */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(metrics.averageOrderValue, 25, 30)}`}>
            ${metrics.averageOrderValue.toFixed(2)}
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${Math.min(100, (metrics.averageOrderValue / 50) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Average Orders Per Day */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Orders Per Day</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(metrics.averageOrdersPerDay, 30, 40)}`}>
            {metrics.averageOrdersPerDay}
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.min(100, (metrics.averageOrdersPerDay / 60) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Average Preparation Time */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Avg. Preparation Time</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(20 - metrics.averagePreparationTime, 5, 10)}`}>
            {metrics.averagePreparationTime} min
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full" 
              style={{ width: `${Math.min(100, (metrics.averagePreparationTime / 20) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Table Occupancy Rate */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Table Occupancy Rate</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(metrics.tableOccupancyRate, 50, 70)}`}>
            {metrics.tableOccupancyRate}%
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${metrics.tableOccupancyRate}%` }}
            ></div>
          </div>
        </div>
        
        {/* Customer Retention Rate */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Customer Retention</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(metrics.customerRetentionRate, 60, 75)}`}>
            {metrics.customerRetentionRate}%
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full" 
              style={{ width: `${metrics.customerRetentionRate}%` }}
            ></div>
          </div>
        </div>
        
        {/* Employee Efficiency */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Employee Efficiency</h3>
          <p className={`text-2xl font-bold mt-1 ${getColorClass(metrics.employeeEfficiency, 70, 85)}`}>
            {metrics.employeeEfficiency}%
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 rounded-full" 
              style={{ width: `${metrics.employeeEfficiency}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 