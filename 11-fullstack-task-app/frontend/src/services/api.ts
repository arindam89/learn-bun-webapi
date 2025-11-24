/**
 * API Client with comprehensive error handling and retry logic
 * Built on top of Bun's built-in fetch API
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { ApiResponse } from '@/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      handleServerError(error.response);
    } else if (error.request) {
      // Network error (no response received)
      handleNetworkError(error);
    } else {
      // Request configuration error
      handleRequestError(error);
    }

    return Promise.reject(error);
  }
);

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Handle server errors (4xx, 5xx)
function handleServerError(response: AxiosResponse) {
  const { status, data } = response;

  switch (status) {
    case 401:
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('taskflow_token');
      delete apiClient.defaults.headers.common['Authorization'];
      toast.error('Your session has expired. Please log in again.');
      // Redirect to login page (handled by router)
      window.location.href = '/auth/login';
      break;

    case 403:
      toast.error('You do not have permission to perform this action.');
      break;

    case 404:
      toast.error('The requested resource was not found.');
      break;

    case 422:
      // Validation errors
      if (data.details && Array.isArray(data.details)) {
        data.details.forEach((detail: any) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        toast.error(data.error || 'Validation failed');
      }
      break;

    case 429:
      toast.error('Too many requests. Please try again later.');
      break;

    case 500:
      toast.error('Internal server error. Please try again later.');
      break;

    default:
      toast.error(data.error || `Request failed with status ${status}`);
  }
}

// Handle network errors
function handleNetworkError(error: AxiosError) {
  if (error.code === 'ECONNABORTED') {
    toast.error('Request timeout. Please check your connection and try again.');
  } else if (error.message.includes('Network Error')) {
    toast.error('Network error. Please check your internet connection.');
  } else {
    toast.error('Connection error. Please try again later.');
  }
}

// Handle request configuration errors
function handleRequestError(error: AxiosError) {
  toast.error('Invalid request configuration. Please try again.');
}

// API Wrapper class for typed responses
export class ApiService {
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (error.response?.data) {
      const { error: message, code } = error.response.data;
      return new Error(message || 'An unexpected error occurred');
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

// Retry utility for failed requests
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'response' in error) {
        const status = (error as any).response?.status;
        if (status && status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const retryDelay = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      console.warn(`Retrying request (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }

  throw lastError!;
}

// Health check function
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
}

export default ApiService;