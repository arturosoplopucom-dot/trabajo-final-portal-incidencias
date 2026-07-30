import path from 'node:path';
import { Download, Page } from 'playwright';
import { ScenarioExecutionPaths } from '../support/ExecutionContext';
import { TextoUtil } from '../utils/TextoUtil';

export class DownloadManager {
  constructor(private readonly page: Page, private readonly paths: ScenarioExecutionPaths) {}

  async capture(action: () => Promise<void>, expectedBaseName?: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      action()
    ]);
    return this.save(download, expectedBaseName);
  }

  private async save(download: Download, expectedBaseName?: string): Promise<string> {
    const suggested = download.suggestedFilename();
    const extension = path.extname(suggested) || '.txt';
    const name = expectedBaseName
      ? `${TextoUtil.safeFileName(expectedBaseName)}${extension}`
      : suggested;
    const target = path.join(this.paths.downloads, name);
    await download.saveAs(target);
    return target;
  }
}
