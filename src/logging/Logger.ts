import fs from 'node:fs';
import path from 'node:path';
import { ArchivoUtil } from '../utils/ArchivoUtil';

export class Logger {
  constructor(private readonly filePath: string) {
    ArchivoUtil.ensureDir(path.dirname(filePath));
  }

  info(category: string, message: string): void {
    this.write('INFO', category, message);
  }

  error(category: string, message: string): void {
    this.write('ERROR', category, message);
  }

  private write(level: string, category: string, message: string): void {
    const line = `[${new Date().toISOString()}] [${level}] [${category}] ${message}`;
    fs.appendFileSync(this.filePath, `${line}\n`, 'utf8');
    console.log(line);
  }

  getPath(): string {
    return this.filePath;
  }
}
