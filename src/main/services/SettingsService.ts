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
}
