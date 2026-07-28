import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class LayoutPage extends BasePage {
  readonly nuevaIncidencia: Locator;
  readonly misIncidencias: Locator;

  constructor(page: Page) {
    super(page);
    this.nuevaIncidencia = page.getByRole('link', { name: 'Nueva incidencia', exact: true });
    this.misIncidencias = page.getByRole('link', { name: 'Mis incidencias', exact: true });
  }

  async abrirNuevaIncidencia(): Promise<void> {
    await this.nuevaIncidencia.click();
    await this.page.getByRole('heading', { name: 'Nueva incidencia', exact: true }).waitFor({ state: 'visible' });
  }

  async abrirMisIncidencias(): Promise<void> {
    await this.misIncidencias.click();
    await this.page.getByRole('heading', { name: 'Mis incidencias', exact: true }).waitFor({ state: 'visible' });
  }
}
