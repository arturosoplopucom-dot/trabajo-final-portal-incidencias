const FERIADOS_MM_DD = new Set([
  '01-01', '05-01', '06-29', '07-28', '07-29',
  '08-30', '10-08', '11-01', '12-08', '12-25'
]);

export class FechaUtil {
  static iso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static addCalendarDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setHours(12, 0, 0, 0);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return !FERIADOS_MM_DD.has(mmdd);
  }

  static nextBusinessDay(date: Date): Date {
    let result = new Date(date);
    while (!this.isBusinessDay(result)) result = this.addCalendarDays(result, 1);
    return result;
  }

  static futureBusinessDay(daysFromToday: number): Date {
    const base = this.addCalendarDays(new Date(), daysFromToday);
    return this.nextBusinessDay(base);
  }

  static endDateFromBusinessDays(start: Date, businessDays: number): Date {
    if (businessDays <= 0.5) return new Date(start);
    let current = new Date(start);
    let counted = this.isBusinessDay(current) ? 1 : 0;
    while (counted < businessDays) {
      current = this.addCalendarDays(current, 1);
      if (this.isBusinessDay(current)) counted += 1;
    }
    return current;
  }

  static executionDate(): string {
    return this.iso(new Date()).replaceAll('-', '');
  }

  static timestamp(): string {
    return new Date().toISOString();
  }
}
