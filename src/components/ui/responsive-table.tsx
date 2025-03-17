'use client';

import React, { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  mobileLabel?: string;
  hidden?: boolean | ((isMobile: boolean) => boolean);
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  emptyMessage = 'No data available',
  className = '',
  rowClassName = '',
  onRowClick,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Filter columns based on hidden property
  const visibleColumns = columns.filter(column => {
    if (typeof column.hidden === 'function') {
      return !column.hidden(isMobile);
    }
    return !column.hidden;
  });

  // Render cell content
  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as ReactNode;
  };

  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map(item => {
          const key = String(item[keyField]);
          const handleClick = onRowClick ? () => onRowClick(item) : undefined;
          const rowClass = typeof rowClassName === 'function' ? rowClassName(item) : rowClassName;
          
          return (
            <Card 
              key={key} 
              className={`bg-white overflow-hidden ${rowClass} ${handleClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={handleClick}
            >
              <div className="p-4 space-y-3">
                {visibleColumns.map((column, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500">
                      {column.mobileLabel || column.header}:
                    </span>
                    <div className={`text-sm text-right ${column.className || ''}`}>
                      {renderCell(item, column)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column, index) => (
                <th 
                  key={index} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(item => {
              const key = String(item[keyField]);
              const handleClick = onRowClick ? () => onRowClick(item) : undefined;
              const rowClass = typeof rowClassName === 'function' ? rowClassName(item) : rowClassName;
              
              return (
                <tr 
                  key={key} 
                  className={`${rowClass} ${handleClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={handleClick}
                >
                  {visibleColumns.map((column, index) => (
                    <td 
                      key={index} 
                      className={`px-4 py-3 whitespace-nowrap text-sm ${column.className || ''}`}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 