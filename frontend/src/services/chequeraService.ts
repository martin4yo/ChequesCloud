import { apiRequest } from '../lib/api';
import type { Chequera, ChequeraInput, PaginatedResponse, PaginationQuery } from '../types';

export const chequeraService = {
  getChequeras: async (params?: PaginationQuery & { bancoId?: string }): Promise<PaginatedResponse<Chequera>> => {
    const response = await apiRequest<{ chequeras: Chequera[]; total: number; page: number; limit: number; totalPages: number }>('GET', '/chequeras', undefined, { params });
    if (response.success && response.data) {
      return {
        data: response.data.chequeras,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    }
    throw new Error(response.error || 'Error al obtener chequeras');
  },

  getChequeraById: async (id: number): Promise<Chequera> => {
    const response = await apiRequest<Chequera>('GET', `/chequeras/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener chequera');
  },

  createChequera: async (chequera: ChequeraInput): Promise<Chequera> => {
    const response = await apiRequest<Chequera>('POST', '/chequeras', chequera);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al crear chequera');
  },

  updateChequera: async (id: number, chequera: ChequeraInput): Promise<Chequera> => {
    const response = await apiRequest<Chequera>('PUT', `/chequeras/${id}`, chequera);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al actualizar chequera');
  },

  deleteChequera: async (id: number): Promise<void> => {
    const response = await apiRequest('DELETE', `/chequeras/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar chequera');
    }
  },

  getChequerasActivas: async (): Promise<Chequera[]> => {
    const response = await apiRequest<Chequera[]>('GET', '/chequeras/activas');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener chequeras activas');
  },
};