import { Page } from 'playwright';
import { DatosIncidencia } from '../models/DatosIncidencia';
import { NuevaIncidenciaPage } from '../pages/NuevaIncidenciaPage';
import { LayoutPage } from '../pages/LayoutPage';

export class RegistroIncidenciaFlow {
  private readonly nuevaIncidencia: NuevaIncidenciaPage;
  private readonly layout: LayoutPage;

  constructor(page: Page) {
    this.nuevaIncidencia = new NuevaIncidenciaPage(page);
    this.layout = new LayoutPage(page);
  }

  async abrirNuevaIncidencia(): Promise<void> {
    await this.layout.abrirNuevaIncidencia();
  }

  async completar(datos: DatosIncidencia): Promise<void> {
    await this.nuevaIncidencia.completar(datos);
  }

  async revisar(): Promise<void> {
    await this.nuevaIncidencia.revisarDatos();
  }

  async registrar(): Promise<void> {
    await this.nuevaIncidencia.registrarIncidencia();
  }
}
