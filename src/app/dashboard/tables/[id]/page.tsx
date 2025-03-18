'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Table } from '@/types';
import Link from 'next/link';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import React from 'react';

export default function TableDetailsPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const { id } = React.use(params);
  const router = useRouter();
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tables/${id}`);
        const tableData = response.data.data || response.data;
        setTable(tableData);
        
        // Initialize form state
        setTableNumber(tableData.tableNumber);
        setCapacity(tableData.capacity);
        setLocation(tableData.location || '');
        setStatus(tableData.status);
      } catch (error: any) {
        console.error('Error fetching table:', error);
        setError(error.response?.data?.error || 'Failed to fetch table details');
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [id]);

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber || capacity <= 0) {
      setFormError('Table number and capacity are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError('');
      
      const response = await axios.patch(`/api/tables/${id}`, {
        tableNumber,
        capacity,
        location: location || undefined,
        status
      });
      
      setTable(response.data.data || response.data);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating table:', error);
      setFormError(error.response?.data?.error || 'Failed to update table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.delete(`/api/tables/${id}`);
      router.push('/dashboard/tables');
    } catch (error: any) {
      console.error('Error deleting table:', error);
      setError(error.response?.data?.error || 'Failed to delete table');
      setSubmitting(false);
    }
  };

  // ... rest of the component remains the same
} 