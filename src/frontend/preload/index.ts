import { contextBridge, ipcRenderer } from 'electron';

// Exponemos de forma segura un subconjunto específico de funcionalidades
contextBridge.exposeInMainWorld('api', {
  // Dialog
  showConfirmDialog: (options: { message: string, title?: string }) => ipcRenderer.invoke('dialog:showConfirm', options),

  // Health Check
  checkHealth: () => ipcRenderer.invoke('health:check'),

  // Setup (First-run wizard)
  checkSetupStatus: () => ipcRenderer.invoke('setup:status'),
  completeSetup: (data: { user: { username: string, password: string, security_question?: string, security_answer?: string }, settings: Record<string, string> }) => ipcRenderer.invoke('setup:complete', data),

  // Auth
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  checkSession: () => ipcRenderer.invoke('auth:checkSession'),
  getSecurityQuestion: (username: string) => ipcRenderer.invoke('auth:getSecurityQuestion', username),
  verifySecurityAnswer: (username: string, answer: string) => ipcRenderer.invoke('auth:verifySecurityAnswer', username, answer),
  resetPassword: (token: string, newPassword: string) => ipcRenderer.invoke('auth:resetPassword', token, newPassword),
  setSecurityQuestion: (userId: number, question: string, answer: string) => ipcRenderer.invoke('auth:setSecurityQuestion', userId, question, answer),

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

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSettings: (settings: Record<string, string>) => ipcRenderer.invoke('settings:update', settings),

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
  addProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => ipcRenderer.invoke('products:addStock', productId, quantity, userId, reason),
  removeProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => ipcRenderer.invoke('products:removeStock', productId, quantity, userId, reason),
  getProductMovements: (productId: number, limit?: number) => ipcRenderer.invoke('products:getMovements', productId, limit),

  // Categories
  getAllCategories: (search?: string) => ipcRenderer.invoke('categories:getAll', search),
  getCategoryById: (id: number) => ipcRenderer.invoke('categories:getById', id),
  createCategory: (categoryData: any, userId?: number) => ipcRenderer.invoke('categories:create', categoryData, userId),
  updateCategory: (id: number, categoryData: any, userId?: number) => ipcRenderer.invoke('categories:update', id, categoryData, userId),
  deleteCategory: (id: number, userId?: number) => ipcRenderer.invoke('categories:delete', id, userId),

  // Sales
  getAllSales: (startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number, page?: number, pageSize?: number) => ipcRenderer.invoke('sales:getAll', startDate, endDate, clientId, cashRegisterId, page, pageSize),
  getTodaySales: () => ipcRenderer.invoke('sales:getToday'),
  getLastSale: () => ipcRenderer.invoke('sales:getLast'),
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

  // Suppliers
  getAllSuppliers: (search?: string) => ipcRenderer.invoke('suppliers:getAll', search),
  getSupplierById: (id: number) => ipcRenderer.invoke('suppliers:getById', id),
  createSupplier: (data: any, userId?: number) => ipcRenderer.invoke('suppliers:create', data, userId),
  updateSupplier: (id: number, data: any, userId?: number) => ipcRenderer.invoke('suppliers:update', id, data, userId),
  deleteSupplier: (id: number, userId?: number) => ipcRenderer.invoke('suppliers:delete', id, userId),

  // Purchases
  getAllPurchases: (supplierId?: number, status?: string) => ipcRenderer.invoke('purchases:getAll', supplierId, status),
  getPurchaseById: (id: number) => ipcRenderer.invoke('purchases:getById', id),
  createPurchase: (data: any, userId?: number) => ipcRenderer.invoke('purchases:create', data, userId),
  receivePurchase: (purchaseId: number, userId?: number) => ipcRenderer.invoke('purchases:receive', purchaseId, userId),
  cancelPurchase: (purchaseId: number, userId?: number) => ipcRenderer.invoke('purchases:cancel', purchaseId, userId),
  updatePurchasePaymentStatus: (purchaseId: number, paymentStatus: string) => ipcRenderer.invoke('purchases:updatePaymentStatus', purchaseId, paymentStatus),

  // Inventory Movements
  getAllMovements: (page?: number, pageSize?: number, productId?: number, type?: string, reason?: string, startDate?: Date, endDate?: Date) => ipcRenderer.invoke('movements:getAll', page, pageSize, productId, type, reason, startDate, endDate),

  // Backup & Restore
  createBackup: (label?: string) => ipcRenderer.invoke('backup:create', label),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
  deleteBackup: (backupPath: string) => ipcRenderer.invoke('backup:delete', backupPath),

  // Discounts
  getDiscounts: (activeOnly?: boolean) => ipcRenderer.invoke('discounts:getAll', activeOnly),
  getDiscountById: (id: number) => ipcRenderer.invoke('discounts:getById', id),
  createDiscount: (data: any) => ipcRenderer.invoke('discounts:create', data),
  updateDiscount: (id: number, data: any) => ipcRenderer.invoke('discounts:update', id, data),
  deleteDiscount: (id: number) => ipcRenderer.invoke('discounts:delete', id),
  getApplicableDiscounts: (productId: number, totalAmount?: number) => ipcRenderer.invoke('discounts:getApplicable', productId, totalAmount),

  // Tax Settings
  getTaxSettings: () => ipcRenderer.invoke('settings:getTax'),
  updateTaxSettings: (taxRate: number, taxType: string, taxIncluded: boolean) => 
    ipcRenderer.invoke('settings:updateTax', taxRate, taxType, taxIncluded),

  // Reports
  generateReport: (request: import('../../domain/dtos').ReportRequestDTO) => 
    ipcRenderer.invoke('reports:generate', request),
  generateReceipt: (saleId: number) => 
    ipcRenderer.invoke('reports:generateReceipt', saleId),
  generateCashClose: (registerId: number) => 
    ipcRenderer.invoke('reports:generateCashClose', registerId),

  // Window management (for focus fix)
  windowFocus: () => ipcRenderer.invoke('window:focus'),
  windowIsReady: () => ipcRenderer.invoke('window:is-ready'),

  // Native dialogs (properly handle focus on Windows)
  dialog: {
    showMessageBox: (options: any) => ipcRenderer.invoke('dialog:showMessageBox', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  },

  // AI Assistant
  askAi: (query: string) => ipcRenderer.invoke('ai:chat', { query }),

  // AI Monitoring
  getAiStats: () => ipcRenderer.invoke('ai:stats'),
  getAiStatsHistory: (limit?: number) => ipcRenderer.invoke('ai:stats:history', { limit }),
  getAiStatsErrors: () => ipcRenderer.invoke('ai:stats:errors'),
  resetAiStats: () => ipcRenderer.invoke('ai:stats:reset'),

  // AI Feedback
  submitAiFeedback: (data: { messageIndex: number; rating: number; query?: string }) => ipcRenderer.invoke('ai:feedback', data),

  // AI Training
  getAiTrainingStats: () => ipcRenderer.invoke('ai:training:stats'),
  retrainAiModel: (epochs?: number) => ipcRenderer.invoke('ai:training:retrain', { epochs }),

  // AI Draft Approval
  approveAiDraft: (draftId: string) => ipcRenderer.invoke('ai:draft:approve', { draftId }),
  rejectAiDraft: (draftId: string) => ipcRenderer.invoke('ai:draft:reject', { draftId }),
  getAiDraftPending: () => ipcRenderer.invoke('ai:draft:pending'),

  // Modal management (native Electron modals)
  modal: {
    create: (options: any) => ipcRenderer.invoke('modal:create', options),
    close: (id: number) => ipcRenderer.invoke('modal:close', id),
    focus: (id: number) => ipcRenderer.invoke('modal:focus', id),
  },
});
