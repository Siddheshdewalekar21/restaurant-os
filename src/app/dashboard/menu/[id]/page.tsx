'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MenuItem, Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

export default function MenuItemDetailsPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const { id } = React.use(params);
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch menu item
        const itemResponse = await axios.get(`/api/menu/${id}`);
        const itemData = itemResponse.data || itemResponse;
        setMenuItem(itemData);
        
        // Initialize form state
        setName(itemData.name);
        setDescription(itemData.description || '');
        setPrice(itemData.price);
        setCategoryId(itemData.categoryId);
        setImageUrl(itemData.imageUrl || '');
        setIsVegetarian(itemData.isVegetarian || false);
        setIsSpicy(itemData.isSpicy || false);
        setIsAvailable(itemData.isAvailable !== false); // Default to true if undefined
        
        // Fetch categories for dropdown
        const categoriesResponse = await axios.get('/api/categories');
        const categoriesData = categoriesResponse.data || [];
        setCategories(categoriesData);
      } catch (error: any) {
        console.error('Error fetching menu item:', error);
        setError(error.response?.data?.error || 'Failed to fetch menu item details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || price <= 0 || !categoryId) {
      setFormError('Name, price, and category are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError('');
      
      const response = await axios.patch(`/api/menu/${id}`, {
        name,
        description: description || undefined,
        price,
        categoryId,
        imageUrl: imageUrl || undefined,
        isVegetarian,
        isSpicy,
        isAvailable
      });
      
      setMenuItem(response.data.data || response.data);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      setFormError(error.response?.data?.error || 'Failed to update menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.delete(`/api/menu/${id}`);
      router.push('/dashboard/menu');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      setError(error.response?.data?.error || 'Failed to delete menu item');
      setSubmitting(false);
    }
  };

  // ... rest of the component remains the same
} 