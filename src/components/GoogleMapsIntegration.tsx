'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'RESTAURANT' | 'BRANCH' | 'DELIVERY';
}

interface DeliveryRoute {
  id: string;
  orderId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  currentLat: number;
  currentLng: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedArrival: string;
}

interface GoogleMapsIntegrationProps {
  apiKey?: string;
  showDeliveryTracking?: boolean;
  height?: string;
  orderId?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsIntegration({
  apiKey,
  showDeliveryTracking = false,
  height = '400px',
  orderId
}: GoogleMapsIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const deliveryMarkerRef = useRef<any>(null);
  const deliveryPathRef = useRef<any>(null);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [deliveryRoute, setDeliveryRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is missing');
      setLoading(false);
      return;
    }
    
    if (window.google) {
      setMapLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      setMapLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps API');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      window.initMap = () => {};
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Mock data for now, would be replaced with actual API call
        const mockLocations: Location[] = [
          {
            id: '1',
            name: 'Main Restaurant',
            address: '123 Main St, City',
            lat: 40.7128,
            lng: -74.0060,
            type: 'RESTAURANT'
          },
          {
            id: '2',
            name: 'Downtown Branch',
            address: '456 Downtown Ave, City',
            lat: 40.7200,
            lng: -74.0100,
            type: 'BRANCH'
          },
          {
            id: '3',
            name: 'Uptown Branch',
            address: '789 Uptown Blvd, City',
            lat: 40.7300,
            lng: -74.0200,
            type: 'BRANCH'
          }
        ];
        
        setLocations(mockLocations);
        
        // Uncomment when API is ready
        // const response = await axios.get('/api/locations');
        // if (response.data.success) {
        //   setLocations(response.data.data);
        // } else {
        //   setError('Failed to fetch locations');
        // }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('An error occurred while fetching locations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

  // Fetch delivery route if tracking is enabled
  useEffect(() => {
    if (!showDeliveryTracking || !orderId) return;
    
    const fetchDeliveryRoute = async () => {
      try {
        // Mock data for now, would be replaced with actual API call
        const mockRoute: DeliveryRoute = {
          id: '1',
          orderId: orderId,
          startLat: 40.7128,
          startLng: -74.0060,
          endLat: 40.7500,
          endLng: -74.0300,
          currentLat: 40.7300,
          currentLng: -74.0200,
          status: 'IN_PROGRESS',
          estimatedArrival: new Date(Date.now() + 20 * 60 * 1000).toISOString()
        };
        
        setDeliveryRoute(mockRoute);
        
        // Uncomment when API is ready
        // const response = await axios.get(`/api/orders/${orderId}/delivery-tracking`);
        // if (response.data.success) {
        //   setDeliveryRoute(response.data.data);
        // } else {
        //   setError('Failed to fetch delivery route');
        // }
      } catch (err) {
        console.error('Error fetching delivery route:', err);
        setError('An error occurred while fetching delivery route');
      }
    };
    
    fetchDeliveryRoute();
    
    // Set up polling for delivery updates
    const intervalId = setInterval(fetchDeliveryRoute, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [showDeliveryTracking, orderId]);

  // Initialize map when Google Maps API and locations are loaded
  useEffect(() => {
    if (!mapLoaded || loading || !mapRef.current || locations.length === 0) return;
    
    const initializeMap = () => {
      // Find center of map based on locations
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      
      // Create map
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      
      // Add markers for each location
      markersRef.current = locations.map(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: googleMapRef.current,
          title: location.name,
          icon: getMarkerIcon(location.type),
          animation: window.google.maps.Animation.DROP,
        });
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div>
              <h3 style="font-weight: bold; margin-bottom: 5px;">${location.name}</h3>
              <p style="margin: 0;">${location.address}</p>
            </div>
          `,
        });
        
        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });
        
        return marker;
      });
      
      // Fit map to bounds
      googleMapRef.current.fitBounds(bounds);
      
      // Adjust zoom if too zoomed in
      const listener = window.google.maps.event.addListener(googleMapRef.current, 'idle', () => {
        if (googleMapRef.current.getZoom() > 15) {
          googleMapRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    };
    
    initializeMap();
  }, [mapLoaded, loading, locations]);

  // Update delivery tracking on map
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current || !deliveryRoute || !showDeliveryTracking) return;
    
    // Create or update delivery marker
    if (!deliveryMarkerRef.current) {
      deliveryMarkerRef.current = new window.google.maps.Marker({
        position: { lat: deliveryRoute.currentLat, lng: deliveryRoute.currentLng },
        map: googleMapRef.current,
        title: 'Delivery',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
        animation: window.google.maps.Animation.BOUNCE,
      });
      
      // Add info window for delivery
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3 style="font-weight: bold; margin-bottom: 5px;">Order #${deliveryRoute.orderId}</h3>
            <p style="margin: 0;">Status: ${formatDeliveryStatus(deliveryRoute.status)}</p>
            <p style="margin: 0;">ETA: ${formatETA(deliveryRoute.estimatedArrival)}</p>
          </div>
        `,
      });
      
      deliveryMarkerRef.current.addListener('click', () => {
        infoWindow.open(googleMapRef.current, deliveryMarkerRef.current);
      });
    } else {
      deliveryMarkerRef.current.setPosition({ lat: deliveryRoute.currentLat, lng: deliveryRoute.currentLng });
    }
    
    // Create or update delivery path
    const pathCoordinates = [
      { lat: deliveryRoute.startLat, lng: deliveryRoute.startLng },
      { lat: deliveryRoute.currentLat, lng: deliveryRoute.currentLng },
      { lat: deliveryRoute.endLat, lng: deliveryRoute.endLng },
    ];
    
    if (!deliveryPathRef.current) {
      deliveryPathRef.current = new window.google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        icons: [{
          icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
          offset: '100%',
          repeat: '100px'
        }],
      });
      
      deliveryPathRef.current.setMap(googleMapRef.current);
    } else {
      deliveryPathRef.current.setPath(pathCoordinates);
    }
    
    // Fit map to include delivery route
    const bounds = new window.google.maps.LatLngBounds();
    pathCoordinates.forEach(coord => bounds.extend(coord));
    googleMapRef.current.fitBounds(bounds);
    
  }, [mapLoaded, deliveryRoute, showDeliveryTracking]);

  // Helper functions
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'RESTAURANT':
        return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      case 'BRANCH':
        return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'DELIVERY':
        return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      default:
        return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };
  
  const formatDeliveryStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };
  
  const formatETA = (eta: string) => {
    const date = new Date(eta);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          Please check your Google Maps API key and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="ml-2 text-gray-500">Loading map...</p>
        </div>
      ) : (
        <div ref={mapRef} style={{ height, width: '100%' }}></div>
      )}
      
      {showDeliveryTracking && deliveryRoute && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-800">Delivery Status</h3>
          <div className="mt-2 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                deliveryRoute.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                deliveryRoute.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {formatDeliveryStatus(deliveryRoute.status)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ETA:</span>
              <span className="ml-2 text-sm font-medium text-gray-800">
                {formatETA(deliveryRoute.estimatedArrival)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 