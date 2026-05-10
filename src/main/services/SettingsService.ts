import { ISettingsRepository } from '../../domain/ports/ISettingsRepository.js';

export class SettingsService {
  constructor(private settingsRepo: ISettingsRepository) {}

  async getSettings() {
    return this.settingsRepo.getAll();
  }

  async updateSettings(settings: Record<string, string>) {
    await this.settingsRepo.upsertMany(settings);
    return { success: true };
  }

  async getSetting(key: string, defaultValue = '') {
    return this.settingsRepo.get(key, defaultValue);
  }

  async getTaxSettings() {
    return this.settingsRepo.getTaxSettings();
  }

  async updateTaxSettings(taxRate: number, taxType: string, taxIncluded: boolean) {
    await this.settingsRepo.updateTaxSettings(taxRate, taxType, taxIncluded);
    return { success: true };
  }
}
