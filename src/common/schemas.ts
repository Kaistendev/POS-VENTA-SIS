import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  description: z.string().optional(),
  category_id: z.number().int().positive().optional().nullable(),
  price_purchase: z.number().min(0, "El precio de compra no puede ser negativo."),
  price_sale: z.number().min(0, "El precio de venta no puede ser negativo."),
  stock: z.number().int().optional(),
  min_stock: z.number().int().min(0).optional().default(10),
});

export const saleItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0."),
  unit_price: z.number().min(0, "El precio unitario no puede ser negativo."),
});

export const saleSchema = z.object({
  cash_register_id: z.number().int().positive(),
  client_id: z.number().int().optional(),
  client_dni: z.string().optional(),
  client_name: z.string().optional(),
  payment_method: z.enum(["CASH", "CARD"]).default("CASH"),
  items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto."),
});

export const clientSchema = z.object({
  dni: z.string().min(1, "El DNI/Documento es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  phone: z.string().optional().nullable(),
  code: z.string().min(1, "El código de cliente es obligatorio."),
  tax_id: z.string().optional().nullable(),
});
