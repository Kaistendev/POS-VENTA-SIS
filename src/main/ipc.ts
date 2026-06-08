import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import { getContainer } from "./di/registry.js";
import { wrapIpc, sanitizedCatch } from "./utils/ipcWrapper.js";
import { setCurrentUser, clearCurrentUser, getCurrentUser } from "./auth/session.js";
import { requireRole, UnauthorizedError, ForbiddenError } from "./auth/authorize.js";
import { logger } from "../shared/logger.js";

const $ = new Proxy({} as ReturnType<typeof getContainer>, {
  get(_, prop) {
    return getContainer()[prop as keyof ReturnType<typeof getContainer>];
  },
});
import {
  productSchema,
  clientSchema,
  saleSchema,
  categorySchema,
  supplierSchema,
  purchaseSchema,
  userCreateSchema,
  settingsSchema,
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
      await $.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('[Health] Database check failed:', error);
      return {
        success: false,
        database: 'disconnected',
        timestamp: new Date().toISOString()
      };
    }
  });

  /**
   * DASHBOARD
   */
  ipcMain.handle("dashboard:getStats", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getStats(startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getStats error:', error);
      return sanitizedCatch(error, 'Error al obtener estadísticas del dashboard');
    }
  });

  ipcMain.handle("dashboard:getWeeklySales", async (_, days?: number) => {
    try {
      return await $.dashboardService.getWeeklySales(days);
    } catch (error: any) {
      logger.error('[Dashboard] getWeeklySales error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getLowStock", async (_, limit?: number) => {
    try {
      return await $.dashboardService.getLowStockProducts(limit || 50);
    } catch (error: any) {
      logger.error('[Dashboard] getLowStock error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getSalesByPaymentMethod(startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getSalesByPayment error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopProducts", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getTopProducts(limit, startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getTopProducts error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopClients", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getTopClients(limit, startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getTopClients error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByHour", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getSalesByHour(startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getSalesByHour error:', error);
      return [];
    }
  });

  ipcMain.handle("dashboard:getCashSummary", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await $.dashboardService.getCashRegisterSummary(startDate, endDate);
    } catch (error: any) {
      logger.error('[Dashboard] getCashSummary error:', error);
      return sanitizedCatch(error, 'Error al obtener resumen de caja');
    }
  });

  ipcMain.handle("dashboard:getInventoryMetrics", async () => {
    try {
      return await $.dashboardService.getInventoryMetrics();
    } catch (error: any) {
      logger.error('[Dashboard] getInventoryMetrics error:', error);
      return sanitizedCatch(error, 'Error al obtener métricas de inventario');
    }
  });

  ipcMain.handle("dashboard:invalidateCache", async () => {
    try {
      $.dashboardService.invalidateCache();
      return { success: true };
    } catch (error: any) {
      logger.error('[Dashboard] invalidateCache error:', error);
      return sanitizedCatch(error, 'Error al limpiar caché');
    }
  });

  /**
   * SETTINGS
   */
  ipcMain.handle("settings:getAll", async () => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.settingsService.getSettings();
    } catch (error: any) {
      logger.error('[Settings] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener configuración');
    }
  });

  ipcMain.handle("settings:update", async (_, settings: Record<string, string>) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      const parsed = settingsSchema.safeParse(settings);
      if (!parsed.success) {
        return { success: false, message: 'Error de validación: ' + parsed.error.issues.map(e => e.message).join(', ') };
      }
      await $.settingsService.updateSettings(parsed.data);
      logger.info('Settings saved successfully');
      return { success: true };
    } catch (error: any) {
      logger.error({ err: error, settings: Object.keys(settings) }, '[Settings] update error');
      return sanitizedCatch(error, 'Error al guardar configuración');
    }
  });

  /**
   * CASH REGISTERS
   */
  ipcMain.handle("cash:getOpen", async () => {
    try {
      return await $.cashRegisterService.getOpenRegister();
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("cash:getAll", async (_, startDate?: Date, endDate?: Date) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.cashRegisterService.getAllRegisters(startDate, endDate);
    } catch (error: any) {
      logger.error('[Cash] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener cajas');
    }
  });

  ipcMain.handle("cash:getDetails", async (_, id) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.cashRegisterService.getRegisterDetails(id);
    } catch (error: any) {
      logger.error('[Cash] getDetails error:', error);
      return sanitizedCatch(error, 'Error al obtener detalles de caja');
    }
  });

  ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.cashRegisterService.getDailySummary(registerId);
    } catch (error: any) {
      logger.error('[Cash] getDailySummary error:', error);
      return sanitizedCatch(error, 'Error al obtener resumen del día');
    }
  });

  ipcMain.handle("cash:open", wrapIpc(requireRole('ADMIN')((amount: number, userId: number) =>
    $.cashRegisterService.openRegister(amount, userId)
  )));

  ipcMain.handle("cash:close", wrapIpc(requireRole('ADMIN')((id: number, amount: number, userId: number) =>
    $.cashRegisterService.closeRegister(id, amount, userId)
  )));

  /**
   * AUTH
   */
  ipcMain.handle("auth:login", async (_, username, password) => {
    try {
      const result = await $.authService.login(username, password);
      if (result.success && result.user) {
        setCurrentUser({ id: result.user.id, username: result.user.username, role: result.user.role });
      }
      return result;
    } catch (error: any) {
      logger.error('[Auth] Login error:', error);
      return sanitizedCatch(error, 'Error de autenticación');
    }
  });

  ipcMain.handle("auth:logout", async () => {
    clearCurrentUser();
    return { success: true };
  });

  ipcMain.handle("auth:checkSession", async () => {
    const user = getCurrentUser();
    return { authenticated: !!user, user };
  });

  ipcMain.handle("auth:getSecurityQuestion", async (_, username) => {
    try {
      return await $.authService.getSecurityQuestion(username);
    } catch (error: any) {
      return sanitizedCatch(error, 'Error al obtener pregunta de seguridad');
    }
  });

  ipcMain.handle("auth:verifySecurityAnswer", async (_, username, answer) => {
    try {
      return await $.authService.verifySecurityAnswer(username, answer);
    } catch (error: any) {
      return sanitizedCatch(error, 'Error al verificar respuesta');
    }
  });

  ipcMain.handle("auth:resetPassword", async (_, token, newPassword) => {
    try {
      return await $.authService.resetPassword(token, newPassword);
    } catch (error: any) {
      return sanitizedCatch(error, 'Error al restablecer contraseña');
    }
  });

  ipcMain.handle("auth:setSecurityQuestion", wrapIpc(requireRole('ADMIN')(async (_, userId, question, answer) => {
    return await $.authService.setSecurityQuestion(userId, question, answer);
  })));

  /**
   * SETUP (First-run wizard)
   */
  ipcMain.handle("setup:status", async () => {
    try {
      const count = await $.userRepo.count();
      return { needsSetup: count === 0 };
    } catch (error: any) {
      logger.error('[Setup] Status error:', error);
      return { needsSetup: true };
    }
  });

  ipcMain.handle("setup:complete", async (_, data: { user: { username: string, password: string, security_question?: string, security_answer?: string }, settings: Record<string, string> }) => {
    try {
      const result = await $.authService.register({
        username: data.user.username,
        password: data.user.password,
        role: 'ADMIN',
        password_hash: '',
        security_question: data.user.security_question,
        security_answer: data.user.security_answer,
      } as any);

      let user: { id: number; username: string; role: string };

      if (result.success && result.user) {
        user = result.user;
        logger.info({ userId: user.id }, 'User created during setup');
      } else if (result.error?.includes('ya existe')) {
        const existing = await $.userRepo.findByUsername(data.user.username);
        if (!existing) {
          return { success: false, message: 'Error al verificar el usuario existente' };
        }
        user = { id: existing.id, username: existing.username, role: existing.role };
        logger.info({ userId: user.id }, 'User already exists, reusing');
      } else {
        return { success: false, message: result.error || 'Error al crear el usuario' };
      }

      setCurrentUser({ id: user.id, username: user.username, role: user.role });

      try {
        await $.settingsService.updateSettings(data.settings);
        logger.info({ settings: Object.keys(data.settings) }, 'Settings saved during setup');
      } catch (settingsErr: any) {
        logger.error({ err: settingsErr, settings: Object.keys(data.settings) }, '[Setup] Settings save error');
        return { success: false, message: 'Error al guardar la configuración del negocio: ' + (settingsErr?.message || String(settingsErr)) };
      }

      return { success: true, user };
    } catch (error: any) {
      logger.error({ err: error }, '[Setup] Complete error');
      return sanitizedCatch(error, 'Error durante la configuración inicial');
    }
  });

  /**
   * CLIENTS
   */
  ipcMain.handle("clients:getAll", async (_, search?: string) => {
    try {
      return await $.clientService.getAllClients(search);
    } catch (error: any) {
      logger.error('[Clients] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener clientes');
    }
  });

  ipcMain.handle("clients:getById", async (_, id) => {
    try {
      return await $.clientService.getClientById(id);
    } catch (error: any) {
      logger.error('[Clients] getById error:', error);
      return sanitizedCatch(error, 'Error al obtener cliente');
    }
  });

  ipcMain.handle("clients:create", wrapIpc((clientData, userId) =>
    $.clientService.createClient(clientData, userId),
    clientSchema
  ));

  ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) =>
    $.clientService.updateClient(id, clientData, userId)
  ));

  ipcMain.handle("clients:delete", async (_, id, userId) => {
    try {
      return await $.clientService.deleteClient(id, userId);
    } catch (error: any) {
      logger.error('[Clients] delete error:', error);
      return sanitizedCatch(error, 'Error al eliminar cliente');
    }
  });

  /**
   * PRODUCTS
   */
  ipcMain.handle("products:getAll", async (_, search?: string, categoryId?: number) => {
    try {
      return await $.productService.getAllProducts(search, categoryId);
    } catch (error: any) {
      logger.error('[Products] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener productos');
    }
  });

  ipcMain.handle("products:getById", async (_, id) => {
    try {
      return await $.productService.getProductById(id);
    } catch (error: any) {
      logger.error('[Products] getById error:', error);
      return sanitizedCatch(error, 'Error al obtener producto');
    }
  });

  ipcMain.handle("products:getLowStock", async () => {
    try {
      return await $.dashboardService.getLowStockProducts(50);
    } catch (error: any) {
      logger.error('Get low stock products error:', error);
      return [];
    }
  });

  ipcMain.handle("products:create", wrapIpc((productData, userId) =>
    $.productService.createProduct(productData, userId),
    productSchema
  ));

  ipcMain.handle("products:update", wrapIpc((id, productData, userId) =>
    $.productService.updateProduct(id, productData, userId)
  ));

  ipcMain.handle("products:delete", async (_, id, userId) => {
    try {
      return await $.productService.deleteProduct(id, userId);
    } catch (error: any) {
      logger.error('[Products] delete error:', error);
      return sanitizedCatch(error, 'Error al eliminar producto');
    }
  });

  ipcMain.handle("products:addStock", async (_, productId, quantity, userId, reason) => {
    try {
      return await $.productService.addStock(productId, quantity, userId, reason);
    } catch (error: any) {
      logger.error('[Products] addStock error:', error);
      return sanitizedCatch(error, 'Error al añadir stock');
    }
  });

  ipcMain.handle("products:removeStock", async (_, productId, quantity, userId, reason) => {
    try {
      return await $.productService.removeStock(productId, quantity, userId, reason);
    } catch (error: any) {
      logger.error('[Products] removeStock error:', error);
      return sanitizedCatch(error, 'Error al reducir stock');
    }
  });

  ipcMain.handle("products:getMovements", async (_, productId, limit) => {
    try {
      return await $.productService.getInventoryMovements(productId, limit);
    } catch (error: any) {
      logger.error('[Products] getMovements error:', error);
      return sanitizedCatch(error, 'Error al obtener movimientos');
    }
  });

  /**
   * SALES
   */
  ipcMain.handle("sales:getAll", async (_, startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) => {
    try {
      return await $.saleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
    } catch (error: any) {
      logger.error('[Sales] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener ventas');
    }
  });

  ipcMain.handle("sales:getToday", async () => {
    try {
      return await $.saleService.getTodaySales();
    } catch (error: any) {
      logger.error('[Sales] getToday error:', error);
      return sanitizedCatch(error, 'Error al obtener ventas del día');
    }
  });

  ipcMain.handle("sales:getLast", async () => {
    try {
      return await $.saleService.getLastSale();
    } catch (error: any) {
      logger.error('[Sales] getLast error:', error);
      return null;
    }
  });

  ipcMain.handle("sales:getStats", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await $.saleService.getSalesStats(startDate, endDate);
    } catch (error: any) {
      logger.error('[Sales] getStats error:', error);
      return sanitizedCatch(error, 'Error al obtener estadísticas');
    }
  });

  ipcMain.handle("sales:getDetails", async (_, saleId) => {
    try {
      return await $.saleService.getSaleDetails(saleId);
    } catch (error: any) {
      logger.error('[Sales] getDetails error:', error);
      return sanitizedCatch(error, 'Error al obtener detalles de venta');
    }
  });

  ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
    return $.saleService.registerSale(saleData, itemsData, userId);
  }, saleSchema.omit({ items: true })));

  ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
    try {
      return await $.saleService.cancelSale(saleId, userId);
    } catch (error: any) {
      logger.error('[Sales] cancel error:', error);
      return sanitizedCatch(error, 'Error al cancelar venta');
    }
  });

  /**
   * CATEGORIES
   */
  ipcMain.handle("categories:getAll", async (_, search?: string) => {
    return await $.categoryService.getAllCategories(search);
  });

  ipcMain.handle("categories:getById", async (_, id) => {
    try {
      return await $.categoryService.getCategoryById(id);
    } catch (error: any) {
      logger.error('[Categories] getById error:', error);
      return sanitizedCatch(error, 'Error al obtener categoría');
    }
  });

  ipcMain.handle("categories:create", wrapIpc(requireRole('ADMIN')(async (categoryData, userId) => {
    return await $.categoryService.createCategory(categoryData, userId);
  }), categorySchema));

  ipcMain.handle("categories:update", wrapIpc(requireRole('ADMIN')(async (id, categoryData, userId) => {
    const parsed = categorySchema.parse(categoryData);
    return await $.categoryService.updateCategory(id, parsed, userId);
  })));

  ipcMain.handle("categories:delete", wrapIpc(requireRole('ADMIN')(async (id, userId) => {
    return await $.categoryService.deleteCategory(id, userId);
  })));

  /**
   * USERS
   */
  ipcMain.handle("users:getAll", async () => {
    try {
      return await requireRole('ADMIN')(async () => {
        return await $.userService.getAllUsers();
      })();
    } catch (error: any) {
      logger.error('[Users] getAll error:', error);
      return sanitizedCatch(error, 'Error al obtener usuarios');
    }
  });

  ipcMain.handle("users:getById", async (_, id) => {
    try {
      return await requireRole('ADMIN')(async () => {
        return await $.userService.getUserById(id);
      })();
    } catch (error: any) {
      logger.error('[Users] getById error:', error);
      return sanitizedCatch(error, 'Error al obtener usuario');
    }
  });

  ipcMain.handle("users:create", wrapIpc(requireRole('ADMIN')((userData, createdBy) =>
    $.userService.createUser(userData, createdBy)
  ), userCreateSchema));

  ipcMain.handle("users:update", wrapIpc(requireRole('ADMIN')(async (id, userData, updatedBy) => {
    const parsed = userCreateSchema.partial().parse(userData);
    return await $.userService.updateUser(id, parsed, updatedBy);
  })));

  ipcMain.handle("users:delete", wrapIpc(requireRole('ADMIN')((id, deletedBy) =>
    $.userService.deleteUser(id, deletedBy)
  )));

  ipcMain.handle("users:changePassword", wrapIpc(requireRole('ADMIN')((userId, newPassword, changedBy) =>
    $.userService.changePassword(userId, newPassword, changedBy)
  )));

  /**
   * INVENTORY MOVEMENTS
   */
  ipcMain.handle("movements:getAll", async () => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.prisma.inventoryMovement.findMany({
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
      return await $.supplierService.getAllSuppliers(search);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("suppliers:getById", async (_, id) => {
    try {
      return await $.supplierService.getSupplierById(id);
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("suppliers:create", wrapIpc(requireRole('ADMIN')((data, userId) =>
    $.supplierService.createSupplier(data, userId)
  ), supplierSchema));

  ipcMain.handle("suppliers:update", wrapIpc(requireRole('ADMIN')(async (id, data, userId) => {
    const parsed = supplierSchema.partial().parse(data);
    return await $.supplierService.updateSupplier(id, parsed, userId);
  })));

  ipcMain.handle("suppliers:delete", wrapIpc(requireRole('ADMIN')((id, userId) =>
    $.supplierService.deleteSupplier(id, userId)
  )));

  /**
   * PURCHASES
   */
  ipcMain.handle("purchases:getAll", async (_, supplierId?, status?) => {
    try {
      return await $.purchaseService.getAllPurchases(supplierId, status);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("purchases:getById", async (_, id) => {
    try {
      return await $.purchaseService.getPurchaseById(id);
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("purchases:create", wrapIpc(requireRole('ADMIN')((data, userId) =>
    $.purchaseService.createPurchase(data, userId)
  ), purchaseSchema));

  ipcMain.handle("purchases:receive", wrapIpc(requireRole('ADMIN')((purchaseId, userId) =>
    $.purchaseService.receivePurchase(purchaseId, userId)
  )));

  ipcMain.handle("purchases:cancel", wrapIpc(requireRole('ADMIN')((purchaseId, userId) =>
    $.purchaseService.cancelPurchase(purchaseId, userId)
  )));

  ipcMain.handle("purchases:updatePaymentStatus", wrapIpc(requireRole('ADMIN')((purchaseId, paymentStatus) =>
    $.purchaseService.updatePaymentStatus(purchaseId, paymentStatus)
  )));

  // Backup & Restore
  ipcMain.handle("backup:create", wrapIpc(requireRole('ADMIN')((label?: string) =>
    $.backupService.createBackup(label)
  )));

  ipcMain.handle("backup:list", async () => {
    try {
      return await $.backupService.listBackups();
    } catch (error: any) {
      logger.error('[IPC] Error listing backups:', error);
      return [];
    }
  });

  ipcMain.handle("backup:restore", wrapIpc(requireRole('ADMIN')((backupPath: string) =>
    $.backupService.restoreBackup(backupPath)
  )));

  ipcMain.handle("backup:delete", wrapIpc(requireRole('ADMIN')((backupPath: string) =>
    $.backupService.deleteBackup(backupPath)
  )));

  // Tax Settings
  ipcMain.handle("settings:getTax", async () => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.settingsService.getTaxSettings();
    } catch (error: any) {
      logger.error('[Settings] getTax error:', error);
      return sanitizedCatch(error, 'Error al obtener configuración de impuestos');
    }
  });

  ipcMain.handle("settings:updateTax", async (_, taxRate: number, taxType: string, taxIncluded: boolean) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new UnauthorizedError();
      if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
      return await $.settingsService.updateTaxSettings(taxRate, taxType, taxIncluded);
    } catch (error: any) {
      logger.error({ err: error }, '[Settings] updateTax error');
      return sanitizedCatch(error, 'Error al guardar configuración de impuestos');
    }
  });

  // Reports
  ipcMain.handle("reports:generate", wrapIpc(requireRole('ADMIN')(async (raw: any) => {
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
    const buffer = await $.reportService.generateReport(request);
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
  })));

  ipcMain.handle("reports:generateReceipt", wrapIpc(requireRole('ADMIN')(async (saleId: number) => {
    const request: import('../domain/dtos.js').ReportRequestDTO = {
      type: 'sale_receipt',
      format: 'pdf',
      saleId,
    };
    const buffer = await $.reportService.generateReport(request);
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `comprobante-${saleId}-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) {
      return { success: false, message: 'Cancelado por el usuario' };
    }
    await fs.writeFile(filePath, buffer);
    return { success: true, path: filePath };
  })));

  ipcMain.handle("reports:generateCashClose", wrapIpc(requireRole('ADMIN')(async (registerId: number) => {
    const request: import('../domain/dtos.js').ReportRequestDTO = {
      type: 'cash_close',
      format: 'pdf',
      registerId,
    };
    const buffer = await $.reportService.generateReport(request);
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `cierre-caja-${registerId}-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) {
      return { success: false, message: 'Cancelado por el usuario' };
    }
    await fs.writeFile(filePath, buffer);
    return { success: true, path: filePath };
  })));
}
