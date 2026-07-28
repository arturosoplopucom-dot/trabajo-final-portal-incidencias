import { ExcelExecutionRow } from '../models/ExcelExecutionRow';

export class ExcelRowValidator {
  static validate(row: ExcelExecutionRow, requiredColumns: string[] = []): void {
    if (!row.executionId) throw new Error(`La fila ${row.rowNumber} no tiene IdEjecucion.`);
    const missing = requiredColumns.filter(column => {
      const value = row.data[column];
      return value === undefined || value === null || String(value).trim() === '';
    });
    if (missing.length) {
      throw new Error(`Fila ${row.rowNumber} (${row.executionId}) incompleta. Faltan: ${missing.join(', ')}`);
    }
  }
}
