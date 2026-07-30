import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class MisIncidenciasPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async abrirIncidencia(codigo: string): Promise<void> {
    const fila = this.page.getByRole('row').filter({ hasText: codigo });
    if (await fila.count() !== 1) {
      throw new Error(`No se encontró una única fila para la incidencia ${codigo}.`);
    }
    await fila.getByRole('link', { name: 'Ver detalle', exact: true }).click();
  }
}
