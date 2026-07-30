import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { ExcelExecutionRow } from '../models/ExcelExecutionRow';

export class ExcelReader {
  async readHeaders(relativeFilePath: string, sheetName: string): Promise<string[]> {
    const sheet = await this.loadSheet(relativeFilePath, sheetName);
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim();
    });
    return headers.filter(header => header !== '');
  }

  async readActiveRows(relativeFilePath: string, sheetName: string): Promise<ExcelExecutionRow[]> {
    const sheet = await this.loadSheet(relativeFilePath, sheetName);
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim();
    });

    const rows: ExcelExecutionRow[] = [];
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const data: Record<string, unknown> = {};
      let hasData = false;
      headers.forEach((header, colNumber) => {
        if (!header) return;
        const raw = row.getCell(colNumber).value;
        const value = this.normalizeCellValue(raw);
        data[header] = value;
        if (value !== '' && value !== null && value !== undefined) hasData = true;
      });
      if (!hasData) continue;

      const activeRaw = String(data.Activo ?? 'SI').trim().toLowerCase();
      const active = !['no', 'false', '0', 'inactivo'].includes(activeRaw);
      if (!active) continue;

      const executionId = String(data.IdEjecucion ?? `FILA_${String(rowNumber).padStart(4, '0')}`).trim();
      rows.push({ rowNumber, executionId, active, data });
    }
    return rows;
  }

  async readRow(relativeFilePath: string, sheetName: string, rowNumber: number): Promise<ExcelExecutionRow> {
    const rows = await this.readActiveRows(relativeFilePath, sheetName);
    const row = rows.find(item => item.rowNumber === rowNumber);
    if (!row) throw new Error(`No se encontró una fila activa en ${sheetName}, fila ${rowNumber}.`);
    return row;
  }

  private async loadSheet(relativeFilePath: string, sheetName: string): Promise<ExcelJS.Worksheet> {
    const absolutePath = path.resolve(process.cwd(), relativeFilePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`No existe el archivo Excel: ${absolutePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(absolutePath);
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`No existe la hoja '${sheetName}' en ${relativeFilePath}`);
    return sheet;
  }

  private normalizeCellValue(value: unknown): unknown {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value;
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if ('result' in record) return record.result ?? '';
      if ('richText' in record && Array.isArray(record.richText)) {
        return record.richText.map(part => String((part as Record<string, unknown>).text ?? '')).join('');
      }
      if ('text' in record) return record.text ?? '';
      if ('hyperlink' in record) return record.hyperlink ?? '';
    }
    return value;
  }
}
