'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { DataVisualization } from '@/components/DataVisualization';
import { Branch } from '@/types';

interface BranchPerformance {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  customerCount: number;
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
}

export default function BranchReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranches.length > 0) {
      fetchBranchPerformance();
    }
  }, [selectedBranches, timeRange]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/branches');
      
      if (response.data.success) {
        const branchesData = response.data.data;
        setBranches(branchesData);
        
        // Select all branches by default
        setSelectedBranches(branchesData.map((branch: Branch) => branch.id));
      } else {
        setError('Failed to fetch branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('An error occurred while fetching branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/branches/performance', {
        params: {
          branchIds: selectedBranches.join(','),
          timeRange
        }
      });
      
      if (response.data.success) {
        setBranchPerformance(response.data.data);
      } else {
        setError('Failed to fetch branch performance data');
      }
    } catch (err) {
      console.error('Error fetching branch performance:', err);
      setError('An error occurred while fetching branch performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  const handleSelectAllBranches = () => {
    setSelectedBranches(branches.map(branch => branch.id));
  };

  const handleDeselectAllBranches = () => {
    setSelectedBranches([]);
  };

  // Prepare data for charts
  const getSalesComparisonData = () => {
    const labels = branchPerformance.map(branch => branch.branchName);
    const data = branchPerformance.map(branch => branch.totalSales);
    
    return {
      labels,
      datasets: [{
        label: 'Total Sales',
        data,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1
      }]
    };
  };

  const getOrdersComparisonData = () => {
    const labels = branchPerformance.map(branch => branch.branchName);
    const data = branchPerformance.map(branch => branch.totalOrders);
    
    return {
      labels,
      datasets: [{
        label: 'Total Orders',
        data,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }]
    };
  };

  const getAverageOrderValueData = () => {
    const labels = branchPerformance.map(branch => branch.branchName);
    const data = branchPerformance.map(branch => branch.averageOrderValue);
    
    return {
      labels,
      datasets: [{
        label: 'Average Order Value',
        data,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1
      }]
    };
  };

  const getCustomerCountData = () => {
    const labels = branchPerformance.map(branch => branch.branchName);
    const data = branchPerformance.map(branch => branch.customerCount);
    
    return {
      labels,
      datasets: [{
        label: 'Customer Count',
        data,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }]
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branch Performance Reports</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Branches</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSelectAllBranches}
                className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAllBranches}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Deselect All
              </button>
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchToggle(branch.id)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    selectedBranches.includes(branch.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Time Range</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 text-xs rounded-md ${
                  timeRange === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-xs rounded-md ${
                  timeRange === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-xs rounded-md ${
                  timeRange === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-xs rounded-md ${
                  timeRange === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading branch performance data...</p>
        </div>
      ) : branchPerformance.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataVisualization
              title="Sales Comparison"
              type="bar"
              labels={getSalesComparisonData().labels}
              datasets={getSalesComparisonData().datasets}
              height={300}
            />
            
            <DataVisualization
              title="Orders Comparison"
              type="bar"
              labels={getOrdersComparisonData().labels}
              datasets={getOrdersComparisonData().datasets}
              height={300}
            />
            
            <DataVisualization
              title="Average Order Value"
              type="bar"
              labels={getAverageOrderValueData().labels}
              datasets={getAverageOrderValueData().datasets}
              height={300}
            />
            
            <DataVisualization
              title="Customer Count"
              type="bar"
              labels={getCustomerCountData().labels}
              datasets={getCustomerCountData().datasets}
              height={300}
            />
          </div>
          
          {/* Branch Performance Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h2 className="text-xl font-semibold p-6 border-b">Branch Performance Summary</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Order Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchPerformance.map((branch) => (
                    <tr key={branch.branchId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branchName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{branch.totalSales.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.totalOrders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{branch.averageOrderValue.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.customerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">
            {selectedBranches.length === 0
              ? 'Please select at least one branch to view performance data.'
              : 'No performance data available for the selected branches and time range.'}
          </p>
        </div>
      )}
    </div>
  );
} 