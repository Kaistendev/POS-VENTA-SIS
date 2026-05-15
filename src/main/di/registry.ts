import type { PrismaClient } from '@prisma/client';

export interface AppContainer {
  prisma: PrismaClient;
  userRepo: any;
  productService: any;
  clientService: any;
  saleService: any;
  cashRegisterService: any;
  settingsService: any;
  userService: any;
  authService: any;
  supplierService: any;
  purchaseService: any;
  categoryService: any;
  dashboardService: any;
  backupService: any;
  reportService: any;
  schedulerService: any;
  cacheService: any;
}

let _container: AppContainer | null = null;

export function getContainer(): AppContainer {
  if (!_container) throw new Error('Container not initialized');
  return _container;
}

export function setContainer(c: AppContainer) {
  _container = c;
}
