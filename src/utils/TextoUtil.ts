export class TextoUtil {
  static slug(value: string, fallback = 'sin-nombre'): string {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return normalized || fallback;
  }

  static safeFileName(value: string, maxLength = 120): string {
    return this.slug(value).slice(0, maxLength);
  }

  static maskSecrets(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = /password|contraseña|clave/i.test(key) ? '********' : value;
    }
    return result;
  }
}
