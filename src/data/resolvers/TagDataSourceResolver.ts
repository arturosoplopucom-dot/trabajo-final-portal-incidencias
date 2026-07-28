import { DataSourceConfiguration } from '../models/DataSourceConfiguration';

export class TagDataSourceResolver {
  static resolve(tagNames: string[]): DataSourceConfiguration {
    const datasource = this.value(tagNames, '@datasource:');
    const sheet = this.value(tagNames, '@hoja:');
    const rowRaw = this.value(tagNames, '@fila:', false);
    const executionId = this.value(tagNames, '@id:', false);

    if (!datasource) throw new Error('Falta el tag @datasource:ruta/al/archivo.xlsx');
    if (!sheet) throw new Error('Falta el tag @hoja:NombreHoja');

    return {
      datasource,
      sheet,
      rowNumber: rowRaw ? Number(rowRaw) : undefined,
      executionId: executionId || undefined
    };
  }

  private static value(tags: string[], prefix: string, required = true): string {
    const tag = tags.find(name => name.startsWith(prefix));
    if (!tag) {
      if (required) return '';
      return '';
    }
    return tag.slice(prefix.length);
  }
}
