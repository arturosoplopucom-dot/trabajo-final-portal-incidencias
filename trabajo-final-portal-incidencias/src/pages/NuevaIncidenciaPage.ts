import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { DatosIncidencia } from '../models/DatosIncidencia';

export class NuevaIncidenciaPage extends BasePage {
  readonly celular: Locator;
  readonly horario: Locator;
  readonly whatsapp: Locator;
  readonly categoria: Locator;
  readonly subcategoria: Locator;
  readonly titulo: Locator;
  readonly equipo: Locator;
  readonly fecha: Locator;
  readonly hora: Locator;
  readonly activo: Locator;
  readonly usuariosAfectados: Locator;
  readonly impacto: Locator;
  readonly urgencia: Locator;
  readonly descripcion: Locator;
  readonly evidencias: Locator;
  readonly revisar: Locator;
  readonly registrar: Locator;

  constructor(page: Page) {
    super(page);
    this.celular = page.getByLabel('Celular', { exact: true });
    this.horario = page.getByLabel('Horario disponible', { exact: true });
    this.whatsapp = page.getByLabel('Autorizo contacto por WhatsApp', { exact: true });
    this.categoria = page.getByLabel('Categoría', { exact: true });
    this.subcategoria = page.getByLabel('Subcategoría', { exact: true });
    this.titulo = page.getByLabel('Título', { exact: true });
    this.equipo = page.getByLabel('Equipo afectado', { exact: true });
    this.fecha = page.getByLabel('Fecha del problema', { exact: true });
    this.hora = page.getByLabel('Hora del problema', { exact: true });
    this.activo = page.getByLabel('Número de activo', { exact: true });
    this.usuariosAfectados = page.getByLabel('Usuarios afectados', { exact: true });
    this.impacto = page.getByLabel('Impacto', { exact: true });
    this.urgencia = page.getByLabel('Urgencia', { exact: true });
    this.descripcion = page.getByLabel('Descripción', { exact: true });
    this.evidencias = page.locator('#evidencias');
    this.revisar = page.getByRole('button', { name: 'Revisar datos', exact: true });
    this.registrar = page.getByRole('button', { name: 'Registrar incidencia', exact: true });
  }

  async completar(datos: DatosIncidencia): Promise<void> {
    await this.celular.fill(datos.celular);
    await this.horario.fill(datos.horarioDisponible);
    await this.whatsapp.setChecked(datos.autorizaWhatsApp);
    await this.categoria.selectOption({ label: datos.categoria });
    await this.subcategoria.selectOption({ label: datos.subcategoria });
    await this.titulo.fill(datos.titulo);
    await this.equipo.fill(datos.equipoAfectado);
    await this.fecha.fill(datos.fechaProblema);
    await this.hora.fill(datos.horaProblema);
    await this.activo.fill(datos.numeroActivo);
    await this.usuariosAfectados.fill(datos.usuariosAfectados.toString());
    await this.impacto.selectOption({ label: datos.impacto });
    await this.urgencia.selectOption({ label: datos.urgencia });
    await this.descripcion.fill(datos.descripcion);
  }

  async revisarDatos(): Promise<void> {
    await this.revisar.click();
    await this.page.getByText('Resumen actualizado.', { exact: true }).waitFor({ state: 'visible' });
    if (!(await this.registrar.isEnabled())) {
      throw new Error('El botón Registrar incidencia no quedó habilitado después de revisar.');
    }
  }

  async registrarIncidencia(): Promise<void> {
    await this.registrar.click();
    const confirmacion = this.page.getByRole('dialog', { name: '¿Deseas registrar esta incidencia?', exact: true });
    await confirmacion.waitFor({ state: 'visible' });
    await confirmacion.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await this.page.getByRole('dialog', { name: 'Incidencia registrada', exact: true }).waitFor({ state: 'visible' });
  }
}
