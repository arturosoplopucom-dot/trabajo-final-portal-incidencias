import path from 'node:path';
import { BrowserContext, Page, Video } from 'playwright';
import { IWorldOptions, World, setDefaultTimeout, setWorldConstructor } from '@cucumber/cucumber';
import { TestDataContext } from '../data/contexts/TestDataContext';
import { DataSourceConfiguration } from '../data/models/DataSourceConfiguration';
import { DatosIncidencia } from '../models/DatosIncidencia';
import { ScenarioExecutionPaths } from './ExecutionContext';
import { Logger } from '../logging/Logger';
import { ScreenshotManager } from '../evidence/ScreenshotManager';
import { DownloadManager } from '../downloads/DownloadManager';

export class TrabajoFinalWorld extends World {
  context!: BrowserContext;
  page!: Page;
  video?: Video | null;
  data!: TestDataContext;
  datosIncidencia!: DatosIncidencia;
  rawData!: Record<string, unknown>;
  dataSource!: DataSourceConfiguration;
  executionId!: string;
  scenarioName!: string;
  paths!: ScenarioExecutionPaths;
  logger!: Logger;
  screenshots!: ScreenshotManager;
  downloads!: DownloadManager;
  stepCounter = 0;
  codigoIncidencia?: string;
  currentStatus = 'UNKNOWN';

  constructor(options: IWorldOptions) {
    super(options);
  }

  initializeServices(): void {
    this.logger = new Logger(path.join(this.paths.logs, `${this.executionId}.log`));
    this.screenshots = new ScreenshotManager(this.page, this.paths);
    this.downloads = new DownloadManager(this.page, this.paths);
  }
}

setWorldConstructor(TrabajoFinalWorld);
setDefaultTimeout(120000);
