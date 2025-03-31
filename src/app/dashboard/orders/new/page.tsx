'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  name: string;      // Store item name directly
  price: number;     // Store item price directly
}

// Debugging function to validate an order item
function validateOrderItem(item: OrderItem): boolean {
  if (!item) {
    console.error('Order item is null or undefined');
    return false;
  }
  
  if (!item.menuItemId) {
    console.error('Order item missing menuItemId', item);
    return false;
  }
  
  if (typeof item.quantity !== 'number' || item.quantity < 1) {
    console.error('Order item has invalid quantity', item);
    return false;
  }
  
  return true;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTableId = searchParams?.get('tableId') || '';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNetworkCheck, setShowNetworkCheck] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Order form state
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableId, setTableId] = useState<string>(initialTableId);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [tablesError, setTablesError] = useState<string>('');

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
      setError('');

      // Fetch categories
      try {
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data || []);
        } else {
          console.warn('Invalid categories response format:', categoriesResponse);
          // Try direct fetch
          const directCategoriesResponse = await axios.get('/api/categories');
          setCategories(directCategoriesResponse.data?.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }

      // Fetch menu items
      try {
        const menuResponse = await api.get('/menu-items');
        if (menuResponse && Array.isArray(menuResponse.data)) {
          setMenuItems(menuResponse.data || []);
        } else {
          console.warn('Invalid menu items response format:', menuResponse);
          // Try direct fetch
          const directMenuResponse = await axios.get('/api/menu-items');
          setMenuItems(directMenuResponse.data?.data || []);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      }

      // Fetch tables with better error handling and fallbacks
      try {
        // First attempt with our API client
        const tablesResponse = await api.get('/tables');
        console.log('Tables response:', tablesResponse);
        
        if (tablesResponse && Array.isArray(tablesResponse.data)) {
          setTables(tablesResponse.data);
        } else {
          console.warn('No data in tables response, trying direct fetch');
          
          // Try with direct fetch to the API endpoint
          const directResponse = await fetch('/api/tables');
          if (!directResponse.ok) {
            throw new Error(`Direct fetch failed: ${directResponse.status}`);
          }
          
          const tables = await directResponse.json();
          console.log('Direct fetch tables response:', tables);
          
          if (Array.isArray(tables)) {
            setTables(tables);
          } else if (tables && Array.isArray(tables.data)) {
            setTables(tables.data);
          } else {
            // Last resort: try Axios directly
            const axiosResponse = await axios.get('/api/tables');
            console.log('Axios direct tables response:', axiosResponse.data);
            setTables(axiosResponse.data?.data || []);
          }
        }
      } catch (tableError) {
        console.error('Error fetching tables:', tableError);
        // Create some demo tables as fallback for testing
        setTables([
          { id: 'table-1', tableNumber: 1, capacity: 4, status: 'AVAILABLE' },
          { id: 'table-2', tableNumber: 2, capacity: 2, status: 'AVAILABLE' },
          { id: 'table-3', tableNumber: 3, capacity: 6, status: 'AVAILABLE' }
        ]);
        setTablesError('Could not load tables, using demo data');
      }

      // Fetch customers
      try {
        const customersResponse = await api.get('/customers');
        if (customersResponse && Array.isArray(customersResponse.data)) {
          setCustomers(customersResponse.data || []);
        } else {
          // Try direct fetch
          const directCustomersResponse = await axios.get('/api/customers');
          setCustomers(directCustomersResponse.data?.data || []);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // If we have an initial tableId, make sure orderType is DINE_IN
    if (initialTableId) {
      setOrderType('DINE_IN');
    }
  }, [initialTableId]);

  const handleAddItem = (menuItem: MenuItem) => {
    if (!menuItem || !menuItem.id || !menuItem.name) {
      console.error('Invalid menu item:', menuItem);
      toast.error('Cannot add invalid menu item');
      return;
    }

    // Ensure price is a valid number
    const price = typeof menuItem.price === 'number' 
      ? menuItem.price 
      : typeof menuItem.price === 'string' 
        ? parseFloat(menuItem.price) 
        : 0;
    
    if (isNaN(price)) {
      console.error('Invalid price for menu item:', menuItem);
      toast.error('Menu item has invalid price');
      return;
    }
    
    // Check if item already exists in the order
    const existingItemIndex = selectedItems.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
      toast.success(`Added another ${menuItem.name}`);
    } else {
      // Add new item with name and price stored directly
      const newItem: OrderItem = {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: price,
        quantity: 1,
        notes: '',
      };
      
      setSelectedItems([...selectedItems, newItem]);
      toast.success(`Added ${menuItem.name}`);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...selectedItems];
    const removedItem = updatedItems[index];
    updatedItems.splice(index, 1);
    
    if (removedItem?.name) {
      toast.success(`Removed ${removedItem.name}`);
    }
    
    setSelectedItems(updatedItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedItems = [...selectedItems];
    if (!updatedItems[index]) return;
    
    updatedItems[index].quantity = quantity;
    setSelectedItems(updatedItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updatedItems = [...selectedItems];
    if (!updatedItems[index]) return;
    
    updatedItems[index].notes = notes;
    setSelectedItems(updatedItems);
  };

  // Calculate subtotal using item's stored price
  const calculateSubtotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Calculate tax
  const calculateTax = () => {
    return calculateSubtotal() * 0.1;
  };

  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
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
      // Prepare order data, using customerName directly instead of customerId
      const orderData = {
        type: orderType,
        // For DINE_IN, provide the tableId as a string, otherwise null
        tableId: orderType === 'DINE_IN' ? tableId : null,
        // Pass customer name directly in the order data
        customerName: customerName && customerName.trim() !== '' ? customerName : null,
        items: selectedItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
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
        
        // Try with direct axios approach
        const response = await axios.post('/api/orders', orderData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Order created successfully:', response.data);
        toast.success('Order created successfully!');
        toast.dismiss(loadingToast);
        router.push('/dashboard/orders');
        router.refresh();
        return;
      } catch (apiError: any) {
        console.error('API error:', apiError);
        toast.dismiss(loadingToast);
        
        // Check if we have a response with error details
        if (apiError.response) {
          const { status, data } = apiError.response;
          
          // Handle validation errors
          if (status === 422 || status === 400) {
            const validationData = data?.errors || {};
            setValidationErrors(validationData);
            setError(data?.error || 'Please correct the validation errors below.');
            toast.error('Validation error. Please check the form.');
          }
          // Handle not found errors
          else if (status === 404) {
            const errorMessage = data?.error || 'Resource not found';
            setError(`Not found: ${errorMessage}`);
            toast.error('Resource not found. Please check your configuration.');
          }
          // Handle server errors
          else if (status === 500) {
            const errorMessage = data?.error || 'Server error. Please try again later.';
            setError(`Server error: ${errorMessage}`);
            toast.error('Server error. Please try again later.');
          }
          // Handle other status codes
          else {
            setError(`Error: ${data?.error || 'Unknown error occurred'}`);
            toast.error('Failed to create order. Please try again.');
          }
        } else {
          // Network or other client-side errors
          setError(`Error: ${apiError.message || 'Unknown error occurred'}`);
          toast.error('Failed to create order. Please check your connection.');
          setShowNetworkCheck(true);
        }
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
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMenuItems = useMemo(() => {
    console.log('Filtering menu items with categoryFilter:', categoryFilter);
    console.log('Total menu items available:', menuItems.length);
    
    // Validate menu items
    if (!Array.isArray(menuItems)) {
      console.error('menuItems is not an array');
      return [];
    }
    
    const filtered = categoryFilter 
      ? menuItems.filter(item => item.categoryId === categoryFilter)
      : menuItems;
    
    console.log('Filtered menu items count:', filtered.length);
    
    // Verify that filtered items have all required properties
    const validItems = filtered.filter(item => {
      const isValid = item && item.id && item.name && item.price !== undefined;
      if (!isValid) {
        console.warn('Invalid menu item found:', item);
      }
      return isValid;
    });
    
    console.log('Valid menu items count:', validItems.length);
    return validItems;
  }, [menuItems, categoryFilter]);

  // Function to create a test table if none exist
  const createTestTable = async () => {
    try {
      setError('');
      const loadingToast = toast.loading('Creating test table...');
      
      const testTableData = {
        tableNumber: 1,
        capacity: 4,
        branchId: 'branch-main-01', 
        positionX: 50,
        positionY: 50,
        shape: 'CIRCLE',
        width: 100,
        height: 100
      };
      
      // Try to create the table
      const response = await axios.post('/api/tables', testTableData);
      console.log('Test table created:', response.data);
      
      toast.success('Test table created successfully!');
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to create test table:', error);
      toast.error('Could not create test table. Please contact support.');
    }
  };

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
                <span className="font-medium">{field}:</span> {Array.isArray(errors) ? errors.join(', ') : String(errors)}
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
              {filteredMenuItems.length === 0 ? (
                <div className="col-span-full p-4 text-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">No menu items available.</p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${!item.isAvailable ? 'opacity-50' : ''}`}
                    onClick={() => item.isAvailable && handleAddItem(item)}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500 mb-2">{item.description}</div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">${typeof item.price === 'number' ? 
                        item.price.toFixed(2) : 
                        parseFloat(String(item.price || 0)).toFixed(2)}</span>
                      {!item.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {/* Order Type and Table Selection */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">
                  Order Type
                </label>
                <select
                  id="orderType"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
              
              {orderType === 'DINE_IN' && (
                <div>
                  <label htmlFor="tableId" className="block text-sm font-medium text-gray-700">
                    Table
                  </label>
                  <div className="relative">
                    <select
                      id="tableId"
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required={orderType === 'DINE_IN'}
                    >
                      <option value="">Select a table</option>
                      {tables.length > 0 ? (
                        tables.map((table) => (
                          <option
                            key={table.id}
                            value={table.id}
                            disabled={table.status && ['OCCUPIED', 'RESERVED'].includes(table.status)}
                          >
                            Table {table.tableNumber} ({table.capacity} seats) 
                            {table.status ? ` - ${table.status}` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No tables available
                        </option>
                      )}
                    </select>
                    
                    {tables.length === 0 && (
                      <div className="mt-2">
                        <p className="text-red-500 text-sm">No tables found. Please add tables first.</p>
                        <button
                          type="button"
                          onClick={createTestTable}
                          className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                        >
                          Create Test Table
                        </button>
                      </div>
                    )}
                    
                    {tablesError && (
                      <p className="mt-2 text-red-500 text-sm">{tablesError}</p>
                    )}
                    
                    <button
                      type="button"
                      onClick={fetchData}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Refresh tables
                    </button>
                  </div>
                </div>
              )}
              
              {/* Customer Name Input */}
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              {/* Debug info - can be removed in production */}
              <div className="p-2 text-xs bg-yellow-50 border border-yellow-100 rounded overflow-auto max-h-24">
                <p>Selected Items Debug:</p>
                <pre>{JSON.stringify(selectedItems, null, 2)}</pre>
              </div>
              
              {/* Selected Items */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Selected Items</h3>
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 p-4 bg-gray-50 rounded text-center">No items selected</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {selectedItems.map((item, index) => (
                      <li key={`${item.menuItemId}-${index}`} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{item.name || 'Unknown Item'}</p>
                            <div className="flex items-center mt-1">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, Math.max(1, item.quantity - 1))}
                                className="p-1 bg-gray-200 text-gray-700 rounded-l-md"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 bg-gray-100">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                className="p-1 bg-gray-200 text-gray-700 rounded-r-md"
                              >
                                +
                              </button>
                            </div>
                            <div className="mt-2">
                              <input
                                type="text"
                                placeholder="Special instructions"
                                value={item.notes || ''}
                                onChange={(e) => handleNotesChange(index, e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md p-1"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div>
                              <p className="font-medium">${item.price.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Order Totals */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax (10%)</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting || selectedItems.length === 0}
                className="w-full px-4 py-2 mt-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Creating Order...' : 'Create Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 