import fs from 'node:fs';
import path from 'node:path';
import { ExcelReader } from '../src/data/readers/ExcelReader';
import { TagDataSourceResolver } from '../src/data/resolvers/TagDataSourceResolver';
import { TextoUtil } from '../src/utils/TextoUtil';
import { ArchivoUtil } from '../src/utils/ArchivoUtil';

interface ScenarioBlock {
  start: number;
  end: number;
  tagStart: number;
  tags: string[];
  scenarioLineIndex: number;
  scenarioName: string;
}

function listFeatureFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const full = path.join(dir, item.name);
    return item.isDirectory() ? listFeatureFiles(full) : item.name.endsWith('.feature') ? [full] : [];
  });
}

function parseTagNames(lines: string[]): string[] {
  return lines
    .flatMap(line => line.trim().split(/\s+/))
    .filter(token => token.startsWith('@'));
}

function findScenarios(lines: string[]): ScenarioBlock[] {
  const scenarioIndexes: number[] = [];
  lines.forEach((line, index) => {
    if (/^\s*(Escenario|Scenario)\s*:/.test(line)) scenarioIndexes.push(index);
  });

  return scenarioIndexes.map((scenarioLineIndex, position) => {
    let tagStart = scenarioLineIndex;
    while (tagStart > 0 && /^\s*@/.test(lines[tagStart - 1])) tagStart -= 1;
    const end = position + 1 < scenarioIndexes.length
      ? (() => {
          let next = scenarioIndexes[position + 1];
          while (next > 0 && /^\s*@/.test(lines[next - 1])) next -= 1;
          return next;
        })()
      : lines.length;
    const scenarioName = lines[scenarioLineIndex].replace(/^\s*(Escenario|Scenario)\s*:\s*/, '').trim();
    return {
      start: tagStart,
      end,
      tagStart,
      tags: parseTagNames(lines.slice(tagStart, scenarioLineIndex)),
      scenarioLineIndex,
      scenarioName
    };
  });
}

function indentOf(line: string): string {
  return line.match(/^\s*/)?.[0] ?? '';
}

async function generateFile(sourceFile: string, targetFile: string): Promise<number> {
  const source = fs.readFileSync(sourceFile, 'utf8').replace(/\r\n/g, '\n');
  const lines = source.split('\n');
  const scenarios = findScenarios(lines);
  if (!scenarios.length) {
    fs.writeFileSync(targetFile, source, 'utf8');
    return 0;
  }

  const reader = new ExcelReader();
  const output: string[] = [];
  let cursor = 0;
  let generatedCount = 0;

  for (const scenario of scenarios) {
    output.push(...lines.slice(cursor, scenario.start));
    const config = TagDataSourceResolver.resolve(scenario.tags);
    const rows = await reader.readActiveRows(config.datasource, config.sheet);
    if (!rows.length) {
      throw new Error(`La hoja ${config.sheet} no contiene filas activas para '${scenario.scenarioName}'.`);
    }

    const originalBlock = lines.slice(scenario.start, scenario.end);
    const relativeScenarioIndex = scenario.scenarioLineIndex - scenario.start;
    const scenarioIndent = indentOf(originalBlock[relativeScenarioIndex]);
    const originalKeyword = originalBlock[relativeScenarioIndex].match(/^\s*(Escenario|Scenario)/)?.[1] || 'Escenario';
    const nonGeneratedTags = scenario.tags.filter(tag => !tag.startsWith('@fila:') && !tag.startsWith('@id:'));
    const bodyStart = relativeScenarioIndex + 1;
    const body = originalBlock.slice(bodyStart);

    rows.forEach(row => {
      nonGeneratedTags.forEach(tag => output.push(`${scenarioIndent}${tag}`));
      output.push(`${scenarioIndent}@fila:${row.rowNumber}`);
      output.push(`${scenarioIndent}@id:${TextoUtil.slug(row.executionId)}`);
      output.push(`${scenarioIndent}${originalKeyword}: ${scenario.scenarioName} [${row.executionId}]`);
      output.push(...body);
      generatedCount += 1;
    });
    cursor = scenario.end;
  }

  output.push(...lines.slice(cursor));
  ArchivoUtil.ensureDir(path.dirname(targetFile));
  fs.writeFileSync(targetFile, output.join('\n'), 'utf8');
  return generatedCount;
}

export async function prepareFeatures(): Promise<void> {
  const sourceRoot = path.resolve(process.cwd(), 'features', 'source');
  const targetRoot = path.resolve(process.cwd(), 'features', 'generated');
  fs.rmSync(targetRoot, { recursive: true, force: true });
  ArchivoUtil.ensureDir(targetRoot);
  const files = listFeatureFiles(sourceRoot);
  let total = 0;
  for (const sourceFile of files) {
    const relative = path.relative(sourceRoot, sourceFile);
    const target = path.join(targetRoot, relative);
    total += await generateFile(sourceFile, target);
  }
  console.log(`[FEATURES] ${files.length} archivo(s) procesado(s).`);
  console.log(`[FEATURES] ${total} escenario(s) generado(s) desde filas activas de Excel.`);
}

if (require.main === module) {
  prepareFeatures().catch(error => {
    console.error('[FEATURES] Error:', error);
    process.exitCode = 1;
  });
}
