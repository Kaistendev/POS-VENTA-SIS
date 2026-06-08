import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGzip, createGunzip } from 'zlib';
import { IBackupService } from '../../domain/ports/IBackupService.js';
import { BackupEntry, BackupResult } from '../../domain/models.js';
import { assertPathWithin } from '../../main/utils/pathValidation.js';
import { logger } from '../../shared/logger.js';

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

      return { success: true, path: backupFileName };
    } catch (error: any) {
      logger.error({ err: error }, 'Error creating backup');
      return { success: false, message: 'Error al crear respaldo' };
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
          path: filename,
          size: stats.size,
          created: stats.mtime,
        };
      }).sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error: any) {
      logger.error({ err: error }, 'Error listing backups');
      return [];
    }
  }

  async restoreBackup(backupPath: string): Promise<BackupResult> {
    try {
      const backupDir = this.getBackupDir();
      if (path.isAbsolute(backupPath)) {
        return { success: false, message: 'Ruta absoluta no permitida. Use solo el nombre del archivo.' };
      }
      const resolvedPath = path.join(backupDir, backupPath);
      assertPathWithin(backupDir, resolvedPath, 'Archivo de backup');

      if (!fs.existsSync(resolvedPath)) {
        return { success: false, message: 'Archivo de backup no encontrado' };
      }

      const dbPath = this.getDbPath();

      await this.createBackup('before-restore');

      const readStream = fs.createReadStream(resolvedPath);
      const gunzipStream = createGunzip();
      const writeStream = fs.createWriteStream(dbPath);

      await pipelineAsync(readStream, gunzipStream, writeStream);

      return { success: true, message: 'Backup restaurado correctamente. Reinicia la aplicación.' };
    } catch (error: any) {
      logger.error({ err: error }, 'Error restoring backup');
      return { success: false, message: 'Error al restaurar respaldo' };
    }
  }

  async deleteBackup(backupPath: string): Promise<BackupResult> {
    try {
      const backupDir = this.getBackupDir();
      if (path.isAbsolute(backupPath)) {
        return { success: false, message: 'Ruta absoluta no permitida. Use solo el nombre del archivo.' };
      }
      const resolvedPath = path.join(backupDir, backupPath);
      assertPathWithin(backupDir, resolvedPath, 'Archivo de backup');

      if (!fs.existsSync(resolvedPath)) {
        return { success: false, message: 'Archivo de backup no encontrado' };
      }
      fs.unlinkSync(resolvedPath);
      return { success: true };
    } catch (error: any) {
      logger.error({ err: error }, 'Error deleting backup');
      return { success: false, message: 'Error al eliminar respaldo' };
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
      logger.info('Automatic backup created');
    }
  }

  async cleanupOldBackups(keep: number = 10): Promise<void> {
    try {
      const backupDir = this.getBackupDir();
      const backups = await this.listBackups();
      if (backups.length > keep) {
        const toDelete = backups.slice(keep);
        for (const backup of toDelete) {
          const fullPath = path.join(backupDir, backup.path);
          fs.unlinkSync(fullPath);
        }
        logger.info(`Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error: any) {
      logger.error({ err: error }, 'Error cleaning up backups');
    }
  }
}
