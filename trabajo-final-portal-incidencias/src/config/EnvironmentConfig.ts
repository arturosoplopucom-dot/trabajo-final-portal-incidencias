import fs from 'node:fs';
import path from 'node:path';
import { ArchivoUtil } from '../utils/ArchivoUtil';

export type BrowserName = 'chromium' | 'firefox' | 'webkit';
export type EnvironmentName = 'local' | 'jenkins';

export interface EnvironmentSettings {
  name: EnvironmentName;
  baseUrl: string;
  browser: BrowserName;
  headless: boolean;
  slowMo: number;
  viewport: { width: number; height: number };
  recordVideo: boolean;
  screenshotsByStep: boolean;
  trace: boolean;
  timeoutMs: number;
}

interface ActiveEnvironmentFile {
  environment: EnvironmentName;
}

export class EnvironmentConfig {
  private static cached?: EnvironmentSettings;

  static activeConfigPath(): string {
    return path.resolve(process.cwd(), 'config', 'active-environment.json');
  }

  static runtimeConfigPath(): string {
    return path.resolve(process.cwd(), '.runtime', 'current-environment.json');
  }

  static selectForExecution(environment: EnvironmentName): void {
    this.validateEnvironmentName(environment);
    ArchivoUtil.writeJson(this.runtimeConfigPath(), { environment });
    this.cached = undefined;
  }

  static getSelectedEnvironment(): EnvironmentName {
    const runtimePath = this.runtimeConfigPath();
    const selectionPath = fs.existsSync(runtimePath) ? runtimePath : this.activeConfigPath();

    if (!fs.existsSync(selectionPath)) {
      throw new Error(`No existe el archivo de selección de ambiente: ${selectionPath}`);
    }

    const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8')) as ActiveEnvironmentFile;
    this.validateEnvironmentName(selection.environment);
    return selection.environment;
  }

  static load(): EnvironmentSettings {
    if (this.cached) return this.cached;

    const environment = this.getSelectedEnvironment();
    const configPath = path.resolve(process.cwd(), 'config', 'environments', `${environment}.json`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`No existe la configuración del ambiente: ${configPath}`);
    }

    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Omit<EnvironmentSettings, 'name'>;
    this.validateSettings(parsed, configPath);

    this.cached = {
      ...parsed,
      name: environment,
      baseUrl: parsed.baseUrl.trim().replace(/\/$/, '')
    };
    return this.cached;
  }

  static reset(): void {
    this.cached = undefined;
  }

  private static validateEnvironmentName(environment: string): asserts environment is EnvironmentName {
    if (!['local', 'jenkins'].includes(environment)) {
      throw new Error(`Ambiente no permitido: ${environment}. Valores válidos: local, jenkins.`);
    }
  }

  private static validateSettings(
    settings: Omit<EnvironmentSettings, 'name'>,
    configPath: string
  ): void {
    if (!settings.baseUrl || !/^https?:\/\//i.test(settings.baseUrl.trim())) {
      throw new Error(`La propiedad baseUrl es inválida en ${configPath}.`);
    }
    if (!['chromium', 'firefox', 'webkit'].includes(settings.browser)) {
      throw new Error(`La propiedad browser es inválida en ${configPath}: ${settings.browser}`);
    }
    if (!settings.viewport || settings.viewport.width <= 0 || settings.viewport.height <= 0) {
      throw new Error(`La propiedad viewport es inválida en ${configPath}.`);
    }
    if (!Number.isFinite(settings.timeoutMs) || settings.timeoutMs <= 0) {
      throw new Error(`La propiedad timeoutMs es inválida en ${configPath}.`);
    }
  }
}
