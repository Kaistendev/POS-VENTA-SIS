import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  description: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  supplier_id: z.coerce.number().int().positive().optional().nullable(),
  price_purchase: z.coerce.number().min(0, "El precio de compra no puede ser negativo."),
  price_sale: z.coerce.number().min(0, "El precio de venta no puede ser negativo."),
  stock: z.coerce.number().int().optional(),
  min_stock: z.coerce.number().int().min(0).optional().default(10),
});

export const saleItemSchema = z.object({
  product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  unit_price: z.coerce.number().min(0, "El precio unitario no puede ser negativo."),
});

export const saleSchema = z.object({
  cash_register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
  client_id: z.coerce.number().int().optional(),
  client_dni: z.string().optional(),
  client_name: z.string().optional(),
  payment_method: z.enum(["CASH", "CARD"]).default("CASH"),
  items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto."),
});

export const cashRegisterSchema = z.object({
  opening_amount: z.coerce.number().min(0, "El monto de apertura no puede ser negativo."),
});

export const cashRegisterCloseSchema = z.object({
  register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
  closing_amount: z.coerce.number().min(0, "El monto de cierre no puede ser negativo."),
});

export const clientSchema = z.object({
  dni: z.string().min(1, "El DNI/Documento es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  phone: z.string().optional().nullable(),
  code: z.string().min(1, "El código de cliente es obligatorio."),
  tax_id: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre de la categoría es obligatorio.").max(255),
});

export const inventoryMovementSchema = z.object({
  product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
  type: z.enum(["ENTRADA", "SALIDA"], {
    errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }),
  }),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
});
