export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Banco {
  id: number;
  nombre: string;
  codigo: string;
  habilitado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BancoInput {
  nombre: string;
  codigo: string;
  habilitado: boolean;
}

export interface Chequera {
  id: number;
  numero: string;
  bancoId: number;
  saldoInicial: number;
  saldoActual: number;
  fechaCreacion: string;
  activa: boolean;
  chequeDesde: number;
  chequeHasta: number;
  banco?: Banco;
  createdAt: string;
  updatedAt: string;
}

export interface ChequeraInput {
  numero: string;
  bancoId: number;
  saldoInicial: number;
  activa: boolean;
  chequeDesde: number;
  chequeHasta: number;
}

export interface Cheque {
  id: number;
  numero: string;
  chequeraId: number;
  fechaEmision: string; // UTC datetime string from backend
  fechaVencimiento: string; // UTC datetime string from backend
  beneficiario: string;
  concepto: string;
  monto: number;
  estado: 'PENDIENTE' | 'COBRADO' | 'ANULADO';
  fechaCobro?: string;
  chequera?: Chequera;
  createdAt: string;
  updatedAt: string;
}

export interface ChequeInput {
  numero: string;
  chequeraId: number;
  fechaEmision: string;
  fechaVencimiento: string;
  beneficiario: string;
  concepto: string;
  monto: number;
  estado?: 'PENDIENTE' | 'COBRADO' | 'ANULADO';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ChequeTotal {
  total: number;
  pendiente: number;
  cobrado: number;
  anulado: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totales?: ChequeTotal;
}

export interface ChequeFilters {
  chequeraId?: string;
  bancoId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}