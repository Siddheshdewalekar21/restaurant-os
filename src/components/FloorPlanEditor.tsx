'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Table } from '@/types';
import api from '@/lib/api-client';

interface Position {
  x: number;
  y: number;
}

interface DraggableTableProps {
  table: Table;
  position: Position;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, position: Position) => void;
}

function DraggableTable({
  table,
  position,
  isSelected,
  onSelect,
  onPositionChange
}: DraggableTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get table status color
  const getStatusColor = () => {
    switch (table.status) {
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

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableRef.current) return;
    
    // Prevent default behavior
    e.preventDefault();
    
    // Calculate offset
    const rect = tableRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Start dragging
    setIsDragging(true);
    
    // Select this table
    onSelect(table.id);
  };

  // Handle mouse move event
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!tableRef.current || !tableRef.current.parentElement) return;
      
      // Get parent container bounds
      const containerRect = tableRef.current.parentElement.getBoundingClientRect();
      
      // Calculate new position
      const newX = Math.max(0, Math.min(e.clientX - containerRect.left - dragOffset.x, containerRect.width - 100));
      const newY = Math.max(0, Math.min(e.clientY - containerRect.top - dragOffset.y, containerRect.height - 100));
      
      // Update position
      onPositionChange(table.id, { x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, table.id, onPositionChange]);

  return (
    <div
      ref={tableRef}
      className={`absolute cursor-move border-2 rounded-md ${getStatusColor()} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '80px',
        height: '80px',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        zIndex: isDragging ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(table.id)}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="font-bold">{table.tableNumber}</div>
        <div className="text-xs">{table.capacity} seats</div>
      </div>
    </div>
  );
}

interface FloorPlanEditorProps {
  branchId: string;
  initialTables?: Table[];
  onTableSelect?: (table: Table) => void;
  readOnly?: boolean;
}

export default function FloorPlanEditor({
  branchId,
  initialTables = [],
  onTableSelect,
  readOnly = false
}: FloorPlanEditorProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [tablePositions, setTablePositions] = useState<Record<string, Position>>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/tables?branchId=${branchId}`);
        setTables(response);
        
        // Initialize positions
        const positions: Record<string, Position> = {};
        response.forEach((table: Table) => {
          positions[table.id] = {
            x: table.positionX || Math.random() * 500,
            y: table.positionY || Math.random() * 300
          };
        });
        
        setTablePositions(positions);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to load tables');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTables();
  }, [branchId]);

  // Handle table position change
  const handlePositionChange = (id: string, position: Position) => {
    setTablePositions(prev => ({
      ...prev,
      [id]: position
    }));
  };

  // Handle table selection
  const handleTableSelect = (id: string) => {
    setSelectedTableId(id);
    
    // Call parent handler if provided
    if (onTableSelect) {
      const selectedTable = tables.find(table => table.id === id);
      if (selectedTable) {
        onTableSelect(selectedTable);
      }
    }
  };

  // Save table positions
  const savePositions = async () => {
    try {
      setIsSaving(true);
      
      // Create promises for all table updates
      const updatePromises = Object.entries(tablePositions).map(([id, position]) => {
        return api.patch(`/tables/${id}`, {
          positionX: Math.round(position.x),
          positionY: Math.round(position.y)
        });
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast.success('Floor plan saved successfully');
    } catch (error) {
      console.error('Error saving floor plan:', error);
      toast.error('Failed to save floor plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Restaurant Floor Plan
        </CardTitle>
        {!readOnly && (
          <button
            onClick={savePositions}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-gray-500">Loading floor plan...</div>
          </div>
        ) : (
          <div 
            className="relative border border-gray-200 rounded-md bg-gray-50 h-[500px] overflow-hidden"
            style={{ backgroundImage: 'url("/images/grid-pattern.svg")' }}
          >
            {tables.map(table => (
              <DraggableTable
                key={table.id}
                table={table}
                position={tablePositions[table.id] || { x: 0, y: 0 }}
                isSelected={selectedTableId === table.id}
                onSelect={handleTableSelect}
                onPositionChange={handlePositionChange}
              />
            ))}
            
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                No tables available for this branch
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-500 rounded-sm mr-1"></div>
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-500 rounded-sm mr-1"></div>
            <span className="text-xs">Occupied</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded-sm mr-1"></div>
            <span className="text-xs">Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded-sm mr-1"></div>
            <span className="text-xs">Cleaning</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 