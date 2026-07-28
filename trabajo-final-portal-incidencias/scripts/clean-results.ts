import fs from 'node:fs';
import path from 'node:path';
import { ArchivoUtil } from '../src/utils/ArchivoUtil';

const targets = [
  'features/generated',
  'allure/results',
  'allure/report',
  'reports/cucumber'
];

export function cleanResults(): void {
  for (const target of targets) {
    const absolute = path.resolve(process.cwd(), target);
    fs.rmSync(absolute, { recursive: true, force: true });
    ArchivoUtil.ensureDir(absolute);
    fs.writeFileSync(path.join(absolute, '.gitkeep'), '', 'utf8');
  }
  console.log('[LIMPIEZA] Resultados temporales eliminados. Las ejecuciones históricas se conservaron.');
}

if (require.main === module) cleanResults();
