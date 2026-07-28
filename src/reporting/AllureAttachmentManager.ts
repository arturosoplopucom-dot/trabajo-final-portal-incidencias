import fs from 'node:fs';
import * as allure from 'allure-js-commons';

export class AllureAttachmentManager {
  static async path(name: string, filePath: string, contentType: string, extension: string): Promise<void> {
    if (!fs.existsSync(filePath)) return;
    await allure.attachmentPath(name, filePath, { contentType, fileExtension: extension });
  }

  static async json(name: string, value: unknown): Promise<void> {
    await allure.attachment(name, JSON.stringify(value, null, 2), 'application/json');
  }

  static async text(name: string, value: string): Promise<void> {
    await allure.attachment(name, value, 'text/plain');
  }
}
