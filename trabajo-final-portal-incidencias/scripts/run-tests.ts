import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { prepareExecution } from './prepare-execution';
import { prepareFeatures } from './prepare-features';
import { cleanResults } from './clean-results';
import { EnvironmentConfig, EnvironmentName } from '../src/config/EnvironmentConfig';
import { PdfEvidenceReportGenerator } from '../src/reporting/PdfEvidenceReportGenerator';

interface ParsedArguments {
  environment?: EnvironmentName;
  cucumberArgs: string[];
}

function parseArguments(args: string[]): ParsedArguments {
  const cucumberArgs: string[] = [];
  let environment: EnvironmentName | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === '--environment') {
      const value = args[index + 1];
      if (!value) throw new Error('Falta el valor de --environment.');
      environment = value as EnvironmentName;
      index += 1;
      continue;
    }

    if (current.startsWith('--environment=')) {
      environment = current.split('=', 2)[1] as EnvironmentName;
      continue;
    }

    cucumberArgs.push(current);
  }

  return { environment, cucumberArgs };
}

function listGeneratedFeatures(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listGeneratedFeatures(fullPath);
      return entry.isFile() && entry.name.endsWith('.feature') ? [fullPath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

async function run(): Promise<void> {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.environment) EnvironmentConfig.selectForExecution(parsed.environment);

  const environment = EnvironmentConfig.load();
  console.log(`[CONFIG] Ambiente: ${environment.name}`);
  console.log(`[CONFIG] URL base: ${environment.baseUrl}`);
  console.log(`[CONFIG] Navegador: ${environment.browser} | headless=${environment.headless}`);

  cleanResults();
  prepareExecution();
  await prepareFeatures();

  const generatedRoot = path.resolve(process.cwd(), 'features', 'generated');
  const generatedFeatures = listGeneratedFeatures(generatedRoot);
  if (generatedFeatures.length === 0) {
    throw new Error('No se encontraron archivos .feature generados para ejecutar.');
  }

  console.log(`[CUCUMBER] ${generatedFeatures.length} archivo(s) feature enviado(s) explícitamente al runner.`);
  generatedFeatures.forEach(feature => {
    console.log(`[CUCUMBER] Feature: ${path.relative(process.cwd(), feature)}`);
  });

  const cucumberBin = path.resolve(
    process.cwd(),
    'node_modules',
    '@cucumber',
    'cucumber',
    'bin',
    'cucumber.js'
  );

  if (!fs.existsSync(cucumberBin)) {
    throw new Error(`No se encontró Cucumber en: ${cucumberBin}. Ejecuta npm install.`);
  }

  // Se envían rutas físicas explícitas. Esto evita que Windows dependa de la
  // expansión de glob configurada en cucumber.js para descubrir escenarios.
  const cucumberArgs = [
    cucumberBin,
    '--config',
    'cucumber.js',
    ...parsed.cucumberArgs,
    ...generatedFeatures
  ];

  console.log(`[COMANDO] ${process.execPath} ${cucumberArgs.join(' ')}`);

  const result = spawnSync(process.execPath, cucumberArgs, {
    cwd: path.resolve(process.cwd()),
    stdio: 'inherit',
    windowsHide: false,
    shell: false
  });

  if (result.error) {
    throw new Error(`No se pudo iniciar Cucumber: ${result.error.message}`);
  }

  if (result.signal) {
    throw new Error(`Cucumber terminó por la señal ${result.signal}.`);
  }

  const status = result.status ?? 1;
  console.log(`[CUCUMBER] Código de salida: ${status}`);
  try {
    await PdfEvidenceReportGenerator.generateCurrentExecution();
    process.exitCode = status;
  } catch (error) {
    console.error('[PDF] Error al generar las evidencias:', error);
    process.exitCode = 1;
  }
}

run().catch(error => {
  console.error('[EJECUCION] Error:', error);
  process.exitCode = 1;
});
