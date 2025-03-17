'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Order, OrderStatus } from '@/types';
import { Card } from '@/components/ui/card';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import RealTimeOrderTracking from '@/components/RealTimeOrderTracking';
import { toast } from 'react-hot-toast';

const formatAmount = (amount: any): string => {
  if (amount === null || amount === undefined) return '0.00';
  
  try {
    // Convert to number if it's a string
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    return numAmount.toFixed(2);
  } catch (error) {
    console.error('Error formatting amount:', error, 'Value:', amount);
    return '0.00';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/orders');
        setOrders(response);
        setError('');
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again.');
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status. Please try again.');
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = statusFilter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            New Order
          </Link>
        </div>
      </div>

      {/* Add real-time order tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                aria-label="List view"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                aria-label="Grid view"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium">Filter by Status:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('PREPARING')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'PREPARING' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Preparing
                </button>
                <button
                  onClick={() => setStatusFilter('READY')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'READY' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'COMPLETED' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>

          {/* Orders Display */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">
                {statusFilter === 'ALL' 
                  ? 'No orders found. Create your first order to get started.' 
                  : `No ${statusFilter.toLowerCase()} orders found.`}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            /* List View - Table for larger screens, Cards for mobile */
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {order.table ? `Table ${order.table.tableNumber}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          ₹{formatAmount(order.grandTotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              disabled={['COMPLETED', 'CANCELLED'].includes(order.status)}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PREPARING">Preparing</option>
                              <option value="READY">Ready</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <Link 
                              href={`/dashboard/orders/${order.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="bg-white overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'} • {order.type}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-lg font-bold text-gray-900">₹{formatAmount(order.grandTotal)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          disabled={['COMPLETED', 'CANCELLED'].includes(order.status)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <Link 
                          href={`/dashboard/orders/${order.id}`}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="bg-white overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'} • {order.type}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="text-lg font-bold text-gray-900">₹{formatAmount(order.grandTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        disabled={['COMPLETED', 'CANCELLED'].includes(order.status)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <Link 
                        href={`/dashboard/orders/${order.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <RealTimeOrderTracking />
        </div>
      </div>

      {/* Mobile Add Button (Fixed) */}
      <div className="md:hidden fixed bottom-20 right-4">
        <Link 
          href="/dashboard/orders/new"
          className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Order Status Badge Component
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  let color;
  
  switch (status) {
    case 'PENDING':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'PREPARING':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'READY':
      color = 'bg-green-100 text-green-800';
      break;
    case 'COMPLETED':
      color = 'bg-gray-100 text-gray-800';
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