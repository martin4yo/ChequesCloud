import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { ApiResponse, BancoInput, PaginationQuery } from '../types';

export const getBancos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'nombre', sortOrder = 'asc' } = req.query as PaginationQuery;

    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [bancos, total] = await Promise.all([
      prisma.banco.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: Number(limit),
        include: {
          _count: {
            select: { chequeras: true }
          }
        }
      }),
      prisma.banco.count({ where: whereClause })
    ]);

    const response: ApiResponse = {
      success: true,
      data: bancos,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error obteniendo bancos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getBancoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const banco = await prisma.banco.findUnique({
      where: { id: Number(id) },
      include: {
        chequeras: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { chequeras: true }
        }
      }
    });

    if (!banco) {
      res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: banco
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo banco:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const createBanco = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo, nombre, habilitado = true }: BancoInput = req.body;

    const banco = await prisma.banco.create({
      data: {
        codigo,
        nombre,
        habilitado
      }
    });

    console.log(`✅ PRISMA - Banco creado exitosamente: ${banco.id}`);

    res.status(201).json({
      success: true,
      data: banco,
      message: 'Banco creado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creando banco:', error);

    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe un banco con este código'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const updateBanco = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { codigo, nombre, habilitado }: BancoInput = req.body;

    const banco = await prisma.banco.findUnique({
      where: { id: Number(id) }
    });

    if (!banco) {
      res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
      return;
    }

    const updatedBanco = await prisma.banco.update({
      where: { id: Number(id) },
      data: {
        codigo,
        nombre,
        habilitado
      }
    });

    console.log(`✅ PRISMA - Banco actualizado exitosamente: ${id}`);

    res.json({
      success: true,
      data: updatedBanco,
      message: 'Banco actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando banco:', error);

    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe un banco con este código'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const deleteBanco = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const banco = await prisma.banco.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { chequeras: true }
        }
      }
    });

    if (!banco) {
      res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
      return;
    }

    if (banco._count.chequeras > 0) {
      res.status(400).json({
        success: false,
        error: 'No se puede eliminar el banco porque tiene chequeras asociadas'
      });
      return;
    }

    await prisma.banco.delete({
      where: { id: Number(id) }
    });

    console.log(`✅ PRISMA - Banco eliminado exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Banco eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando banco:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getBancosHabilitados = async (req: Request, res: Response): Promise<void> => {
  try {
    const bancos = await prisma.banco.findMany({
      where: { habilitado: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        habilitado: true
      }
    });

    res.json({
      success: true,
      data: bancos
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo bancos habilitados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};