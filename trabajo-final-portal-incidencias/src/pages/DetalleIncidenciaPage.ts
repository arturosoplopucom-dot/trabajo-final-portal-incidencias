import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class DetalleIncidenciaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async obtenerCodigo(): Promise<string> {
    const dialogo = this.page.getByRole('dialog', { name: 'Incidencia registrada', exact: true });
    await dialogo.waitFor({ state: 'visible' });
    const contenido = await dialogo.textContent();
    const codigo = contenido?.match(/INC-\d{4}-\d{4}/)?.[0];
    if (!codigo) throw new Error('No se encontró el código generado en la confirmación.');
    return codigo;
  }

  async irAlListado(): Promise<void> {
    const dialogo = this.page.getByRole('dialog', { name: 'Incidencia registrada', exact: true });
    await dialogo.getByRole('button', { name: 'Ir al listado', exact: true }).click();
    await this.page.getByRole('heading', { name: 'Mis incidencias', exact: true }).waitFor({ state: 'visible' });
  }
}
