import { contextBridge, ipcRenderer } from 'electron';

// Exponemos de forma segura un subconjunto específico de funcionalidades
contextBridge.exposeInMainWorld('api', {
  // Cash Registers
  getOpenRegister: () => ipcRenderer.invoke('cash:getOpen'),
  openRegister: (amount: number) => ipcRenderer.invoke('cash:open', amount),
  closeRegister: (id: number, amount: number) => ipcRenderer.invoke('cash:close', id, amount),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getWeeklySales: () => ipcRenderer.invoke('dashboard:getWeeklySales'),
  getLowStock: () => ipcRenderer.invoke('dashboard:getLowStock'),

  // CLients
  getAllClients: () => ipcRenderer.invoke('clients:getAll'),
  createClient: (clientData: any, userId?: number) => ipcRenderer.invoke('clients:create', clientData, userId),

  // Products
  getAllProducts: () => ipcRenderer.invoke('products:getAll'),
  createProduct: (productData: any, userId?: number) => ipcRenderer.invoke('products:create', productData, userId),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  addProductStock: (productId: number, quantity: number, userId?: number) => ipcRenderer.invoke('products:addStock', productId, quantity, userId),

  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),

  // Sales
  getAllSales: () => ipcRenderer.invoke('sales:getAll'),
  getSaleDetails: (saleId: number) => ipcRenderer.invoke('sales:getDetails', saleId),
  registerSale: (saleData: any, itemsData: any) => ipcRenderer.invoke('sales:register', saleData, itemsData),

  // Categories
  getAllCategories: () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (categoryData: any) => ipcRenderer.invoke('categories:create', categoryData),
  deleteCategory: (id: number) => ipcRenderer.invoke('categories:delete', id)
});
