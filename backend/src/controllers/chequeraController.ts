import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { ApiResponse, ChequeraInput, PaginationQuery } from '../types';

export const getChequeras = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, bancoId, sortBy = 'numero', sortOrder = 'asc' } = req.query as PaginationQuery & { bancoId?: string };

    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { numero: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (bancoId) {
      whereClause.bancoId = Number(bancoId);
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [chequeras, total] = await Promise.all([
      prisma.chequera.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: Number(limit),
        include: {
          banco: {
            select: { id: true, nombre: true, codigo: true }
          },
          _count: {
            select: { cheques: true }
          }
        }
      }),
      prisma.chequera.count({ where: whereClause })
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        chequeras,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error obteniendo chequeras:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getChequerasActivas = async (req: Request, res: Response): Promise<void> => {
  try {
    const chequeras = await prisma.chequera.findMany({
      where: {
        activa: true,
        banco: { habilitado: true }
      },
      orderBy: { numero: 'asc' },
      include: {
        banco: {
          select: { id: true, nombre: true, codigo: true }
        }
      }
    });

    res.json({
      success: true,
      data: chequeras
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo chequeras activas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getChequeraById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chequera = await prisma.chequera.findUnique({
      where: { id: Number(id) },
      include: {
        banco: true,
        cheques: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 cheques
        },
        _count: {
          select: { cheques: true }
        }
      }
    });

    if (!chequera) {
      res.status(404).json({
        success: false,
        error: 'Chequera no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: chequera
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo chequera:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const createChequera = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      numero,
      bancoId,
      saldoInicial,
      fechaCreacion,
      activa = true,
      chequeDesde,
      chequeHasta
    }: ChequeraInput = req.body;

    console.log('🏦 Creando chequera:', { numero, bancoId, saldoInicial, activa, chequeDesde, chequeHasta });

    // Validate that banco exists
    const banco = await prisma.banco.findUnique({
      where: { id: bancoId }
    });

    if (!banco) {
      res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
      return;
    }

    // Validate cheque range
    if (chequeHasta <= chequeDesde) {
      res.status(400).json({
        success: false,
        error: 'El número de cheque final debe ser mayor al inicial'
      });
      return;
    }

    const chequera = await prisma.chequera.create({
      data: {
        numero,
        bancoId,
        saldoInicial,
        saldoActual: saldoInicial,
        fechaCreacion: fechaCreacion ? new Date(fechaCreacion) : new Date(),
        activa,
        chequeDesde,
        chequeHasta
      },
      include: {
        banco: {
          select: { id: true, nombre: true, codigo: true }
        }
      }
    });

    console.log(`✅ PRISMA - Chequera creada exitosamente: ${chequera.id}`);

    res.status(201).json({
      success: true,
      data: chequera,
      message: 'Chequera creada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creando chequera:', error);

    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe una chequera con este número'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const updateChequera = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      numero,
      bancoId,
      saldoInicial,
      fechaCreacion,
      activa,
      chequeDesde,
      chequeHasta
    }: ChequeraInput = req.body;

    const chequera = await prisma.chequera.findUnique({
      where: { id: Number(id) }
    });

    if (!chequera) {
      res.status(404).json({
        success: false,
        error: 'Chequera no encontrada'
      });
      return;
    }

    // Validate that banco exists
    const banco = await prisma.banco.findUnique({
      where: { id: bancoId }
    });

    if (!banco) {
      res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
      return;
    }

    // Validate cheque range
    if (chequeHasta <= chequeDesde) {
      res.status(400).json({
        success: false,
        error: 'El número de cheque final debe ser mayor al inicial'
      });
      return;
    }

    // Calculate new saldoActual if saldoInicial changed
    let newSaldoActual: number = Number(chequera.saldoActual);
    if (Number(saldoInicial) !== Number(chequera.saldoInicial)) {
      const difference = Number(saldoInicial) - Number(chequera.saldoInicial);
      newSaldoActual = Number(chequera.saldoActual) + difference;
    }

    const updatedChequera = await prisma.chequera.update({
      where: { id: Number(id) },
      data: {
        numero,
        bancoId,
        saldoInicial,
        saldoActual: newSaldoActual,
        fechaCreacion: fechaCreacion ? new Date(fechaCreacion) : chequera.fechaCreacion,
        activa,
        chequeDesde,
        chequeHasta
      },
      include: {
        banco: {
          select: { id: true, nombre: true, codigo: true }
        }
      }
    });

    console.log(`✅ PRISMA - Chequera actualizada exitosamente: ${id}`);

    res.json({
      success: true,
      data: updatedChequera,
      message: 'Chequera actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando chequera:', error);

    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe una chequera con este número'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const deleteChequera = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chequera = await prisma.chequera.findUnique({
      where: { id: Number(id) },
      include: {
        banco: { select: { nombre: true } },
        _count: {
          select: { cheques: true }
        }
      }
    });

    if (!chequera) {
      res.status(404).json({
        success: false,
        error: 'Chequera no encontrada'
      });
      return;
    }

    if (chequera._count.cheques > 0) {
      res.status(400).json({
        success: false,
        error: `No se puede eliminar la chequera "${chequera.numero}" del banco "${chequera.banco?.nombre}" porque tiene ${chequera._count.cheques} cheque(s) registrado(s). Elimine primero todos los cheques asociados.`
      });
      return;
    }

    await prisma.chequera.delete({
      where: { id: Number(id) }
    });

    console.log(`✅ PRISMA - Chequera eliminada exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Chequera eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando chequera:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};