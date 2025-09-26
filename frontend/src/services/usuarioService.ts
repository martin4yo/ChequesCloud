import { apiRequest } from '../lib/api';
import type { PaginatedResponse, PaginationQuery, ApiResponse } from '../types';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioInput {
  username: string;
  email: string;
  password?: string;
  activo?: boolean;
}

export const usuarioService = {
  getUsuarios: async (params?: PaginationQuery): Promise<PaginatedResponse<Usuario>> => {
    const response = await apiRequest<Usuario[]>('GET', '/usuarios', undefined, { params });
    if (response.success && response.data) {
      return {
        data: response.data,
        total: response.total || 0,
        page: response.page || 1,
        limit: params?.limit || 10,
        totalPages: response.totalPages || 1,
      };
    }
    throw new Error(response.error || 'Error al obtener usuarios');
  },

  getUsuarioById: async (id: number): Promise<Usuario> => {
    const response = await apiRequest<Usuario>('GET', `/usuarios/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener usuario');
  },

  createUsuario: async (usuario: UsuarioInput): Promise<Usuario> => {
    const response = await apiRequest<Usuario>('POST', '/usuarios', usuario);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al crear usuario');
  },

  updateUsuario: async (id: number, usuario: UsuarioInput): Promise<Usuario> => {
    const response = await apiRequest<Usuario>('PUT', `/usuarios/${id}`, usuario);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al actualizar usuario');
  },

  toggleUsuarioActivo: async (id: number): Promise<Usuario> => {
    const response = await apiRequest<Usuario>('PATCH', `/usuarios/${id}/toggle-activo`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al cambiar estado del usuario');
  },

  reenviarEmailCambioPassword: async (id: number): Promise<void> => {
    const response = await apiRequest('POST', `/usuarios/${id}/reenviar-email`);
    if (!response.success) {
      throw new Error(response.error || 'Error al reenviar email de cambio de contraseña');
    }
  },

  deleteUsuario: async (id: number): Promise<void> => {
    const response = await apiRequest('DELETE', `/usuarios/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar usuario');
    }
  },
};