'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/api/categories');
        setCategories(categoriesResponse);
        
        // Fetch menu items
        const menuItemsResponse = await api.get('/api/menu-items');
        console.log('Fetched menu items:', menuItemsResponse);
        setMenuItems(menuItemsResponse);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/menu-items?search=${searchQuery}`);
      setMenuItems(response);
      setError('');
    } catch (error: any) {
      console.error('Error searching customers:', error);
      setError(error.message || 'Failed to search customers. Please try again.');
      toast.error('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleItemAvailability = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (!item) return;
      
      // Update item in the database
      await api.patch(`/api/menu-items/${id}`, {
        isAvailable: !item.isAvailable
      });
      
      // Update local state
      setMenuItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
        )
      );
      
      toast.success(`Item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error('Error toggling item availability:', error);
      toast.error('Failed to update item');
    }
  };

  // Helper function to format price
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return '0';
    
    try {
      // Convert to number if it's a string
      const numPrice = typeof price === 'number' ? price : parseFloat(price);
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(numPrice);
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/menu/categories/new" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Category
          </Link>
          <Link 
            href="/dashboard/menu/items/new" 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Menu Item
          </Link>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow flex">
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
        <Link 
          href="/dashboard/menu/items/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add New Item
        </Link>
      </div>

      {/* Category Filters */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No menu items found. Try adjusting your filters or add new items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-white rounded-lg shadow-sm">
              <div className="relative h-48 bg-gray-200">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <button
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    onClick={() => toggleItemAvailability(item.id)}
                  >
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(item.price)}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-800">
                    {item.category?.name || 'Uncategorized'}
                  </span>
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/menu/items/${item.id}/edit`} className="p-1 text-gray-500 hover:text-indigo-600">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <button 
                      className="p-1 text-gray-500 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                          // Handle delete
                        }
                      }}
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 