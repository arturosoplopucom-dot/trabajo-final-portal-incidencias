import { Page } from 'playwright';

export class RegistroIncidenciaAssertions {
  constructor(private readonly page: Page) {}

  async validarConfirmacion(): Promise<void> {
    const dialogo = this.page.getByRole('dialog', { name: 'Incidencia registrada', exact: true });
    await dialogo.waitFor({ state: 'visible' });
    const contenido = await dialogo.textContent();
    if (!contenido?.includes('El código generado es')) {
      throw new Error('El diálogo no muestra la confirmación ni el código generado.');
    }
  }

  validarFormatoCodigo(codigo: string): void {
    if (!/^INC-\d{4}-\d{4}$/.test(codigo)) {
      throw new Error(`Formato de código inválido: ${codigo}`);
    }
  }

  async validarEnListado(codigo: string, titulo: string, estado: string): Promise<void> {
    const fila = this.page.getByRole('row').filter({ hasText: codigo });
    const cantidad = await fila.count();
    if (cantidad !== 1) throw new Error(`Se esperó una fila para ${codigo}, pero se encontraron ${cantidad}.`);
    const contenido = await fila.innerText();
    if (!contenido.includes(titulo)) {
      throw new Error(`La incidencia ${codigo} no muestra el título esperado: ${titulo}.`);
    }
    if (!contenido.includes(estado)) {
      throw new Error(`La incidencia ${codigo} no muestra el estado esperado: ${estado}.`);
    }
  }
}
