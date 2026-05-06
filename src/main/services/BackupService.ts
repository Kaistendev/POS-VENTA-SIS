import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGzip, createGunzip } from 'zlib';

const pipelineAsync = promisify(pipeline);

export class BackupService {
  private static getDbPath(): string {
    // In development, the database is in the project root
    // In production, it would be in userData
    const isDev = !app.isPackaged;
    if (isDev) {
      return path.resolve(process.cwd(), 'prisma', 'dev.sqlite3');
    }
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'dev.sqlite3');
  }

  private static getBackupDir(): string {
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

  /**
   * Create a manual backup of the database
   */
  static async createBackup(label?: string): Promise<{ success: boolean; path?: string; message?: string }> {
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

      // Read database and compress
      const readStream = fs.createReadStream(dbPath);
      const gzipStream = createGzip();
      const writeStream = fs.createWriteStream(backupPath);

      await pipelineAsync(readStream, gzipStream, writeStream);

      return { success: true, path: backupPath };
    } catch (error: any) {
      console.error('[BackupService] Error creating backup:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * List all available backups
   */
  static async listBackups(): Promise<Array<{ filename: string; path: string; size: number; created: Date }>> {
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
      console.error('[BackupService] Error listing backups:', error);
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  static async restoreBackup(backupPath: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' };
      }

      const dbPath = this.getDbPath();
      
      // Create a backup of current state before restoring
      await this.createBackup('before-restore');
      
      // Read compressed backup and write to database location
      const readStream = fs.createReadStream(backupPath);
      const gunzipStream = createGunzip();
      const writeStream = fs.createWriteStream(dbPath);
      
      await pipelineAsync(readStream, gunzipStream, writeStream);

      return { success: true, message: 'Backup restored successfully. Restart the app to see changes.' };
    } catch (error: any) {
      console.error('[BackupService] Error restoring backup:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a backup file
   */
  static async deleteBackup(backupPath: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' };
      }
      fs.unlinkSync(backupPath);
      return { success: true };
    } catch (error: any) {
      console.error('[BackupService] Error deleting backup:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create automatic scheduled backup
   */
  static async createScheduledBackup(): Promise<void> {
    const backups = await this.listBackups();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if we already have a backup today
    const todayBackup = backups.find(b => {
      const backupDate = new Date(b.created);
      const bDate = new Date(backupDate.getFullYear(), backupDate.getMonth(), backupDate.getDate());
      return bDate.getTime() === today.getTime();
    });

    if (!todayBackup) {
      await this.createBackup('auto');
      console.log('[BackupService] Automatic backup created');
    }
  }

  /**
   * Cleanup old backups (keep last N)
   */
  static async cleanupOldBackups(keep: number = 10): Promise<void> {
    try {
      const backups = await this.listBackups();
      if (backups.length > keep) {
        const toDelete = backups.slice(keep);
        for (const backup of toDelete) {
          fs.unlinkSync(backup.path);
        }
        console.log(`[BackupService] Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error: any) {
      console.error('[BackupService] Error cleaning up backups:', error);
    }
  }
}
