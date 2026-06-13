import { IBackupService } from '../../domain/ports/IBackupService.js';
import { BackupEntry, BackupResult } from '../../domain/models.js';

export class BackupService {
  constructor(private readonly adapter: IBackupService) {}

  async createBackup(label?: string): Promise<BackupResult> {
    return this.adapter.createBackup(label);
  }

  async listBackups(): Promise<BackupEntry[]> {
    return this.adapter.listBackups();
  }

  async restoreBackup(backupPath: string): Promise<BackupResult> {
    return this.adapter.restoreBackup(backupPath);
  }

  async deleteBackup(backupPath: string): Promise<BackupResult> {
    return this.adapter.deleteBackup(backupPath);
  }

  async createScheduledBackup(): Promise<void> {
    return this.adapter.createScheduledBackup();
  }

  async cleanupOldBackups(keep?: number): Promise<void> {
    return this.adapter.cleanupOldBackups(keep);
  }
}
