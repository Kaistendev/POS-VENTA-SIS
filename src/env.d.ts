interface Window {
  api: {
    // Auth
    login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string; message?: string }>;

    // Cash Registers
    getOpenRegister: () => Promise<any>;
    openRegister: (amount: number) => Promise<any>;
    closeRegister: (id: number, amount: number) => Promise<any>;

    // Dashboard
    getDashboardStats: () => Promise<any>;
    getWeeklySales: () => Promise<any[]>;
    getLowStock: () => Promise<any[]>;

    // Clients
    getAllClients: () => Promise<any[]>;
    createClient: (clientData: any, userId?: number) => Promise<any>;

    // Products
    getAllProducts: () => Promise<any[]>;
    createProduct: (productData: any, userId?: number) => Promise<any>;
    addProductStock: (productId: number, quantity: number, userId?: number) => Promise<any>;

    // Sales
    getAllSales: () => Promise<any[]>;
    getSaleDetails: (saleId: number) => Promise<any>;
    registerSale: (saleData: any, itemsData: any) => Promise<any>;

    // Categories
    getAllCategories: () => Promise<any[]>;
    createCategory: (categoryData: any) => Promise<any>;
    deleteCategory: (id: number) => Promise<any>;
  };
}
