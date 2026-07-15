import { IAiProvider } from '../../domain/ports/IAiProvider.js';
import { AiResponseDTO } from '../../domain/dtos.js';
import { ProductService } from './ProductService.js';
import { DashboardService } from './DashboardService.js';
import { ClientService } from './ClientService.js';

export class AiService {
  constructor(
    private aiProvider: IAiProvider,
    private dashboardService: DashboardService,
    private productService: ProductService,
    private clientService: ClientService,
  ) {}

  async processCommand(userInput: string): Promise<AiResponseDTO> {
    const q = userInput.toLowerCase();

    // ─── Fast regex paths (no LLM) ───
    if (/^sku[\s]*[:]?\s*[\w-]+/i.test(q)) return this.handleStockQuery(userInput);
    if (/costoso|caro|precio\.?mas|mayor\.?precio|mas\.?caro|mas caro/i.test(q) && !/crear|nuevo/.test(q)) return this.handleMostExpensiveProduct();
    if (/barato|mas\.?barato|menor\.?precio|economico|mas economico/i.test(q) && !/crear|nuevo/.test(q)) return this.handleCheapestProduct();
    if (/cuantos?\s+clientes/i.test(q)) return this.handleClientCount();
    if (/cuantos?\s+(categorías|categorias)/i.test(q)) return this.handleCategoryCount();
    if (/cuantos?\s+proveedores/i.test(q)) return this.handleSupplierCount();
    if (/cuantos?\s+productos\s+(tengo|hay|en|registrados)/i.test(q)) return this.handleProductCount();
    if (/cuantos?\s+ventas/i.test(q)) return this.handleSalesSummary(userInput);

    // ─── LLM classifier ───
    const result = await this.classifyWithLLM(userInput);
    if (!result) return this.handleGeneralQuery(userInput);

    switch (result.intent) {
      case 'product_query':
        return this.handleStockQuery(userInput);
      case 'sales_summary':
        return this.handleSalesSummary(userInput);
      case 'entity_count': {
        const type = (result.entities?.entity_type as string) || '';
        if (type.includes('producto') || type === 'product') return this.handleProductCount();
        if (type.includes('cliente') || type === 'client') return this.handleClientCount();
        if (type.includes('categoria') || type === 'category') return this.handleCategoryCount();
        if (type.includes('proveedor') || type === 'supplier') return this.handleSupplierCount();
        return this.handleGeneralQuery(userInput);
      }
      case 'entity_creation':
        return this.handleEntityCreation(userInput, result.entities);
      case 'sale_draft':
        return this.handleSaleDraft(userInput, result.entities);
      default:
        return this.handleGeneralQuery(userInput);
    }
  }

  private async classifyWithLLM(input: string): Promise<{ intent: string; entities?: Record<string, unknown> } | null> {
    const examples = `Eres un clasificador de intenciones para un sistema POS. Responde SOLO un JSON con intent y entities.

Intents posibles:
- product_query: preguntas sobre precio, stock, SKU, búsqueda de productos
- sales_summary: resumen de ventas, ganancias, ingresos
- entity_count: cuántos productos/clientes/categorías existen
- entity_creation: crear o registrar un nuevo producto, cliente, categoría
- sale_draft: preparar un carrito de venta
- general: cualquier otra consulta

Ejemplos:
Usuario: cuales son los productos con poco stock
{"intent":"product_query","entities":{"query_type":"low_stock"}}

Usuario: cuanto se vendio ayer
{"intent":"sales_summary","entities":{"period":"yesterday"}}

Usuario: quiero saber el producto mas caro
{"intent":"product_query","entities":{"query_type":"most_expensive"}}

Usuario: registra un producto nuevo llamado te verde
{"intent":"entity_creation","entities":{"entity_type":"product","name":"Te verde"}}

Usuario: crea un cliente llamado juan perez con dni 12345678
{"intent":"entity_creation","entities":{"entity_type":"client","name":"Juan Perez","dni":"12345678"}}

Usuario: registra un cliente nuevo maria lopez
{"intent":"entity_creation","entities":{"entity_type":"client","name":"Maria Lopez"}}

Usuario: crear producto castañas precio compra 1.30 precio venta 2
{"intent":"entity_creation","entities":{"entity_type":"product","name":"Castañas","price_purchase":1.30,"price_sale":2}}

Usuario: cuantos productos hay en total
{"intent":"entity_count","entities":{"entity_type":"product"}}

Usuario: dame el precio del SKU BEB-001
{"intent":"product_query","entities":{"query_type":"sku","sku":"BEB-001"}}

Usuario: vende 2 cafes a juan perez
{"intent":"sale_draft","entities":{"producto":"cafe","cantidad":2,"cliente":"juan perez"}}

Usuario: quiero comprar 3 arroz
{"intent":"sale_draft","entities":{"producto":"arroz","cantidad":3}}

Usuario: vende una leche a maria
{"intent":"sale_draft","entities":{"producto":"leche","cantidad":1,"cliente":"maria"}}

Usuario: prepara carrito con pan y mantequilla
{"intent":"sale_draft","entities":{"producto":"pan mantequilla","cantidad":1}}

Usuario: cuales son las categorias que tengo
{"intent":"entity_count","entities":{"entity_type":"category"}}

Usuario: que productos estan por vencer
{"intent":"general"}

Usuario: quien compro la ultima venta
{"intent":"general"}`;

    const raw = await this.aiProvider.classifyIntent(input, examples);
    if (!raw || typeof raw.intent !== 'string') return null;
    return raw as { intent: string; entities?: Record<string, unknown> };
  }

  async askAssistant(query: string): Promise<AiResponseDTO> {
    return this.processCommand(query);
  }

  private extractKeywords(input: string): string[] {
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por', 'para', 'y', 'e', 'o', 'a', 'su', 'que', 'es', 'se', 'no', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'este', 'entre', 'porque', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'mi', 'tu', 'te', 'si', 'nos', 'les', 'hay', 'cual', 'cuales', 'dime', 'busca', 'encuentra', 'saber', 'puedes', 'podrias', 'quiero', 'necesito'];
    return input
      .toLowerCase()
      .replace(/[¿?¡!,.;:]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.includes(w));
  }

  // ─── SALES SUMMARY ───

  private async handleSalesSummary(_input: string): Promise<AiResponseDTO> {
    const stats = await this.dashboardService.getStats();
    const topProducts = await this.dashboardService.getTopProducts(3);
    const paymentMethods = await this.dashboardService.getSalesByPaymentMethod();

    if (stats.todaySalesCount === 0) {
      return { type: 'TEXT', content: 'No hay ventas registradas hoy.\n\n' +
        `📊 Totales históricos — Ingresos: S/ ${stats.totalRevenue.toFixed(2)} | Ventas: ${stats.totalSales} | Ganancia: S/ ${stats.totalProfit.toFixed(2)}` };
    }

    const top3 = topProducts.map((p, i) => `${i + 1}. ${p.product_name} (${p.total_quantity} uds)`).join('\n');
    const pagos = paymentMethods.map(m =>
      `${m.payment_method === 'CASH' ? 'Efectivo' : 'Tarjeta'}: S/ ${(m._sum.total ?? 0).toFixed(2)}`
    ).join(' | ');

    return { type: 'TEXT', content:
`📊 **Resumen de ventas - Hoy**
• Ingresos: S/ ${stats.todayRevenue.toFixed(2)}
• Transacciones: ${stats.todaySalesCount}
• Ganancia: S/ ${stats.todayProfit.toFixed(2)}
• Ticket promedio: S/ ${stats.averageSale.toFixed(2)}

🥇 **Top 3 productos:**
${top3}

💳 ${pagos}

📈 Totales históricos: S/ ${stats.totalRevenue.toFixed(2)} en ${stats.totalSales} ventas` };
  }

  // ─── STOCK / PRICE QUERY ───

  private async handleStockQuery(input: string): Promise<AiResponseDTO> {
    const q = input.toLowerCase();

    if (/costoso|caro|precio.mas|mayor.precio|mas.caro/.test(q)) {
      return this.handleMostExpensiveProduct();
    }
    if (/barato|menor.precio|mas.barato|economico/.test(q)) {
      return this.handleCheapestProduct();
    }

    const skuMatch = q.match(/sku[\s]*[:]?[\s]*([\w-]+)/i);
    if (skuMatch) {
      const sku = skuMatch[1].toUpperCase();
      const allProducts = await this.productService.getAllProducts();
      const found = allProducts.find(p => p.sku.toUpperCase() === sku);
      if (found) {
        return { type: 'TEXT', content:
`**${found.name}** (SKU: ${found.sku})
• Precio venta: **S/ ${found.price_sale.toFixed(2)}**
• Precio compra: S/ ${found.price_purchase.toFixed(2)}
• Stock: ${found.stock} unidades
• Stock mínimo: ${found.min_stock ?? 5}
• Categoría: ${found.category?.name ?? 'Sin categoría'}` };
      }
      return { type: 'TEXT', content: `No encontré ningún producto con el SKU "${sku}".` };
    }

    const raw = q.replace(/[¿?¡!.,;:]/g, '').trim();
    const garbageWords = ['cuanto', 'cuanta', 'cuantos', 'cuantas', 'hay', 'tengo', 'dime', 'busca', 'encuentra', 'saber', 'puedes', 'quiero', 'necesito', 'stock', 'inventario', 'producto', 'productos', 'precio', 'precios', 'cual', 'cuales', 'el', 'la', 'los', 'las', 'de', 'del', 'que', 'me', 'te', 'se', 'le', 'un', 'una', 'con', 'por', 'para', 'como', 'mas', 'pero', 'tiene', 'tienen', 'esta', 'este'];
    const searchTerm = raw.split(/\s+/).filter(w => w.length > 2 && !garbageWords.includes(w)).join(' ');

    const allProducts = await this.productService.getAllProducts(searchTerm || raw);
    const found = allProducts.length > 0 ? allProducts
      : searchTerm ? (await this.productService.getAllProducts()).filter(p =>
          p.name.toLowerCase().includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm)
        )
      : [];

    if (found.length === 0) {
      return { type: 'TEXT', content: `No encontré productos que coincidan con "${searchTerm || raw}".` };
    }

    const top = [...found].sort((a, b) => b.stock - a.stock).slice(0, 10);
    const lines = top.map(p =>
      `• ${p.name} — S/ ${p.price_sale.toFixed(2)} — Stock: ${p.stock}${p.stock <= (p.min_stock ?? 5) ? ' ⚠️' : ''}`
    );
    return { type: 'TEXT', content: `Productos encontrados:\n${lines.join('\n')}` };
  }

  private async handleMostExpensiveProduct(): Promise<AiResponseDTO> {
    const allProducts = await this.productService.getAllProducts();
    if (allProducts.length === 0) {
      return { type: 'TEXT', content: 'No hay productos registrados en el inventario.' };
    }

    const sorted = [...allProducts].sort((a, b) => b.price_sale - a.price_sale);
    const top5 = sorted.slice(0, 5);
    const maxProduct = top5[0];
    const respuesta = `El producto más costoso del inventario es **${maxProduct.name}** (SKU: ${maxProduct.sku}) con un precio de venta de **S/ ${maxProduct.price_sale.toFixed(2)}** (precio de compra: S/ ${maxProduct.price_purchase.toFixed(2)}). Stock actual: ${maxProduct.stock} unidades.

Otros productos de alto valor:
${top5.slice(1).map((p, i) => `${i + 2}. ${p.name} — S/ ${p.price_sale.toFixed(2)}`).join('\n')}`;

    return { type: 'TEXT', content: respuesta };
  }

  private async handleCheapestProduct(): Promise<AiResponseDTO> {
    const allProducts = await this.productService.getAllProducts();
    if (allProducts.length === 0) {
      return { type: 'TEXT', content: 'No hay productos registrados en el inventario.' };
    }

    const sorted = [...allProducts].sort((a, b) => a.price_sale - b.price_sale);
    const top5 = sorted.slice(0, 5);

    const minProduct = top5[0];
    const respuesta = `El producto más económico del inventario es **${minProduct.name}** (SKU: ${minProduct.sku}) con un precio de venta de **S/ ${minProduct.price_sale.toFixed(2)}**. Stock actual: ${minProduct.stock} unidades.

Otros productos económicos:
${top5.slice(1).map((p, i) => `${i + 2}. ${p.name} — S/ ${p.price_sale.toFixed(2)}`).join('\n')}`;

    return { type: 'TEXT', content: respuesta };
  }

  // ─── COUNTS ───

  private async handleProductCount(): Promise<AiResponseDTO> {
    const products = await this.productService.getAllProducts();
    const total = products.length;
    const active = products.filter(p => p.stock > 0).length;
    const lowStock = products.filter(p => p.stock <= (p.min_stock ?? 5)).length;
    return { type: 'TEXT', content: `📦 **${total} productos** en total.\n• Con stock: ${active}\n• Stock bajo: ${lowStock}` };
  }

  private async handleClientCount(): Promise<AiResponseDTO> {
    try {
      const clients = await this.clientService.getAllClients();
      return { type: 'TEXT', content: `👥 **${clients.length} clientes** registrados.` };
    } catch {
      return { type: 'TEXT', content: 'No se pudieron obtener los clientes.' };
    }
  }

  private async handleCategoryCount(): Promise<AiResponseDTO> {
    try {
      const { getContainer } = await import('../di/registry.js');
      const categories = await getContainer().categoryService.getAllCategories();
      return { type: 'TEXT', content: `📂 **${categories.length} categorías** registradas.` };
    } catch {
      return { type: 'TEXT', content: 'No se pudieron obtener las categorías.' };
    }
  }

  private async handleSupplierCount(): Promise<AiResponseDTO> {
    try {
      const { getContainer } = await import('../di/registry.js');
      const suppliers = await getContainer().supplierService.getAllSuppliers();
      return { type: 'TEXT', content: `🏢 **${suppliers.length} proveedores** registrados.` };
    } catch {
      return { type: 'TEXT', content: 'No se pudieron obtener los proveedores.' };
    }
  }

  // ─── ENTITY CREATION ───

  private handleEntityCreation(input: string, entities?: Record<string, unknown>): Promise<AiResponseDTO> {
    const q = input.toLowerCase();
    const entityType = ((entities?.entity_type as string) || '').toLowerCase();

    const extractProduct = (): AiResponseDTO => {
      const nameMatch = q.match(/(?:llamado|llamada|nombre)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|precio|un|una)|["""]?\s*$|,|\.)/i);
      const name = nameMatch?.[1]?.trim();
      if (!name || name.length <= 1) return null;

      const ppMatch = q.match(/precio\s*(?:de\s*)?compra\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const pvMatch = q.match(/precio\s*(?:de\s*)?venta\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);

      return {
        type: 'ACTION' as const, action: 'DRAFT_PRODUCT',
        payload: {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          price_purchase: ppMatch ? parseFloat(ppMatch[1]) : 0,
          price_sale: pvMatch ? parseFloat(pvMatch[1]) : 0,
          stock: 0, min_stock: 5,
        },
      };
    };

    const extractClient = (): AiResponseDTO => {
      const dniMatch = q.match(/\b(\d{6,11})\b/);
      const clName = q.match(/(?:llamado|llamada|nombre|cliente|persona)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|dni)|["""]?\s*$|,|\.)/i);

      if (!clName && !dniMatch) return null;

      return {
        type: 'ACTION' as const, action: 'DRAFT_CLIENT',
        payload: {
          name: clName?.[1] ? (clName[1].charAt(0).toUpperCase() + clName[1].slice(1)) : '',
          dni: dniMatch?.[1] || '',
          phone: null,
        },
      };
    };

    // Use entity_type from classifier to decide order
    if (entityType.includes('cliente') || entityType === 'client') {
      const client = extractClient();
      if (client) return Promise.resolve(client);
    }

    if (entityType.includes('producto') || entityType === 'product') {
      const product = extractProduct();
      if (product) return Promise.resolve(product);
    }

    // No classifier guidance: heuristic by keywords
    if (/cliente|persona/.test(q) && !/precio\s*(?:de\s*)?(?:compra|venta)/.test(q)) {
      const client = extractClient();
      if (client) return Promise.resolve(client);
    }

    if (!/cliente|persona/.test(q) || /precio|producto|sku/.test(q)) {
      const product = extractProduct();
      if (product) return Promise.resolve(product);
    }

    const client = extractClient();
    if (client) return Promise.resolve(client);

    return Promise.resolve({ type: 'TEXT', content: 'No pude entender los datos para crear. Especifica nombre, precio de compra y precio de venta del producto, o nombre y DNI del cliente.' });
  }

  // ─── SALE DRAFT ───

  private async handleSaleDraft(input: string, entities?: Record<string, unknown>): Promise<AiResponseDTO> {
    const productName = typeof entities?.producto === 'string' ? entities.producto.trim() : '';
    const clientName = typeof entities?.cliente === 'string' ? entities.cliente.trim() : '';
    const quantity = typeof entities?.cantidad === 'number' ? entities.cantidad
      : typeof entities?.cantidad === 'string' ? parseInt(entities.cantidad, 10) || 0
      : 0;

    // Use entities from classifier if available
    if (productName || clientName) {
      const [clients, products] = await Promise.all([
        clientName ? this.clientService.getAllClients(clientName) : Promise.resolve([]),
        productName ? this.productService.getAllProducts(productName) : Promise.resolve([]),
      ]);

      if (clients.length === 0 && products.length === 0) {
        return { type: 'TEXT', content: clientName
          ? `No encontré "${clientName}" como cliente ni "${productName}" como producto.`
          : `No encontré ningún producto llamado "${productName}".` };
      }

      const payload: Record<string, unknown> = {
        client_id: clients.length > 0 ? clients[0].id : null,
        client_name: clients.length > 0 ? clients[0].name : '',
        items: products.map(p => ({
          product_id: p.id,
          product_name: p.name,
          quantity: quantity > 0 ? quantity : 1,
          unit_price: p.price_sale,
        })),
      };

      return { type: 'ACTION', action: 'DRAFT_SALE', payload };
    }

    // Fallback: extract keywords directly from input
    const searchTerm = this.extractKeywords(input).join(' ');
    if (!searchTerm) {
      return { type: 'TEXT', content: 'Especifica qué producto y/o cliente para armar el carrito. Ej: "vende 2 cafes a juan perez".' };
    }

    const [clients, products] = await Promise.all([
      this.clientService.getAllClients(searchTerm),
      this.productService.getAllProducts(searchTerm),
    ]);

    if (clients.length === 0 && products.length === 0) {
      return { type: 'TEXT', content: 'No encontré clientes ni productos que coincidan con tu búsqueda.' };
    }

    const payload: Record<string, unknown> = {
      client_id: clients.length > 0 ? clients[0].id : null,
      client_name: clients.length > 0 ? clients[0].name : '',
      items: products.map(p => ({
        product_id: p.id,
        product_name: p.name,
        quantity: 1,
        unit_price: p.price_sale,
      })),
    };

    return { type: 'ACTION', action: 'DRAFT_SALE', payload };
  }

  // ─── GENERAL ───

  private async handleGeneralQuery(input: string): Promise<AiResponseDTO> {
    const q = input.toLowerCase();

    // Cliente de la última venta
    if (/a nombre de|comprador|cliente.*venta|quien.*compro|quien.*compró/.test(q)) {
      const lastSale = await this.dashboardService.getLastSaleWithClient();
      if (lastSale?.client_name) {
        return { type: 'TEXT', content: `La última venta fue a nombre de **${lastSale.client_name}**${lastSale.client_dni ? ` (${lastSale.client_dni})` : ''}.` };
      }
      const saleCount = (await this.dashboardService.getStats()).todaySalesCount;
      if (saleCount > 0) {
        return { type: 'TEXT', content: 'La última venta del día no tiene cliente registrado (venta al mostrador).' };
      }
      return { type: 'TEXT', content: 'No hay ventas registradas hoy.' };
    }

    const stats = await this.dashboardService.getStats();
    const products = await this.productService.getAllProducts();

    const masCaro = products.length > 0 ? [...products].sort((a, b) => b.price_sale - a.price_sale)[0] : null;
    const masBarato = products.length > 0 ? [...products].sort((a, b) => a.price_sale - b.price_sale)[0] : null;

    const lines: string[] = [];
    if (/producto|inventario/.test(q)) {
      lines.push(`📦 **${products.length} productos** en inventario.`);
      if (masCaro) lines.push(`💰 Más costoso: **${masCaro.name}** — S/ ${masCaro.price_sale.toFixed(2)}`);
      if (masBarato) lines.push(`💵 Más barato: **${masBarato.name}** — S/ ${masBarato.price_sale.toFixed(2)}`);
    }
    if (/venta|ganancia|ingreso/.test(q) || lines.length === 0) {
      lines.push(`📊 Hoy: S/ ${stats.todayRevenue.toFixed(2)} ingresos, ${stats.todaySalesCount} ventas, S/ ${stats.todayProfit.toFixed(2)} ganancia.`);
    }

    return { type: 'TEXT', content: lines.join('\n') };
  }

}
