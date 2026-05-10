import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGzip, createGunzip } from 'zlib';
import { IBackupService } from '../../domain/ports/IBackupService.js';
import { BackupEntry, BackupResult } from '../../domain/models.js';

const pipelineAsync = promisify(pipeline);

export class ElectronBackupService implements IBackupService {
  private getDbPath(): string {
    const isDev = !app.isPackaged;
    if (isDev) {
      return path.resolve(process.cwd(), 'prisma', 'dev.sqlite3');
    }
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'dev.sqlite3');
  }

  private getBackupDir(): string {
    const isDev = !app.isPackaged;
    let basePath: string;

    if (isDev) {
      basePath = process.cwd();
    } else {
      basePath = app.getPath('userData');
    }

    const backupDir = path.join(basePath, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  }

  async createBackup(label?: string): Promise<BackupResult> {
    try {
      const dbPath = this.getDbPath();
      if (!fs.existsSync(dbPath)) {
        return { success: false, message: 'Database file not found' };
      }

      const backupDir = this.getBackupDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const labelSuffix = label ? `-${label}` : '';
      const backupFileName = `backup-${timestamp}${labelSuffix}.sqlite.gz`;
      const backupPath = path.join(backupDir, backupFileName);

      const readStream = fs.createReadStream(dbPath);
      const gzipStream = createGzip();
      const writeStream = fs.createWriteStream(backupPath);

      await pipelineAsync(readStream, gzipStream, writeStream);

      return { success: true, path: backupPath };
    } catch (error: any) {
      console.error('[ElectronBackupService] Error creating backup:', error);
      return { success: false, message: error.message };
    }
  }

  async listBackups(): Promise<BackupEntry[]> {
    try {
      const backupDir = this.getBackupDir();
      if (!fs.existsSync(backupDir)) {
        return [];
      }

      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sqlite.gz'));

      return files.map(filename => {
        const filePath = path.join(backupDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
        };
      }).sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error: any) {
      console.error('[ElectronBackupService] Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(backupPath: string): Promise<BackupResult> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' };
      }

      const dbPath = this.getDbPath();

      await this.createBackup('before-restore');

      const readStream = fs.createReadStream(backupPath);
      const gunzipStream = createGunzip();
      const writeStream = fs.createWriteStream(dbPath);

      await pipelineAsync(readStream, gunzipStream, writeStream);

      return { success: true, message: 'Backup restored successfully. Restart the app to see changes.' };
    } catch (error: any) {
      console.error('[ElectronBackupService] Error restoring backup:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteBackup(backupPath: string): Promise<BackupResult> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' };
      }
      fs.unlinkSync(backupPath);
      return { success: true };
    } catch (error: any) {
      console.error('[ElectronBackupService] Error deleting backup:', error);
      return { success: false, message: error.message };
    }
  }

  async createScheduledBackup(): Promise<void> {
    const backups = await this.listBackups();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayBackup = backups.find(b => {
      const backupDate = new Date(b.created);
      const bDate = new Date(backupDate.getFullYear(), backupDate.getMonth(), backupDate.getDate());
      return bDate.getTime() === today.getTime();
    });

    if (!todayBackup) {
      await this.createBackup('auto');
      console.log('[ElectronBackupService] Automatic backup created');
    }
  }

  async cleanupOldBackups(keep: number = 10): Promise<void> {
    try {
      const backups = await this.listBackups();
      if (backups.length > keep) {
        const toDelete = backups.slice(keep);
        for (const backup of toDelete) {
          fs.unlinkSync(backup.path);
        }
        console.log(`[ElectronBackupService] Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error: any) {
      console.error('[ElectronBackupService] Error cleaning up backups:', error);
    }
  }
}
