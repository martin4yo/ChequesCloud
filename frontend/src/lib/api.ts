import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic API request wrapper
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  console.log(`📡 API Request: ${method} ${API_BASE_URL}${url}`, data ? { data } : '');

  // Debug para ver parámetros de query
  if (config?.params) {
    console.log('🔗 Query params siendo enviados:', config.params);
    if (config.params.fechaDesde || config.params.fechaHasta) {
      console.log('📅 FECHAS EN PARAMS:');
      console.log('  fechaDesde:', config.params.fechaDesde, typeof config.params.fechaDesde);
      console.log('  fechaHasta:', config.params.fechaHasta, typeof config.params.fechaHasta);
    }
  }

  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    console.log(`✅ API Response: ${method} ${url}`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ API Error: ${method} ${url}`, error);
    
    if (error?.response?.data) {
      console.error('Error response data:', error.response.data);
      // Make sure the error object has the expected structure
      const errorResponse = error.response.data;
      if (errorResponse.success === false && errorResponse.error) {
        throw { error: errorResponse.error, message: errorResponse.error };
      }
      throw error.response.data;
    }
    
    // Handle different types of network errors
    let errorMessage = 'Error de conexión';
    
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
      errorMessage = 'No se pudo conectar al servidor. Verifique que el backend esté funcionando.';
    } else if (error?.code === 'ENOTFOUND') {
      errorMessage = 'Servidor no encontrado. Verifique la configuración de la URL.';
    } else if (error?.code === 'ECONNABORTED') {
      errorMessage = 'La conexión tardó demasiado tiempo. Intente nuevamente.';
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'Tiempo de espera agotado. El servidor no responde.';
    } else if (error?.message?.includes('Network Error')) {
      errorMessage = 'Error de red. Verifique su conexión a internet y que el servidor esté disponible.';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.error('Network or other error:', errorMessage);
    throw {
      success: false,
      error: errorMessage,
    };
  }
};

export default api;