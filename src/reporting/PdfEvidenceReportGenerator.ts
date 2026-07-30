import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { ExecutionContextManager } from '../support/ExecutionContextManager';
import { TextoUtil } from '../utils/TextoUtil';

interface ScenarioResult {
  idEjecucion: string;
  escenario: string;
  resultado: string;
  codigoIncidencia?: string | null;
  finalizado: string;
}

interface StepEvidence {
  number: number;
  text: string;
  imagePath: string;
}

interface ScenarioEvidence {
  root: string;
  result: ScenarioResult;
  steps: StepEvidence[];
  finalImage?: string;
}

const COLORS = {
  navy: '#102A43',
  blue: '#1677FF',
  cyan: '#12B5CB',
  ink: '#172B4D',
  muted: '#64748B',
  line: '#DCE5EF',
  paper: '#F5F8FC',
  white: '#FFFFFF',
  green: '#168A5B',
  greenSoft: '#E8F7F0',
  red: '#C53B3B',
  redSoft: '#FDECEC',
  amber: '#B7791F'
} as const;

export class PdfEvidenceReportGenerator {
  static async generateCurrentExecution(): Promise<string[]> {
    const execution = ExecutionContextManager.getGlobal();
    const scenarios = this.readScenarios(execution.rootPath);
    if (!scenarios.length) {
      console.warn('[PDF] No se encontraron resultados para generar evidencias.');
      return [];
    }

    const generated: string[] = [];
    for (const scenario of scenarios) {
      const directory = path.join(scenario.root, 'pdf');
      fs.mkdirSync(directory, { recursive: true });
      const target = path.join(directory, `${TextoUtil.safeFileName(scenario.result.idEjecucion)}.pdf`);
      await this.createPdf(target, [scenario], 'Informe de evidencia del escenario');
      generated.push(target);
    }

    const globalDirectory = path.join(execution.rootPath, 'pdf');
    fs.mkdirSync(globalDirectory, { recursive: true });
    const consolidated = path.join(globalDirectory, 'reporte-ejecucion-completa.pdf');
    await this.createPdf(consolidated, scenarios, `Informe de ejecución ${execution.executionId}`);
    generated.push(consolidated);

    console.log(`[PDF] ${scenarios.length} PDF(s) individuales y 1 consolidado generados.`);
    console.log(`[PDF] Consolidado: ${consolidated}`);
    return generated;
  }

  private static readScenarios(executionRoot: string): ScenarioEvidence[] {
    return this.findFiles(executionRoot, 'resultado.json').map(resultPath => {
      const scenarioRoot = path.dirname(path.dirname(resultPath));
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf8')) as ScenarioResult;
      return {
        root: scenarioRoot,
        result,
        steps: this.readSteps(scenarioRoot),
        finalImage: this.firstImage([
          path.join(scenarioRoot, 'screenshots', 'failed'),
          path.join(scenarioRoot, 'screenshots', 'final')
        ])
      };
    }).sort((left, right) => left.result.idEjecucion.localeCompare(right.result.idEjecucion));
  }

  private static readSteps(scenarioRoot: string): StepEvidence[] {
    const logPath = this.findFiles(path.join(scenarioRoot, 'logs'), '.log')[0];
    const stepNames = new Map<number, string>();
    if (logPath) {
      for (const line of fs.readFileSync(logPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/\[PASO\]\s+(\d+)\.\s+(.+)$/);
        if (match) stepNames.set(Number(match[1]), match[2].trim());
      }
    }

    const directory = path.join(scenarioRoot, 'screenshots', 'steps');
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory).filter(file => file.toLowerCase().endsWith('.png'))
      .sort((left, right) => left.localeCompare(right)).map(file => {
        const number = Number(file.match(/^(\d+)/)?.[1] ?? 0);
        return { number, text: stepNames.get(number) ?? `Paso ${number}`, imagePath: path.join(directory, file) };
      });
  }

  private static async createPdf(target: string, scenarios: ScenarioEvidence[], title: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const document = new PDFDocument({
        autoFirstPage: false,
        bufferPages: true,
        layout: 'landscape',
        size: 'A4',
        margin: 36,
        info: { Title: title, Author: 'NALABTECH QA Automation', Subject: 'Evidencia de pruebas automatizadas' }
      });
      const output = fs.createWriteStream(target);
      output.on('finish', resolve);
      output.on('error', reject);
      document.on('error', reject);
      document.pipe(output);

      this.addGlobalCover(document, title, scenarios);
      this.addExecutiveSummary(document, scenarios);
      for (const scenario of scenarios) {
        this.addScenarioCover(document, scenario);
        for (const step of scenario.steps) this.addEvidencePage(document, scenario, step);
        if (scenario.finalImage) this.addFinalPage(document, scenario);
      }

      const range = document.bufferedPageRange();
      for (let index = range.start; index < range.start + range.count; index += 1) {
        document.switchToPage(index);
        this.addFooter(document, index + 1, range.count);
      }
      document.end();
    });
  }

  private static addGlobalCover(document: PDFKit.PDFDocument, title: string, scenarios: ScenarioEvidence[]): void {
    document.addPage();
    document.rect(0, 0, document.page.width, document.page.height).fill(COLORS.paper);
    document.rect(0, 0, 232, document.page.height).fill(COLORS.navy);
    document.rect(0, 0, 12, document.page.height).fill(COLORS.cyan);

    document.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.white).text('NALABTECH', 38, 46);
    document.font('Helvetica').fontSize(10).fillColor('#B9D2E8').text('QA AUTOMATION', 38, 69);
    document.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.white)
      .text('INCIDENCIAS', 38, 212, { width: 175, lineBreak: false });
    document.font('Helvetica').fontSize(11).fillColor('#B9D2E8')
      .text('Informe de evidencias de pruebas automatizadas', 38, 252, { width: 155, lineGap: 4 });
    document.rect(38, 333, 70, 4).fill(COLORS.cyan);
    document.font('Helvetica').fontSize(9).fillColor('#B9D2E8')
      .text('Documento generado automáticamente', 38, 355, { width: 150 });

    const passed = scenarios.filter(item => this.isPassed(item)).length;
    const failed = scenarios.length - passed;
    document.font('Helvetica').fontSize(11).fillColor(COLORS.blue).text('INFORME DE EJECUCIÓN', 282, 86);
    document.font('Helvetica-Bold').fontSize(30).fillColor(COLORS.ink)
      .text(title, 282, 112, { width: 500, lineGap: 4 });
    document.font('Helvetica').fontSize(12).fillColor(COLORS.muted)
      .text('Resultado consolidado, trazabilidad y evidencia visual por cada paso ejecutado.', 282, 190, { width: 470 });

    this.metricCard(document, 282, 274, 136, 'ESCENARIOS', String(scenarios.length), COLORS.blue);
    this.metricCard(document, 432, 274, 136, 'APROBADOS', String(passed), COLORS.green);
    this.metricCard(document, 582, 274, 136, 'NO APROBADOS', String(failed), failed ? COLORS.red : COLORS.green);

    document.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text('ESTADO GENERAL', 282, 382);
    this.statusPill(document, 282, 405, failed === 0 ? 'EJECUCIÓN EXITOSA' : 'REQUIERE REVISIÓN', failed === 0);
    document.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text(`Generado: ${this.formatDate(new Date().toISOString())}`, 282, 465)
      .text('Ambiente: Jenkins / Local QA', 282, 483);
  }

  private static addExecutiveSummary(document: PDFKit.PDFDocument, scenarios: ScenarioEvidence[]): void {
    document.addPage();
    this.pageHeader(document, 'RESUMEN EJECUTIVO', 'Vista consolidada de resultados');
    const passed = scenarios.filter(item => this.isPassed(item)).length;
    const steps = scenarios.reduce((total, item) => total + item.steps.length, 0);
    this.metricCard(document, 36, 86, 170, 'TOTAL ESCENARIOS', String(scenarios.length), COLORS.blue);
    this.metricCard(document, 220, 86, 170, 'APROBADOS', String(passed), COLORS.green);
    this.metricCard(document, 404, 86, 170, 'EVIDENCIAS DE PASO', String(steps), COLORS.cyan);
    const rate = scenarios.length ? Math.round((passed / scenarios.length) * 100) : 0;
    this.metricCard(document, 588, 86, 170, 'TASA DE ÉXITO', `${rate}%`, rate === 100 ? COLORS.green : COLORS.amber);

    document.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.ink).text('Detalle de escenarios', 36, 205);
    const columns = [36, 104, 530, 650];
    document.roundedRect(36, 232, 722, 28, 4).fill(COLORS.navy);
    ['N°', 'ESCENARIO', 'EVIDENCIAS', 'RESULTADO'].forEach((label, index) => {
      const widths = [60, 418, 110, 108];
      document.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
        .text(label, columns[index], 242, { width: widths[index] });
    });
    let y = 268;
    scenarios.forEach((scenario, index) => {
      if (index % 2 === 0) document.rect(36, y - 6, 722, 34).fill('#F1F5F9');
      document.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.ink).text(String(index + 1).padStart(2, '0'), 36, y);
      document.font('Helvetica').fontSize(9).fillColor(COLORS.ink)
        .text(scenario.result.escenario, 104, y, { width: 408, ellipsis: true, lineBreak: false });
      document.text(`${scenario.steps.length} pasos`, 530, y, { width: 100 });
      this.smallStatus(document, 650, y - 3, this.isPassed(scenario));
      y += 34;
    });
    document.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text('Cada evidencia de paso incluye la captura obtenida durante la ejecución automática.', 36, 532);
  }

  private static addScenarioCover(document: PDFKit.PDFDocument, scenario: ScenarioEvidence): void {
    document.addPage();
    document.rect(0, 0, document.page.width, document.page.height).fill(COLORS.paper);
    document.rect(0, 0, document.page.width, 13).fill(this.isPassed(scenario) ? COLORS.green : COLORS.red);
    document.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.blue).text('DETALLE DEL ESCENARIO', 54, 72);
    document.font('Helvetica-Bold').fontSize(26).fillColor(COLORS.ink)
      .text(scenario.result.escenario, 54, 104, { width: 700, lineGap: 5 });
    document.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
      .text(`ID de ejecución: ${scenario.result.idEjecucion}`, 54, 180);

    document.roundedRect(54, 226, 704, 210, 10).fill(COLORS.white).strokeColor(COLORS.line).stroke();
    this.labelValue(document, 80, 256, 'RESULTADO', this.statusText(scenario), this.isPassed(scenario) ? COLORS.green : COLORS.red);
    this.labelValue(document, 310, 256, 'CÓDIGO DE INCIDENCIA', scenario.result.codigoIncidencia ?? 'No generado', COLORS.ink);
    this.labelValue(document, 540, 256, 'PASOS CON CAPTURA', String(scenario.steps.length), COLORS.ink);
    document.moveTo(80, 326).lineTo(732, 326).strokeColor(COLORS.line).stroke();
    this.labelValue(document, 80, 352, 'FINALIZADO', this.formatDate(scenario.result.finalizado), COLORS.ink);
    this.labelValue(document, 430, 352, 'TIPO DE EVIDENCIA', 'Captura por paso + evidencia final', COLORS.ink);
    document.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text('Las siguientes páginas documentan cronológicamente cada acción validada.', 54, 474);
  }

  private static addEvidencePage(document: PDFKit.PDFDocument, scenario: ScenarioEvidence, step: StepEvidence): void {
    document.addPage();
    this.pageHeader(document, scenario.result.idEjecucion, `Evidencia ${step.number} de ${scenario.steps.length}`);
    document.roundedRect(36, 76, document.page.width - 72, 58, 7).fill('#EEF5FF');
    document.circle(66, 105, 17).fill(COLORS.blue);
    document.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.white)
      .text(String(step.number), 50, 99, { width: 32, align: 'center', lineBreak: false });
    document.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.ink)
      .text(step.text, 96, 94, { width: document.page.width - 152, height: 32, ellipsis: true });
    document.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text('CAPTURA DE PANTALLA', 36, 151);
    this.fitImage(document, step.imagePath, 36, 168, document.page.width - 72, document.page.height - 218);
  }

  private static addFinalPage(document: PDFKit.PDFDocument, scenario: ScenarioEvidence): void {
    document.addPage();
    this.pageHeader(document, scenario.result.idEjecucion, this.isPassed(scenario) ? 'Evidencia final' : 'Evidencia de error');
    document.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.ink)
      .text(scenario.result.escenario, 36, 83, { width: 560 });
    this.statusPill(document, 640, 78, this.statusText(scenario), this.isPassed(scenario), 118);
    document.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text(this.isPassed(scenario) ? 'ESTADO FINAL REGISTRADO' : 'CAPTURA PARA ANÁLISIS DEL ERROR', 36, 126);
    this.fitImage(document, scenario.finalImage!, 36, 145, document.page.width - 72, document.page.height - 195);
  }

  private static fitImage(document: PDFKit.PDFDocument, imagePath: string, x: number, y: number,
    width: number, height: number): void {
    document.save();
    document.roundedRect(x, y, width, height, 7).fill(COLORS.white).strokeColor(COLORS.line).lineWidth(1).stroke();
    document.image(imagePath, x + 7, y + 7, { fit: [width - 14, height - 14], align: 'center', valign: 'center' });
    document.restore();
  }

  private static pageHeader(document: PDFKit.PDFDocument, left: string, right: string): void {
    document.rect(0, 0, document.page.width, 58).fill(COLORS.navy);
    document.rect(0, 0, 8, 58).fill(COLORS.cyan);
    document.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white).text(left, 36, 21, { lineBreak: false });
    document.font('Helvetica').fontSize(9).fillColor('#C8DAEA').text(right, 36, 22,
      { width: document.page.width - 72, align: 'right', lineBreak: false });
    document.y = 58;
  }

  private static addFooter(document: PDFKit.PDFDocument, page: number, total: number): void {
    const y = document.page.height - 48;
    document.moveTo(36, y - 9).lineTo(document.page.width - 36, y - 9).strokeColor(COLORS.line).lineWidth(0.5).stroke();
    document.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
      .text('NALABTECH QA | Informe de evidencia automatizada', 36, y, { lineBreak: false });
    document.text(`Página ${page} de ${total}`, 36, y,
      { width: document.page.width - 72, align: 'right', lineBreak: false });
  }

  private static metricCard(document: PDFKit.PDFDocument, x: number, y: number, width: number,
    label: string, value: string, accent: string): void {
    document.roundedRect(x, y, width, 78, 8).fill(COLORS.white).strokeColor(COLORS.line).stroke();
    document.rect(x, y, 5, 78).fill(accent);
    document.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(label, x + 18, y + 15, { width: width - 28 });
    document.font('Helvetica-Bold').fontSize(23).fillColor(COLORS.ink).text(value, x + 18, y + 35, { width: width - 28 });
  }

  private static statusPill(document: PDFKit.PDFDocument, x: number, y: number, text: string,
    passed: boolean, width = 176): void {
    document.roundedRect(x, y, width, 30, 15).fill(passed ? COLORS.greenSoft : COLORS.redSoft);
    document.circle(x + 17, y + 15, 4).fill(passed ? COLORS.green : COLORS.red);
    document.font('Helvetica-Bold').fontSize(9).fillColor(passed ? COLORS.green : COLORS.red)
      .text(text, x + 29, y + 11, { width: width - 39, lineBreak: false });
  }

  private static smallStatus(document: PDFKit.PDFDocument, x: number, y: number, passed: boolean): void {
    document.roundedRect(x, y, 82, 20, 10).fill(passed ? COLORS.greenSoft : COLORS.redSoft);
    document.font('Helvetica-Bold').fontSize(8).fillColor(passed ? COLORS.green : COLORS.red)
      .text(passed ? 'APROBADO' : 'NO APROBADO', x, y + 6, { width: 82, align: 'center', lineBreak: false });
  }

  private static labelValue(document: PDFKit.PDFDocument, x: number, y: number,
    label: string, value: string, color: string): void {
    document.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(label, x, y);
    document.font('Helvetica-Bold').fontSize(12).fillColor(color).text(value, x, y + 18, { width: 260, ellipsis: true });
  }

  private static isPassed(scenario: ScenarioEvidence): boolean {
    return scenario.result.resultado.toUpperCase() === 'PASSED';
  }

  private static statusText(scenario: ScenarioEvidence): string {
    return this.isPassed(scenario) ? 'APROBADO' : 'NO APROBADO';
  }

  private static formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-PE');
  }

  private static firstImage(directories: string[]): string | undefined {
    for (const directory of directories) {
      if (!fs.existsSync(directory)) continue;
      const file = fs.readdirSync(directory).find(item => item.toLowerCase().endsWith('.png'));
      if (file) return path.join(directory, file);
    }
    return undefined;
  }

  private static findFiles(root: string, suffix: string): string[] {
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
      const target = path.join(root, entry.name);
      if (entry.isDirectory()) return this.findFiles(target, suffix);
      return entry.isFile() && entry.name.endsWith(suffix) ? [target] : [];
    });
  }
}
