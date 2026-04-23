import { ipcMain } from "electron";
import { ClientService } from "./services/ClientService.js";
import { ProductService } from "./services/ProductService.js";
import { SaleService } from "./services/SaleService.js";
import { AuthService } from "./services/AuthService.js";
import { UserService } from "./services/UserService.js";
import { DashboardRepository } from "./repositories/DashboardRepository.js";
import { CashRegisterService } from "./services/CashRegisterService.js";
import { CategoryRepository } from "./repositories/CategoryRepository.js";
import { prisma } from "./prisma/client.js";
import { wrapIpc } from "./utils/ipcWrapper.js";
import { 
  productSchema, 
  clientSchema, 
  saleSchema, 
  categorySchema
} from "../common/schemas.js";

export function setupIpcHandlers() {
  /**
   * HEALTH CHECK
   */
  ipcMain.handle("health:check", async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
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
      return await DashboardRepository.getStats(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:getWeeklySales", async (_, days?: number) => {
    try {
      return await DashboardRepository.getWeeklySales(days);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getLowStock", async (_, limit?: number) => {
    try {
      return await DashboardRepository.getLowStockProducts(limit);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await DashboardRepository.getSalesByPaymentMethod(startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopProducts", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await DashboardRepository.getTopProducts(limit, startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getTopClients", async (_, limit?: number, startDate?: Date, endDate?: Date) => {
    try {
      return await DashboardRepository.getTopClients(limit, startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getSalesByHour", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await DashboardRepository.getSalesByHour(startDate, endDate);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getCashSummary", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await DashboardRepository.getCashRegisterSummary(startDate, endDate);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:getInventoryMetrics", async () => {
    try {
      return await DashboardRepository.getInventoryMetrics();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:invalidateCache", async () => {
    try {
      DashboardRepository.invalidateCache();
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  /**
   * CASH REGISTERS
   */
  ipcMain.handle("cash:getOpen", async () => {
    try {
      return await CashRegisterService.getOpenRegister();
    } catch (error: any) {
      return null;
    }
  });

  ipcMain.handle("cash:getAll", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await CashRegisterService.getAllRegisters(startDate, endDate);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener cajas",
      };
    }
  });

  ipcMain.handle("cash:getDetails", async (_, id) => {
    try {
      return await CashRegisterService.getRegisterDetails(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener detalles de caja",
      };
    }
  });

  ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
    try {
      return await CashRegisterService.getDailySummary(registerId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener resumen del día",
      };
    }
  });

  // Eliminados validadores de Zod aquí porque el frontend envía números directos, no objetos
  ipcMain.handle("cash:open", wrapIpc((amount: number, userId: number) => 
    CashRegisterService.openRegister(amount, userId)
  ));

  ipcMain.handle("cash:close", wrapIpc((id: number, amount: number, userId: number) => 
    CashRegisterService.closeRegister(id, amount, userId)
  ));

  /**
   * AUTH
   */
  ipcMain.handle("auth:login", async (_, username, password) => {
    try {
      return await AuthService.login(username, password);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error de autenticación",
      };
    }
  });

  /**
   * CLIENTS
   */
  ipcMain.handle("clients:getAll", async (_, search?: string) => {
    try {
      return await ClientService.getAllClients(search);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener clientes",
      };
    }
  });

  ipcMain.handle("clients:getById", async (_, id) => {
    try {
      return await ClientService.getClientById(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener cliente",
      };
    }
  });

  ipcMain.handle("clients:create", wrapIpc((clientData, userId) => 
    ClientService.createClient(clientData, userId),
    clientSchema
  ));

  ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) => 
    ClientService.updateClient(id, clientData, userId)
  ));

  ipcMain.handle("clients:delete", async (_, id, userId) => {
    try {
      return await ClientService.deleteClient(id, userId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar cliente",
      };
    }
  });

  /**
   * PRODUCTS
   */
  ipcMain.handle("products:getAll", async (_, search?: string, categoryId?: number) => {
    try {
      return await ProductService.getAllProducts(search, categoryId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener productos",
      };
    }
  });

  ipcMain.handle("products:getById", async (_, id) => {
    try {
      return await ProductService.getProductById(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener producto",
      };
    }
  });

  ipcMain.handle("products:getLowStock", async () => {
    try {
      return await ProductService.getLowStockProducts();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener productos con stock bajo",
      };
    }
  });

  ipcMain.handle("products:create", wrapIpc((productData, userId) => 
    ProductService.createProduct(productData, userId), 
    productSchema
  ));

  ipcMain.handle("products:update", wrapIpc((id, productData, userId) => 
    ProductService.updateProduct(id, productData, userId)
  ));

  ipcMain.handle("products:delete", async (_, id, userId) => {
    try {
      return await ProductService.deleteProduct(id, userId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar producto",
      };
    }
  });

  ipcMain.handle(
    "products:addStock",
    async (_, productId, quantity, userId) => {
      try {
        return await ProductService.addStock(
          productId,
          quantity,
          userId,
        );
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Error al añadir stock",
        };
      }
    },
  );

  ipcMain.handle(
    "products:removeStock",
    async (_, productId, quantity, userId) => {
      try {
        return await ProductService.removeStock(
          productId,
          quantity,
          userId,
        );
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Error al reducir stock",
        };
      }
    },
  );

  ipcMain.handle(
    "products:getMovements",
    async (_, productId, limit) => {
      try {
        return await ProductService.getInventoryMovements(productId, limit);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Error al obtener movimientos",
        };
      }
    },
  );

  /**
   * SALES
   */
  ipcMain.handle(
    "sales:getAll",
    async (_, startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) => {
      try {
        return await SaleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Error al obtener ventas",
        };
      }
    },
  );

  ipcMain.handle("sales:getToday", async () => {
    try {
      return await SaleService.getTodaySales();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener ventas del día",
      };
    }
  });

  ipcMain.handle("sales:getStats", async (_, startDate?: Date, endDate?: Date) => {
    try {
      return await SaleService.getSalesStats(startDate, endDate);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener estadísticas",
      };
    }
  });

  ipcMain.handle("sales:getDetails", async (_, saleId) => {
    try {
      return await SaleService.getSaleDetails(saleId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener detalles de venta",
      };
    }
  });

  ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
    return SaleService.registerSale(saleData, itemsData, userId);
  }, saleSchema.omit({ items: true })));

  ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
    try {
      return await SaleService.cancelSale(saleId, userId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al cancelar venta",
      };
    }
  });

  /**
   * CATEGORIES
   */
  ipcMain.handle("categories:getAll", async (_, search?: string) => {
    try {
      return await CategoryRepository.findAll(search);
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("categories:getById", async (_, id) => {
    try {
      return await CategoryRepository.findById(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener categoría",
      };
    }
  });

  ipcMain.handle("categories:create", wrapIpc((categoryData, userId) => 
    CategoryRepository.create(categoryData, userId),
    categorySchema
  ));

  ipcMain.handle("categories:update", wrapIpc((id, categoryData, userId) => 
    CategoryRepository.update(id, categoryData, userId)
  ));

  ipcMain.handle("categories:delete", async (_, id, userId) => {
    try {
      return await CategoryRepository.delete(id, userId);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  /**
   * USERS
   */
  ipcMain.handle("users:getAll", async () => {
    try {
      return await UserService.getAllUsers();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener usuarios",
      };
    }
  });

  ipcMain.handle("users:getById", async (_, id) => {
    try {
      return await UserService.getUserById(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener usuario",
      };
    }
  });

  ipcMain.handle("users:create", async (_, userData, createdBy) => {
    try {
      const user = await UserService.createUser(userData, createdBy);
      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al crear usuario",
      };
    }
  });

  ipcMain.handle("users:update", async (_, id, userData, updatedBy) => {
    try {
      const user = await UserService.updateUser(id, userData, updatedBy);
      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al actualizar usuario",
      };
    }
  });

  ipcMain.handle("users:delete", async (_, id, deletedBy) => {
    try {
      return await UserService.deleteUser(id, deletedBy);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar usuario",
      };
    }
  });

  ipcMain.handle("users:changePassword", async (_, userId, newPassword, changedBy) => {
    try {
      return await UserService.changePassword(userId, newPassword, changedBy);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al cambiar contraseña",
      };
    }
  });
}
