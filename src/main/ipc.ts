import { ipcMain } from "electron";
import { ClientService } from "./services/ClientService.js";
import { ProductService } from "./services/ProductService.js";
import { SaleService } from "./services/SaleService.js";
import { AuthService } from "./services/AuthService.js";
import { DashboardRepository } from "./repositories/DashboardRepository.js";
import { CashRegisterService } from "./services/CashRegisterService.js";

export function setupIpcHandlers() {
  /**
   * DASHBOARD
   */
  ipcMain.handle("dashboard:getStats", async () => {
    try {
      return await DashboardRepository.getStats();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("dashboard:getWeeklySales", async () => {
    try {
      return await DashboardRepository.getWeeklySales();
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("dashboard:getLowStock", async () => {
    try {
      return await DashboardRepository.getLowStockProducts();
    } catch (error: any) {
      return [];
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

  ipcMain.handle("cash:open", async (_, amount) => {
    try {
      return await CashRegisterService.openRegister(amount);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("cash:close", async (_, id, amount) => {
    try {
      return await CashRegisterService.closeRegister(id, amount);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

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
  ipcMain.handle("clients:getAll", async () => {
    try {
      return await ClientService.getAllClients();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener clientes",
      };
    }
  });

  ipcMain.handle("clients:create", async (_, clientData, userId) => {
    try {
      return await ClientService.createClient(clientData, userId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al crear cliente",
      };
    }
  });

  /**
   * PRODUCTS
   */
  ipcMain.handle("products:getAll", async () => {
    try {
      return await ProductService.getAllProducts();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener productos",
      };
    }
  });

  ipcMain.handle("products:create", async (_, productData, userId) => {
    try {
      return await ProductService.createProduct(productData, userId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al crear producto",
      };
    }
  });

  ipcMain.handle(
    "products:addStock",
    async (_, productId, quantity, userId) => {
      try {
        return await ProductService.addInitialStock(
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

  /**
   * SALES
   */
  ipcMain.handle("sales:getAll", async () => {
    try {
      return await SaleService.getAllSales();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al obtener ventas",
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

  ipcMain.handle("sales:register", async (_, saleData, itemsData) => {
    try {
      return await SaleService.registerSale(saleData, itemsData);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al registrar venta",
      };
    }
  });
}
