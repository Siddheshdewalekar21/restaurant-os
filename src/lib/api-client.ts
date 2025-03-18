import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { retryNetworkErrors } from './retry';

// Get the API base URL from environment or use a default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to ensure URL starts with /
function normalizeUrl(url: string): string {
  // If URL already starts with http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Remove leading /api if present
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  }
  
  // If URL already starts with /, return as is
  if (url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, add / prefix
  return `/${url}`;
}

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error detected. Server might be unreachable.');
      return Promise.reject({
        response: {
          data: {
            error: 'Unable to connect to the server. Please check your internet connection or try again later.',
          },
          status: 0,
        },
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Server might be overloaded.');
      return Promise.reject({
        response: {
          data: {
            error: 'Request timed out. Please try again later.',
          },
          status: 408,
        },
      });
    }
    
    // Handle 404 errors with more specific message
    if (error.response?.status === 404) {
      const fullUrl = error.config?.baseURL + error.config?.url;
      console.error(`Resource not found: ${fullUrl}`);
      return Promise.reject({
        response: {
          data: {
            error: `The requested resource was not found: ${fullUrl}`,
          },
          status: 404,
        },
      });
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// Custom error class to preserve the original error structure
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number = 400, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// API request wrapper with error handling
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    // Check if URL is valid before making the request
    if (!url) {
      throw new ApiError('Invalid API endpoint: URL is empty', 400);
    }
    
    // Normalize the URL
    const normalizedUrl = normalizeUrl(url);
    
    // Log the request for debugging
    console.log(`API Request: ${method} ${API_BASE_URL}${normalizedUrl}`);
    
    // Use retry mechanism for network errors
    const response = await retryNetworkErrors(() => 
      apiClient({
        method,
        url: normalizedUrl,
        data,
        ...config,
      })
    );
    
    console.log('API Response:', response.data);
    
    // Check if the response has the expected format
    if (response.data && typeof response.data === 'object') {
      // If the response has a success property, it's using our standard format
      if ('success' in response.data) {
        if (response.data.success === true) {
          // Return the data property if it exists, otherwise return the whole response
          return response.data;
        } else {
          // If success is false, throw an error with the error message
          throw new ApiError(
            response.data.error || 'API request failed',
            response.status || 400,
            response.data.errors || response.data
          );
        }
      } else {
        // If the response doesn't have a success property, return the whole response
        return response.data;
      }
    }
    
    // Fallback to returning the whole response
    return response.data;
  } catch (error: any) {
    console.error('API request error:', error);
    
    // Extract error information from response
    const status = error.response?.status || 500;
    const responseData = error.response?.data;
    
    // Handle validation errors (typically 422 status code)
    if (status === 422 && responseData?.errors) {
      throw new ApiError('Validation error', status, responseData.errors);
    }
    
    // Handle 404 errors specifically
    if (status === 404) {
      const fullUrl = API_BASE_URL + normalizeUrl(url);
      throw new ApiError(`Resource not found: ${fullUrl}`, 404, responseData);
    }
    
    // Extract error message from response if available
    const errorMessage = responseData?.error || 
                         responseData?.message || 
                         error.message || 
                         'An unexpected error occurred';
    
    // Throw a more informative error with the original data preserved
    throw new ApiError(errorMessage, status, responseData);
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>('GET', url, undefined, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>('POST', url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>('PUT', url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>('PATCH', url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>('DELETE', url, undefined, config),
};

export default api; 