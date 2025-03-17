'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Reservation {
  id: string;
  customerName: string;
  contactNumber: string;
  email: string | null;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  tableId: string | null;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
  table?: {
    id: string;
    tableNumber: number;
  };
}

interface Branch {
  id: string;
  name: string;
}

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response);
        
        // Set default branch
        if (response.length > 0) {
          // If user has a branch, select that one
          if (session?.user?.branchId) {
            setSelectedBranchId(session.user.branchId);
          } else {
            // Otherwise select the first branch
            setSelectedBranchId(response[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches');
      }
    };
    
    fetchBranches();
  }, [session]);

  // Fetch reservations when branch or date changes
  useEffect(() => {
    const fetchReservations = async () => {
      if (!selectedBranchId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(
          `/reservations?branchId=${selectedBranchId}&date=${selectedDate}&status=${getStatusFilter()}`
        );
        setReservations(response);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast.error('Failed to load reservations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, [selectedBranchId, selectedDate, activeTab]);

  // Get status filter based on active tab
  const getStatusFilter = () => {
    switch (activeTab) {
      case 'upcoming':
        return 'PENDING,CONFIRMED';
      case 'seated':
        return 'SEATED';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED,NO_SHOW';
      default:
        return '';
    }
  };

  // Handle branch change
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle reservation status change
  const handleStatusChange = async (reservationId: string, status: string) => {
    try {
      await api.patch(`/reservations/${reservationId}`, {
        status
      });
      
      // Update reservation in state
      setReservations(reservations.map(reservation => 
        reservation.id === reservationId ? { ...reservation, status: status as any } : reservation
      ));
      
      toast.success(`Reservation status updated to ${status}`);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast.error('Failed to update reservation status');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'SEATED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Reservations</h1>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {branches.length === 0 ? (
                <option value="">No branches available</option>
              ) : (
                branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <Link href="/dashboard/reservations/new">
              <Button>New Reservation</Button>
            </Link>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'seated' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('seated')}
          >
            Seated
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'completed' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('completed')}
          >
            Completed
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'cancelled' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('cancelled')}
          >
            Cancelled/No-Show
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'upcoming' && 'Upcoming Reservations'}
              {activeTab === 'seated' && 'Currently Seated'}
              {activeTab === 'completed' && 'Completed Reservations'}
              {activeTab === 'cancelled' && 'Cancelled/No-Show Reservations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-4">
                No reservations found for the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-left">Party Size</th>
                      <th className="px-4 py-2 text-left">Table</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(reservation => (
                      <tr key={reservation.id} className="border-t">
                        <td className="px-4 py-2">{reservation.reservationTime}</td>
                        <td className="px-4 py-2">
                          <div>
                            <div className="font-medium">{reservation.customerName}</div>
                            <div className="text-sm text-gray-500">{reservation.contactNumber}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2">{reservation.partySize} guests</td>
                        <td className="px-4 py-2">
                          {reservation.table ? (
                            `Table #${reservation.table.tableNumber}`
                          ) : (
                            <span className="text-gray-500">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <button className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                                Status ▼
                              </button>
                              <div className="absolute z-10 hidden group-hover:block bg-white shadow-lg rounded-md p-2 min-w-[120px]">
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'CONFIRMED')}
                                  disabled={reservation.status === 'CONFIRMED'}
                                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'SEATED')}
                                  disabled={reservation.status === 'SEATED'}
                                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                  Seat
                                </button>
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'COMPLETED')}
                                  disabled={reservation.status === 'COMPLETED'}
                                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                                  disabled={reservation.status === 'CANCELLED'}
                                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'NO_SHOW')}
                                  disabled={reservation.status === 'NO_SHOW'}
                                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                  No-Show
                                </button>
                              </div>
                            </div>
                            <Link href={`/dashboard/reservations/${reservation.id}`}>
                              <button className="px-2 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 rounded">
                                View
                              </button>
                            </Link>
                            <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
                              <button className="px-2 py-1 text-sm bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded">
                                Edit
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
} 