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

// Helper function to create cash flow data
const createCashFlowData = (cheques: any[]) => {
  const cashFlowMap = new Map();
  const bancos = new Set<string>();

  // Process data
  cheques.forEach((cheque) => {
    // NO sumar +1 día - usar fecha real de vencimiento
    const fecha = moment(cheque.fechaVencimiento).format('YYYY-MM-DD');
    const banco = cheque.chequera?.banco?.nombre || 'Sin banco';
    const monto = parseFloat(cheque.monto.toString()) || 0;

    bancos.add(banco);

    if (!cashFlowMap.has(fecha)) {
      cashFlowMap.set(fecha, {});
    }

    // SUMAR todos los cheques del mismo banco y fecha, no reemplazar
    if (!cashFlowMap.get(fecha)[banco]) {
      cashFlowMap.get(fecha)[banco] = 0;
    }
    cashFlowMap.get(fecha)[banco] += monto;
  });

  // Convert to array format
  const cashFlowArray = Array.from(cashFlowMap.entries()).map(([fecha, bancoData]) => {
    const row: any = { Vencimiento: fecha };
    bancos.forEach((banco) => {
      row[banco] = bancoData[banco as string] || 0;
    });
    return row;
  });

  return cashFlowArray;
};

// Export cheques to Excel with Prisma
export const exportChequesToExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📥 GET /api/cheques/export', req.query, '{ body:', req.body, '}');

    const filters = req.query as {
      chequeraId?: string;
      bancoId?: string;
      estado?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      search?: string;
    };

    // Build where clause for Prisma
    const whereClause: any = {};

    if (filters.search) {
      whereClause.OR = [
        { numero: { contains: filters.search, mode: 'insensitive' } },
        { beneficiario: { contains: filters.search, mode: 'insensitive' } },
        { concepto: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.chequeraId) {
      whereClause.chequeraId = parseInt(filters.chequeraId);
    }

    if (filters.estado) {
      whereClause.estado = filters.estado;
    }

    if (filters.fechaDesde && filters.fechaHasta) {
      whereClause.fechaVencimiento = {
        gte: new Date(filters.fechaDesde),
        lte: new Date(filters.fechaHasta)
      };
    } else if (filters.fechaDesde) {
      whereClause.fechaVencimiento = { gte: new Date(filters.fechaDesde) };
    } else if (filters.fechaHasta) {
      whereClause.fechaVencimiento = { lte: new Date(filters.fechaHasta) };
    }

    // Add banco filter through chequera relation
    let includeClause: any = {
      chequera: {
        include: {
          banco: true
        }
      }
    };

    if (filters.bancoId) {
      whereClause.chequera = {
        bancoId: parseInt(filters.bancoId)
      };
    }

    const cheques = await prisma.cheque.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: [
        { fechaVencimiento: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log(`📊 Found ${cheques.length} cheques for export`);

    // Generate cash flow data
    const cashFlow = createCashFlowData(cheques);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // SHEET 1: Detailed cheques list with subtotals by date
    const worksheet = workbook.addWorksheet("Cheques");

    // Define columns
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
    let totalGeneral = 0;

    // Add data with subtotals
    cheques.forEach((cheque) => {
      // Add 1 day to due date to compensate for timezone
      const vencimientoFormateado = moment(cheque.fechaVencimiento).add(1, 'day').format("DD/MM/YYYY");

      // Check if this is the first row
      if (currentVencimiento === null) {
        currentVencimiento = vencimientoFormateado;
      }

      rowNumber += 1;

      // Check for break in due date grouping
      if (currentVencimiento !== vencimientoFormateado) {
        // Add subtotal
        const subtotalRow = worksheet.addRow({
          fechaVencimiento: `Subtotal ${currentVencimiento}`,
          importe: { formula: `SUM(G${startRowVencimiento}:G${rowNumber - 1})` }
        });

        // Style for subtotals
        subtotalRow.font = { bold: true };
        subtotalRow.getCell('G').border = {
          top: { style: 'thin' },
          bottom: { style: 'double' }
        };

        currentVencimiento = vencimientoFormateado;
        rowNumber += 1;
        startRowVencimiento = rowNumber;
      }

      // Add to general total
      totalGeneral += Number(cheque.monto);

      // Add data row
      worksheet.addRow({
        id: cheque.id,
        banco: cheque.chequera?.banco?.nombre || '',
        numero: cheque.numero,
        beneficiario: cheque.beneficiario,
        fechaEmision: moment(cheque.fechaEmision).add(1, 'day').format("DD/MM/YYYY"),
        fechaVencimiento: vencimientoFormateado,
        importe: Number(Number(cheque.monto).toFixed(2)),
        estado: cheque.estado
      });
    });

    // Add last subtotal if there's data
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

    // Configure format for first sheet
    worksheet.getRow(1).font = { bold: true };

    // Apply currency format to amount column
    worksheet.getColumn('G').numFmt = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';

    const lastRow = worksheet.rowCount;

    // General total (use calculated value, not formula)
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
      totalRow.getCell('G').numFmt = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';
    }

    // SHEET 2: Dynamic cash flow table
    const dynamicTable = workbook.addWorksheet('CashFlow');

    if (cashFlow.length > 0) {
      // Get headers dynamically
      const headers = Object.keys(cashFlow[0]);
      const bancoHeaders = headers.filter(h => h !== 'Vencimiento');

      // Define columns including "Total" column
      const allHeaders = [...headers, 'Total'];
      dynamicTable.columns = allHeaders.map(header => ({
        header: header,
        key: header,
        width: header === 'Vencimiento' ? 15 : 20
      }));

      // Add data and calculate row totals (NO sumar +1 día en CashFlow)
      cashFlow.forEach(row => {
        if (row.Vencimiento) {
          row.Vencimiento = moment(row.Vencimiento).format("DD/MM/YYYY");
        }

        // Calculate row total
        let totalFila = 0;
        bancoHeaders.forEach(banco => {
          totalFila += parseFloat(row[banco]) || 0;
        });
        row.Total = totalFila;

        dynamicTable.addRow(row);
      });

      // Add totals row by column
      const totalRowData: any = { Vencimiento: 'TOTAL' };

      // Add sum formulas by column for each bank
      bancoHeaders.forEach((banco, index) => {
        const colLetter = String.fromCharCode(66 + index); // B, C, D, etc.
        const lastDataRow = dynamicTable.rowCount;
        totalRowData[banco] = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
      });

      // General total (sum of entire Total column)
      const totalColLetter = String.fromCharCode(66 + bancoHeaders.length); // Total column
      const lastDataRow = dynamicTable.rowCount;
      totalRowData['Total'] = { formula: `SUM(${totalColLetter}2:${totalColLetter}${lastDataRow})` };

      const totalRow = dynamicTable.addRow(totalRowData);
      totalRow.font = { bold: true };

      // Style headers
      dynamicTable.getRow(1).font = { bold: true };

      // Apply currency format to all bank columns and Total column
      bancoHeaders.forEach((_, index) => {
        const colLetter = String.fromCharCode(66 + index); // B, C, D, etc.
        dynamicTable.getColumn(colLetter).numFmt = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';
      });

      // Format Total column (reuse totalColLetter from above)
      dynamicTable.getColumn(totalColLetter).numFmt = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';

      // Add auto filter
      dynamicTable.autoFilter = {
        from: 'A1',
        to: `${totalColLetter}1`
      };
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cheques_export_${moment().format('YYYY-MM-DD')}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

    console.log('✅ Excel export completed successfully');

  } catch (error) {
    console.error('Error al exportar:', error);
    console.error('❌ Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Error al generar el archivo Excel'
      });
    }
  }
};