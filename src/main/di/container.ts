import type { PrismaClient } from '@prisma/client';

// Adaptadores de infraestructura
import { PrismaProductRepository } from '../../infrastructure/persistence/PrismaProductRepository.js';
import { PrismaClientRepository } from '../../infrastructure/persistence/PrismaClientRepository.js';
import { PrismaSaleRepository } from '../../infrastructure/persistence/PrismaSaleRepository.js';
import { PrismaCashRegisterRepository } from '../../infrastructure/persistence/PrismaCashRegisterRepository.js';
import { PrismaSupplierRepository } from '../../infrastructure/persistence/PrismaSupplierRepository.js';
import { PrismaPurchaseRepository } from '../../infrastructure/persistence/PrismaPurchaseRepository.js';
import { PrismaSettingsRepository } from '../../infrastructure/persistence/PrismaSettingsRepository.js';
import { PrismaUserRepository } from '../../infrastructure/persistence/PrismaUserRepository.js';
import { PrismaCategoryRepository } from '../../infrastructure/persistence/PrismaCategoryRepository.js';
import { PrismaAuditLogRepository } from '../../infrastructure/persistence/PrismaAuditLogRepository.js';
import { PrismaDashboardRepository } from '../../infrastructure/persistence/PrismaDashboardRepository.js';
import { ElectronBackupService } from '../../infrastructure/backup/ElectronBackupService.js';
import { PDFReportGenerator } from '../../infrastructure/reports/PDFReportGenerator.js';
import { ExcelReportGenerator } from '../../infrastructure/reports/ExcelReportGenerator.js';

// Servicios de aplicación
import { ProductService } from '../services/ProductService.js';
import { ClientService } from '../services/ClientService.js';
import { SaleService } from '../services/SaleService.js';
import { CashRegisterService } from '../services/CashRegisterService.js';
import { SupplierService } from '../services/SupplierService.js';
import { PurchaseService } from '../services/PurchaseService.js';
import { SettingsService } from '../services/SettingsService.js';
import { UserService } from '../services/UserService.js';
import { AuthService } from '../services/AuthService.js';
import { CategoryService } from '../services/CategoryService.js';
import { BackupService } from '../services/BackupService.js';
import { DashboardService } from '../services/DashboardService.js';
import { CacheService } from '../services/CacheService.js';
import { ReportService } from '../services/ReportService.js';
import { SchedulerService } from '../services/SchedulerService.js';

export function buildContainer(prisma: PrismaClient) {
  // --- Repositorios (adaptadores) ---
  const productRepo = new PrismaProductRepository(prisma);
  const clientRepo = new PrismaClientRepository(prisma);
  const saleRepo = new PrismaSaleRepository(prisma);
  const cashRegisterRepo = new PrismaCashRegisterRepository(prisma);
  const supplierRepo = new PrismaSupplierRepository(prisma);
  const purchaseRepo = new PrismaPurchaseRepository(prisma);
  const settingsRepo = new PrismaSettingsRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  const categoryRepo = new PrismaCategoryRepository(prisma);
  const auditLogRepo = new PrismaAuditLogRepository(prisma);
  const dashboardRepo = new PrismaDashboardRepository(prisma);

  // --- Servicios de infraestructura ---
  const cacheService = new CacheService();
  const backupAdapter = new ElectronBackupService();
  const pdfReportGenerator = new PDFReportGenerator();
  const excelReportGenerator = new ExcelReportGenerator();

  // --- Servicios de aplicación ---
  const dashboardService = new DashboardService(dashboardRepo, cacheService);
  const productService = new ProductService(productRepo, categoryRepo, auditLogRepo);
  const clientService = new ClientService(clientRepo, auditLogRepo);
  const cashRegisterService = new CashRegisterService(cashRegisterRepo, auditLogRepo);
  const settingsService = new SettingsService(settingsRepo);
  const userService = new UserService(userRepo, auditLogRepo);
  const authService = new AuthService(userRepo);
  const supplierService = new SupplierService(supplierRepo, auditLogRepo);
  const purchaseService = new PurchaseService(purchaseRepo, supplierRepo, productRepo, auditLogRepo);
  const saleService = new SaleService(
    saleRepo,
    productRepo,
    clientRepo,
    cashRegisterRepo,
    settingsRepo,
    auditLogRepo,
    dashboardService,
  );
  const backupService = new BackupService(backupAdapter);
  const categoryService = new CategoryService(categoryRepo, auditLogRepo);
  const reportService = new ReportService(
    pdfReportGenerator,
    excelReportGenerator,
    dashboardService,
    saleService,
    productService,
    cashRegisterService,
    settingsService,
  );
  const schedulerService = new SchedulerService(reportService, backupService);

  return {
    prisma,
    userRepo,
    productService,
    clientService,
    saleService,
    cashRegisterService,
    settingsService,
    userService,
    authService,
    supplierService,
    purchaseService,
    categoryService,
    dashboardService,
    backupService,
    reportService,
    schedulerService,
    cacheService,
  };
}
