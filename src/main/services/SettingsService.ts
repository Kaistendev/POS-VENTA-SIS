import { prisma } from '../prisma/client.js';

export class SettingsService {
  /**
   * Obtiene todas las configuraciones como un objeto clave-valor
   */
  static async getSettings() {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  /**
   * Guarda o actualiza múltiples configuraciones
   */
  static async updateSettings(settings: Record<string, string>) {
    const promises = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(promises);
    return { success: true };
  }

  /**
   * Obtiene una configuración específica
   */
  static async getSetting(key: string, defaultValue: string = '') {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  }

  /**
   * Get tax configuration
   */
  static async getTaxSettings() {
    const taxRate = await this.getSetting('tax_rate', '0');
    const taxType = await this.getSetting('tax_type', 'none'); // none, iva, igv
    const taxIncluded = await this.getSetting('tax_included', 'false');
    
    return {
      taxRate: parseFloat(taxRate) || 0,
      taxType,
      taxIncluded: taxIncluded === 'true',
    };
  }

  /**
   * Update tax configuration
   */
  static async updateTaxSettings(taxRate: number, taxType: string, taxIncluded: boolean) {
    await this.updateSettings({
      tax_rate: taxRate.toString(),
      tax_type: taxType,
      tax_included: taxIncluded.toString(),
    });
    return { success: true };
  }
}
