import { IAiProvider } from '../../domain/ports/IAiProvider.js';
import { IAiTrainingLogRepository } from '../../domain/ports/IAiTrainingLogRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { AiResponseDTO } from '../../domain/dtos.js';
import { ProductService } from './ProductService.js';
import { DashboardService } from './DashboardService.js';
import { ClientService } from './ClientService.js';
import { NeuralOrchestrator } from '../../infrastructure/neural/orchestrator/neuralOrchestrator.js';
import { UnifiedQueryService } from '../../infrastructure/neural/orchestrator/unifiedQueryService.js';
import { IntentCategory } from '../../infrastructure/neural/types.js';
import { ValidationPipeline } from '../../infrastructure/ai/validationPipeline.js';
import { logger } from '../../shared/logger.js';

export class AiService {
  private neuralOrchestrator: NeuralOrchestrator | null = null;
  private unifiedQueryService: UnifiedQueryService | null = null;
  private neuralEnabled = false;
  private validationPipeline: ValidationPipeline | null = null;

  constructor(
    private aiProvider: IAiProvider,
    private dashboardService: DashboardService,
    private productService: ProductService,
    private clientService: ClientService,
    private aiTrainingLogRepo?: IAiTrainingLogRepository,
  ) {}

  setNeuralOrchestrator(orchestrator: NeuralOrchestrator): void {
    this.neuralOrchestrator = orchestrator;
  }

  setUnifiedQueryService(service: UnifiedQueryService): void {
    this.unifiedQueryService = service;
  }

  setValidationPipeline(pipeline: ValidationPipeline): void {
    this.validationPipeline = pipeline;
  }

  async enableNeuralClassifier(): Promise<boolean> {
    if (!this.neuralOrchestrator) return false;
    const loaded = await this.neuralOrchestrator.isModelLoaded();
    this.neuralEnabled = loaded;
    if (loaded) {
      logger.info('Neural classifier enabled');
    }
    return loaded;
  }

  async processCommand(userInput: string): Promise<AiResponseDTO> {
    // ─── Neural + UQS classification → route by intent ───
    let intent: string | null = null;
    let confidence = 0;
    let entities: Record<string, unknown> = {};

    // Try UQS first (includes cache + neural + ambiguity)
    if (this.unifiedQueryService) {
      try {
        const uqs = await this.unifiedQueryService.query(userInput);
        if (uqs.source === 'cache' || uqs.source === 'neural') {
          intent = uqs.intent;
          confidence = uqs.confidence ?? 0;
        }
      } catch {
        logger.warn('[AiService] UQS failed, falling back to neural');
      }
    }

    // Fallback: direct neural classifier
    if (!intent && this.neuralEnabled && this.neuralOrchestrator) {
      try {
        const nn = await this.neuralOrchestrator.classify(userInput);
        if (nn.source === 'neural' || nn.source === 'cache') {
          intent = nn.intent;
          confidence = nn.confidence ?? 0;
        }
      } catch {
        logger.warn('[AiService] Neural classifier failed');
      }
    }

    // Final fallback: LLM intent classifier
    if (!intent) {
      const llm = await this.classifyWithLLM(userInput);
      if (llm?.intent) {
        intent = llm.intent;
        entities = llm.entities ?? {};
      }
    }

    if (intent) {
      return this.routeByIntent(intent as IntentCategory, userInput, entities);
    }

    return this.handleGeneralQuery(userInput);
  }

  private async routeByIntent(
    intent: string,
    userInput: string,
    entities: Record<string, unknown>,
  ): Promise<AiResponseDTO> {
    switch (intent) {
      case 'product_query':
        return this.handleStockQuery(userInput);
      case 'sales_summary':
        return this.handleSalesSummary(userInput);
      case 'entity_count': {
        const q = userInput.toLowerCase();
        const type = (entities?.entity_type as string) || '';
        if (/proveedor/.test(q) || type.includes('proveedor') || type === 'supplier') return this.handleSupplierCount();
        if (/categor/.test(q) || type.includes('categoria') || type === 'category') return this.handleCategoryCount();
        if (/cliente/.test(q) || type.includes('cliente') || type === 'client') return this.handleClientCount();
        if (/producto/.test(q) || type.includes('producto') || type === 'product') return this.handleProductCount();
        return this.handleGeneralQuery(userInput);
      }
      case 'entity_creation':
        return this.handleEntityCreation(userInput, entities);
      case 'data_modification':
        return this.handleDataModification(entities);
      case 'data_deletion':
        return this.handleDataDeletion(entities);
      case 'sale_draft':
        return this.handleSaleDraft(userInput, entities);
      default:
        return this.handleGeneralQuery(userInput);
    }
  }

  private async classifyWithLLM(input: string): Promise<{ intent: string; entities?: Record<string, unknown> } | null> {
    const systemRules = `Eres un clasificador de intenciones para un sistema POS. Tu única tarea es elegir un intent y extraer entidades clave. NO generes texto libre, NO respondas preguntas, SOLO clasifica.

## REGLAS DE CLASIFICACIÓN

### 1. product_query — Consultas sobre productos existentes
- Preguntas por precio, stock, SKU, productos caros/baratos, poco stock, buscar productos
- Incluye: "cuanto vale", "precio del", "dame el producto mas ...", "productos con poco stock", busqueda por SKU
- NO incluye: crear productos nuevos, contar productos

### 2. entity_count — Preguntar cuántos existen
- "cuantos productos", "cuantas categorias", "cuantos clientes", "cuantos proveedores"
- Palabras clave: cuantos, cuantas, total, registrados, existen, hay
- entity_type puede ser: "product", "client", "category", "supplier"

### 3. entity_creation — Crear/registrar un nuevo producto o cliente
- Producto: menciona "producto", "precio de compra", "precio de venta", "sku"
- Cliente: menciona "cliente", "persona", "dni", "documento"
- entity_type: "product" o "client"
- SI menciona "cliente" o "persona" SIN precios de compra/venta → entity_type = "client"
- SI menciona "precio de compra" o "precio de venta" → entity_type = "product"
- NUNCA uses entity_creation para modificar o borrar

### 4. data_modification — Modificar/editar/actualizar datos existentes
- "modificar", "editar", "actualizar", "cambiar precio", "cambiar nombre"
- Este intent NO tiene handler real, solo clasifica para dar mensaje

### 5. data_deletion — Eliminar/borrar datos existentes
- "eliminar", "borrar", "quitar", "dar de baja", "remover"
- Este intent NO tiene handler real, solo clasifica para dar mensaje

### 6. sale_draft — Preparar un carrito de venta
- "vender", "comprar", "carrito", "prepara venta", "arma venta"
- Incluye producto(s) y opcionalmente cliente
- Entities: producto (string), cantidad (number), cliente (string opcional)

### 7. sales_summary — Resumen de ventas/ganancias
- "cuanto se vendio", "resumen de ventas", "ganancias", "ingresos", "ventas del dia"

### 8. general — Cualquier cosa que no encaje arriba
- Saludos, preguntas existenciales, consultas no relacionadas al POS

## FORMATO DE RESPUESTA
Siempre responde SOLO un JSON: {"intent":"...","entities":{...}}
Si no hay entidades relevantes, entities puede ser {} u omitirse.

## EJEMPLOS`;
    const examples = `
product_query:
- cuales son los productos con poco stock → {"intent":"product_query","entities":{"query_type":"low_stock"}}
- quiero saber el producto mas caro → {"intent":"product_query","entities":{"query_type":"most_expensive"}}
- dame el precio del SKU BEB-001 → {"intent":"product_query","entities":{"query_type":"sku","sku":"BEB-001"}}
- cuanto vale el arroz → {"intent":"product_query"}
- cuales son los productos mas vendidos → {"intent":"product_query","entities":{"query_type":"top_sold"}}

entity_count:
- cuantos productos hay en total → {"intent":"entity_count","entities":{"entity_type":"product"}}
- cuantas categorias tengo → {"intent":"entity_count","entities":{"entity_type":"category"}}
- cuantos clientes registrados → {"intent":"entity_count","entities":{"entity_type":"client"}}
- cuantos proveedores existen → {"intent":"entity_count","entities":{"entity_type":"supplier"}}

entity_creation:
- registra un producto nuevo llamado te verde → {"intent":"entity_creation","entities":{"entity_type":"product","name":"Te verde"}}
- crea un cliente llamado juan perez con dni 12345678 → {"intent":"entity_creation","entities":{"entity_type":"client","name":"Juan Perez","dni":"12345678"}}
- registra un cliente nuevo maria lopez → {"intent":"entity_creation","entities":{"entity_type":"client","name":"Maria Lopez"}}
- crear producto castañas precio compra 1.30 precio venta 2 → {"intent":"entity_creation","entities":{"entity_type":"product","name":"Castañas","price_purchase":1.30,"price_sale":2}}

data_modification:
- modifica el precio del arroz → {"intent":"data_modification","entities":{"entity_type":"product","name":"arroz"}}
- actualiza el stock de la leche → {"intent":"data_modification","entities":{"entity_type":"product","name":"leche"}}
- cambiar nombre del cliente juan → {"intent":"data_modification","entities":{"entity_type":"client","name":"juan"}}

data_deletion:
- elimina el producto cafe → {"intent":"data_deletion","entities":{"entity_type":"product","name":"cafe"}}
- borrar cliente pedro → {"intent":"data_deletion","entities":{"entity_type":"client","name":"pedro"}}

sale_draft:
- vende 2 cafes a juan perez → {"intent":"sale_draft","entities":{"producto":"cafe","cantidad":2,"cliente":"juan perez"}}
- quiero comprar 3 arroz → {"intent":"sale_draft","entities":{"producto":"arroz","cantidad":3}}
- vende una leche a maria → {"intent":"sale_draft","entities":{"producto":"leche","cantidad":1,"cliente":"maria"}}
- prepara carrito con pan y mantequilla → {"intent":"sale_draft","entities":{"producto":"pan mantequilla","cantidad":1}}

sales_summary:
- cuanto se vendio ayer → {"intent":"sales_summary","entities":{"period":"yesterday"}}
- resumen de ventas de esta semana → {"intent":"sales_summary","entities":{"period":"week"}}
- dame las ganancias del dia → {"intent":"sales_summary"}

general:
- que productos estan por vencer → {"intent":"general"}
- quien compro la ultima venta → {"intent":"general"}
- hola como estas → {"intent":"general"}`;

    const prompt = `${systemRules}\n${examples}\n\nUsuario: ${input}\n\nJSON:`;
    const raw = await this.aiProvider.classifyIntent(input, prompt);
    if (!raw || typeof raw.intent !== 'string') return null;
    return raw as { intent: string; entities?: Record<string, unknown> };
  }

  async askAssistant(query: string, userId?: number): Promise<AiResponseDTO> {
    const response = await this.processCommand(query);
    await this.logInteraction(query, response, userId);
    return response;
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

  private async handleSalesSummary(input: string): Promise<AiResponseDTO> {
    const q = input.toLowerCase();

    // Top client
    if (/cliente\s+(que\s+)?(mas|más|top|mayor)\s+(compro|compró|gasto|gastó|compra)/i.test(q)) {
      const top = await this.dashboardService.getTopClients(1);
      if (top.length > 0) {
        const t = top[0];
        return { type: 'TEXT', content: `🥇 **${t.client_name}** es el cliente que más compró hoy:\n• ${t.total_purchases} compras\n• Total: S/ ${t.total_spent.toFixed(2)}\n• Promedio: S/ ${t.avg_purchase.toFixed(2)} por compra` };
      }
      return { type: 'TEXT', content: 'No hay ventas con clientes registrados hoy.' };
    }

    // Last sale client
    if (/a nombre de|comprador|cliente.*venta|quien.*compro|quien.*compró/i.test(q)) {
      const last = await this.dashboardService.getLastSaleWithClient();
      if (last?.client_name) {
        return { type: 'TEXT', content: `La última venta fue a nombre de **${last.client_name}**${last.client_dni ? ` (${last.client_dni})` : ''}.` };
      }
      const cnt = (await this.dashboardService.getStats()).todaySalesCount;
      if (cnt > 0) return { type: 'TEXT', content: 'La última venta del día no tiene cliente registrado (venta al mostrador).' };
      return { type: 'TEXT', content: 'No hay ventas registradas hoy.' };
    }

    // Default: sales summary
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

  private async handleEntityCreation(input: string, entities?: Record<string, unknown>): Promise<AiResponseDTO> {
    const q = input.toLowerCase();
    const entityType = ((entities?.entity_type as string) || '').toLowerCase();

    const extractProduct = (): { action: 'DRAFT_PRODUCT'; payload: Record<string, unknown> } | null => {
      const nameMatch = q.match(/(?:llamado|llamada|nombre)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|precio|un|una)|["""]?\s*$|,|\.)/i);
      const name = nameMatch?.[1]?.trim();
      if (!name || name.length <= 1) return null;

      const ppMatch = q.match(/precio\s*(?:de\s*)?compra\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const pvMatch = q.match(/precio\s*(?:de\s*)?venta\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);

      return {
        action: 'DRAFT_PRODUCT',
        payload: {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          price_purchase: ppMatch ? parseFloat(ppMatch[1]) : 0,
          price_sale: pvMatch ? parseFloat(pvMatch[1]) : 0,
          stock: 0, min_stock: 5,
        },
      };
    };

    const extractClient = (): { action: 'DRAFT_CLIENT'; payload: Record<string, unknown> } | null => {
      const dniMatch = q.match(/\b(\d{6,11})\b/);
      const clName = q.match(/(?:llamado|llamada|nombre|cliente|persona)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|dni)|["""]?\s*$|,|\.)/i);

      if (!clName && !dniMatch) return null;

      return {
        action: 'DRAFT_CLIENT',
        payload: {
          name: clName?.[1] ? (clName[1].charAt(0).toUpperCase() + clName[1].slice(1)) : '',
          dni: dniMatch?.[1] || '',
          phone: null,
        },
      };
    };

    let draft: { action: 'DRAFT_PRODUCT' | 'DRAFT_CLIENT'; payload: Record<string, unknown> } | null = null;

    if (entityType.includes('cliente') || entityType === 'client') {
      draft = extractClient();
    } else if (entityType.includes('producto') || entityType === 'product') {
      draft = extractProduct();
    }

    if (!draft) {
      if (/cliente|persona/.test(q) && !/precio/.test(q)) draft = extractClient();
      else if (!/cliente|persona/.test(q) || /precio|producto|sku/.test(q)) draft = extractProduct();
      else draft = extractClient();
    }

    if (!draft) {
      return { type: 'TEXT', content: 'No pude entender los datos para crear. Especifica nombre, precio de compra y precio de venta del producto, o nombre y DNI del cliente.' };
    }

    if (!this.validationPipeline) {
      return { type: 'ACTION', action: draft.action, payload: draft.payload };
    }

    const rateCheck = this.validationPipeline.checkRateLimit();
    if (!rateCheck.allowed) {
      return { type: 'TEXT', content: `Límite de solicitudes alcanzado. Espera ${Math.ceil(rateCheck.resetMs / 1000)}s antes de crear más.` };
    }

    const processed = await this.validationPipeline.processDraft(
      draft.action,
      draft.payload,
      (entities?.confidence as number) ?? 0,
      undefined,
      'neural',
    );

    if (processed.autoApproved) {
      try {
        const result = draft.action === 'DRAFT_PRODUCT'
          ? await this.productService.createProduct(draft.payload as any)
          : (await this.clientService.createClient(draft.payload as any)).id;
        return { type: 'TEXT', content: `✅ ${draft.action === 'DRAFT_PRODUCT' ? 'Producto' : 'Cliente'} creado automáticamente (alta confianza).` };
      } catch {
        return { type: 'TEXT', content: `No se pudo crear automáticamente. Revisa los datos en el formulario.`, draftId: processed.draft.id };
      }
    }

    return { type: 'ACTION', action: draft.action, payload: draft.payload, draftId: processed.draft.id, autoApproved: false };
  }

  // ─── DATA MODIFICATION / DELETION ───

  private handleDataModification(entities?: Record<string, unknown>): Promise<AiResponseDTO> {
    const entityType = ((entities?.entity_type as string) || '').toLowerCase();
    const name = (entities?.name as string) || '';

    if (entityType === 'client' || entityType.includes('cliente')) {
      return Promise.resolve({ type: 'TEXT', content: `Para modificar el cliente "${name}", ve a la sección Clientes y usa el botón Editar. El asistente IA solo puede consultar y crear datos, no modificarlos.` });
    }
    return Promise.resolve({ type: 'TEXT', content: `Para modificar ${name ? `"${name}"` : 'datos'}, ve a la sección correspondiente y usa el botón Editar. El asistente IA solo puede consultar y crear datos, no modificarlos.` });
  }

  private handleDataDeletion(entities?: Record<string, unknown>): Promise<AiResponseDTO> {
    const entityType = ((entities?.entity_type as string) || '').toLowerCase();
    const name = (entities?.name as string) || '';

    if (entityType === 'client' || entityType.includes('cliente')) {
      return Promise.resolve({ type: 'TEXT', content: `Para eliminar al cliente "${name}", ve a la sección Clientes y usa el botón Eliminar. El asistente IA no puede borrar datos por seguridad.` });
    }
    return Promise.resolve({ type: 'TEXT', content: `Para eliminar ${name ? `"${name}"` : 'datos'}, ve a la sección correspondiente y usa el botón Eliminar. El asistente IA no puede borrar datos por seguridad.` });
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

  private async logInteraction(query: string, response: AiResponseDTO, userId?: number): Promise<void> {
    if (!this.aiTrainingLogRepo || !userId) return;
    try {
      const nlu = response.type === 'ACTION'
        ? JSON.stringify({ intent: 'entity_creation', action: response.action, payload: response.payload })
        : null;
      await this.aiTrainingLogRepo.create({
        usuario_id: userId,
        mensaje_usuario: query,
        nlu_output: nlu,
        respuesta_sistema: response.type === 'TEXT' ? response.content : `[ACTION: ${response.action}]`,
      });
    } catch {
      // Log failure is non-critical
    }
  }

  // ─── GENERAL ───

  private async handleGeneralQuery(input: string): Promise<AiResponseDTO> {
    const stats = await this.dashboardService.getStats();
    const products = await this.productService.getAllProducts();
    const q = input.toLowerCase();

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
