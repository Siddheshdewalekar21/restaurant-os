'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  type: 'DELIVERY' | 'MAPS' | 'MESSAGING';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'SWIGGY' | 'ZOMATO' | 'GOOGLE_MAPS' | 'WHATSAPP'>('SWIGGY');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now, would be replaced with actual API call
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Swiggy',
          type: 'DELIVERY',
          status: 'ACTIVE',
          apiKey: 'swiggy_api_key_xxxxx',
          merchantId: 'SWIGGY123456',
          webhookUrl: 'https://restaurantos.com/api/webhooks/swiggy',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Zomato',
          type: 'DELIVERY',
          status: 'INACTIVE',
          apiKey: '',
          merchantId: '',
          webhookUrl: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Google Maps',
          type: 'MAPS',
          status: 'ACTIVE',
          apiKey: 'google_maps_api_key_xxxxx',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          name: 'WhatsApp Business',
          type: 'MESSAGING',
          status: 'PENDING',
          apiKey: 'whatsapp_api_key_xxxxx',
          secretKey: 'whatsapp_secret_key_xxxxx',
          webhookUrl: 'https://restaurantos.com/api/webhooks/whatsapp',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setIntegrations(mockIntegrations);
      
      // Uncomment when API is ready
      // const response = await axios.get('/api/integrations');
      // if (response.data.success) {
      //   setIntegrations(response.data.data);
      // } else {
      //   setError('Failed to fetch integrations');
      // }
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('An error occurred while fetching integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setFormError(null);
      
      if (!apiKey) {
        setFormError('API Key is required');
        return;
      }
      
      // Different validation based on integration type
      if (formType === 'SWIGGY' || formType === 'ZOMATO') {
        if (!merchantId) {
          setFormError('Merchant ID is required');
          return;
        }
        if (!webhookUrl) {
          setFormError('Webhook URL is required');
          return;
        }
      }
      
      if (formType === 'WHATSAPP' && !secretKey) {
        setFormError('Secret Key is required');
        return;
      }
      
      // Mock successful integration
      const newIntegration: Integration = {
        id: Date.now().toString(),
        name: formType === 'SWIGGY' ? 'Swiggy' : 
              formType === 'ZOMATO' ? 'Zomato' : 
              formType === 'GOOGLE_MAPS' ? 'Google Maps' : 'WhatsApp Business',
        type: formType === 'GOOGLE_MAPS' ? 'MAPS' : 
              formType === 'WHATSAPP' ? 'MESSAGING' : 'DELIVERY',
        status: 'ACTIVE',
        apiKey,
        secretKey: secretKey || undefined,
        merchantId: merchantId || undefined,
        webhookUrl: webhookUrl || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update the existing integration or add a new one
      const existingIndex = integrations.findIndex(i => 
        i.name.toLowerCase() === newIntegration.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        const updatedIntegrations = [...integrations];
        updatedIntegrations[existingIndex] = newIntegration;
        setIntegrations(updatedIntegrations);
      } else {
        setIntegrations([...integrations, newIntegration]);
      }
      
      // Reset form
      setApiKey('');
      setSecretKey('');
      setMerchantId('');
      setWebhookUrl('');
      setShowForm(false);
      
      // Uncomment when API is ready
      // const response = await axios.post('/api/integrations', {
      //   type: formType,
      //   apiKey,
      //   secretKey: secretKey || undefined,
      //   merchantId: merchantId || undefined,
      //   webhookUrl: webhookUrl || undefined
      // });
      
      // if (response.data.success) {
      //   // Reset form
      //   setApiKey('');
      //   setSecretKey('');
      //   setMerchantId('');
      //   setWebhookUrl('');
      //   setShowForm(false);
      //   
      //   // Refresh integrations list
      //   fetchIntegrations();
      // } else {
      //   setFormError(response.data.error || 'Failed to save integration');
      // }
    } catch (err: any) {
      console.error('Error saving integration:', err);
      setFormError(err.response?.data?.error || 'An error occurred while saving the integration');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updatedIntegrations = integrations.map(integration => {
      if (integration.id === id) {
        return {
          ...integration,
          status: integration.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        };
      }
      return integration;
    });
    
    setIntegrations(updatedIntegrations);
    
    // Uncomment when API is ready
    // axios.patch(`/api/integrations/${id}/toggle-status`)
    //   .then(response => {
    //     if (response.data.success) {
    //       fetchIntegrations();
    //     }
    //   })
    //   .catch(err => {
    //     console.error('Error toggling integration status:', err);
    //   });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrationTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'MAPS':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'MESSAGING':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Third-Party Integrations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Add Integration'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Add Integration Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configure Integration</h2>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('SWIGGY')}
                  className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                    formType === 'SWIGGY' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}
                >
                  <img src="https://via.placeholder.com/40x40?text=Swiggy" alt="Swiggy" className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">Swiggy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('ZOMATO')}
                  className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                    formType === 'ZOMATO' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}
                >
                  <img src="https://via.placeholder.com/40x40?text=Zomato" alt="Zomato" className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">Zomato</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('GOOGLE_MAPS')}
                  className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                    formType === 'GOOGLE_MAPS' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}
                >
                  <img src="https://via.placeholder.com/40x40?text=Maps" alt="Google Maps" className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">Google Maps</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('WHATSAPP')}
                  className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                    formType === 'WHATSAPP' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}
                >
                  <img src="https://via.placeholder.com/40x40?text=WhatsApp" alt="WhatsApp" className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              {(formType === 'WHATSAPP') && (
                <div>
                  <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key *
                  </label>
                  <input
                    type="text"
                    id="secretKey"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required={formType === 'WHATSAPP'}
                  />
                </div>
              )}
              
              {(formType === 'SWIGGY' || formType === 'ZOMATO') && (
                <>
                  <div>
                    <label htmlFor="merchantId" className="block text-sm font-medium text-gray-700 mb-1">
                      Merchant ID *
                    </label>
                    <input
                      type="text"
                      id="merchantId"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required={formType === 'SWIGGY' || formType === 'ZOMATO'}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL *
                    </label>
                    <input
                      type="text"
                      id="webhookUrl"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required={formType === 'SWIGGY' || formType === 'ZOMATO'}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Integration
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Integrations List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading integrations...</p>
        </div>
      ) : integrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {getIntegrationTypeIcon(integration.type)}
                    <h2 className="text-xl font-semibold text-gray-800 ml-2">{integration.name}</h2>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  {integration.apiKey && (
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-500 w-32">API Key:</span>
                      <span className="text-sm text-gray-700 flex-1">
                        {integration.apiKey.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                  
                  {integration.merchantId && (
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-500 w-32">Merchant ID:</span>
                      <span className="text-sm text-gray-700 flex-1">{integration.merchantId}</span>
                    </div>
                  )}
                  
                  {integration.webhookUrl && (
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-500 w-32">Webhook URL:</span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{integration.webhookUrl}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => handleToggleStatus(integration.id)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      integration.status === 'ACTIVE'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {integration.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <Link 
                    href={`/dashboard/integrations/${integration.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No integrations found. Add your first integration to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Integration
          </button>
        </div>
      )}
    </div>
  );
} 