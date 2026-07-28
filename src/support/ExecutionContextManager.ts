import path from 'node:path';
import { ArchivoUtil } from '../utils/ArchivoUtil';
import { TextoUtil } from '../utils/TextoUtil';
import { GlobalExecutionMetadata, ScenarioExecutionPaths } from './ExecutionContext';

export class ExecutionContextManager {
  static runtimeFile(): string {
    return path.resolve(process.cwd(), '.runtime', 'current-execution.json');
  }

  static getGlobal(): GlobalExecutionMetadata {
    return ArchivoUtil.readJson<GlobalExecutionMetadata>(this.runtimeFile());
  }

  static createScenarioPaths(scenarioName: string, sheet: string, executionId: string): ScenarioExecutionPaths {
    const global = this.getGlobal();
    const root = path.join(
      global.rootPath,
      TextoUtil.slug(scenarioName),
      TextoUtil.slug(sheet),
      TextoUtil.slug(executionId)
    );

    const paths: ScenarioExecutionPaths = {
      root,
      screenshotsSteps: path.join(root, 'screenshots', 'steps'),
      screenshotsFinal: path.join(root, 'screenshots', 'final'),
      screenshotsFailed: path.join(root, 'screenshots', 'failed'),
      videos: path.join(root, 'videos'),
      downloads: path.join(root, 'downloads'),
      logs: path.join(root, 'logs'),
      data: path.join(root, 'data'),
      tempVideo: path.join(root, '.video-temp')
    };

    Object.values(paths).forEach(directory => ArchivoUtil.ensureDir(directory));
    return paths;
  }
}
