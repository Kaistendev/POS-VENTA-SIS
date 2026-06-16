import type { Product, Category, Client, Supplier, User, Discount, CashRegister, Setting } from '../../domain/models';

export const seedCategories: Category[] = [
  { id: 1, name: 'Electrónicos', created_at: new Date(), updated_at: new Date() },
  { id: 2, name: 'Ropa y Accesorios', created_at: new Date(), updated_at: new Date() },
  { id: 3, name: 'Alimentos y Bebidas', created_at: new Date(), updated_at: new Date() },
  { id: 4, name: 'Hogar y Decoración', created_at: new Date(), updated_at: new Date() },
  { id: 5, name: 'Librería y Oficina', created_at: new Date(), updated_at: new Date() },
];

export const seedSuppliers: Supplier[] = [
  { id: 1, name: 'Distribuidora Nacional S.A.', ruc: 'J-12345678-9', phone: '0212-5550101', email: 'ventas@distnacional.com', address: 'Av. Principal, Centro Comercial Paseo, Piso 2', created_at: new Date(), updated_at: new Date() },
  { id: 2, name: 'Importaciones Global C.A.', ruc: 'J-98765432-1', phone: '0241-5550202', email: 'info@importglobal.com', address: 'Zona Industrial Sur, Galpón 15', created_at: new Date(), updated_at: new Date() },
  { id: 3, name: 'Suministros Express 2000', ruc: 'J-45678912-3', phone: '0251-5550303', email: 'pedidos@sumiexpress.com', address: 'Calle 5, Edif. Comercial Los Andes', created_at: new Date(), updated_at: new Date() },
];

export const seedProducts: (Product & { category?: any; supplier?: any })[] = [
  { id: 1, sku: 'TEC-001', name: 'Auriculares Bluetooth Pro', description: 'Auriculares inalámbricos con cancelación de ruido', category_id: 1, supplier_id: 1, price_purchase: 15.50, price_sale: 35.99, stock: 50, min_stock: 10, created_at: new Date(), updated_at: new Date() },
  { id: 2, sku: 'TEC-002', name: 'Cargador USB-C 65W', description: 'Cargador rápido GaN para laptops y tablets', category_id: 1, supplier_id: 1, price_purchase: 8.00, price_sale: 22.50, stock: 120, min_stock: 20, created_at: new Date(), updated_at: new Date() },
  { id: 3, sku: 'TEC-003', name: 'Mouse Ergonómico Inalámbrico', description: 'Mouse vertical con sensor óptico 4000 DPI', category_id: 1, supplier_id: 2, price_purchase: 6.75, price_sale: 18.99, stock: 80, min_stock: 15, created_at: new Date(), updated_at: new Date() },
  { id: 4, sku: 'TEC-004', name: 'Teclado Mecánico RGB', description: 'Teclado mecánico switches Cherry MX, retroiluminación RGB', category_id: 1, supplier_id: 2, price_purchase: 22.00, price_sale: 55.00, stock: 30, min_stock: 5, created_at: new Date(), updated_at: new Date() },
  { id: 5, sku: 'TEC-005', name: 'Hub USB 7 Puertos', description: 'Hub USB 3.0 con lecto SD/TF, alimentación externa', category_id: 1, supplier_id: 1, price_purchase: 5.50, price_sale: 14.99, stock: 65, min_stock: 10, created_at: new Date(), updated_at: new Date() },
  { id: 6, sku: 'ROPA-001', name: 'Camiseta Algodón Premium', description: 'Camiseta manga corta 100% algodón, varios colores', category_id: 2, supplier_id: 2, price_purchase: 4.00, price_sale: 12.99, stock: 200, min_stock: 30, created_at: new Date(), updated_at: new Date() },
  { id: 7, sku: 'ROPA-002', name: 'Jeans Clásico Slim Fit', description: 'Pantalón jeans corte slim fit, tela stretch', category_id: 2, supplier_id: 2, price_purchase: 10.50, price_sale: 29.99, stock: 80, min_stock: 15, created_at: new Date(), updated_at: new Date() },
  { id: 8, sku: 'ROPA-003', name: 'Chaqueta Impermeable', description: 'Chaqueta con capucha, impermeable y cortaviento', category_id: 2, supplier_id: 2, price_purchase: 18.00, price_sale: 45.00, stock: 40, min_stock: 8, created_at: new Date(), updated_at: new Date() },
  { id: 9, sku: 'ROPA-004', name: 'Zapatos Deportivos Urbanos', description: 'Zapatillas casuales, suela antideslizante', category_id: 2, supplier_id: 2, price_purchase: 14.00, price_sale: 38.50, stock: 60, min_stock: 10, created_at: new Date(), updated_at: new Date() },
  { id: 10, sku: 'ALI-001', name: 'Café Artesanal 250g', description: 'Café molido 100% arábica, tostado medio', category_id: 3, supplier_id: 3, price_purchase: 3.50, price_sale: 8.99, stock: 150, min_stock: 25, created_at: new Date(), updated_at: new Date() },
  { id: 11, sku: 'ALI-002', name: 'Té Verde Premium 50 bolsas', description: 'Té verde orgánico, caja de 50 bolsitas', category_id: 3, supplier_id: 3, price_purchase: 1.80, price_sale: 5.50, stock: 90, min_stock: 15, created_at: new Date(), updated_at: new Date() },
  { id: 12, sku: 'ALI-003', name: 'Aceite de Oliva Extra Virgen 500ml', description: 'Aceite de oliva italiano, primera presión en frío', category_id: 3, supplier_id: 3, price_purchase: 5.00, price_sale: 14.00, stock: 45, min_stock: 8, created_at: new Date(), updated_at: new Date() },
  { id: 13, sku: 'ALI-004', name: 'Miel Pura de Abeja 350g', description: 'Miel 100% natural, sin aditivos ni conservantes', category_id: 3, supplier_id: 3, price_purchase: 2.50, price_sale: 7.50, stock: 70, min_stock: 10, created_at: new Date(), updated_at: new Date() },
  { id: 14, sku: 'HOG-001', name: 'Lámpara LED Escritorio', description: 'Lámpara LED con brazo articulado, luz regulable', category_id: 4, supplier_id: 1, price_purchase: 7.00, price_sale: 19.99, stock: 35, min_stock: 5, created_at: new Date(), updated_at: new Date() },
  { id: 15, sku: 'HOG-002', name: 'Organizador de Escritorio Bambú', description: 'Organizador multinivel de bambú natural', category_id: 4, supplier_id: 1, price_purchase: 4.50, price_sale: 12.99, stock: 55, min_stock: 10, created_at: new Date(), updated_at: new Date() },
  { id: 16, sku: 'HOG-003', name: 'Set 6 Vasos Cristal Templado', description: 'Vasos de cristal templado 350ml', category_id: 4, supplier_id: 3, price_purchase: 6.00, price_sale: 16.50, stock: 100, min_stock: 20, created_at: new Date(), updated_at: new Date() },
  { id: 17, sku: 'LIB-001', name: 'Cuaderno Profesional A4', description: 'Cuaderno tapa dura, 200 hojas rayadas', category_id: 5, supplier_id: 3, price_purchase: 2.00, price_sale: 6.99, stock: 180, min_stock: 30, created_at: new Date(), updated_at: new Date() },
  { id: 18, sku: 'LIB-002', name: 'Bolígrafos Gel Colores (12 uds)', description: 'Estuche 12 bolígrafos gel de colores surtidos', category_id: 5, supplier_id: 3, price_purchase: 1.50, price_sale: 4.99, stock: 120, min_stock: 20, created_at: new Date(), updated_at: new Date() },
  { id: 19, sku: 'LIB-003', name: 'Mochila Portátil 15.6"', description: 'Mochila acolchada para laptop, compartimentos múltiples', category_id: 5, supplier_id: 2, price_purchase: 9.00, price_sale: 24.99, stock: 25, min_stock: 5, created_at: new Date(), updated_at: new Date() },
  { id: 20, sku: 'LIB-004', name: 'Calculadora Científica', description: 'Calculadora científica con pantalla LCD de 2 líneas', category_id: 5, supplier_id: 1, price_purchase: 5.50, price_sale: 15.99, stock: 0, min_stock: 10, created_at: new Date(), updated_at: new Date() },
];

export const seedClients: Client[] = [
  { id: 1, dni: 'V-12345678', name: 'María García', phone: '0412-1112233', code: 'CLI-001', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 2, dni: 'V-23456789', name: 'Carlos Mendoza', phone: '0414-2223344', code: 'CLI-002', tax_id: 'J-23456789-0', created_at: new Date(), updated_at: new Date() },
  { id: 3, dni: 'V-34567890', name: 'Ana Rodríguez', phone: '0426-3334455', code: 'CLI-003', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 4, dni: 'E-45678901', name: 'Pedro López', phone: '0416-4445566', code: 'CLI-004', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 5, dni: 'V-56789012', name: 'Laura Martínez', phone: '0412-5556677', code: 'CLI-005', tax_id: 'J-56789012-3', created_at: new Date(), updated_at: new Date() },
  { id: 6, dni: 'V-67890123', name: 'José Hernández', phone: '0424-6667788', code: 'CLI-006', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 7, dni: 'V-78901234', name: 'Diana Torres', phone: '0414-7778899', code: 'CLI-007', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 8, dni: 'E-89012345', name: 'Roberto Sánchez', phone: '0426-8889900', code: 'CLI-008', tax_id: 'J-89012345-6', created_at: new Date(), updated_at: new Date() },
  { id: 9, dni: 'V-90123456', name: 'Sofía Ramírez', phone: '0416-9990011', code: 'CLI-009', tax_id: null, created_at: new Date(), updated_at: new Date() },
  { id: 10, dni: 'V-01234567', name: 'Miguel Ángel Pérez', phone: '0412-0001122', code: 'CLI-010', tax_id: null, created_at: new Date(), updated_at: new Date() },
];

export const seedUsers: (User & { password_hash: string; security_answer_hash?: string | null })[] = [
  { id: 1, username: 'admin', role: 'ADMIN', password_hash: 'Admin123!', security_question: '¿Cuál es tu mascota favorita?', security_answer_hash: 'perro', created_at: new Date(), updated_at: new Date() },
  { id: 2, username: 'vendedor1', role: 'VENDEDOR', password_hash: 'Vendedor1!', security_question: null, security_answer_hash: null, created_at: new Date(), updated_at: new Date() },
];

export const seedSettings: Setting[] = [
  { id: 1, key: 'business_name', value: 'Tienda Demo' },
  { id: 2, key: 'business_phone', value: '0212-5550000' },
  { id: 3, key: 'business_address', value: 'Av. Principal, Local 5, Caracas' },
  { id: 4, key: 'business_tax_id', value: 'J-00000000-0' },
  { id: 5, key: 'ticket_footer', value: '¡Gracias por su compra!' },
  { id: 6, key: 'exchange_rate_usd_ves', value: '45.50' },
];

export const seedDiscounts: Discount[] = [
  { id: 1, name: '10% Electrónicos', type: 'PERCENTAGE', value: 10, is_active: true, applicable_to: 'CATEGORY', category_id: 1, min_purchase_amount: null, created_at: new Date(), updated_at: new Date() },
  { id: 2, name: '5% OFF en Ropa', type: 'PERCENTAGE', value: 5, is_active: true, applicable_to: 'CATEGORY', category_id: 2, min_purchase_amount: null, created_at: new Date(), updated_at: new Date() },
  { id: 3, name: 'Bs. 2 OFF Café', type: 'FIXED_AMOUNT', value: 2, is_active: true, applicable_to: 'SPECIFIC', category_id: null, min_purchase_amount: 5, created_at: new Date(), updated_at: new Date() },
];

export const seedCashRegister: CashRegister = {
  id: 1, opening_amount: 100, total_sales: 0, opened_at: new Date(), closed_at: null, closing_amount: null, difference: null, status: null, created_at: new Date(), updated_at: new Date(),
};

export interface AppData {
  products: Product[];
  categories: Category[];
  clients: Client[];
  suppliers: Supplier[];
  users: (User & { password_hash: string; security_answer_hash?: string | null })[];
  discounts: Discount[];
  cashRegisters: CashRegister[];
  settings: Setting[];
  sales: any[];
  purchases: any[];
  inventoryMovements: any[];
  nextId: Record<string, number>;
  reportLogs: { id: number; type: string; filename: string; generatedAt: string }[];
}

export function getSeedData(): AppData {
  return {
    products: JSON.parse(JSON.stringify(seedProducts)),
    categories: JSON.parse(JSON.stringify(seedCategories)),
    clients: JSON.parse(JSON.stringify(seedClients)),
    suppliers: JSON.parse(JSON.stringify(seedSuppliers)),
    users: JSON.parse(JSON.stringify(seedUsers)),
    discounts: JSON.parse(JSON.stringify(seedDiscounts)),
    cashRegisters: [JSON.parse(JSON.stringify(seedCashRegister))],
    settings: JSON.parse(JSON.stringify(seedSettings)),
    sales: [],
    purchases: [],
      inventoryMovements: [],
      reportLogs: [],
      nextId: {
      products: 21, categories: 6, clients: 11, suppliers: 4, users: 3,
      discounts: 4, cashRegisters: 2, sales: 1, purchases: 1, inventoryMovements: 1, settings: 7, reportLogs: 1,
    },
  };
}
