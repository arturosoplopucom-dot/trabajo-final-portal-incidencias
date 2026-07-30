export interface ExcelExecutionRow {
  rowNumber: number;
  executionId: string;
  active: boolean;
  data: Record<string, unknown>;
}
