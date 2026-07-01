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
  discount_id: z.coerce.number().int().positive().optional(),
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

// ─── Supplier ───
export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre del proveedor es obligatorio."),
  ruc: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
});

export const supplierUpdateSchema = z.object({
  name: z.string().min(1, "El nombre del proveedor es obligatorio.").optional(),
  ruc: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
});

// ─── Purchase ───
export const purchaseItemSchema = z.object({
  product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  unit_cost: z.coerce.number().min(0, "El costo unitario no puede ser negativo."),
});

export const purchaseSchema = z.object({
  supplier_id: z.coerce.number().int().positive("El ID del proveedor es obligatorio."),
  items: z.array(purchaseItemSchema).min(1, "La orden debe tener al menos un producto."),
  payment_status: z.enum(["PENDING", "PAID", "CANCELED"]).optional().default("PENDING"),
});

// ─── User ───
export const userCreateSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio.").max(50),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial").regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[a-z]/, "Debe contener al menos una minúscula").regex(/[0-9]/, "Debe contener al menos un número").regex(/[!@#$%^&*()_\-+=<>?/{}~|]/, "Debe contener al menos un carácter especial"),
  role: z.enum(["ADMIN", "VENDEDOR"], { errorMap: () => ({ message: "El rol debe ser ADMIN o VENDEDOR." }) }),
  question: z.string().optional(),
  answer: z.string().optional(),
});

export const userUpdateSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio.").max(50).optional(),
  role: z.enum(["ADMIN", "VENDEDOR"]).optional(),
});

// ─── Discount ───
export const discountSchema = z.object({
  name: z.string().min(1, "El nombre del descuento es obligatorio."),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"], {
    errorMap: () => ({ message: "El tipo debe ser PERCENTAGE o FIXED_AMOUNT." }),
  }),
  value: z.coerce.number().min(0, "El valor no puede ser negativo."),
  is_active: z.boolean().optional(),
  applicable_to: z.enum(["ALL", "CATEGORY", "SPECIFIC"]).optional(),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  product_ids: z.array(z.coerce.number().int().positive()).optional(),
  min_purchase_amount: z.coerce.number().min(0).optional().nullable(),
});

// ─── Settings allowlist ───
const SETTINGS_ALLOWLIST = [
  "business_name",
  "business_phone",
  "business_address",
  "business_tax_id",
  "ticket_footer",
  "business_logo",
  "exchange_rate_usd_ves",
  "tax_rate",
  "tax_type",
  "tax_included",
] as const;

export const settingsSchema = z.record(
  z.enum(SETTINGS_ALLOWLIST),
  z.string()
).refine(
  (val) => Object.keys(val).length > 0,
  { message: "Debe enviar al menos una configuración." }
);
