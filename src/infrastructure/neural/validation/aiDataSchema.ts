import { z } from 'zod';

const entityTypeEnum = z.enum(['product', 'client', 'supplier', 'category']);

const entityCreationBase = z.object({
  entity_type: entityTypeEnum,
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
});

const productCreationSchema = entityCreationBase.extend({
  entity_type: z.literal('product'),
  name: z.string().min(1),
  price_purchase: z.coerce.number().min(0, 'Precio de compra no puede ser negativo').default(0),
  price_sale: z.coerce.number().min(0, 'Precio de venta no puede ser negativo').default(0),
  stock: z.coerce.number().int().min(0).default(0),
  min_stock: z.coerce.number().int().min(0).default(5),
  sku: z.string().optional(),
  category_name: z.string().optional(),
});

const clientCreationSchema = entityCreationBase.extend({
  entity_type: z.literal('client'),
  name: z.string().min(1),
  dni: z.string().min(6, 'DNI debe tener al menos 6 caracteres').max(15).optional().default(''),
  phone: z.string().optional().nullable(),
});

const supplierCreationSchema = entityCreationBase.extend({
  entity_type: z.literal('supplier'),
  name: z.string().min(1),
  ruc: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
});

const categoryCreationSchema = entityCreationBase.extend({
  entity_type: z.literal('category'),
  name: z.string().min(1),
});

export const aiEntityCreationSchema = z.discriminatedUnion('entity_type', [
  productCreationSchema,
  clientCreationSchema,
  supplierCreationSchema,
  categoryCreationSchema,
]);

export type AiEntityCreation = z.infer<typeof aiEntityCreationSchema>;

const saleDraftItemSchema = z.object({
  product_name: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unit_price: z.coerce.number().min(0).optional(),
});

export const aiSaleDraftSchema = z.object({
  client_name: z.string().optional(),
  client_dni: z.string().optional(),
  items: z.array(saleDraftItemSchema).min(1, 'Debe tener al menos un producto'),
  payment_method: z.enum(['CASH', 'CARD']).optional().default('CASH'),
});

export type AiSaleDraft = z.infer<typeof aiSaleDraftSchema>;

export const aiChatInputSchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía').max(500, 'La consulta es demasiado larga (máx 500 caracteres)'),
});

export type AiChatInput = z.infer<typeof aiChatInputSchema>;

export const aiIntentClassificationSchema = z.object({
  intent: z.enum([
    'product_query',
    'entity_count',
    'entity_creation',
    'data_modification',
    'data_deletion',
    'sale_draft',
    'sales_summary',
    'general',
  ]),
  confidence: z.coerce.number().min(0).max(1).optional(),
  entities: z.record(z.string(), z.unknown()).optional(),
});

export type AiIntentClassification = z.infer<typeof aiIntentClassificationSchema>;
