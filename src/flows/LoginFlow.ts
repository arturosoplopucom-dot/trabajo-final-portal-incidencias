import { Page } from 'playwright';
import { LoginPage } from '../pages/LoginPage';

export class LoginFlow {
  private readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
  }

  async iniciarSesion(baseUrl: string, correo: string, contrasena: string): Promise<void> {
    await this.loginPage.abrir(baseUrl);
    await this.loginPage.ingresar(correo, contrasena);
  }
}
