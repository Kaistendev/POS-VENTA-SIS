import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ReportService } from './ReportService.js';
import { BackupService } from './BackupService.js';

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
    console.log('[Scheduler] Starting scheduled tasks...');
    this.scheduleDailyReport();
    this.scheduleWeeklyReport();
    this.scheduleDailyBackup();
  }

  stop() {
    if (this.dailyTimer) clearInterval(this.dailyTimer);
    if (this.weeklyTimer) clearInterval(this.weeklyTimer);
    console.log('[Scheduler] Stopped scheduled tasks');
  }

  private scheduleDailyReport() {
    const runDaily = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const lastRun = this.getLastRun('daily_report');
        if (lastRun === today) return;

        console.log('[Scheduler] Generating daily report...');
        await this.reportService.generateReport({
          type: 'daily_sales',
          format: 'pdf',
          title: `Reporte Diario - ${new Date().toLocaleDateString('es-PE')}`,
        });
        this.setLastRun('daily_report', today);
        console.log('[Scheduler] Daily report saved');
      } catch (err) {
        console.error('[Scheduler] Error generating daily report:', err);
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

        console.log('[Scheduler] Generating weekly report...');
        await this.reportService.generateReport({
          type: 'sales_summary',
          format: 'pdf',
          startDate: startOfWeek,
          endDate: now,
          title: `Reporte Semanal - Semana ${weekNum}`,
        });
        this.setLastRun('weekly_report', String(weekNum));
        console.log('[Scheduler] Weekly report saved');
      } catch (err) {
        console.error('[Scheduler] Error generating weekly report:', err);
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

        console.log('[Scheduler] Creating daily backup...');
        await this.backupService.createBackup(`auto-${today}`);
        this.setLastRun('daily_backup', today);
        console.log('[Scheduler] Daily backup created');
      } catch (err) {
        console.error('[Scheduler] Error creating daily backup:', err);
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
