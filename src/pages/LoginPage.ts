import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly correo: Locator;
  readonly contrasena: Locator;
  readonly iniciarSesion: Locator;

  constructor(page: Page) {
    super(page);
    this.correo = page.getByLabel('Correo electrónico', { exact: true });
    this.contrasena = page.getByLabel('Contraseña', { exact: true });
    this.iniciarSesion = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
  }

  async abrir(baseUrl: string): Promise<void> {
    await this.page.goto(`${baseUrl}/login.html`);
  }

  async ingresar(correo: string, contrasena: string): Promise<void> {
    await this.correo.fill(correo);
    await this.contrasena.fill(contrasena);
    await this.iniciarSesion.click();
    await this.page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor({ state: 'visible' });
  }
}
