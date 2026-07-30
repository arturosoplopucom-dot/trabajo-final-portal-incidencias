import path from 'node:path';
import { Page } from 'playwright';
import { ScenarioExecutionPaths } from '../support/ExecutionContext';
import { TextoUtil } from '../utils/TextoUtil';

export class ScreenshotManager {
  constructor(private readonly page: Page, private readonly paths: ScenarioExecutionPaths) {}

  async step(stepNumber: number, stepText: string): Promise<string> {
    const fileName = `${String(stepNumber).padStart(3, '0')}_${TextoUtil.safeFileName(stepText)}.png`;
    const target = path.join(this.paths.screenshotsSteps, fileName);
    await this.page.screenshot({ path: target, fullPage: true });
    return target;
  }

  async final(executionId: string): Promise<string> {
    const target = path.join(this.paths.screenshotsFinal, `${TextoUtil.safeFileName(executionId)}_FINAL.png`);
    await this.page.screenshot({ path: target, fullPage: true });
    return target;
  }

  async failed(executionId: string): Promise<string> {
    const target = path.join(this.paths.screenshotsFailed, `${TextoUtil.safeFileName(executionId)}_ERROR.png`);
    await this.page.screenshot({ path: target, fullPage: true });
    return target;
  }
}
