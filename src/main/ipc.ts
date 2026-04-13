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

  ipcMain.handle("products:delete", async (_, id) => {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

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

  /**
   * CATEGORIES
   */
  ipcMain.handle("categories:getAll", async () => {
    try {
      return await CategoryRepository.findAll();
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle("categories:create", async (_, categoryData) => {
    try {
      return await CategoryRepository.create(categoryData);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("categories:delete", async (_, id) => {
    try {
      return await CategoryRepository.delete(id);
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
