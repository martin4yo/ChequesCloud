import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, ChequeInput, PaginationQuery } from '../types';
import { Cheque, Chequera, Banco, sequelize } from '../models';
import { Op, QueryTypes } from 'sequelize';
import { exportToExcel } from '../utils/excel';
import ExcelJS from 'exceljs';
import moment from 'moment';

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

  // Get updated cheque with all details
  const updatedCheque = await Cheque.findByPk(id, {
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
    data: updatedCheque,
    message: 'Cheque marcado como cobrado'
  };

  res.json(response);
});

// Función auxiliar para obtener CashFlow agrupado por fecha y banco
const obtenerCashFlow = async (filters: any) => {
  const { chequeraId, bancoId, estado, fechaDesde, fechaHasta, search } = filters;
  
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

  // Aplicar filtros
  if (search) {
    whereClause[Op.or] = [
      { numero: { [Op.like]: `%${search}%` } },
      { beneficiario: { [Op.like]: `%${search}%` } },
      { concepto: { [Op.like]: `%${search}%` } }
    ];
  }

  if (chequeraId) whereClause.chequeraId = chequeraId;
  if (bancoId) includeClause.where = { bancoId };
  if (estado) whereClause.estado = estado;

  if (fechaDesde && fechaHasta) {
    whereClause.fechaVencimiento = { [Op.between]: [fechaDesde, fechaHasta] };
  } else if (fechaDesde) {
    whereClause.fechaVencimiento = { [Op.gte]: fechaDesde };
  } else if (fechaHasta) {
    whereClause.fechaVencimiento = { [Op.lte]: fechaHasta };
  }

  // Obtener cheques agrupados usando raw query para mayor control
  const cheques = await sequelize.query(`
    SELECT 
      c.fechaVencimiento,
      b.nombre as bancoNombre,
      SUM(c.monto) as totalMonto
    FROM cheques c
    INNER JOIN chequeras ch ON c.chequeraId = ch.id
    INNER JOIN bancos b ON ch.bancoId = b.id
    ${Object.keys(whereClause).length > 0 ? 'WHERE 1=1' : ''}
    ${filters.search ? `AND (c.numero LIKE '%${filters.search}%' OR c.beneficiario LIKE '%${filters.search}%' OR c.concepto LIKE '%${filters.search}%')` : ''}
    ${filters.chequeraId ? `AND c.chequeraId = ${filters.chequeraId}` : ''}
    ${filters.bancoId ? `AND ch.bancoId = ${filters.bancoId}` : ''}
    ${filters.estado ? `AND c.estado = '${filters.estado}'` : ''}
    ${filters.fechaDesde && filters.fechaHasta ? `AND c.fechaVencimiento BETWEEN '${filters.fechaDesde}' AND '${filters.fechaHasta}'` : ''}
    ${filters.fechaDesde && !filters.fechaHasta ? `AND c.fechaVencimiento >= '${filters.fechaDesde}'` : ''}
    ${!filters.fechaDesde && filters.fechaHasta ? `AND c.fechaVencimiento <= '${filters.fechaHasta}'` : ''}
    GROUP BY c.fechaVencimiento, b.nombre
    ORDER BY c.fechaVencimiento ASC
  `, { type: QueryTypes.SELECT });

  // Transformar datos para tabla dinámica
  const cashFlowMap = new Map();
  const bancos = new Set();

  cheques.forEach((cheque: any) => {
    const fecha = cheque.fechaVencimiento;
    const banco = cheque.bancoNombre || 'Sin banco';
    const monto = parseFloat(cheque.totalMonto) || 0;

    bancos.add(banco);

    if (!cashFlowMap.has(fecha)) {
      cashFlowMap.set(fecha, { Vencimiento: fecha });
    }

    cashFlowMap.get(fecha)[banco] = monto;
  });

  // Convertir a array y llenar celdas vacías
  const cashFlowArray = Array.from(cashFlowMap.values()).map(row => {
    bancos.forEach(banco => {
      if (!row[banco as string]) {
        row[banco as string] = 0;
      }
    });
    return row;
  });

  return cashFlowArray;
};

export const exportChequesToExcel = asyncHandler(async (req: Request, res: Response) => {
  try {
    const filters = req.query as {
      chequeraId?: string;
      bancoId?: string;
      estado?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      search?: string;
    };

    // Obtener datos de cheques
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

    // Aplicar filtros
    if (filters.search) {
      whereClause[Op.or] = [
        { numero: { [Op.like]: `%${filters.search}%` } },
        { beneficiario: { [Op.like]: `%${filters.search}%` } },
        { concepto: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    if (filters.chequeraId) whereClause.chequeraId = filters.chequeraId;
    if (filters.bancoId) includeClause.where = { bancoId: filters.bancoId };
    if (filters.estado) whereClause.estado = filters.estado;

    if (filters.fechaDesde && filters.fechaHasta) {
      whereClause.fechaVencimiento = {
        [Op.between]: [filters.fechaDesde, filters.fechaHasta]
      };
    } else if (filters.fechaDesde) {
      whereClause.fechaVencimiento = { [Op.gte]: filters.fechaDesde };
    } else if (filters.fechaHasta) {
      whereClause.fechaVencimiento = { [Op.lte]: filters.fechaHasta };
    }

    const cheques = await Cheque.findAll({
      where: whereClause,
      include: [includeClause],
      order: [['fechaVencimiento', 'ASC'], ['id', 'ASC']]
    });

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    
    // HOJA 1: Lista de cheques con subtotales por fecha
    const worksheet = workbook.addWorksheet("Cheques");

    // Definir columnas
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Banco", key: "banco", width: 25 },
      { header: "Número", key: "numero", width: 15 },
      { header: "Beneficiario", key: "beneficiario", width: 30 },
      { header: "Fecha Emisión", key: "fechaEmision", width: 15 },
      { header: "Fecha Vencimiento", key: "fechaVencimiento", width: 15 },
      { header: "Importe", key: "importe", width: 15 },
      { header: "Estado", key: "estado", width: 12 }
    ];

    let currentVencimiento: string | null = null;
    let startRowVencimiento = 2;
    let rowNumber = 1;
    let totalGeneral = 0; // Variable para acumular el total

    // Agregar datos con subtotales
    cheques.forEach((cheque) => {
      // Sumar 1 día a fecha de vencimiento para compensar zona horaria
      const vencimientoFormateado = moment(cheque.fechaVencimiento).add(1, 'day').format("DD/MM/YYYY");
      
      // Validar si es la primera fila
      if (currentVencimiento === null) {
        currentVencimiento = vencimientoFormateado;
      }

      rowNumber += 1;

      // Validar corte de control por fecha de vencimiento
      if (currentVencimiento !== vencimientoFormateado) {
        // Agregar subtotal
        const subtotalRow = worksheet.addRow({
          fechaVencimiento: `Subtotal ${currentVencimiento}`,
          importe: { formula: `SUM(G${startRowVencimiento}:G${rowNumber - 1})` }
        });

        // Estilo para subtotales
        subtotalRow.font = { bold: true };
        subtotalRow.getCell('G').border = {
          top: { style: 'thin' },
          bottom: { style: 'double' }
        };

        currentVencimiento = vencimientoFormateado;
        rowNumber += 1;
        startRowVencimiento = rowNumber;
      }

      // Sumar al total general
      totalGeneral += Number(cheque.monto);

      // Agregar fila de datos
      worksheet.addRow({
        id: cheque.id,
        banco: cheque.chequera?.banco?.nombre || '',
        numero: cheque.numero,
        beneficiario: cheque.beneficiario,
        fechaEmision: moment(cheque.fechaEmision).add(1, 'day').format("DD/MM/YYYY"), // +1 día también a fecha emisión
        fechaVencimiento: vencimientoFormateado,
        importe: Number(cheque.monto.toFixed(2)),
        estado: cheque.estado
      });
    });

    // Agregar último subtotal si hay datos
    if (cheques.length > 0 && currentVencimiento) {
      const subtotalRow = worksheet.addRow({
        fechaVencimiento: `Subtotal ${currentVencimiento}`,
        importe: { formula: `SUM(G${startRowVencimiento}:G${rowNumber})` }
      });
      subtotalRow.font = { bold: true };
      subtotalRow.getCell('G').border = {
        top: { style: 'thin' },
        bottom: { style: 'double' }
      };
    }

    // Configurar formato de la primera hoja
    worksheet.getRow(1).font = { bold: true };
    const lastRow = worksheet.rowCount;

    // Total general (usar valor calculado, no fórmula)
    if (lastRow > 1) {
      const totalRow = worksheet.addRow({
        fechaVencimiento: "TOTAL GENERAL:",
        importe: Number(totalGeneral.toFixed(2))
      });
      totalRow.font = { bold: true, size: 12 };
      totalRow.getCell('G').border = {
        top: { style: 'double' },
        bottom: { style: 'double' }
      };
    }

    // Formato de columna de importes
    worksheet.getColumn('G').numFmt = '#,##0.00';

    // HOJA 2: CashFlow (Tabla dinámica por fecha y banco)
    const cashFlow = await obtenerCashFlow(filters);
    const dynamicTable = workbook.addWorksheet('CashFlow');

    if (cashFlow.length > 0) {
      // Obtener headers dinámicamente
      const headers = Object.keys(cashFlow[0]);
      const bancoHeaders = headers.filter(h => h !== 'Vencimiento');

      // Definir columnas incluyendo la columna "Total"
      const allHeaders = [...headers, 'Total'];
      dynamicTable.columns = allHeaders.map(header => ({
        header: header,
        key: header,
        width: header === 'Vencimiento' ? 15 : 20
      }));

      // Agregar datos con +1 día a las fechas y calcular totales por fila
      cashFlow.forEach(row => {
        if (row.Vencimiento) {
          row.Vencimiento = moment(row.Vencimiento).add(1, 'day').format("DD/MM/YYYY");
        }
        
        // Calcular total por fila
        let totalFila = 0;
        bancoHeaders.forEach(banco => {
          totalFila += parseFloat(row[banco]) || 0;
        });
        row.Total = totalFila;
        
        dynamicTable.addRow(row);
      });
      // Agregar fila de totales por columna
      const totalRowData: any = { Vencimiento: 'TOTAL' };
      
      // Agregar fórmulas de suma por columna para cada banco
      bancoHeaders.forEach((banco, index) => {
        const colLetter = String.fromCharCode(66 + index); // B, C, D, etc.
        const lastDataRow = dynamicTable.rowCount;
        totalRowData[banco] = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
      });
      
      // Total general (suma de toda la columna Total)
      const totalColLetter = String.fromCharCode(66 + bancoHeaders.length); // Columna Total
      const lastDataRow = dynamicTable.rowCount;
      totalRowData['Total'] = { formula: `SUM(${totalColLetter}2:${totalColLetter}${lastDataRow})` };
      
      const totalRow = dynamicTable.addRow(totalRowData);
      totalRow.font = { bold: true };
      
      // Estilizar headers
      dynamicTable.getRow(1).font = { bold: true };

      // Formato de moneda para columnas de bancos y Total (desde la segunda columna)
      dynamicTable.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar headers

        row.eachCell((cell, colNumber) => {
          if (colNumber > 1) { // Aplicar formato desde la segunda columna (bancos y Total)
            cell.numFmt = '[Black]#,##0.00;[Red]-#,##0.00;;';
          }
        });
      });

      // Agregar filtro (incluyendo la columna Total)
      const headerRange = `A1:${String.fromCharCode(65 + allHeaders.length)}1`;
      dynamicTable.autoFilter = headerRange;
    }

    // Configurar respuesta HTTP
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=cheques_${moment().format('YYYY-MM-DD')}.xlsx`
    );

    // Enviar archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error al exportar:", error);
    throw new AppError("Error al generar el archivo Excel", 500);
  }
});