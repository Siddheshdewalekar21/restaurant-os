'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface DeliveryOrder {
  id: string;
  externalId: string;
  platform: 'SWIGGY' | 'ZOMATO';
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  totalAmount: number;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  createdAt: string;
  estimatedDeliveryTime?: string;
}

interface DeliveryServiceIntegrationProps {
  platform: 'SWIGGY' | 'ZOMATO';
  apiKey?: string;
  merchantId?: string;
  onAccept?: (order: DeliveryOrder) => void;
  onReject?: (order: DeliveryOrder) => void;
}

export default function DeliveryServiceIntegration({
  platform,
  apiKey,
  merchantId,
  onAccept,
  onReject
}: DeliveryServiceIntegrationProps) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute default
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Check connection status
  useEffect(() => {
    if (!apiKey || !merchantId) {
      setIsConnected(false);
      setError('API Key and Merchant ID are required');
      setLoading(false);
      return;
    }
    
    const checkConnection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock connection check for now
        // In a real implementation, this would call the delivery service API
        setTimeout(() => {
          setIsConnected(true);
          setLoading(false);
        }, 1000);
        
        // Uncomment when API is ready
        // const response = await axios.post('/api/integrations/check-connection', {
        //   platform,
        //   apiKey,
        //   merchantId
        // });
        // 
        // if (response.data.success) {
        //   setIsConnected(response.data.data.connected);
        // } else {
        //   setError(response.data.error || 'Failed to check connection');
        //   setIsConnected(false);
        // }
        // setLoading(false);
      } catch (err) {
        console.error(`Error checking ${platform} connection:`, err);
        setError(`An error occurred while checking ${platform} connection`);
        setIsConnected(false);
        setLoading(false);
      }
    };
    
    checkConnection();
  }, [platform, apiKey, merchantId]);

  // Fetch orders
  useEffect(() => {
    if (!isConnected) return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock data for now
        const mockOrders: DeliveryOrder[] = [
          {
            id: '1',
            externalId: `${platform}-123456`,
            platform,
            customerName: 'John Doe',
            customerPhone: '+1234567890',
            customerAddress: '123 Main St, Apt 4B, City',
            items: [
              {
                name: 'Butter Chicken',
                quantity: 1,
                price: 250,
                notes: 'Extra spicy'
              },
              {
                name: 'Garlic Naan',
                quantity: 2,
                price: 40
              }
            ],
            totalAmount: 330,
            status: 'NEW',
            paymentMethod: 'Online Payment',
            paymentStatus: 'PAID',
            createdAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            externalId: `${platform}-789012`,
            platform,
            customerName: 'Jane Smith',
            customerPhone: '+0987654321',
            customerAddress: '456 Oak St, City',
            items: [
              {
                name: 'Paneer Tikka',
                quantity: 1,
                price: 180
              },
              {
                name: 'Jeera Rice',
                quantity: 1,
                price: 120
              }
            ],
            totalAmount: 300,
            status: 'ACCEPTED',
            paymentMethod: 'Cash on Delivery',
            paymentStatus: 'PENDING',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000).toISOString()
          }
        ];
        
        setOrders(mockOrders);
        
        // Uncomment when API is ready
        // const response = await axios.get(`/api/integrations/${platform.toLowerCase()}/orders`, {
        //   params: { merchantId }
        // });
        // 
        // if (response.data.success) {
        //   setOrders(response.data.data);
        // } else {
        //   setError(`Failed to fetch ${platform} orders`);
        // }
      } catch (err) {
        console.error(`Error fetching ${platform} orders:`, err);
        setError(`An error occurred while fetching ${platform} orders`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up polling for order updates
    const intervalId = setInterval(fetchOrders, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [isConnected, platform, merchantId, refreshInterval]);

  // Handle order actions
  const handleAcceptOrder = async (order: DeliveryOrder) => {
    try {
      // Mock API call
      const updatedOrder = { ...order, status: 'ACCEPTED' as const };
      
      // Update local state
      setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
      
      // Notify parent component
      if (onAccept) {
        onAccept(updatedOrder);
      }
      
      toast.success(`${platform} order accepted`);
      
      // Uncomment when API is ready
      // const response = await axios.post(`/api/integrations/${platform.toLowerCase()}/orders/${order.id}/accept`, {
      //   merchantId
      // });
      // 
      // if (response.data.success) {
      //   // Update local state
      //   setOrders(orders.map(o => o.id === order.id ? response.data.data : o));
      //   
      //   // Notify parent component
      //   if (onAccept) {
      //     onAccept(response.data.data);
      //   }
      //   
      //   toast.success(`${platform} order accepted`);
      // } else {
      //   toast.error(response.data.error || `Failed to accept ${platform} order`);
      // }
    } catch (err) {
      console.error(`Error accepting ${platform} order:`, err);
      toast.error(`An error occurred while accepting the ${platform} order`);
    }
  };
  
  const handleRejectOrder = async (order: DeliveryOrder) => {
    try {
      // Mock API call
      const updatedOrder = { ...order, status: 'CANCELLED' as const };
      
      // Update local state
      setOrders(orders.filter(o => o.id !== order.id));
      
      // Notify parent component
      if (onReject) {
        onReject(updatedOrder);
      }
      
      toast.success(`${platform} order rejected`);
      
      // Uncomment when API is ready
      // const response = await axios.post(`/api/integrations/${platform.toLowerCase()}/orders/${order.id}/reject`, {
      //   merchantId,
      //   reason: 'Restaurant unavailable'
      // });
      // 
      // if (response.data.success) {
      //   // Update local state
      //   setOrders(orders.filter(o => o.id !== order.id));
      //   
      //   // Notify parent component
      //   if (onReject) {
      //     onReject(response.data.data);
      //   }
      //   
      //   toast.success(`${platform} order rejected`);
      // } else {
      //   toast.error(response.data.error || `Failed to reject ${platform} order`);
      // }
    } catch (err) {
      console.error(`Error rejecting ${platform} order:`, err);
      toast.error(`An error occurred while rejecting the ${platform} order`);
    }
  };
  
  const handleUpdateOrderStatus = async (order: DeliveryOrder, status: DeliveryOrder['status']) => {
    try {
      // Mock API call
      const updatedOrder = { ...order, status };
      
      // Update local state
      setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
      
      toast.success(`Order status updated to ${status}`);
      
      // Uncomment when API is ready
      // const response = await axios.post(`/api/integrations/${platform.toLowerCase()}/orders/${order.id}/status`, {
      //   merchantId,
      //   status
      // });
      // 
      // if (response.data.success) {
      //   // Update local state
      //   setOrders(orders.map(o => o.id === order.id ? response.data.data : o));
      //   toast.success(`Order status updated to ${status}`);
      // } else {
      //   toast.error(response.data.error || `Failed to update ${platform} order status`);
      // }
    } catch (err) {
      console.error(`Error updating ${platform} order status:`, err);
      toast.error(`An error occurred while updating the ${platform} order status`);
    }
  };

  // Helper functions
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-purple-100 text-purple-800';
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-indigo-100 text-indigo-800';
      case 'PICKED_UP':
        return 'bg-orange-100 text-orange-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!apiKey || !merchantId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
        <p className="text-yellow-700">API Key and Merchant ID are required to connect to {platform}.</p>
        <p className="text-sm text-yellow-600 mt-2">
          Please configure your {platform} integration in the settings.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          Please check your {platform} API credentials and try again.
        </p>
      </div>
    );
  }

  if (loading && !isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Connecting to {platform}...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-600">Failed to connect to {platform}.</p>
        <p className="text-sm text-red-500 mt-2">
          Please check your API credentials and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
          <h3 className="font-medium text-gray-800">{platform} Integration</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value={30000}>Refresh: 30s</option>
            <option value={60000}>Refresh: 1m</option>
            <option value={300000}>Refresh: 5m</option>
          </select>
          <button
            onClick={() => setOrders([])}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {orders.map((order) => (
            <div key={order.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-800">Order #{order.externalId}</h4>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-sm text-gray-500 mt-1">{order.paymentMethod}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-700">Customer Details</h5>
                </div>
                <p className="text-sm text-gray-700">{order.customerName}</p>
                <p className="text-sm text-gray-700">{order.customerPhone}</p>
                <p className="text-sm text-gray-700">{order.customerAddress}</p>
              </div>
              
              <div className="mb-3">
                <h5 className="font-medium text-gray-700 mb-2">Order Items</h5>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="text-gray-700">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {order.status === 'NEW' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptOrder(order)}
                    className="flex-1 bg-green-100 text-green-700 py-2 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleRejectOrder(order)}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Reject Order
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order, 'PREPARING')}
                      className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-md hover:bg-yellow-200 transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order, 'READY')}
                      className="flex-1 bg-indigo-100 text-indigo-700 py-2 rounded-md hover:bg-indigo-200 transition-colors"
                    >
                      Mark as Ready
                    </button>
                  )}
                  
                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order, 'PICKED_UP')}
                      className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-md hover:bg-orange-200 transition-colors"
                    >
                      Mark as Picked Up
                    </button>
                  )}
                  
                  {(order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
                    <button
                      onClick={() => handleRejectOrder(order)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-500">No {platform} orders found.</p>
        </div>
      )}
    </div>
  );
} 