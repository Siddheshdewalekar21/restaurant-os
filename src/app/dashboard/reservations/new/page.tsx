'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
}

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
}

export default function NewReservationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    partySize: '2',
    reservationDate: format(new Date(), 'yyyy-MM-dd'),
    reservationTime: '18:00',
    tableId: '',
    branchId: '',
    specialRequests: '',
  });
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/branches');
        setBranches(response);
        
        // Set default branch if user has one
        if (session?.user?.branchId) {
          setFormData(prev => ({ ...prev, branchId: session.user.branchId }));
        } else if (response.length > 0) {
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

  // Fetch tables when branch, date, or time changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!formData.branchId) return;
      
      try {
        setIsLoading(true);
        
        // Get all tables for the branch
        const allTables = await api.get(`/tables?branchId=${formData.branchId}`);
        
        // Get reservations for the selected date and time
        const reservations = await api.get(
          `/reservations?branchId=${formData.branchId}&date=${formData.reservationDate}`
        );
        
        // Filter out tables that are already reserved for the selected time
        const reservedTableIds = reservations
          .filter(r => 
            r.reservationTime === formData.reservationTime && 
            ['PENDING', 'CONFIRMED'].includes(r.status)
          )
          .map(r => r.tableId);
        
        // Filter tables by availability and capacity
        const availableTables = allTables.filter(table => 
          table.status === 'AVAILABLE' && 
          !reservedTableIds.includes(table.id) &&
          table.capacity >= Number(formData.partySize)
        );
        
        setTables(availableTables);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to load available tables');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTables();
  }, [formData.branchId, formData.reservationDate, formData.reservationTime, formData.partySize]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    
    if (!formData.customerName) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (formData.contactNumber.length < 10) {
      newErrors.contactNumber = 'Contact number must be at least 10 digits';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.partySize) {
      newErrors.partySize = 'Party size is required';
    } else if (isNaN(Number(formData.partySize)) || Number(formData.partySize) <= 0) {
      newErrors.partySize = 'Party size must be a positive number';
    }
    
    if (!formData.reservationDate) {
      newErrors.reservationDate = 'Reservation date is required';
    }
    
    if (!formData.reservationTime) {
      newErrors.reservationTime = 'Reservation time is required';
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
      
      await api.post('/reservations', {
        customerName: formData.customerName,
        contactNumber: formData.contactNumber,
        email: formData.email || null,
        partySize: Number(formData.partySize),
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        tableId: formData.tableId || null,
        branchId: formData.branchId,
        specialRequests: formData.specialRequests || null,
      });
      
      toast.success('Reservation created successfully');
      router.push('/dashboard/reservations');
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">New Reservation</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/reservations')}>
            Back to Reservations
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name*
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.customerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number*
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="partySize" className="block text-sm font-medium text-gray-700 mb-1">
                    Party Size*
                  </label>
                  <input
                    type="number"
                    id="partySize"
                    name="partySize"
                    value={formData.partySize}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.partySize ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    required
                  />
                  {errors.partySize && (
                    <p className="mt-1 text-sm text-red-600">{errors.partySize}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Reservation Date*
                  </label>
                  <input
                    type="date"
                    id="reservationDate"
                    name="reservationDate"
                    value={formData.reservationDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.reservationDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                  {errors.reservationDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.reservationDate}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="reservationTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Reservation Time*
                  </label>
                  <input
                    type="time"
                    id="reservationTime"
                    name="reservationTime"
                    value={formData.reservationTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.reservationTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.reservationTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.reservationTime}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">
                    Branch*
                  </label>
                  <select
                    id="branchId"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.branchId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select a branch</option>
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
                  <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-1">
                    Table
                  </label>
                  <select
                    id="tableId"
                    name="tableId"
                    value={formData.tableId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading || tables.length === 0}
                  >
                    <option value="">No table (walk-in)</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        Table #{table.tableNumber} - {table.capacity} seats
                      </option>
                    ))}
                  </select>
                  {tables.length === 0 && formData.branchId && (
                    <p className="mt-1 text-sm text-yellow-600">
                      No available tables for the selected criteria
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/reservations')}
                  className="mr-2"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Reservation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
} 