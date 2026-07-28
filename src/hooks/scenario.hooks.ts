import path from 'node:path';
import {
  After,
  AfterStep,
  Before,
  BeforeStep,
  ITestCaseHookParameter,
  ITestStepHookParameter,
  Status
} from '@cucumber/cucumber';
import { EnvironmentConfig } from '../config/EnvironmentConfig';
import { ExcelReader } from '../data/readers/ExcelReader';
import { TagDataSourceResolver } from '../data/resolvers/TagDataSourceResolver';
import { ExcelRowValidator } from '../data/validators/ExcelRowValidator';
import { TestDataContext } from '../data/contexts/TestDataContext';
import { BrowserFactory } from '../support/BrowserFactory';
import { ExecutionContextManager } from '../support/ExecutionContextManager';
import { TrabajoFinalWorld } from '../support/TrabajoFinalWorld';
import { IncidenciaDataMapper } from '../data/mappers/IncidenciaDataMapper';
import { TextoUtil } from '../utils/TextoUtil';
import { ArchivoUtil } from '../utils/ArchivoUtil';
import { AllureManager } from '../reporting/AllureManager';
import { AllureAttachmentManager } from '../reporting/AllureAttachmentManager';
import { VideoManager } from '../evidence/VideoManager';

Before(async function (this: TrabajoFinalWorld, scenario: ITestCaseHookParameter) {
  console.log(`[ESCENARIO] Iniciando: ${scenario.pickle.name}`);
  const tags = scenario.pickle.tags.map(tag => tag.name);
  const config = TagDataSourceResolver.resolve(tags);
  if (!config.rowNumber) throw new Error('El escenario generado no contiene el tag técnico @fila:.');

  const row = await new ExcelReader().readRow(config.datasource, config.sheet, config.rowNumber);
  ExcelRowValidator.validate(row, ['IdEjecucion', 'Activo']);
  config.executionId = row.executionId;

  this.dataSource = config;
  this.executionId = row.executionId;
  this.rawData = row.data;
  this.data = new TestDataContext(row.data);
  this.datosIncidencia = IncidenciaDataMapper.from(this.data);
  this.scenarioName = scenario.pickle.name.replace(/\s*\[[^\]]+\]\s*$/, '');
  this.paths = ExecutionContextManager.createScenarioPaths(this.scenarioName, config.sheet, this.executionId);

  const environment = EnvironmentConfig.load();
  const browser = await BrowserFactory.getBrowser();
  this.context = await browser.newContext({
    acceptDownloads: true,
    viewport: environment.viewport,
    locale: 'es-PE',
    recordVideo: environment.recordVideo
      ? { dir: this.paths.tempVideo, size: environment.viewport }
      : undefined
  });
  if (environment.trace) await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(environment.timeoutMs);
  this.video = this.page.video();
  this.initializeServices();

  const sanitized = TextoUtil.maskSecrets(this.rawData);
  ArchivoUtil.writeJson(path.join(this.paths.data, 'fila-excel.json'), {
    datasource: config.datasource,
    hoja: config.sheet,
    numeroFila: config.rowNumber,
    idEjecucion: row.executionId,
    datos: sanitized
  });

  await AllureManager.register(config, row.executionId, sanitized);
  await AllureAttachmentManager.json('Datos de entrada (secretos ocultos)', sanitized);
  this.logger.info('INICIO', `Escenario: ${this.scenarioName} | Hoja: ${config.sheet} | Fila: ${config.rowNumber} | Id: ${row.executionId}`);
});

BeforeStep(async function (this: TrabajoFinalWorld, step: ITestStepHookParameter) {
  this.stepCounter += 1;
  this.logger.info('PASO', `${this.stepCounter}. ${step.pickleStep?.text ?? 'Paso'}`);
});

AfterStep(async function (this: TrabajoFinalWorld, step: ITestStepHookParameter) {
  const environment = EnvironmentConfig.load();
  if (!environment.screenshotsByStep || !this.page || this.page.isClosed()) return;
  const stepText = step.pickleStep?.text ?? `paso-${this.stepCounter}`;
  const screenshot = await this.screenshots.step(this.stepCounter, stepText);
  await AllureAttachmentManager.path(`Paso ${this.stepCounter}: ${stepText}`, screenshot, 'image/png', 'png');
});

After(async function (this: TrabajoFinalWorld, scenario: ITestCaseHookParameter) {
  const status = scenario.result?.status ?? 'UNKNOWN';
  this.currentStatus = String(status);
  const failed = status === Status.FAILED || status === Status.AMBIGUOUS || status === Status.UNDEFINED;

  try {
    if (this.page && !this.page.isClosed()) {
      const screenshot = failed
        ? await this.screenshots.failed(this.executionId)
        : await this.screenshots.final(this.executionId);
      await AllureAttachmentManager.path(
        failed ? 'Evidencia de error' : 'Evidencia final',
        screenshot,
        'image/png',
        'png'
      );
    }

    const environment = EnvironmentConfig.load();
    if (environment.trace && this.context) {
      const tracePath = path.join(this.paths.data, 'trace.zip');
      await this.context.tracing.stop({ path: tracePath });
      await AllureAttachmentManager.path('Trace de Playwright', tracePath, 'application/zip', 'zip');
    }
  } catch (error) {
    this.logger.error('EVIDENCIA', error instanceof Error ? error.message : String(error));
  }

  try {
    if (this.context) await this.context.close();
    const videoPath = await VideoManager.save(this.video ?? null, this.paths, this.executionId);
    if (videoPath) await AllureAttachmentManager.path('Video de ejecución', videoPath, 'video/webm', 'webm');
  } catch (error) {
    this.logger.error('VIDEO', error instanceof Error ? error.message : String(error));
  }

  const result = {
    idEjecucion: this.executionId,
    escenario: this.scenarioName,
    resultado: status,
    codigoIncidencia: this.codigoIncidencia ?? null,
    finalizado: new Date().toISOString()
  };
  const resultPath = path.join(this.paths.data, 'resultado.json');
  ArchivoUtil.writeJson(resultPath, result);

  this.logger.info('FIN', `Resultado: ${status}`);
  await AllureAttachmentManager.path('Log de ejecución', this.logger.getPath(), 'text/plain', 'log');
  await AllureAttachmentManager.path('Resultado de ejecución', resultPath, 'application/json', 'json');
});
