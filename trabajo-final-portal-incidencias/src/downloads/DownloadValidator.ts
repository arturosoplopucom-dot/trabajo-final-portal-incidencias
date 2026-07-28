import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';

export class DownloadValidator {
  static validate(filePath: string, expectedCode?: string): void {
    expect(fs.existsSync(filePath), `No existe la descarga: ${filePath}`).toBeTruthy();
    expect(fs.statSync(filePath).size, 'La descarga está vacía.').toBeGreaterThan(0);
    if (expectedCode) {
      expect(path.basename(filePath).toLowerCase()).toContain(expectedCode.toLowerCase());
    }
  }
}
