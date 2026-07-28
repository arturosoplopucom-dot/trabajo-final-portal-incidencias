export class TestDataContext {
  constructor(private readonly values: Record<string, unknown>) {}

  all(): Record<string, unknown> {
    return { ...this.values };
  }

  has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.values, key);
  }

  getString(key: string, defaultValue = ''): string {
    const value = this.values[key];
    if (value === undefined || value === null) return defaultValue;
    if (value instanceof Date) return value.toISOString();
    return String(value).trim();
  }

  requireString(key: string): string {
    const value = this.getString(key);
    if (!value) throw new Error(`El dato obligatorio '${key}' está vacío.`);
    return value;
  }

  getNumber(key: string, defaultValue = 0): number {
    const raw = this.values[key];
    if (raw === undefined || raw === null || raw === '') return defaultValue;
    const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
    if (Number.isNaN(value)) throw new Error(`El dato '${key}' no es numérico: ${raw}`);
    return value;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const raw = this.values[key];
    if (raw === undefined || raw === null || raw === '') return defaultValue;
    if (typeof raw === 'boolean') return raw;
    return ['si', 'sí', 'true', '1', 'yes', 'x'].includes(String(raw).trim().toLowerCase());
  }
}
