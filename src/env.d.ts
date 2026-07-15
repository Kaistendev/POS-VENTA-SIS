interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

interface Window {
  api: {
    // Dialogs
    showConfirmDialog: (options: { message: string; title?: string }) => Promise<boolean>;

    // Health Check
    checkHealth: () => Promise<{ status: string; timestamp: string }>;

    // Setup (First-run wizard)
    checkSetupStatus: () => Promise<{ needsSetup: boolean }>;
    completeSetup: (data: { user: { username: string; password: string }; settings: Record<string, string> }) => Promise<{ success: boolean; message?: string }>;

    // Auth
    login: (username: string, password: string) => Promise<
      | { success: true; user: import('./domain/models').User }
      | { success: false; error: string; message?: string }
    >;

    // Settings
    getSettings: () => Promise<Record<string, string>>;
    updateSettings: (settings: Record<string, string>) => Promise<{ success: boolean }>;

    // Dashboard
    getDashboardStats: (startDate?: Date, endDate?: Date) => Promise<import('./domain/models').DashboardStats>;
    getWeeklySales: (days?: number) => Promise<import('./domain/models').WeeklySalesEntry[]>;
    getLowStock: (limit?: number) => Promise<import('./domain/models').LowStockProduct[]>;
    getSalesByPayment: (startDate?: Date, endDate?: Date) => Promise<import('./domain/models').SalesByPaymentEntry[]>;
    getTopProducts: (limit?: number, startDate?: Date, endDate?: Date) => Promise<import('./domain/models').TopProductEntry[]>;
    getTopClients: (limit?: number, startDate?: Date, endDate?: Date) => Promise<import('./domain/models').TopClientEntry[]>;
    getSalesByHour: (startDate?: Date, endDate?: Date) => Promise<import('./domain/models').SalesByHourEntry[]>;
    getCashSummary: (startDate?: Date, endDate?: Date) => Promise<import('./domain/models').CashRegisterSummary>;
    getInventoryMetrics: () => Promise<import('./domain/models').InventoryMetrics>;
    invalidateDashboardCache: () => Promise<void>;

    // Cash Registers
    getOpenRegister: () => Promise<import('./domain/models').CashRegister | null>;
    getAllRegisters: (startDate?: Date, endDate?: Date) => Promise<(import('./domain/models').CashRegister & { _count?: { sales: number } })[]>;
    getRegisterDetails: (id: number) => Promise<import('./domain/models').CashRegisterWithSales>;
    getDailySummary: (registerId: number) => Promise<unknown>;
    openRegister: (amount: number, userId?: number) => Promise<IpcResponse<{ id: number }>>;
    closeRegister: (id: number, amount: number, userId?: number) => Promise<IpcResponse<{
      registerId: number;
      openingAmount: number;
      totalSales: number;
      expectedCash: number;
      realCash: number;
      difference: number;
      status: string;
      salesCount: number;
    }>>;

    // Clients
    getAllClients: (search?: string) => Promise<import('./domain/models').Client[]>;
    getClientById: (id: number) => Promise<import('./domain/models').Client>;
    createClient: (clientData: import('./domain/dtos').CreateClientDTO, userId?: number) => Promise<IpcResponse<{ id: number }>>;
    updateClient: (id: number, clientData: import('./domain/dtos').UpdateClientDTO, userId?: number) => Promise<IpcResponse<{ client: import('./domain/models').Client }>>;
    deleteClient: (id: number, userId?: number) => Promise<{ success: boolean }>;

    // Products
    getAllProducts: (search?: string, categoryId?: number) => Promise<import('./domain/models').Product[]>;
    getProductById: (id: number) => Promise<import('./domain/models').ProductWithRelations>;
    getLowStockProducts: () => Promise<import('./domain/models').ProductWithRelations[]>;
    createProduct: (productData: import('./domain/dtos').CreateProductDTO, userId?: number) => Promise<IpcResponse<{ id: number }>>;
    updateProduct: (id: number, productData: import('./domain/dtos').UpdateProductDTO, userId?: number) => Promise<IpcResponse<{ product: import('./domain/models').ProductWithRelations }>>;
    deleteProduct: (id: number, userId?: number) => Promise<{ success: boolean }>;
    addProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => Promise<{ success: boolean }>;
    removeProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => Promise<{ success: boolean }>;
    getProductMovements: (productId: number, limit?: number) => Promise<import('./domain/models').InventoryMovement[]>;

    // Categories
    getAllCategories: (search?: string) => Promise<import('./domain/models').Category[]>;
    getCategoryById: (id: number) => Promise<import('./domain/models').CategoryWithProducts>;
    createCategory: (categoryData: import('./domain/dtos').CreateCategoryDTO, userId?: number) => Promise<IpcResponse<import('./domain/models').Category>>;
    updateCategory: (id: number, categoryData: import('./domain/dtos').UpdateCategoryDTO, userId?: number) => Promise<{ success: boolean; data: import('./domain/models').Category }>;
    deleteCategory: (id: number, userId?: number) => Promise<{ success: boolean }>;

    // Sales
    getAllSales: (startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number, page?: number, pageSize?: number) => Promise<import('./domain/dtos').PaginatedResult<import('./domain/models').Sale>>;
    getTodaySales: () => Promise<import('./domain/models').Sale[]>;
    getLastSale: () => Promise<import('./domain/models').SaleWithItems | null>;
    getSalesStats: (startDate?: Date, endDate?: Date) => Promise<import('./domain/dtos').SalesStatsDTO>;
    getSaleDetails: (saleId: number) => Promise<import('./domain/models').SaleWithItems>;
    registerSale: (saleData: Record<string, unknown>, itemsData: Record<string, unknown>[], userId?: number) => Promise<IpcResponse<{ id: number }>>;
    cancelSale: (saleId: number, userId?: number) => Promise<{ success: boolean }>;

    // Users
    getAllUsers: () => Promise<import('./domain/models').User[]>;
    getUserById: (id: number) => Promise<import('./domain/models').User>;
    createUser: (userData: import('./domain/dtos').CreateUserDTO & { password: string }, createdBy?: number) => Promise<{ success: true; user: import('./domain/models').User } | { success: false; message: string }>;
    updateUser: (id: number, userData: import('./domain/dtos').UpdateUserDTO, updatedBy?: number) => Promise<{ success: true; user: import('./domain/models').User } | { success: false; message: string }>;
    deleteUser: (id: number, deletedBy?: number) => Promise<import('./domain/models').User>;
    changePassword: (userId: number, newPassword: string, changedBy?: number) => Promise<{ success: boolean }>;

    // Suppliers
    getAllSuppliers: (search?: string) => Promise<(import('./domain/models').Supplier & { _count?: { products: number; purchases: number } })[]>;
    getSupplierById: (id: number) => Promise<import('./domain/models').SupplierWithRelations>;
    createSupplier: (data: import('./domain/dtos').CreateSupplierDTO, userId?: number) => Promise<{ success: true; supplier: import('./domain/models').Supplier } | { success: false; message: string }>;
    updateSupplier: (id: number, data: import('./domain/dtos').UpdateSupplierDTO, userId?: number) => Promise<{ success: true; supplier: import('./domain/models').Supplier } | { success: false; message: string }>;
    deleteSupplier: (id: number, userId?: number) => Promise<{ success: boolean }>;

    // Purchases
    getAllPurchases: (supplierId?: number, status?: string) => Promise<import('./domain/models').Purchase[]>;
    getPurchaseById: (id: number) => Promise<import('./domain/models').Purchase>;
    createPurchase: (data: import('./domain/dtos').CreatePurchaseDTO, userId?: number) => Promise<{ success: true; purchase: import('./domain/models').Purchase } | { success: false; message: string }>;
    receivePurchase: (purchaseId: number, userId?: number) => Promise<{ success: boolean }>;
    cancelPurchase: (purchaseId: number, userId?: number) => Promise<{ success: boolean }>;
    updatePurchasePaymentStatus: (purchaseId: number, paymentStatus: string) => Promise<{ success: boolean }>;

    // Inventory Movements
    getAllMovements: (page?: number, pageSize?: number, productId?: number, type?: string, reason?: string, startDate?: Date, endDate?: Date) => Promise<import('./domain/dtos').PaginatedResult<import('./domain/models').InventoryMovement>>;

    // Tax Settings
    getTaxSettings: () => Promise<import('./domain/dtos').TaxSettingsDTO>;
    updateTaxSettings: (taxRate: number, taxType: string, taxIncluded: boolean) => Promise<{ success: boolean }>;

    // Backup & Restore
    createBackup: (label?: string) => Promise<import('./domain/models').BackupResult>;
    listBackups: () => Promise<import('./domain/models').BackupEntry[]>;
    restoreBackup: (backupPath: string) => Promise<import('./domain/models').BackupResult>;
    deleteBackup: (backupPath: string) => Promise<import('./domain/models').BackupResult>;

    // Window
    windowFocus: () => Promise<void>;
    windowIsReady: () => Promise<boolean>;

    // Dialog API
    dialog: {
      showMessageBox: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
      showOpenDialog: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
      showSaveDialog: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };

    // AI Assistant
    askAi: (query: string) => Promise<IpcResponse<import('./domain/dtos').AiResponseDTO>>;

    // Reports
    generateReport: (request: import('./domain/dtos').ReportRequestDTO) => Promise<{ success: boolean; path?: string; message?: string }>;
    generateReceipt: (saleId: number) => Promise<{ success: boolean; path?: string; message?: string }>;
    generateCashClose: (registerId: number) => Promise<{ success: boolean; path?: string; message?: string }>;

    // Modal API
    modal: {
      create: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
      close: (id: number) => Promise<void>;
      focus: (id: number) => Promise<void>;
    };
  };
}
