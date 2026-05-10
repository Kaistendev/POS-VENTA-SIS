import { BackupEntry, BackupResult } from '../models.js';

export interface IBackupService {
  createBackup(label?: string): Promise<BackupResult>;
  listBackups(): Promise<BackupEntry[]>;
  restoreBackup(backupPath: string): Promise<BackupResult>;
  deleteBackup(backupPath: string): Promise<BackupResult>;
  createScheduledBackup(): Promise<void>;
  cleanupOldBackups(keep?: number): Promise<void>;
}
