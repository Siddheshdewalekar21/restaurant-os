'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Reservation } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';

export default function ReservationDetailsPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const { id } = React.use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/reservations/${id}`);
        const reservationData = response.data.data || response.data;
        setReservation(reservationData);
      } catch (error: any) {
        console.error('Error fetching reservation:', error);
        setError(error.response?.data?.error || 'Failed to fetch reservation details');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusUpdateLoading(true);
      await axios.patch(`/api/reservations/${id}`, { status: newStatus });
      
      // Refresh reservation data
      const response = await axios.get(`/api/reservations/${id}`);
      const reservationData = response.data.data || response.data;
      setReservation(reservationData);
      
    } catch (error: any) {
      console.error('Error updating reservation status:', error);
      setError(error.response?.data?.error || 'Failed to update reservation status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // ... rest of the component remains the same
} 