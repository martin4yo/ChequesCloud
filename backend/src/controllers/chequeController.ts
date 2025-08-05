import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, ChequeInput, PaginationQuery } from '../types';
import { Cheque, Chequera, Banco } from '../models';
import { Op } from 'sequelize';
import { exportToExcel } from '../utils/excel';

export const getCheques = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    chequeraId, 
    bancoId, 
    estado, 
    fechaDesde, 
    fechaHasta,
    sortBy = 'fechaEmision', 
    sortOrder = 'DESC' 
  } = req.query as PaginationQuery & {
    chequeraId?: string;
    bancoId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  };

  const offset = (Number(page) - 1) * Number(limit);
  const whereClause: any = {};
  const includeClause: any = {
    model: Chequera,
    as: 'chequera',
    attributes: ['id', 'numero', 'bancoId'],
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ]
  };

  if (search) {
    whereClause[Op.or] = [
      { numero: { [Op.like]: `%${search}%` } },
      { beneficiario: { [Op.like]: `%${search}%` } },
      { concepto: { [Op.like]: `%${search}%` } }
    ];
  }

  if (chequeraId) {
    whereClause.chequeraId = chequeraId;
  }

  if (bancoId) {
    includeClause.where = { bancoId };
  }

  if (estado) {
    whereClause.estado = estado;
  }

  if (fechaDesde && fechaHasta) {
    whereClause.fechaVencimiento = {
      [Op.between]: [fechaDesde, fechaHasta] // DATEONLY fields work directly with string dates
    };
  } else if (fechaDesde) {
    whereClause.fechaVencimiento = {
      [Op.gte]: fechaDesde
    };
  } else if (fechaHasta) {
    whereClause.fechaVencimiento = {
      [Op.lte]: fechaHasta
    };
  }

  const { count, rows } = await Cheque.findAndCountAll({
    where: whereClause,
    include: [includeClause],
    limit: Number(limit),
    offset,
    order: [[sortBy as string, sortOrder as string]]
  });
 
  const response: ApiResponse = {
    success: true,
    data: {
      cheques: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    }
  };

  res.json(response);
});

export const getChequeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const cheque = await Cheque.findByPk(id, {
    include: [
      {
        model: Chequera,
        as: 'chequera',
        attributes: ['id', 'numero'],
        include: [
          {
            model: Banco,
            as: 'banco',
            attributes: ['id', 'nombre', 'codigo']
          }
        ]
      }
    ]
  });

  if (!cheque) {
    throw new AppError('Cheque no encontrado', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: cheque
  };

  res.json(response);
});

export const createCheque = asyncHandler(async (req: Request, res: Response) => {
  const { numero, chequeraId, fechaEmision, fechaVencimiento, beneficiario, concepto, monto, estado }: ChequeInput = req.body;

  // Verify chequera exists and is active
  const chequera = await Chequera.findByPk(chequeraId);
  if (!chequera) {
    throw new AppError('Chequera no encontrada', 404);
  }

  if (!chequera.activa) {
    throw new AppError('La chequera no está activa', 400);
  }

  // Validate cheque number is within chequera range
  const numeroInt = parseInt(numero);
  if (isNaN(numeroInt) || numeroInt < chequera.chequeDesde || numeroInt > chequera.chequeHasta) {
    throw new AppError(
      `El número de cheque debe estar entre ${chequera.chequeDesde} y ${chequera.chequeHasta}`, 
      400
    );
  }

  // Check if cheque number already exists for this chequera
  const existingCheque = await Cheque.findOne({
    where: { numero, chequeraId }
  });
  
  if (existingCheque) {
    throw new AppError('Ya existe un cheque con este número en la chequera', 400);
  }

  const cheque = await Cheque.create({
    numero,
    chequeraId,
    fechaEmision: fechaEmision, // DATEONLY field - Sequelize handles this automatically
    fechaVencimiento: fechaVencimiento, // DATEONLY field - Sequelize handles this automatically
    beneficiario,
    concepto,
    monto,
    estado: estado || 'PENDIENTE'
  });

  // Update chequera balance if cheque is created as COBRADO
  if (estado === 'COBRADO') {
    await chequera.update({
      saldoActual: chequera.saldoActual - monto
    });
  }

  const chequeWithDetails = await Cheque.findByPk(cheque.id, {
    include: [
      {
        model: Chequera,
        as: 'chequera',
        attributes: ['id', 'numero'],
        include: [
          {
            model: Banco,
            as: 'banco',
            attributes: ['id', 'nombre', 'codigo']
          }
        ]
      }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: chequeWithDetails,
    message: 'Cheque creado exitosamente'
  };

  res.status(201).json(response);
});

export const updateCheque = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { numero, chequeraId, fechaEmision, fechaVencimiento, beneficiario, concepto, monto, estado }: ChequeInput = req.body;

  const cheque = await Cheque.findByPk(id, {
    include: [
      {
        model: Chequera,
        as: 'chequera'
      }
    ]
  });

  if (!cheque) {
    throw new AppError('Cheque no encontrado', 404);
  }

  const oldEstado = cheque.estado;
  const oldMonto = cheque.monto;

  // Verify chequera exists if it's being updated
  let nuevaChequera = cheque.chequera;
  if (chequeraId && chequeraId !== cheque.chequeraId) {
    nuevaChequera = await Chequera.findByPk(chequeraId);
    if (!nuevaChequera) {
      throw new AppError('Chequera no encontrada', 404);
    }
    if (!nuevaChequera.activa) {
      throw new AppError('La chequera no está activa', 400);
    }
  }

  // Validate cheque number range if chequera or number is being updated
  if ((numero && numero !== cheque.numero) || (chequeraId && chequeraId !== cheque.chequeraId)) {
    const numeroInt = parseInt(numero || cheque.numero);
    if (isNaN(numeroInt) || numeroInt < nuevaChequera!.chequeDesde || numeroInt > nuevaChequera!.chequeHasta) {
      throw new AppError(
        `El número de cheque debe estar entre ${nuevaChequera!.chequeDesde} y ${nuevaChequera!.chequeHasta}`, 
        400
      );
    }

    // Check if new cheque number already exists for the chequera (excluding current cheque)
    const existingCheque = await Cheque.findOne({
      where: { 
        numero: numero || cheque.numero, 
        chequeraId: chequeraId || cheque.chequeraId,
        id: { [Op.ne]: id }
      }
    });
    
    if (existingCheque) {
      throw new AppError('Ya existe un cheque con este número en la chequera', 400);
    }
  }

  await cheque.update({
    numero,
    chequeraId,
    fechaEmision: fechaEmision, // DATEONLY field - Sequelize handles this automatically
    fechaVencimiento: fechaVencimiento, // DATEONLY field - Sequelize handles this automatically
    beneficiario,
    concepto,
    monto,
    estado,
    fechaCobro: estado === 'COBRADO' ? new Date() : undefined // This one keeps time as it's when it was paid
  });

  // Update chequera balances based on state changes
  if (oldEstado !== estado) {
    if (oldEstado === 'COBRADO' && estado !== 'COBRADO') {
      // Revert previous deduction
      await cheque.chequera!.update({
        saldoActual: cheque.chequera!.saldoActual + oldMonto
      });
    } else if (oldEstado !== 'COBRADO' && estado === 'COBRADO') {
      // Apply new deduction
      await nuevaChequera!.update({
        saldoActual: nuevaChequera!.saldoActual - monto
      });
    }
  } else if (estado === 'COBRADO' && oldMonto !== monto) {
    // Update amount for COBRADO cheque
    const difference = monto - oldMonto;
    await nuevaChequera!.update({
      saldoActual: nuevaChequera!.saldoActual - difference
    });
  }

  const chequeWithDetails = await Cheque.findByPk(cheque.id, {
    include: [
      {
        model: Chequera,
        as: 'chequera',
        attributes: ['id', 'numero'],
        include: [
          {
            model: Banco,
            as: 'banco',
            attributes: ['id', 'nombre', 'codigo']
          }
        ]
      }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: chequeWithDetails,
    message: 'Cheque actualizado exitosamente'
  };

  res.json(response);
});

export const deleteCheque = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const cheque = await Cheque.findByPk(id, {
    include: [
      {
        model: Chequera,
        as: 'chequera'
      }
    ]
  });

  if (!cheque) {
    throw new AppError('Cheque no encontrado', 404);
  }

  // Revert balance if cheque was COBRADO
  if (cheque.estado === 'COBRADO') {
    await cheque.chequera!.update({
      saldoActual: cheque.chequera!.saldoActual + cheque.monto
    });
  }

  await cheque.destroy();

  const response: ApiResponse = {
    success: true,
    message: 'Cheque eliminado exitosamente'
  };

  res.json(response);
});

export const marcarComoCobrado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const cheque = await Cheque.findByPk(id, {
    include: [
      {
        model: Chequera,
        as: 'chequera'
      }
    ]
  });

  if (!cheque) {
    throw new AppError('Cheque no encontrado', 404);
  }

  if (cheque.estado === 'COBRADO') {
    throw new AppError('El cheque ya está marcado como cobrado', 400);
  }

  await cheque.update({
    estado: 'COBRADO',
    fechaCobro: new Date()
  });

  // Update chequera balance
  await cheque.chequera!.update({
    saldoActual: cheque.chequera!.saldoActual - cheque.monto
  });

  const response: ApiResponse = {
    success: true,
    data: cheque,
    message: 'Cheque marcado como cobrado'
  };

  res.json(response);
});

export const exportChequesToExcel = asyncHandler(async (req: Request, res: Response) => {
  const { 
    chequeraId, 
    bancoId, 
    estado, 
    fechaDesde, 
    fechaHasta,
    search
  } = req.query as {
    chequeraId?: string;
    bancoId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
  };

  const whereClause: any = {};
  const includeClause: any = {
    model: Chequera,
    as: 'chequera',
    attributes: ['id', 'numero', 'bancoId'],
    include: [
      {
        model: Banco,
        as: 'banco',
        attributes: ['id', 'nombre', 'codigo']
      }
    ]
  };

  if (search) {
    whereClause[Op.or] = [
      { numero: { [Op.like]: `%${search}%` } },
      { beneficiario: { [Op.like]: `%${search}%` } },
      { concepto: { [Op.like]: `%${search}%` } }
    ];
  }

  if (chequeraId) {
    whereClause.chequeraId = chequeraId;
  }

  if (bancoId) {
    includeClause.where = { bancoId };
  }

  if (estado) {
    whereClause.estado = estado;
  }

  if (fechaDesde && fechaHasta) {
    whereClause.fechaVencimiento = {
      [Op.between]: [fechaDesde, fechaHasta] // DATEONLY fields work directly with string dates
    };
  } else if (fechaDesde) {
    whereClause.fechaVencimiento = {
      [Op.gte]: fechaDesde
    };
  } else if (fechaHasta) {
    whereClause.fechaVencimiento = {
      [Op.lte]: fechaHasta
    };
  }

  const cheques = await Cheque.findAll({
    where: whereClause,
    include: [includeClause],
    order: [['fechaEmision', 'DESC']]
  });

  const excelData = cheques.map(cheque => ({
    numero: cheque.numero,
    banco: cheque.chequera?.banco?.nombre || '',
    chequera: cheque.chequera?.numero || '',
    fechaEmision: cheque.fechaEmision, // DATEONLY field already in YYYY-MM-DD format
    fechaVencimiento: cheque.fechaVencimiento, // DATEONLY field already in YYYY-MM-DD format
    beneficiario: cheque.beneficiario,
    concepto: cheque.concepto,
    monto: cheque.monto,
    estado: cheque.estado,
    fechaCobro: cheque.fechaCobro ? cheque.fechaCobro.toISOString().split('T')[0] : ''
  }));

  await exportToExcel(res, {
    filename: `cheques_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Cheques',
    data: excelData,
    columns: [
      { key: 'numero', header: 'Número', width: 15 },
      { key: 'banco', header: 'Banco', width: 20 },
      { key: 'chequera', header: 'Chequera', width: 15 },
      { key: 'fechaEmision', header: 'Fecha Emisión', width: 12 },
      { key: 'fechaVencimiento', header: 'Fecha Vencimiento', width: 12 },
      { key: 'beneficiario', header: 'Beneficiario', width: 25 },
      { key: 'concepto', header: 'Concepto', width: 30 },
      { key: 'monto', header: 'Monto', width: 12 },
      { key: 'estado', header: 'Estado', width: 12 },
      { key: 'fechaCobro', header: 'Fecha Cobro', width: 12 }
    ]
  });
});