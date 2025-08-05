import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface Banco {
  id: number;
  nombre: string;
  codigo: string;
  habilitado: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  fechaCreacion: Date;
  activa: boolean;
  chequeDesde: number;
  chequeHasta: number;
  banco?: Banco;
  createdAt: Date;
  updatedAt: Date;
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
  fechaEmision: string; // DATEONLY field returns string in YYYY-MM-DD format
  fechaVencimiento: string; // DATEONLY field returns string in YYYY-MM-DD format
  beneficiario: string;
  concepto: string;
  monto: number;
  estado: 'PENDIENTE' | 'COBRADO' | 'ANULADO';
  fechaCobro?: Date; // This keeps time info as it's when the check was cashed
  chequera?: Chequera;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChequeInput {
  numero: string;
  chequeraId: number;
  fechaEmision: string; // Date string in YYYY-MM-DD format
  fechaVencimiento: string; // Date string in YYYY-MM-DD format
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
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  data: any[];
  columns: Array<{
    key: string;
    header: string;
    width?: number;
  }>;
}