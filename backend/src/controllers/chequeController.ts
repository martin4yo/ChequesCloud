import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { ApiResponse, AuthRequest, PaginationQuery, ChequeFilters } from '../types';
import ExcelJS from 'exceljs';
import moment from 'moment';

// Get all cheques with filters
export const getCheques = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      chequeraId,
      bancoId,
      estado,
      fechaDesde,
      fechaHasta,
      sortBy = 'fechaVencimiento',
      sortOrder = 'ASC'
    } = req.query as PaginationQuery & ChequeFilters;

    console.log('🔧 PRISMA DEBUG - Filtros de fecha:');
    console.log('📅 fechaDesde original:', fechaDesde, typeof fechaDesde);
    console.log('📅 fechaHasta original:', fechaHasta, typeof fechaHasta);

    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

    // Text search
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { beneficiario: { contains: search, mode: 'insensitive' } },
        { concepto: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Chequera filter
    if (chequeraId) {
      where.chequeraId = Number(chequeraId);
    }

    // Banco filter (through chequera relation)
    if (bancoId) {
      where.chequera = {
        bancoId: Number(bancoId)
      };
    }

    // Estado filter
    if (estado) {
      where.estado = estado;
    }

    // Date filters - Using simple date strings
    if (fechaDesde && fechaHasta) {
      if (fechaDesde === fechaHasta) {
        // Para fechas iguales, usar comparación exacta
        console.log('🎯 PRISMA - Filtro fecha exacta:', fechaDesde);
        where.fechaVencimiento = new Date(fechaDesde);
      } else {
        // Para rango de fechas
        console.log('📊 PRISMA - Filtro rango:', fechaDesde, 'hasta', fechaHasta);
        where.fechaVencimiento = {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta)
        };
      }
    } else if (fechaDesde) {
      where.fechaVencimiento = {
        gte: new Date(fechaDesde)
      };
    } else if (fechaHasta) {
      where.fechaVencimiento = {
        lte: new Date(fechaHasta)
      };
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder.toLowerCase();

    // Execute queries in parallel
    const [cheques, totalCount] = await Promise.all([
      prisma.cheque.findMany({
        where,
        include: {
          chequera: {
            include: {
              banco: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: Number(limit)
      }),
      prisma.cheque.count({ where })
    ]);

    // Calculate totals for all filtered cheques
    console.log('📊 Calculando totales para todos los cheques filtrados...');

    const totalesData = await prisma.cheque.groupBy({
      by: ['estado'],
      where,
      _sum: {
        monto: true
      }
    });

    const totales = {
      total: 0,
      pendiente: 0,
      cobrado: 0,
      anulado: 0
    };

    totalesData.forEach((item) => {
      const monto = Number(item._sum.monto) || 0;
      totales.total += monto;

      if (item.estado === 'PENDIENTE') {
        totales.pendiente += monto;
      } else if (item.estado === 'COBRADO') {
        totales.cobrado += monto;
      } else if (item.estado === 'ANULADO') {
        totales.anulado += monto;
      }
    });

    console.log('💰 Totales calculados:', totales);

    const response: ApiResponse = {
      success: true,
      data: {
        cheques,
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totales
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error obteniendo cheques:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Get cheque by ID
export const getChequeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cheque = await prisma.cheque.findUnique({
      where: { id: Number(id) },
      include: {
        chequera: {
          include: {
            banco: true
          }
        }
      }
    });

    if (!cheque) {
      res.status(404).json({
        success: false,
        error: 'Cheque no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: cheque
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo cheque:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Create cheque
export const createCheque = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero, chequeraId, fechaEmision, fechaVencimiento, beneficiario, concepto, monto, estado } = req.body;

    console.log('🆕 PRISMA - Creando cheque con fechas:', {
      fechaEmision,
      fechaVencimiento
    });

    // Validar que la fecha de vencimiento sea mayor a la fecha de emisión
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (fechaVencimientoDate <= fechaEmisionDate) {
      res.status(400).json({
        success: false,
        error: 'La fecha de vencimiento debe ser mayor a la fecha de emisión'
      });
      return;
    }

    const cheque = await prisma.cheque.create({
      data: {
        numero,
        chequeraId: Number(chequeraId),
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: new Date(fechaVencimiento),
        beneficiario,
        concepto,
        monto: Number(monto),
        estado: estado || 'PENDIENTE'
      },
      include: {
        chequera: {
          include: {
            banco: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: cheque
    });
  } catch (error: any) {
    console.error('❌ Error creando cheque:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Update cheque
export const updateCheque = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { numero, chequeraId, fechaEmision, fechaVencimiento, beneficiario, concepto, monto, estado } = req.body;

    console.log('🔄 PRISMA - Actualizando cheque con fechas:', {
      fechaEmision,
      fechaVencimiento
    });

    // Validar que la fecha de vencimiento sea mayor a la fecha de emisión
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (fechaVencimientoDate <= fechaEmisionDate) {
      res.status(400).json({
        success: false,
        error: 'La fecha de vencimiento debe ser mayor a la fecha de emisión'
      });
      return;
    }

    const cheque = await prisma.cheque.update({
      where: { id: Number(id) },
      data: {
        numero,
        chequeraId: Number(chequeraId),
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: new Date(fechaVencimiento),
        beneficiario,
        concepto,
        monto: Number(monto),
        estado
      },
      include: {
        chequera: {
          include: {
            banco: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: cheque
    });
  } catch (error: any) {
    console.error('❌ Error actualizando cheque:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Delete cheque
export const deleteCheque = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.cheque.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Cheque eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando cheque:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Mark cheque as paid
export const marcarComoCobrado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`🔄 PRISMA - Marcando cheque ${id} como cobrado...`);

    // Get cheque first to validate dates
    const cheque = await prisma.cheque.findUnique({
      where: { id: Number(id) }
    });

    if (!cheque) {
      res.status(404).json({
        success: false,
        error: 'Cheque no encontrado'
      });
      return;
    }

    // Validate that due date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(cheque.fechaVencimiento);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate >= today) {
      res.status(400).json({
        success: false,
        error: 'No se puede cobrar un cheque que aún no ha vencido'
      });
      return;
    }

    const updatedCheque = await prisma.cheque.update({
      where: { id: Number(id) },
      data: {
        estado: 'COBRADO',
        fechaCobro: new Date()
      },
      include: {
        chequera: {
          include: {
            banco: true
          }
        }
      }
    });

    console.log(`✅ PRISMA - Cheque ${id} marcado como cobrado exitosamente`);

    res.json({
      success: true,
      data: updatedCheque
    });
  } catch (error: any) {
    console.error('❌ Error marcando cheque como cobrado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};