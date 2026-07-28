import { Locator, Page } from 'playwright';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected async visible(locator: Locator, description: string): Promise<Locator> {
    await locator.waitFor({ state: 'visible' });
    if (!(await locator.isVisible())) throw new Error(`No se encontró visible: ${description}`);
    return locator;
  }
}
