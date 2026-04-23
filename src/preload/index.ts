import { contextBridge, ipcRenderer } from 'electron';

// Exponemos de forma segura un subconjunto específico de funcionalidades
contextBridge.exposeInMainWorld('api', {
  // Health Check
  checkHealth: () => ipcRenderer.invoke('health:check'),

  // Auth
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),

  // Dashboard
  getDashboardStats: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getStats', startDate, endDate),
  getWeeklySales: (days?: number) => ipcRenderer.invoke('dashboard:getWeeklySales', days),
  getLowStock: (limit?: number) => ipcRenderer.invoke('dashboard:getLowStock', limit),
  getSalesByPayment: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getSalesByPayment', startDate, endDate),
  getTopProducts: (limit?: number, startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getTopProducts', limit, startDate, endDate),
  getTopClients: (limit?: number, startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getTopClients', limit, startDate, endDate),
  getSalesByHour: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getSalesByHour', startDate, endDate),
  getCashSummary: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('dashboard:getCashSummary', startDate, endDate),
  getInventoryMetrics: () => ipcRenderer.invoke('dashboard:getInventoryMetrics'),
  invalidateDashboardCache: () => ipcRenderer.invoke('dashboard:invalidateCache'),

  // Cash Registers
  getOpenRegister: () => ipcRenderer.invoke('cash:getOpen'),
  getAllRegisters: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('cash:getAll', startDate, endDate),
  getRegisterDetails: (id: number) => ipcRenderer.invoke('cash:getDetails', id),
  getDailySummary: (registerId: number) => ipcRenderer.invoke('cash:getDailySummary', registerId),
  openRegister: (amount: number, userId?: number) => ipcRenderer.invoke('cash:open', amount, userId),
  closeRegister: (id: number, amount: number, userId?: number) => ipcRenderer.invoke('cash:close', id, amount, userId),

  // Clients
  getAllClients: (search?: string) => ipcRenderer.invoke('clients:getAll', search),
  getClientById: (id: number) => ipcRenderer.invoke('clients:getById', id),
  createClient: (clientData: any, userId?: number) => ipcRenderer.invoke('clients:create', clientData, userId),
  updateClient: (id: number, clientData: any, userId?: number) => ipcRenderer.invoke('clients:update', id, clientData, userId),
  deleteClient: (id: number, userId?: number) => ipcRenderer.invoke('clients:delete', id, userId),

  // Products
  getAllProducts: (search?: string, categoryId?: number) => ipcRenderer.invoke('products:getAll', search, categoryId),
  getProductById: (id: number) => ipcRenderer.invoke('products:getById', id),
  getLowStockProducts: () => ipcRenderer.invoke('products:getLowStock'),
  createProduct: (productData: any, userId?: number) => ipcRenderer.invoke('products:create', productData, userId),
  updateProduct: (id: number, productData: any, userId?: number) => ipcRenderer.invoke('products:update', id, productData, userId),
  deleteProduct: (id: number, userId?: number) => ipcRenderer.invoke('products:delete', id, userId),
  addProductStock: (productId: number, quantity: number, userId?: number) => ipcRenderer.invoke('products:addStock', productId, quantity, userId),
  removeProductStock: (productId: number, quantity: number, userId?: number) => ipcRenderer.invoke('products:removeStock', productId, quantity, userId),
  getProductMovements: (productId: number, limit?: number) => ipcRenderer.invoke('products:getMovements', productId, limit),

  // Categories
  getAllCategories: (search?: string) => ipcRenderer.invoke('categories:getAll', search),
  getCategoryById: (id: number) => ipcRenderer.invoke('categories:getById', id),
  createCategory: (categoryData: any, userId?: number) => ipcRenderer.invoke('categories:create', categoryData, userId),
  updateCategory: (id: number, categoryData: any, userId?: number) => ipcRenderer.invoke('categories:update', id, categoryData, userId),
  deleteCategory: (id: number, userId?: number) => ipcRenderer.invoke('categories:delete', id, userId),

  // Sales
  getAllSales: (startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) => ipcRenderer.invoke('sales:getAll', startDate, endDate, clientId, cashRegisterId),
  getTodaySales: () => ipcRenderer.invoke('sales:getToday'),
  getSalesStats: (startDate?: Date, endDate?: Date) => ipcRenderer.invoke('sales:getStats', startDate, endDate),
  getSaleDetails: (saleId: number) => ipcRenderer.invoke('sales:getDetails', saleId),
  registerSale: (saleData: any, itemsData: any, userId?: number) => ipcRenderer.invoke('sales:register', saleData, itemsData, userId),
  cancelSale: (saleId: number, userId?: number) => ipcRenderer.invoke('sales:cancel', saleId, userId),

  // Users
  getAllUsers: () => ipcRenderer.invoke('users:getAll'),
  getUserById: (id: number) => ipcRenderer.invoke('users:getById', id),
  createUser: (userData: any, createdBy?: number) => ipcRenderer.invoke('users:create', userData, createdBy),
  updateUser: (id: number, userData: any, updatedBy?: number) => ipcRenderer.invoke('users:update', id, userData, updatedBy),
  deleteUser: (id: number, deletedBy?: number) => ipcRenderer.invoke('users:delete', id, deletedBy),
  changePassword: (userId: number, newPassword: string, changedBy?: number) => ipcRenderer.invoke('users:changePassword', userId, newPassword, changedBy),
});
