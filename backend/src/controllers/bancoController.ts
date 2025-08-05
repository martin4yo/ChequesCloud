import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, BancoInput, PaginationQuery } from '../types';
import { Banco, Chequera } from '../models';
import { Op } from 'sequelize';

export const getBancos = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy = 'nombre', sortOrder = 'ASC' } = req.query as PaginationQuery;

  const offset = (Number(page) - 1) * Number(limit);
  const whereClause: any = {};

  if (search) {
    whereClause[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { codigo: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Banco.findAndCountAll({
    where: whereClause,
    limit: Number(limit),
    offset,
    order: [[sortBy as string, sortOrder as string]]
  });

  const response: ApiResponse = {
    success: true,
    data: {
      bancos: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    }
  };

  res.json(response);
});

export const getBancoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const banco = await Banco.findByPk(id);

  if (!banco) {
    throw new AppError('Banco no encontrado', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: banco
  };

  res.json(response);
});

export const createBanco = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, codigo, habilitado }: BancoInput = req.body;

  const banco = await Banco.create({
    nombre,
    codigo,
    habilitado
  });

  const response: ApiResponse = {
    success: true,
    data: banco,
    message: 'Banco creado exitosamente'
  };

  res.status(201).json(response);
});

export const updateBanco = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, codigo, habilitado }: BancoInput = req.body;

  const banco = await Banco.findByPk(id);

  if (!banco) {
    throw new AppError('Banco no encontrado', 404);
  }

  await banco.update({
    nombre,
    codigo,
    habilitado
  });

  const response: ApiResponse = {
    success: true,
    data: banco,
    message: 'Banco actualizado exitosamente'
  };

  res.json(response);
});

export const deleteBanco = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const banco = await Banco.findByPk(id);

  if (!banco) {
    throw new AppError('Banco no encontrado', 404);
  }

  // Check if bank has associated chequeras
  const chequeras = await Chequera.findAll({
    where: { bancoId: id }
  });

  if (chequeras.length > 0) {
    throw new AppError(
      `No se puede eliminar el banco "${banco.nombre}" porque tiene ${chequeras.length} chequera(s) asignada(s). Elimine primero todas las chequeras asociadas.`,
      400
    );
  }

  await banco.destroy();

  const response: ApiResponse = {
    success: true,
    message: 'Banco eliminado exitosamente'
  };

  res.json(response);
});

export const getBancosHabilitados = asyncHandler(async (req: Request, res: Response) => {
  const bancos = await Banco.findAll({
    where: { habilitado: true },
    order: [['nombre', 'ASC']]
  });

  const response: ApiResponse = {
    success: true,
    data: bancos
  };

  res.json(response);
});