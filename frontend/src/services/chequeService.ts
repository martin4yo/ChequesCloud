import { apiRequest } from '../lib/api';
import type { Cheque, ChequeInput, PaginatedResponse, PaginationQuery, ChequeFilters } from '../types';

export const chequeService = {
  getCheques: async (params?: PaginationQuery & ChequeFilters): Promise<PaginatedResponse<Cheque>> => {
    console.log('🚀 SERVICIO DEBUG - Parámetros recibidos:', params);
    console.log('📅 fechaDesde en servicio:', params?.fechaDesde);
    console.log('📅 fechaHasta en servicio:', params?.fechaHasta);

    const response = await apiRequest<{ cheques: Cheque[]; total: number; page: number; limit: number; totalPages: number; totales?: any }>('GET', '/cheques', undefined, { params });

    if (response.success && response.data) {
      return {
        data: response.data.cheques,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
        totales: response.data.totales,
      };
    }
    throw new Error(response.error || 'Error al obtener cheques');
  },

  getChequeById: async (id: number): Promise<Cheque> => {
    const response = await apiRequest<Cheque>('GET', `/cheques/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al obtener cheque');
  },

  createCheque: async (cheque: ChequeInput): Promise<Cheque> => {
    const response = await apiRequest<Cheque>('POST', '/cheques', cheque);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al crear cheque');
  },

  updateCheque: async (id: number, cheque: ChequeInput): Promise<Cheque> => {
    const response = await apiRequest<Cheque>('PUT', `/cheques/${id}`, cheque);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al actualizar cheque');
  },

  deleteCheque: async (id: number): Promise<void> => {
    const response = await apiRequest('DELETE', `/cheques/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar cheque');
    }
  },

  marcarComoCobrado: async (id: number): Promise<Cheque> => {
    console.log(`🔄 Marcando cheque ${id} como cobrado...`);
    const response = await apiRequest<Cheque>('PATCH', `/cheques/${id}/cobrar`);
    console.log(`📦 Respuesta marcar como cobrado:`, response);
    if (response.success && response.data) {
      console.log(`✅ Cheque ${id} marcado como cobrado exitosamente:`, response.data);
      return response.data;
    }
    console.error(`❌ Error al marcar cheque ${id} como cobrado:`, response);
    throw new Error(response.error || 'Error al marcar cheque como cobrado');
  },

  exportToExcel: async (filters?: ChequeFilters): Promise<Blob> => {
    const response = await apiRequest('GET', '/cheques/export', undefined, {
      params: filters,
      responseType: 'blob',
    });
    return response as any; // This will be the blob directly
  },
};