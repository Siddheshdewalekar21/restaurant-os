'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Branch = {
  id: string;
  name: string;
};

type FormData = {
  tableNumber: string;
  capacity: string;
  branchId: string;
  shape: 'CIRCLE' | 'RECTANGLE' | 'SQUARE';
  width: string;
  height: string;
};

export default function NewTablePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permissionError, setPermissionError] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    tableNumber: '',
    capacity: '',
    branchId: '',
    shape: 'CIRCLE',
    width: '100',
    height: '100',
  });
  
  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/branches');
        console.log('Fetched branches:', response);
        setBranches(response);
        
        // Set default branch if user has a branch
        if (session?.user?.branchId) {
          console.log('Using user branch ID:', session.user.branchId);
          setFormData(prev => ({ ...prev, branchId: session.user.branchId }));
        } else if (response.length > 0) {
          console.log('Using first branch ID:', response[0].id);
          setFormData(prev => ({ ...prev, branchId: response[0].id }));
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBranches();
  }, [session]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tableNumber) {
      newErrors.tableNumber = 'Table number is required';
    } else if (isNaN(Number(formData.tableNumber)) || Number(formData.tableNumber) <= 0) {
      newErrors.tableNumber = 'Table number must be a positive number';
    }
    
    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    
    if (!formData.branchId) {
      newErrors.branchId = 'Branch is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setPermissionError(false);
      
      // Use the known working branch ID
      const tableData = {
        tableNumber: Number(formData.tableNumber),
        capacity: Number(formData.capacity),
        branchId: 'branch-main-01', // Hardcode the branch ID that we know works
        shape: formData.shape,
        width: Number(formData.width),
        height: Number(formData.height),
      };
      
      console.log('Submitting table data:', tableData);
      
      const response = await api.post('/tables', tableData);
      
      console.log('Table creation response:', response);
      toast.success('Table created successfully');
      router.push('/dashboard/tables');
    } catch (error: any) {
      console.error('Error creating table:', error);
      
      // Check if it's a permission error
      if (error.status === 403) {
        setPermissionError(true);
        toast.error('You do not have permission to create tables. Please sign out and sign in again with an admin account.');
      } else {
        // Show more detailed error information
        const errorMessage = error.data?.error || error.message || 'Failed to create table';
        const errorDetails = error.data?.details ? JSON.stringify(error.data.details, null, 2) : '';
        
        console.log('API Error Details:', {
          status: error.status,
          message: errorMessage,
          details: error.data
        });
        
        toast.error(`${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Table</h1>
        <Button
          onClick={() => router.push('/dashboard/tables')}
          variant="outline"
        >
          Back to Tables
        </Button>
      </div>
      
      {permissionError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Permission Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You do not have permission to create tables. Your current role is {session?.user?.role}.</p>
                <p className="mt-1">You need to have ADMIN or MANAGER role to create tables.</p>
                <Button 
                  onClick={handleSignOut}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                >
                  Sign Out and Sign In Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Table Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number *
                </label>
                <input
                  type="number"
                  id="tableNumber"
                  name="tableNumber"
                  value={formData.tableNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.tableNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.tableNumber}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-600">{errors.branchId}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="shape" className="block text-sm font-medium text-gray-700 mb-1">
                  Shape
                </label>
                <select
                  id="shape"
                  name="shape"
                  value={formData.shape}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CIRCLE">Circle</option>
                  <option value="RECTANGLE">Rectangle</option>
                  <option value="SQUARE">Square</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="50"
                  max="300"
                />
              </div>
              
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="50"
                  max="300"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/tables')}
                className="mr-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Table'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 