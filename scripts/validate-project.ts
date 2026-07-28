import fs from 'node:fs';
import path from 'node:path';
import { EnvironmentConfig, EnvironmentName, EnvironmentSettings } from '../src/config/EnvironmentConfig';
import { ExcelReader } from '../src/data/readers/ExcelReader';

function readEnvironmentArgument(args: string[]): EnvironmentName | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === '--environment') return args[index + 1] as EnvironmentName | undefined;
    if (current.startsWith('--environment=')) return current.split('=', 2)[1] as EnvironmentName;
  }
  return undefined;
}

function validateEnvironmentFile(name: EnvironmentName): void {
  const configPath = path.resolve(process.cwd(), 'config', 'environments', `${name}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Omit<EnvironmentSettings, 'name'>;

  if (!config.baseUrl || !/^https?:\/\//i.test(config.baseUrl)) {
    throw new Error(`baseUrl inválida en ${configPath}: ${config.baseUrl ?? '(vacía)'}`);
  }
  if (!['chromium', 'firefox', 'webkit'].includes(config.browser)) {
    throw new Error(`browser inválido en ${configPath}: ${config.browser}`);
  }
}

async function validate(): Promise<void> {
  const required = [
    'features/source',
    'src/pages',
    'src/flows',
    'src/assertions',
    'src/step-definitions',
    'src/evidence',
    'src/reporting',
    'config/active-environment.json',
    'config/environments/local.json',
    'config/environments/jenkins.json',
    'jenkins/Jenkinsfile',
    'test-data/excel/DatosIncidencias.xlsx'
  ];

  for (const item of required) {
    if (!fs.existsSync(path.resolve(process.cwd(), item))) throw new Error(`Falta: ${item}`);
  }

  validateEnvironmentFile('local');
  validateEnvironmentFile('jenkins');

  const selected = readEnvironmentArgument(process.argv.slice(2));
  if (selected) EnvironmentConfig.selectForExecution(selected);
  EnvironmentConfig.reset();
  const environment = EnvironmentConfig.load();

  const reader = new ExcelReader();
  for (const sheet of ['REGISTRO']) {
    const headers = await reader.readHeaders('test-data/excel/DatosIncidencias.xlsx', sheet);
    if (headers.includes('UrlBase')) {
      throw new Error(`La hoja ${sheet} contiene UrlBase. La URL debe vivir en config/environments, no en Excel.`);
    }
    const rows = await reader.readActiveRows('test-data/excel/DatosIncidencias.xlsx', sheet);
    if (!rows.length) throw new Error(`La hoja ${sheet} no tiene datos activos.`);
  }

  console.log(`[VALIDACION] Ambiente activo: ${environment.name}`);
  console.log(`[VALIDACION] URL base desde el proyecto: ${environment.baseUrl}`);
  console.log('[VALIDACION] No se requieren variables de entorno en la PC.');
  console.log('[VALIDACION] Estructura, TypeScript, configuraciones y Excel validados correctamente.');
}

validate().catch(error => {
  console.error('[VALIDACION] Error:', error);
  process.exitCode = 1;
});
