'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Table } from '@/types';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
}

export default function TablesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  // Fetch tables when branch changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!selectedBranchId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/tables?branchId=${selectedBranchId}`);
        setTables(response);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to load tables');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTables();
  }, [selectedBranchId]);

  // Handle branch change
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  // Handle table status change
  const handleStatusChange = async (tableId: string, status: string) => {
    try {
      await api.patch(`/tables/${tableId}`, {
        status
      });
      
      // Update table in state
      setTables(tables.map(table => 
        table.id === tableId ? { ...table, status: status as any } : table
      ));
      
      toast.success(`Table status updated to ${status}`);
      
      // Close the popup after status change
      setSelectedTable(null);
    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Failed to update table status');
    }
  };

  // Handle table deletion
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await api.delete(`/tables/${tableId}`);
      
      // Remove table from state
      setTables(tables.filter(table => table.id !== tableId));
      
      toast.success('Table deleted successfully');
      
      // Close the popup after deletion
      setSelectedTable(null);
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast.error(error.message || 'Failed to delete table');
    }
  };

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-500';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-500';
      case 'RESERVED':
        return 'bg-blue-100 border-blue-500';
      case 'CLEANING':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  // Get table shape based on capacity
  const getTableShape = (capacity: number) => {
    if (capacity <= 2) {
      return 'rounded-full'; // Circle for small tables
    } else if (capacity <= 4) {
      return 'rounded-lg'; // Rounded square for medium tables
    } else {
      return 'rounded-md'; // Rectangle for large tables
    }
  };

  // Get table dimensions based on capacity
  const getTableDimensions = (capacity: number) => {
    if (capacity <= 2) {
      return 'w-20 h-20'; // Small circle
    } else if (capacity <= 4) {
      return 'w-24 h-24'; // Medium square
    } else if (capacity <= 8) {
      return 'w-32 h-24'; // Large rectangle
    } else {
      return 'w-40 h-24'; // Extra large rectangle
    }
  };

  // Get table background pattern based on status
  const getTablePattern = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50';
      case 'OCCUPIED':
        return 'bg-red-50 bg-[url("/images/table-pattern.svg")]';
      case 'RESERVED':
        return 'bg-blue-50 bg-[url("/images/reserved-pattern.svg")]';
      case 'CLEANING':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Handle table selection
  const handleTableClick = (tableId: string, event: React.MouseEvent) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    
    // Toggle selection
    setSelectedTable(prevSelected => prevSelected === tableId ? null : tableId);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedTable && !(event.target as Element).closest('.table-item')) {
        setSelectedTable(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedTable]);

  // Filter tables by status
  const filteredTables = statusFilter 
    ? tables.filter(table => table.status === statusFilter)
    : tables;

  // Count tables by status
  const tableCounts = {
    AVAILABLE: tables.filter(t => t.status === 'AVAILABLE').length,
    OCCUPIED: tables.filter(t => t.status === 'OCCUPIED').length,
    RESERVED: tables.filter(t => t.status === 'RESERVED').length,
    CLEANING: tables.filter(t => t.status === 'CLEANING').length,
  };

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Tables Management</h1>
          <div className="flex items-center gap-2 flex-wrap">
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
            <Link href="/dashboard/tables/new">
              <Button>Add Table</Button>
            </Link>
            <Link href="/dashboard/tables/floor-plan">
              <Button variant="outline">Floor Plan</Button>
            </Link>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'AVAILABLE' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'AVAILABLE' ? null : 'AVAILABLE')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-green-600">{tableCounts.AVAILABLE}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'OCCUPIED' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'OCCUPIED' ? null : 'OCCUPIED')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Occupied</p>
                  <p className="text-2xl font-bold text-red-600">{tableCounts.OCCUPIED}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'RESERVED' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'RESERVED' ? null : 'RESERVED')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reserved</p>
                  <p className="text-2xl font-bold text-blue-600">{tableCounts.RESERVED}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'CLEANING' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'CLEANING' ? null : 'CLEANING')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cleaning</p>
                  <p className="text-2xl font-bold text-yellow-600">{tableCounts.CLEANING}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {statusFilter && (
          <div className="flex items-center">
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
              <span>Filtered by: <strong>{statusFilter}</strong></span>
              <button 
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => setStatusFilter(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <Card>
            <CardHeader>
              <CardTitle>Tables Layout</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading tables...</div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-4">
                  {statusFilter 
                    ? `No tables with status "${statusFilter}" found.` 
                    : "No tables found for this branch."}
                  {!statusFilter && (
                  <Link href="/dashboard/tables/new" className="text-blue-600 ml-1">
                    Add a table
                  </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-4">
                  {filteredTables.map(table => (
                    <div 
                      key={table.id}
                      className={`relative table-item ${
                        selectedTable === table.id ? 'scale-105 z-10' : ''
                      } transition-all duration-200 ease-in-out`}
                    >
                      <div 
                        className={`
                          border-2 ${getTableStatusColor(table.status)} 
                          ${getTableShape(table.capacity)} ${getTableDimensions(table.capacity)}
                          ${getTablePattern(table.status)}
                          mx-auto flex flex-col items-center justify-center
                          hover:shadow-lg transition-shadow cursor-pointer
                          ${selectedTable === table.id ? 'ring-2 ring-indigo-500 shadow-lg' : ''}
                          relative overflow-hidden
                        `}
                        onClick={(e) => handleTableClick(table.id, e)}
                      >
                        {/* Table number label */}
                        <div className="absolute top-0 left-0 bg-white bg-opacity-90 px-2 py-1 text-xs font-bold rounded-br">
                          #{table.tableNumber}
                        </div>
                        
                        {/* Table content */}
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {/* Chair indicators for visual representation */}
                          {table.capacity <= 2 ? (
                            // Small round table with 2 chairs
                            <>
                              <div className="absolute top-[-8px] w-6 h-3 bg-gray-300 rounded-t-full"></div>
                              <div className="absolute bottom-[-8px] w-6 h-3 bg-gray-300 rounded-t-full transform rotate-180"></div>
                            </>
                          ) : table.capacity <= 4 ? (
                            // Square table with 4 chairs
                            <>
                              <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full"></div>
                              <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full transform rotate-180"></div>
                              <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 h-6 w-3 bg-gray-300 rounded-l-full"></div>
                              <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 h-6 w-3 bg-gray-300 rounded-l-full transform rotate-180"></div>
                            </>
                          ) : (
                            // Rectangular table with 6+ chairs
                            <>
                              <div className="absolute top-[-8px] left-1/4 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full"></div>
                              <div className="absolute top-[-8px] left-3/4 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full"></div>
                              <div className="absolute bottom-[-8px] left-1/4 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full transform rotate-180"></div>
                              <div className="absolute bottom-[-8px] left-3/4 transform -translate-x-1/2 w-6 h-3 bg-gray-300 rounded-t-full transform rotate-180"></div>
                              <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 h-6 w-3 bg-gray-300 rounded-l-full"></div>
                              <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 h-6 w-3 bg-gray-300 rounded-l-full transform rotate-180"></div>
                            </>
                          )}
                          
                          {/* Capacity indicator */}
                          <div className="text-sm font-medium">{table.capacity} seats</div>
                          
                          {/* Status indicator */}
                          {table.status === 'OCCUPIED' && (
                            <div className="mt-1 flex items-center">
                              <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <span className="text-xs">In use</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-center">
                        <div className="font-medium text-sm">Table {table.tableNumber}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          table.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                          table.status === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      
                      {selectedTable === table.id && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg rounded-md p-3 z-20 border table-popup">
                          <div className="text-sm font-medium mb-2">Change Status:</div>
                          <div className="grid grid-cols-2 gap-1 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(table.id, 'AVAILABLE');
                              }}
                              disabled={table.status === 'AVAILABLE'}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              Available
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(table.id, 'OCCUPIED');
                              }}
                              disabled={table.status === 'OCCUPIED'}
                              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              Occupied
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(table.id, 'RESERVED');
                              }}
                              disabled={table.status === 'RESERVED'}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              Reserved
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(table.id, 'CLEANING');
                              }}
                              disabled={table.status === 'CLEANING'}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
                            >
                              Cleaning
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <Link 
                              href={`/dashboard/tables/${table.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded inline-block"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTable(table.id);
                              }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading tables...</div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-4">
                  {statusFilter 
                    ? `No tables with status "${statusFilter}" found.` 
                    : "No tables found for this branch."}
                  {!statusFilter && (
                  <Link href="/dashboard/tables/new" className="text-blue-600 ml-1">
                    Add a table
                  </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Table #</th>
                        <th className="px-4 py-2 text-left">Capacity</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTables.map(table => (
                        <tr key={table.id} className="border-t">
                          <td className="px-4 py-2">{table.tableNumber}</td>
                          <td className="px-4 py-2">{table.capacity} seats</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                              table.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                              table.status === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {table.status}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(table.id, 'AVAILABLE');
                                    }}
                                    disabled={table.status === 'AVAILABLE'}
                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                  >
                                    Available
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(table.id, 'OCCUPIED');
                                    }}
                                    disabled={table.status === 'OCCUPIED'}
                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                  >
                                    Occupied
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(table.id, 'RESERVED');
                                    }}
                                    disabled={table.status === 'RESERVED'}
                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                  >
                                    Reserved
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(table.id, 'CLEANING');
                                    }}
                                    disabled={table.status === 'CLEANING'}
                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
                                  >
                                    Cleaning
                                  </button>
                                </div>
                              </div>
                              <Link href={`/dashboard/tables/${table.id}/edit`}>
                                <button className="px-2 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 rounded">
                                  Edit
                                </button>
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTable(table.id);
                                }}
                                className="px-2 py-1 text-sm bg-red-100 text-red-800 hover:bg-red-200 rounded"
                              >
                                Delete
                              </button>
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
        )}
      </div>
    </ResponsiveContainer>
  );
}