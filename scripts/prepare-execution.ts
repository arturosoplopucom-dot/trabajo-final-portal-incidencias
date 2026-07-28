import fs from 'node:fs';
import path from 'node:path';
import { ArchivoUtil } from '../src/utils/ArchivoUtil';
import { FechaUtil } from '../src/utils/FechaUtil';
import { GlobalExecutionMetadata } from '../src/support/ExecutionContext';
import { EnvironmentConfig } from '../src/config/EnvironmentConfig';

export function prepareExecution(): GlobalExecutionMetadata {
  const environment = EnvironmentConfig.load();
  const date = FechaUtil.executionDate();
  const dateRoot = path.resolve(process.cwd(), 'ejecuciones', date);
  ArchivoUtil.ensureDir(dateRoot);

  const sequences = fs.readdirSync(dateRoot, { withFileTypes: true })
    .filter(item => item.isDirectory() && /^\d+$/.test(item.name))
    .map(item => Number(item.name));

  const next = sequences.length ? Math.max(...sequences) + 1 : 1;
  const sequence = String(next).padStart(2, '0');
  const rootPath = path.join(dateRoot, sequence);
  ArchivoUtil.ensureDir(rootPath);

  const metadata: GlobalExecutionMetadata = {
    executionId: `${date}-${sequence}`,
    date,
    sequence,
    rootPath,
    startedAt: FechaUtil.timestamp(),
    environment: environment.name
  };

  ArchivoUtil.writeJson(path.resolve(process.cwd(), '.runtime', 'current-execution.json'), metadata);
  ArchivoUtil.writeJson(path.join(rootPath, 'metadata', 'ejecucion.json'), metadata);
  console.log(`[EJECUCION] ${metadata.executionId}`);
  console.log(`[EJECUCION] Ambiente: ${metadata.environment}`);
  console.log(`[EJECUCION] Carpeta: ${rootPath}`);
  return metadata;
}

if (require.main === module) prepareExecution();
