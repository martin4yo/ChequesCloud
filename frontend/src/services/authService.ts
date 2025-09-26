import { apiRequest } from '../lib/api';
import type { AuthResponse, LoginInput, UserInput, User } from '../types';

export const authService = {
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    console.log('🔐 Frontend: Iniciando login con:', { email: credentials.email });
    try {
      const response = await apiRequest<AuthResponse>('POST', '/auth/login', credentials);
      console.log('📡 Frontend: Respuesta del servidor:', response);
      
      if (response.success && response.data) {
        console.log('✅ Frontend: Login exitoso, guardando datos');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      console.log('❌ Frontend: Login falló', response.error);
      throw new Error(response.error || 'Credenciales inválidas');
    } catch (error: any) {
      console.error('🚨 Frontend: Error en login:', error);
      throw error;
    }
  },

  register: async (userData: UserInput): Promise<AuthResponse> => {
    console.log('📝 Frontend: Iniciando registro con:', { username: userData.username, email: userData.email });
    try {
      const response = await apiRequest<AuthResponse>('POST', '/auth/register', userData);
      console.log('📡 Frontend: Respuesta del servidor para registro:', response);
      
      if (response.success && response.data) {
        console.log('✅ Frontend: Registro exitoso, guardando datos');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      console.log('❌ Frontend: Registro falló', response.error);
      throw new Error(response.error || 'Error en el registro');
    } catch (error: any) {
      console.error('🚨 Frontend: Error en registro:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getProfile: async (): Promise<User> => {
    const response = await apiRequest<User>('GET', '/auth/profile');
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener el perfil');
  },

  forgotPassword: async (email: string): Promise<any> => {
    const response = await apiRequest('POST', '/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (token: string, newPassword: string): Promise<any> => {
    const response = await apiRequest('POST', '/auth/reset-password', {
      token,
      newPassword
    });
    return response;
  },

  validateResetToken: async (token: string): Promise<any> => {
    const response = await apiRequest('GET', `/auth/validate-reset-token/${token}`);
    return response;
  },
};