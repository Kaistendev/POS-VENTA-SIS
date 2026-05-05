interface Window {
  api: {
    // Dialogs
    showConfirmDialog: (options: { message: string, title?: string }) => Promise<boolean>;

    // Auth
    login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string; message?: string }>;

    // Settings
    getSettings: () => Promise<any>;
    updateSettings: (settings: Record<string, string>) => Promise<any>;

    // Cash Registers
    getOpenRegister: () => Promise<any>;
    openRegister: (amount: number) => Promise<any>;
    closeRegister: (id: number, amount: number) => Promise<any>;

    // Dashboard
    getDashboardStats: () => Promise<any>;
    getWeeklySales: () => Promise<any[]>;
    getLowStock: () => Promise<any[]>;

    // Clients
    getAllClients: (search?: string) => Promise<any[]>;
    getClientById: (id: number) => Promise<any>;
    createClient: (clientData: any, userId?: number) => Promise<any>;
    updateClient: (id: number, clientData: any, userId?: number) => Promise<any>;
    deleteClient: (id: number, userId?: number) => Promise<any>;

    // Products
    getAllProducts: (search?: string, categoryId?: number) => Promise<any[]>;
    getProductById: (id: number) => Promise<any>;
    getLowStockProducts: () => Promise<any[]>;
    createProduct: (productData: any, userId?: number) => Promise<any>;
    updateProduct: (id: number, productData: any, userId?: number) => Promise<any>;
    deleteProduct: (id: number, userId?: number) => Promise<any>;
    addProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => Promise<any>;
    removeProductStock: (productId: number, quantity: number, userId?: number, reason?: string) => Promise<any>;
    getProductMovements: (productId: number, limit?: number) => Promise<any[]>;

    // Sales
    getAllSales: (startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) => Promise<any[]>;
    getTodaySales: () => Promise<any>;
    getLastSale: () => Promise<any>;
    getSalesStats: (startDate?: Date, endDate?: Date) => Promise<any>;
    getSaleDetails: (saleId: number) => Promise<any>;
    registerSale: (saleData: any, itemsData: any, userId?: number) => Promise<any>;
    cancelSale: (saleId: number, userId?: number) => Promise<any>;

    // Categories
    getAllCategories: (search?: string) => Promise<any[]>;
    getCategoryById: (id: number) => Promise<any>;
    createCategory: (categoryData: any, userId?: number) => Promise<any>;
    updateCategory: (id: number, categoryData: any, userId?: number) => Promise<any>;
    deleteCategory: (id: number, userId?: number) => Promise<any>;

    // Users
    getAllUsers: () => Promise<any[]>;
    getUserById: (id: number) => Promise<any>;
    createUser: (userData: any, createdBy?: number) => Promise<any>;
    updateUser: (id: number, userData: any, updatedBy?: number) => Promise<any>;
    deleteUser: (id: number, deletedBy?: number) => Promise<any>;
    changePassword: (userId: number, newPassword: string, changedBy?: number) => Promise<any>;

    // Suppliers
    getAllSuppliers: (search?: string) => Promise<any[]>;
    getSupplierById: (id: number) => Promise<any>;
    createSupplier: (data: any, userId?: number) => Promise<any>;
    updateSupplier: (id: number, data: any, userId?: number) => Promise<any>;
    deleteSupplier: (id: number, userId?: number) => Promise<any>;

    // Purchases
    getAllPurchases: (supplierId?: number, status?: string) => Promise<any[]>;
    getPurchaseById: (id: number) => Promise<any>;
    createPurchase: (data: any, userId?: number) => Promise<any>;
    receivePurchase: (purchaseId: number, userId?: number) => Promise<any>;
    cancelPurchase: (purchaseId: number, userId?: number) => Promise<any>;

    // Inventory Movements
    getAllMovements: () => Promise<any[]>;
  };
}
