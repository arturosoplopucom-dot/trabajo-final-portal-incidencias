import fs from 'node:fs';
import path from 'node:path';
import { Video } from 'playwright';
import { ScenarioExecutionPaths } from '../support/ExecutionContext';
import { TextoUtil } from '../utils/TextoUtil';
import { ArchivoUtil } from '../utils/ArchivoUtil';

export class VideoManager {
  static async save(video: Video | null, paths: ScenarioExecutionPaths, executionId: string): Promise<string | undefined> {
    if (!video) return undefined;
    const source = await video.path();
    if (!fs.existsSync(source)) return undefined;
    const target = path.join(paths.videos, `${TextoUtil.safeFileName(executionId)}.webm`);
    ArchivoUtil.ensureDir(path.dirname(target));
    fs.renameSync(source, target);
    fs.rmSync(paths.tempVideo, { recursive: true, force: true });
    return target;
  }
}
