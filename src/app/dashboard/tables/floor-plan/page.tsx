'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import FloorPlanEditor from '@/components/FloorPlanEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Table } from '@/types';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
}

export default function FloorPlanPage() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBranches();
  }, [session]);

  // Handle branch change
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSelectedTable(null);
  };

  // Handle table selection
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  // Handle table status change
  const handleStatusChange = async (status: string) => {
    if (!selectedTable) return;
    
    try {
      setIsUpdating(true);
      
      await api.patch(`/tables/${selectedTable.id}`, {
        status
      });
      
      // Update selected table
      setSelectedTable({
        ...selectedTable,
        status: status as any
      });
      
      toast.success(`Table status updated to ${status}`);
    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Failed to update table status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle table merge
  const handleMergeTables = () => {
    toast.error('Table merging is not implemented yet');
  };

  // Handle table split
  const handleSplitTable = () => {
    toast.error('Table splitting is not implemented yet');
  };

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Floor Plan Management</h1>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedBranchId ? (
              <FloorPlanEditor
                branchId={selectedBranchId}
                onTableSelect={handleTableSelect}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    {isLoading ? 'Loading branches...' : 'Please select a branch to view the floor plan'}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Table Management</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTable ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Table #{selectedTable.tableNumber}</h3>
                      <p className="text-sm text-gray-500">Capacity: {selectedTable.capacity} seats</p>
                      <p className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${
                          selectedTable.status === 'AVAILABLE' ? 'text-green-600' :
                          selectedTable.status === 'OCCUPIED' ? 'text-red-600' :
                          selectedTable.status === 'RESERVED' ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>{selectedTable.status}</span>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Change Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusChange('AVAILABLE')}
                          disabled={selectedTable.status === 'AVAILABLE' || isUpdating}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 disabled:opacity-50"
                        >
                          Available
                        </button>
                        <button
                          onClick={() => handleStatusChange('OCCUPIED')}
                          disabled={selectedTable.status === 'OCCUPIED' || isUpdating}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 disabled:opacity-50"
                        >
                          Occupied
                        </button>
                        <button
                          onClick={() => handleStatusChange('RESERVED')}
                          disabled={selectedTable.status === 'RESERVED' || isUpdating}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50"
                        >
                          Reserved
                        </button>
                        <button
                          onClick={() => handleStatusChange('CLEANING')}
                          disabled={selectedTable.status === 'CLEANING' || isUpdating}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm hover:bg-yellow-200 disabled:opacity-50"
                        >
                          Cleaning
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleMergeTables}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm hover:bg-indigo-200"
                        >
                          Merge Tables
                        </button>
                        <button
                          onClick={handleSplitTable}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm hover:bg-purple-200"
                        >
                          Split Table
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Select a table to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
} 