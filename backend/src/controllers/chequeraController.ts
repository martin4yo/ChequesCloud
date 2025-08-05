import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, ChequeraInput, PaginationQuery } from '../types';
import { Chequera, Banco, Cheque } from '../models';
import { Op } from 'sequelize';

export const getChequeras = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, bancoId, sortBy = 'numero', sortOrder = 'ASC' } = req.query as PaginationQuery & { bancoId?: string };

  const offset = (Number(page) - 1) * Number(limit);
  const whereClause: any = {};

  if (search) {
    whereClause.numero = { [Op.like]: `%${search}%` };
  }

  if (bancoId) {
    whereClause.bancoId = bancoId;
  }

  const { count, rows } = await Chequera.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ],
    limit: Number(limit),
    offset,
    order: [[sortBy as string, sortOrder as string]]
  });

  const response: ApiResponse = {
    success: true,
    data: {
      chequeras: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    }
  };

  res.json(response);
});

export const getChequeraById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const chequera = await Chequera.findByPk(id, {
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ]
  });

  if (!chequera) {
    throw new AppError('Chequera no encontrada', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: chequera
  };

  res.json(response);
});

export const createChequera = asyncHandler(async (req: Request, res: Response) => {
  const { numero, bancoId, saldoInicial, activa, chequeDesde, chequeHasta }: ChequeraInput = req.body;

  console.log('🏦 Creando chequera:', { numero, bancoId, saldoInicial, activa, chequeDesde, chequeHasta });

  // Verify bank exists
  const banco = await Banco.findByPk(bancoId);
  
  if (!banco) {
    throw new AppError('Banco no encontrado', 404);
  }

  const chequera = await Chequera.create({
    numero,
    bancoId,
    saldoInicial,
    saldoActual: saldoInicial,
    fechaCreacion: new Date(),
    activa,
    chequeDesde,
    chequeHasta
  });

  const chequeraWithBanco = await Chequera.findByPk(chequera.id, {
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: chequeraWithBanco,
    message: 'Chequera creada exitosamente'
  };

  res.status(201).json(response);
});

export const updateChequera = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { numero, bancoId, saldoInicial, activa, chequeDesde, chequeHasta }: ChequeraInput = req.body;

  const chequera = await Chequera.findByPk(id);

  if (!chequera) {
    throw new AppError('Chequera no encontrada', 404);
  }

  // Verify bank exists if bancoId is being updated
  if (bancoId && bancoId !== chequera.bancoId) {
    const banco = await Banco.findByPk(bancoId);
    if (!banco) {
      throw new AppError('Banco no encontrado', 404);
    }
  }

  await chequera.update({
    numero,
    bancoId,
    saldoInicial,
    activa,
    chequeDesde,
    chequeHasta
  });

  const chequeraWithBanco = await Chequera.findByPk(chequera.id, {
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: chequeraWithBanco,
    message: 'Chequera actualizada exitosamente'
  };

  res.json(response);
});

export const deleteChequera = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const chequera = await Chequera.findByPk(id, {
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['nombre']
      }
    ]
  });

  if (!chequera) {
    throw new AppError('Chequera no encontrada', 404);
  }

  // Check if chequera has associated cheques
  const cheques = await Cheque.findAll({
    where: { chequeraId: id }
  });

  if (cheques.length > 0) {
    throw new AppError(
      `No se puede eliminar la chequera "${chequera.numero}" del banco "${chequera.banco?.nombre}" porque tiene ${cheques.length} cheque(s) registrado(s). Elimine primero todos los cheques asociados.`,
      400
    );
  }

  await chequera.destroy();

  const response: ApiResponse = {
    success: true,
    message: 'Chequera eliminada exitosamente'
  };

  res.json(response);
});

export const getChequerasActivas = asyncHandler(async (req: Request, res: Response) => {
  const chequeras = await Chequera.findAll({
    where: { activa: true },
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo'],
        where: { habilitado: true }
      }
    ],
    order: [['numero', 'ASC']]
  });

  const response: ApiResponse = {
    success: true,
    data: chequeras
  };

  res.json(response);
});