import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import { container } from "./di/container.js";
import { wrapIpc } from "./utils/ipcWrapper.js";
import {
  productSchema,
  clientSchema,
  saleSchema,
  categorySchema,
} from "../common/schemas.js";

export function setupIpcHandlers() {
  /**
   * HEALTH CHECK
   */
  ipcMain.handle("dialog:showConfirm", async (_, options: { message: string, title?: string }) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Sí', 'No'],
      defaultId: 0,
      cancelId: 1,
      title: options.title || 'Confirmación',
      message: options.message,
    });
    return result.response === 0;
  });

  ipcMain.handle("health:check", async () => {
    try {
      await container.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  /**
   * DASHBOARD
   */
  ipcMain.handle("dashboard:getStats", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getStats(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:getWeeklySales", async (_, days?: number) => {
    try {
      return await container.dashboardService.getWeeklySales(days);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getLowStock", async (_, limit?: number) => {
    try {
      return await container.dashboardService.getLowStockProducts(limit || 50);
    } catch (error: any) {
      console.error('[IPC] Error getting low stock:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getSalesByPaymentMethod(startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopProducts", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getTopProducts(limit, startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopClients", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getTopClients(limit, startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByHour", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getSalesByHour(startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getCashSummary", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.dashboardService.getCashRegisterSummary(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:getInventoryMetrics", async () => {
    try {
      return await container.dashboardService.getInventoryMetrics();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:invalidateCache", async () => {
    try {
      container.dashboardService.invalidateCache();
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  /**
   * SETTINGS
   */
  ipcMain.handle("settings:getAll", async () => {
    try {
      return await container.settingsService.getSettings();
    } catch (error: any) {
      return {};
    }
  });

  ipcMain.handle("settings:update", async (_, settings: Record<string, string>) => {
    try {
      return await container.settingsService.updateSettings(settings);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  /**
   * CASH REGISTERS
   */
  ipcMain.handle("cash:getOpen", async () => {
    try {
      return await container.cashRegisterService.getOpenRegister();
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("cash:getAll", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.cashRegisterService.getAllRegisters(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener cajas" };
    }
  });

  ipcMain.handle("cash:getDetails", async (_, id) => {
    try {
      return await container.cashRegisterService.getRegisterDetails(id);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener detalles de caja" };
    }
  });

  ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
    try {
      return await container.cashRegisterService.getDailySummary(registerId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener resumen del día" };
    }
  });

  ipcMain.handle("cash:open", wrapIpc((amount: number, userId: number) =>
    container.cashRegisterService.openRegister(amount, userId)
  ));

  ipcMain.handle("cash:close", wrapIpc((id: number, amount: number, userId: number) =>
    container.cashRegisterService.closeRegister(id, amount, userId)
  ));

  /**
   * AUTH
   */
  ipcMain.handle("auth:login", async (_, username, password) => {
    try {
      return await container.authService.login(username, password);
    } catch (error: any) {
      return { success: false, message: error.message || "Error de autenticación" };
    }
  });

  /**
   * CLIENTS
   */
  ipcMain.handle("clients:getAll", async (_, search?: string) => {
    try {
      return await container.clientService.getAllClients(search);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener clientes" };
    }
  });

  ipcMain.handle("clients:getById", async (_, id) => {
    try {
      return await container.clientService.getClientById(id);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener cliente" };
    }
  });

  ipcMain.handle("clients:create", wrapIpc((clientData, userId) =>
    container.clientService.createClient(clientData, userId),
    clientSchema
  ));

  ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) =>
    container.clientService.updateClient(id, clientData, userId)
  ));

  ipcMain.handle("clients:delete", async (_, id, userId) => {
    try {
      return await container.clientService.deleteClient(id, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al eliminar cliente" };
    }
  });

  /**
   * PRODUCTS
   */
  ipcMain.handle("products:getAll", async (_, search?: string, categoryId?: number) => {
    try {
      return await container.productService.getAllProducts(search, categoryId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener productos" };
    }
  });

  ipcMain.handle("products:getById", async (_, id) => {
    try {
      return await container.productService.getProductById(id);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener producto" };
    }
  });

  ipcMain.handle("products:getLowStock", async () => {
    try {
      return await container.dashboardService.getLowStockProducts(50);
    } catch (error: any) {
      console.error('Get low stock products error:', error);
      return [];
    }
  });

  ipcMain.handle("products:create", wrapIpc((productData, userId) =>
    container.productService.createProduct(productData, userId),
    productSchema
  ));

  ipcMain.handle("products:update", wrapIpc((id, productData, userId) =>
    container.productService.updateProduct(id, productData, userId)
  ));

  ipcMain.handle("products:delete", async (_, id, userId) => {
    try {
      return await container.productService.deleteProduct(id, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al eliminar producto" };
    }
  });

  ipcMain.handle("products:addStock", async (_, productId, quantity, userId, reason) => {
    try {
      return await container.productService.addStock(productId, quantity, userId, reason);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al añadir stock" };
    }
  });

  ipcMain.handle("products:removeStock", async (_, productId, quantity, userId, reason) => {
    try {
      return await container.productService.removeStock(productId, quantity, userId, reason);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al reducir stock" };
    }
  });

  ipcMain.handle("products:getMovements", async (_, productId, limit) => {
    try {
      return await container.productService.getInventoryMovements(productId, limit);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener movimientos" };
    }
  });

  /**
   * SALES
   */
  ipcMain.handle("sales:getAll", async (_, startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) => {
    try {
      return await container.saleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener ventas" };
    }
  });

  ipcMain.handle("sales:getToday", async () => {
    try {
      return await container.saleService.getTodaySales();
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener ventas del día" };
    }
  });

  ipcMain.handle("sales:getLast", async () => {
    try {
      return await container.saleService.getLastSale();
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("sales:getStats", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await container.saleService.getSalesStats(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener estadísticas" };
    }
  });

  ipcMain.handle("sales:getDetails", async (_, saleId) => {
    try {
      return await container.saleService.getSaleDetails(saleId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener detalles de venta" };
    }
  });

  ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
    return container.saleService.registerSale(saleData, itemsData, userId);
  }, saleSchema.omit({ items: true })));

  ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
    try {
      return await container.saleService.cancelSale(saleId, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al cancelar venta" };
    }
  });

  /**
   * CATEGORIES
   */
  ipcMain.handle("categories:getAll", async (_, search?: string) => {
    return await container.categoryService.getAllCategories(search);
  });

  ipcMain.handle("categories:getById", async (_, id) => {
    try {
      return await container.categoryService.getCategoryById(id);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener categoría" };
    }
  });

  ipcMain.handle("categories:create", wrapIpc(async (categoryData, userId) => {
    return await container.categoryService.createCategory(categoryData, userId);
  }, categorySchema));

  ipcMain.handle("categories:update", wrapIpc(async (id, categoryData, userId) => {
    const parsed = categorySchema.parse(categoryData);
    return await container.categoryService.updateCategory(id, parsed, userId);
  }));

  ipcMain.handle("categories:delete", wrapIpc(async (id, userId) => {
    return await container.categoryService.deleteCategory(id, userId);
  }));

  /**
   * USERS
   */
  ipcMain.handle("users:getAll", async () => {
    try {
      return await container.userService.getAllUsers();
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener usuarios" };
    }
  });

  ipcMain.handle("users:getById", async (_, id) => {
    try {
      return await container.userService.getUserById(id);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al obtener usuario" };
    }
  });

  ipcMain.handle("users:create", async (_, userData, createdBy) => {
    try {
      const user = await container.userService.createUser(userData, createdBy);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, message: error.message || "Error al crear usuario" };
    }
  });

  ipcMain.handle("users:update", async (_, id, userData, updatedBy) => {
    try {
      const user = await container.userService.updateUser(id, userData, updatedBy);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, message: error.message || "Error al actualizar usuario" };
    }
  });

  ipcMain.handle("users:delete", async (_, id, deletedBy) => {
    try {
      return await container.userService.deleteUser(id, deletedBy);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al eliminar usuario" };
    }
  });

  ipcMain.handle("users:changePassword", async (_, userId, newPassword, changedBy) => {
    try {
      return await container.userService.changePassword(userId, newPassword, changedBy);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al cambiar contraseña" };
    }
  });

  /**
   * INVENTORY MOVEMENTS
   */
  ipcMain.handle("movements:getAll", async () => {
    try {
      return await container.prisma.inventoryMovement.findMany({
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 500,
      });
    } catch (error: any) {
      return [];
    }
  });

  /**
   * SUPPLIERS
   */
  ipcMain.handle("suppliers:getAll", async (_, search?: string) => {
    try {
      return await container.supplierService.getAllSuppliers(search);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("suppliers:getById", async (_, id) => {
    try {
      return await container.supplierService.getSupplierById(id);
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("suppliers:create", async (_, data, userId) => {
    try {
      const supplier = await container.supplierService.createSupplier(data, userId);
      return { success: true, supplier };
    } catch (error: any) {
      return { success: false, message: error.message || "Error al crear proveedor" };
    }
  });

  ipcMain.handle("suppliers:update", async (_, id, data, userId) => {
    try {
      const supplier = await container.supplierService.updateSupplier(id, data, userId);
      return { success: true, supplier };
    } catch (error: any) {
      return { success: false, message: error.message || "Error al actualizar proveedor" };
    }
  });

  ipcMain.handle("suppliers:delete", async (_, id, userId) => {
    try {
      return await container.supplierService.deleteSupplier(id, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al eliminar proveedor" };
    }
  });

  /**
   * PURCHASES
   */
  ipcMain.handle("purchases:getAll", async (_, supplierId?, status?) => {
    try {
      return await container.purchaseService.getAllPurchases(supplierId, status);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("purchases:getById", async (_, id) => {
    try {
      return await container.purchaseService.getPurchaseById(id);
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("purchases:create", async (_, data, userId) => {
    try {
      const purchase = await container.purchaseService.createPurchase(data, userId);
      return { success: true, purchase };
    } catch (error: any) {
      return { success: false, message: error.message || "Error al crear orden de compra" };
    }
  });

  ipcMain.handle("purchases:receive", async (_, purchaseId, userId) => {
    try {
      return await container.purchaseService.receivePurchase(purchaseId, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al recibir compra" };
    }
  });

  ipcMain.handle("purchases:cancel", async (_, purchaseId, userId) => {
    try {
      return await container.purchaseService.cancelPurchase(purchaseId, userId);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al cancelar compra" };
    }
  });

  ipcMain.handle("purchases:updatePaymentStatus", async (_, purchaseId, paymentStatus) => {
    try {
      return await container.purchaseService.updatePaymentStatus(purchaseId, paymentStatus);
    } catch (error: any) {
      return { success: false, message: error.message || "Error al actualizar estado de pago" };
    }
  });

  // Backup & Restore
  ipcMain.handle("backup:create", async (_, label?: string) => {
    try {
      return await container.backupService.createBackup(label);
    } catch (error: any) {
      console.error('[IPC] Error creating backup:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("backup:list", async () => {
    try {
      return await container.backupService.listBackups();
    } catch (error: any) {
      console.error('[IPC] Error listing backups:', error);
      return [];
    }
  });

  ipcMain.handle("backup:restore", async (_, backupPath: string) => {
    try {
      return await container.backupService.restoreBackup(backupPath);
    } catch (error: any) {
      console.error('[IPC] Error restoring backup:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("backup:delete", async (_, backupPath: string) => {
    try {
      return await container.backupService.deleteBackup(backupPath);
    } catch (error: any) {
      console.error('[IPC] Error deleting backup:', error);
      return { success: false, message: error.message };
    }
  });

  // Tax Settings
  ipcMain.handle("settings:getTax", async () => {
    try {
      return await container.settingsService.getTaxSettings();
    } catch (error: any) {
      console.error('[IPC] Error getting tax settings:', error);
      return { taxRate: 0, taxType: 'none', taxIncluded: false };
    }
  });

  ipcMain.handle("settings:updateTax", async (_, taxRate: number, taxType: string, taxIncluded: boolean) => {
    try {
      return await container.settingsService.updateTaxSettings(taxRate, taxType, taxIncluded);
    } catch (error: any) {
      console.error('[IPC] Error updating tax settings:', error);
      return { success: false, message: error.message };
    }
  });

  // Reports
  ipcMain.handle("reports:generate", async (_, raw: any) => {
    try {
      const startDate = raw.startDate ? new Date(raw.startDate) : undefined;
      let endDate: Date | undefined;
      if (raw.endDate) {
        endDate = new Date(raw.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (startDate) {
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      }
      const request: import('../domain/dtos.js').ReportRequestDTO = {
        ...raw,
        startDate,
        endDate,
      };
      const buffer = await container.reportService.generateReport(request);
      const ext = request.format === 'pdf' ? 'pdf' : 'xlsx';
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: `${request.type}-${Date.now()}.${ext}`,
        filters: request.format === 'pdf'
          ? [{ name: 'PDF', extensions: ['pdf'] }]
          : [{ name: 'Excel', extensions: ['xlsx'] }],
      });
      if (canceled || !filePath) {
        return { success: false, message: 'Cancelado por el usuario' };
      }
      await fs.writeFile(filePath, buffer);
      return { success: true, path: filePath };
    } catch (error: any) {
      console.error('[IPC] Error generating report:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("reports:generateReceipt", async (_, saleId: number) => {
    try {
      const request: import('../domain/dtos.js').ReportRequestDTO = {
        type: 'sale_receipt',
        format: 'pdf',
        saleId,
      };
      const buffer = await container.reportService.generateReport(request);
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: `comprobante-${saleId}-${Date.now()}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) {
        return { success: false, message: 'Cancelado por el usuario' };
      }
      await fs.writeFile(filePath, buffer);
      return { success: true, path: filePath };
    } catch (error: any) {
      console.error('[IPC] Error generating receipt:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("reports:generateCashClose", async (_, registerId: number) => {
    try {
      const request: import('../domain/dtos.js').ReportRequestDTO = {
        type: 'cash_close',
        format: 'pdf',
        registerId,
      };
      const buffer = await container.reportService.generateReport(request);
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: `cierre-caja-${registerId}-${Date.now()}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) {
        return { success: false, message: 'Cancelado por el usuario' };
      }
      await fs.writeFile(filePath, buffer);
      return { success: true, path: filePath };
    } catch (error: any) {
      console.error('[IPC] Error generating cash close report:', error);
      return { success: false, message: error.message };
    }
  });
}
