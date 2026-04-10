interface Window {
  api: {
    // Auth
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;

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
  };
}
