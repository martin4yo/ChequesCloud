import { apiRequest } from '../lib/api';
import type { Banco, BancoInput, PaginatedResponse, PaginationQuery } from '../types';

export const bancoService = {
  getBancos: async (params?: PaginationQuery): Promise<PaginatedResponse<Banco>> => {
    const response = await apiRequest<{ bancos: Banco[]; total: number; page: number; limit: number; totalPages: number }>('GET', '/bancos', undefined, { params });
    if (response.success && response.data) {
      return {
        data: response.data.bancos,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    }
    throw new Error(response.error || 'Error al obtener bancos');
  },

  getBancoById: async (id: number): Promise<Banco> => {
    const response = await apiRequest<Banco>('GET', `/bancos/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener banco');
  },

  createBanco: async (banco: BancoInput): Promise<Banco> => {
    const response = await apiRequest<Banco>('POST', '/bancos', banco);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al crear banco');
  },

  updateBanco: async (id: number, banco: BancoInput): Promise<Banco> => {
    const response = await apiRequest<Banco>('PUT', `/bancos/${id}`, banco);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al actualizar banco');
  },

  deleteBanco: async (id: number): Promise<void> => {
    const response = await apiRequest('DELETE', `/bancos/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar banco');
    }
  },

  getBancosHabilitados: async (): Promise<Banco[]> => {
    const response = await apiRequest<Banco[]>('GET', '/bancos/habilitados');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener bancos habilitados');
  },
};