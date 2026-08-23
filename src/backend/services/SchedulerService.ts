import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { ReportService } from './ReportService.js';
import { BackupService } from './BackupService.js';
import { logger } from '../../shared/logger.js';

const SCHEDULER_PREFIX = 'scheduler_';

export class SchedulerService {
  private dailyTimer: ReturnType<typeof setInterval> | null = null;
  private weeklyTimer: ReturnType<typeof setInterval> | null = null;
  private statePath: string;

  constructor(
    private reportService: ReportService,
    private backupService: BackupService,
  ) {
    this.statePath = join(process.cwd(), 'scheduler-state.json');
  }

  start() {
    logger.info('Starting scheduled tasks');
    this.scheduleDailyReport();
    this.scheduleWeeklyReport();
    this.scheduleDailyBackup();
  }

  stop() {
    if (this.dailyTimer) clearInterval(this.dailyTimer);
    if (this.weeklyTimer) clearInterval(this.weeklyTimer);
    logger.info('Stopped scheduled tasks');
  }

  /**
   * Carpeta donde se guardan los reportes automáticos.
   * En desarrollo: <proyecto>/reports. En producción: userData/reports.
   */
  private getReportsDir(): string {
    const isDev = !app.isPackaged;
    const basePath = isDev ? process.cwd() : app.getPath('userData');
    const reportsDir = join(basePath, 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  }

  private saveReportPdf(filename: string, buffer: Uint8Array): string {
    const reportsDir = this.getReportsDir();
    const filePath = join(reportsDir, filename);
    writeFileSync(filePath, buffer);
    return filePath;
  }

  private scheduleDailyReport() {
    const runDaily = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const lastRun = this.getLastRun('daily_report');
        if (lastRun === today) return;

        logger.info('Generating daily report');

        // Solo las ventas de hoy
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const pdf = await this.reportService.generateReport({
          type: 'daily_sales',
          format: 'pdf',
          startDate: startOfDay,
          endDate: new Date(),
          title: `Reporte Diario - ${new Date().toLocaleDateString('es-PE')}`,
        });
        const filePath = this.saveReportPdf(`reporte-diario-${today}.pdf`, pdf);
        this.setLastRun('daily_report', today);
        logger.info({ filePath }, 'Daily report saved');
      } catch (err) {
        logger.error({ err }, 'Error generating daily report');
      }
    };

    runDaily();
    this.dailyTimer = setInterval(runDaily, 60 * 60 * 1000);
  }

  private scheduleWeeklyReport() {
    const runWeekly = async () => {
      try {
        const now = new Date();
        const weekNum = this.getWeekNumber(now);
        const lastWeek = this.getLastRun('weekly_report');
        if (lastWeek === String(weekNum)) return;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        logger.info('Generating weekly report');
        const pdf = await this.reportService.generateReport({
          type: 'sales_summary',
          format: 'pdf',
          startDate: startOfWeek,
          endDate: now,
          title: `Reporte Semanal - Semana ${weekNum}`,
        });
        const filePath = this.saveReportPdf(`reporte-semanal-semana-${weekNum}.pdf`, pdf);
        this.setLastRun('weekly_report', String(weekNum));
        logger.info({ filePath }, 'Weekly report saved');
      } catch (err) {
        logger.error({ err }, 'Error generating weekly report');
      }
    };

    runWeekly();
    this.weeklyTimer = setInterval(runWeekly, 6 * 60 * 60 * 1000);
  }

  private scheduleDailyBackup() {
    const runBackup = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const lastBackup = this.getLastRun('daily_backup');
        if (lastBackup === today) return;

        logger.info('Creating daily backup');
        await this.backupService.createBackup(`auto-${today}`);
        this.setLastRun('daily_backup', today);
        logger.info('Daily backup created');
      } catch (err) {
        logger.error({ err }, 'Error creating daily backup');
      }
    };

    runBackup();
    setInterval(runBackup, 60 * 60 * 1000);
  }

  private getLastRun(key: string): string {
    try {
      if (!existsSync(this.statePath)) return '';
      const data = JSON.parse(readFileSync(this.statePath, 'utf-8'));
      return data[SCHEDULER_PREFIX + key] ?? '';
    } catch {
      return '';
    }
  }

  private setLastRun(key: string, value: string) {
    try {
      let data: Record<string, string> = {};
      if (existsSync(this.statePath)) {
        data = JSON.parse(readFileSync(this.statePath, 'utf-8'));
      }
      data[SCHEDULER_PREFIX + key] = value;
      writeFileSync(this.statePath, JSON.stringify(data, null, 2));
    } catch {
    }
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
  }
}
