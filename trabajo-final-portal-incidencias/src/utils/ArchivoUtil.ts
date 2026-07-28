import fs from 'node:fs';
import path from 'node:path';

export class ArchivoUtil {
  static ensureDir(dir: string): string {
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static writeJson(filePath: string, value: unknown): void {
    this.ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  }

  static readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  }

  static copy(source: string, target: string): void {
    this.ensureDir(path.dirname(target));
    fs.copyFileSync(source, target);
  }
}
