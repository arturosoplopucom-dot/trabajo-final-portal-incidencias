import { Browser, chromium, firefox, webkit } from 'playwright';
import { EnvironmentConfig } from '../config/EnvironmentConfig';

export class BrowserFactory {
  private static browser?: Browser;

  static async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    const config = EnvironmentConfig.load();
    const browserType = config.browser === 'firefox' ? firefox : config.browser === 'webkit' ? webkit : chromium;
    this.browser = await browserType.launch({ headless: config.headless, slowMo: config.slowMo });
    return this.browser;
  }

  static async close(): Promise<void> {
    if (this.browser) await this.browser.close();
    this.browser = undefined;
  }
}
