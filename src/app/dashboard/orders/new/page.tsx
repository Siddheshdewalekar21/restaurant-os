'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { MenuItem, Table, OrderType } from '@/types';
import api, { ApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import NetworkCheck from '@/components/NetworkCheck';
import { retryNetworkErrors } from '@/lib/retry';

interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNetworkCheck, setShowNetworkCheck] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Order form state
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableId, setTableId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Handle network status change
  const handleNetworkStatusChange = (isOnline: boolean) => {
    if (!isOnline) {
      toast.error('You are currently offline. Please check your internet connection.');
    } else {
      toast.success('You are back online!');
      // Refresh data when coming back online
      fetchData();
    }
  };

  // Extract fetchData to a named function so we can call it from elsewhere
  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching data from API...');
      
      // Log the API base URL
      console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL || '/api');
      
      // Try to fetch menu items first
      try {
        console.log('Fetching menu items...');
        const menuResponse = await api.get('/menu-items');
        console.log('Menu items fetched successfully:', menuResponse);
        setMenuItems(menuResponse);
      } catch (menuError) {
        console.error('Error fetching menu items:', menuError);
        // Try direct axios as fallback
        try {
          console.log('Trying direct axios for menu items...');
          const directMenuResponse = await axios.get('/api/menu-items');
          console.log('Menu items fetched with direct axios:', directMenuResponse.data);
          setMenuItems(directMenuResponse.data.data || []);
        } catch (directMenuError) {
          console.error('Direct axios for menu items also failed:', directMenuError);
        }
      }
      
      // Try to fetch tables
      try {
        console.log('Fetching tables...');
        const tablesResponse = await api.get('/tables?status=AVAILABLE');
        console.log('Tables fetched successfully:', tablesResponse);
        setTables(tablesResponse);
      } catch (tablesError) {
        console.error('Error fetching tables:', tablesError);
        // Try direct axios as fallback
        try {
          console.log('Trying direct axios for tables...');
          const directTablesResponse = await axios.get('/api/tables?status=AVAILABLE');
          console.log('Tables fetched with direct axios:', directTablesResponse.data);
          setTables(directTablesResponse.data.data || []);
        } catch (directTablesError) {
          console.error('Direct axios for tables also failed:', directTablesError);
        }
      }
      
      // Try to fetch categories
      try {
        console.log('Fetching categories...');
        const categoriesResponse = await api.get('/categories');
        console.log('Categories fetched successfully:', categoriesResponse);
        setCategories(categoriesResponse);
      } catch (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        // Try direct axios as fallback
        try {
          console.log('Trying direct axios for categories...');
          const directCategoriesResponse = await axios.get('/api/categories');
          console.log('Categories fetched with direct axios:', directCategoriesResponse.data);
          setCategories(directCategoriesResponse.data.data || []);
        } catch (directCategoriesError) {
          console.error('Direct axios for categories also failed:', directCategoriesError);
        }
      }
      
      setError('');
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      
      // More detailed error logging
      if (error instanceof ApiError) {
        console.error(`API Error (${error.status}):`, error.message);
        console.error('Error data:', error.data);
      }
      
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data. Please refresh the page.');
      
      // Show network check component if we have a network error
      if (error.message === 'Network Error') {
        setShowNetworkCheck(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = (menuItem: MenuItem) => {
    // Check if item already exists in the order
    const existingItemIndex = selectedItems.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      setSelectedItems([...selectedItems, {
        menuItemId: menuItem.id,
        quantity: 1,
        notes: '',
      }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = quantity;
    setSelectedItems(updatedItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].notes = notes;
    setSelectedItems(updatedItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return total + (menuItem ? Number(menuItem.price) * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }
    
    if (orderType === 'DINE_IN' && !tableId) {
      setError('Please select a table for dine-in orders');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setValidationErrors({});
    
    try {
      // Prepare order data with the correct format for tableId and customerId
      const orderData = {
        type: orderType,
        // For DINE_IN, provide the tableId as a string, otherwise null
        tableId: orderType === 'DINE_IN' ? tableId : null,
        // Provide customerId as a string if it exists, otherwise null
        customerId: customerId && customerId.trim() !== '' ? customerId : null,
        items: selectedItems.map(item => ({
          ...item,
          // Ensure notes is a string, not undefined
          notes: item.notes || ''
        })),
      };
      
      console.log('Submitting order data:', orderData);
      
      // Show loading toast
      const loadingToast = toast.loading('Creating order...');
      
      try {
        // First check if we're online
        if (!navigator.onLine) {
          throw new Error('Network Error');
        }
        
        // Try with retryNetworkErrors for better resilience
        await retryNetworkErrors(async () => {
          console.log('Sending POST request to /orders endpoint');
          const response = await api.post('/orders', orderData);
          console.log('Order created successfully:', response);
          return response;
        }, 2); // Retry up to 2 times
        
        toast.success('Order created successfully!');
        router.push('/dashboard/orders');
        router.refresh();
      } catch (apiError: any) {
        console.error('API client error:', apiError);
        
        // Handle validation errors
        if (apiError instanceof ApiError && apiError.status === 422) {
          setValidationErrors(apiError.data || {});
          setError('Please correct the validation errors below.');
          toast.error('Validation error. Please check the form.');
          toast.dismiss(loadingToast);
          setSubmitting(false);
          return;
        }
        
        // Handle 404 errors specifically
        if (apiError instanceof ApiError && apiError.status === 404) {
          setError(`Resource not found: ${apiError.message}`);
          toast.error('Resource not found. Please check your configuration.');
          console.error('Trying direct axios fallback due to 404 error');
          toast.dismiss(loadingToast);
          
          // Try with direct axios as a fallback, using the full URL
          try {
            const response = await axios.post('http://localhost:3000/api/orders', orderData);
            console.log('Order created successfully with direct axios:', response.data);
            toast.success('Order created successfully!');
            router.push('/dashboard/orders');
            router.refresh();
            return;
          } catch (directError: any) {
            console.error('Direct axios fallback also failed:', directError);
            setSubmitting(false);
            return;
          }
        }
        
        // Handle 500 errors specifically
        if (apiError instanceof ApiError && apiError.status === 500) {
          setError(`Server error: ${apiError.message}`);
          toast.error('Server error. Please try again later.');
          console.error('Server error details:', apiError.data);
          toast.dismiss(loadingToast);
          setSubmitting(false);
          return;
        }
        
        // Fall back to direct axios if our API client fails
        try {
          console.log('Falling back to direct axios');
          await retryNetworkErrors(async () => {
            const response = await axios.post('/api/orders', orderData, {
              timeout: 15000, // Increase timeout for this specific request
            });
            console.log('Order created successfully with axios fallback:', response.data);
            return response;
          }, 1); // Retry only once
          
          toast.success('Order created successfully!');
          router.push('/dashboard/orders');
          router.refresh();
        } catch (axiosError: any) {
          console.error('Axios fallback error:', axiosError);
          
          // Check for validation errors in axios response
          if (axiosError.response?.status === 422) {
            const validationData = axiosError.response.data?.errors || {};
            setValidationErrors(validationData);
            setError('Please correct the validation errors below.');
            toast.error('Validation error. Please check the form.');
          } else if (axiosError.response?.status === 404) {
            // Handle 404 errors
            const errorMessage = axiosError.response.data?.error || 'Resource not found';
            setError(`Not found: ${errorMessage}`);
            toast.error('Resource not found. Please check your configuration.');
            console.error('404 error details:', axiosError.response.data);
          } else if (axiosError.response?.status === 500) {
            // Handle server errors
            const errorMessage = axiosError.response.data?.error || 'Server error. Please try again later.';
            setError(`Server error: ${errorMessage}`);
            toast.error('Server error. Please try again later.');
            console.error('Server error details:', axiosError.response.data);
          } else {
            throw axiosError;
          }
        }
      } finally {
        toast.dismiss(loadingToast);
      }
    } catch (error: any) {
      console.error('Failed to create order:', error);
      
      // Handle different types of errors
      if (error.message === 'Network Error') {
        setError('Unable to connect to the server. Please check your network connection and try again.');
        toast.error('Network error. Please check your connection.');
        setShowNetworkCheck(true);
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. The server might be overloaded. Please try again later.');
        toast.error('Request timed out. Please try again.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to create order. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      
      setSubmitting(false);
    }
  };

  const filteredMenuItems = categoryFilter 
    ? menuItems.filter(item => item.categoryId === categoryFilter)
    : menuItems;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Order</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowNetworkCheck(!showNetworkCheck)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showNetworkCheck ? 'Hide Network Status' : 'Check Network Status'}
          </button>
          <Link 
            href="/dashboard/orders" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Display validation errors if any */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          <h3 className="font-medium mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside">
            {Object.entries(validationErrors).map(([field, errors]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {Array.isArray(errors) ? errors.join(', ') : errors}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showNetworkCheck && (
        <div className="mb-6">
          <NetworkCheck onStatusChange={handleNetworkStatusChange} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
            
            {/* Category Filter */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${!item.isAvailable ? 'opacity-50' : ''}`}
                  onClick={() => item.isAvailable && handleAddItem(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{item.description}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">${Number(item.price).toFixed(2)}</span>
                    {!item.isAvailable && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {/* Order Type */}
            <div className="mb-4">
              <label htmlFor="orderType" className="block text-sm font-medium text-gray-700 mb-1">
                Order Type
              </label>
              <select
                id="orderType"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="DINE_IN">Dine In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            
            {/* Table Selection (for Dine In) */}
            {orderType === 'DINE_IN' && (
              <div className="mb-4">
                <label htmlFor="table" className="block text-sm font-medium text-gray-700 mb-1">
                  Table
                </label>
                <select
                  id="table"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.tableNumber} ({table.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Selected Items */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Items</h3>
              {selectedItems.length === 0 ? (
                <div className="text-gray-500 italic">No items selected</div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => {
                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                    return (
                      <div key={index} className="flex flex-col p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{menuItem?.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center mb-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded-l-md"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 bg-gray-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded-r-md"
                          >
                            +
                          </button>
                          <span className="ml-auto">
                            ${menuItem ? (Number(menuItem.price) * item.quantity).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Special instructions"
                          value={item.notes || ''}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Order Totals */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (10%)</span>
                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 