import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExcelExportOptions } from '../types';

export const exportToExcel = async (res: Response, options: ExcelExportOptions): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName);

  // Add headers
  const headers = options.columns.map(col => col.header);
  worksheet.addRow(headers);

  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Set column widths
  options.columns.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = col.width || 15;
  });

  // Add data rows
  options.data.forEach(row => {
    const values = options.columns.map(col => row[col.key]);
    worksheet.addRow(values);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
  });

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${options.filename}"`
  );

  // Write to response
  await workbook.xlsx.write(res);
};