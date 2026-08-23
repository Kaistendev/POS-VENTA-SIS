CREATE TABLE IF NOT EXISTS "discounts" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "applicable_to" TEXT NOT NULL DEFAULT 'ALL',
  "category_id" INTEGER,
  "min_purchase_amount" REAL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity");

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");

CREATE TABLE IF NOT EXISTS "product_discounts" (
  "product_id" INTEGER NOT NULL,
  "discount_id" INTEGER NOT NULL,
  PRIMARY KEY ("product_id", "discount_id")
);

CREATE TABLE IF NOT EXISTS "purchases" (
  "id" INTEGER NOT NULL,
  "supplier_id" INTEGER NOT NULL,
  "total_amount" REAL NOT NULL,
  "paid_amount" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "purchases_created_at_idx" ON "purchases" ("created_at");

CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases" ("status");

CREATE INDEX IF NOT EXISTS "purchases_supplier_id_idx" ON "purchases" ("supplier_id");

CREATE INDEX IF NOT EXISTS "purchases_payment_status_idx" ON "purchases" ("payment_status");

CREATE TABLE IF NOT EXISTS "supplier_payments" (
  "id" INTEGER NOT NULL,
  "supplier_id" INTEGER NOT NULL,
  "purchase_id" INTEGER,
  "amount" REAL NOT NULL,
  "note" TEXT,
  "created_by" INTEGER,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "supplier_payments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "supplier_payments_created_at_idx" ON "supplier_payments" ("created_at");

CREATE INDEX IF NOT EXISTS "supplier_payments_purchase_id_idx" ON "supplier_payments" ("purchase_id");

CREATE INDEX IF NOT EXISTS "supplier_payments_supplier_id_idx" ON "supplier_payments" ("supplier_id");

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "inventory_movements_product_id_type_idx" ON "inventory_movements" ("product_id", "type");

CREATE INDEX IF NOT EXISTS "inventory_movements_product_id_created_at_idx" ON "inventory_movements" ("product_id", "created_at");

CREATE INDEX IF NOT EXISTS "inventory_movements_type_idx" ON "inventory_movements" ("type");

CREATE INDEX IF NOT EXISTS "inventory_movements_product_id_idx" ON "inventory_movements" ("product_id");

CREATE TABLE IF NOT EXISTS "sale_items" (
  "id" INTEGER NOT NULL,
  "sale_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" REAL NOT NULL,
  "purchase_price" REAL NOT NULL,
  "discount_name" TEXT,
  "discount_type" TEXT,
  "discount_value" REAL,
  "discount_amount" REAL DEFAULT 0,
  "final_unit_price" REAL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sale_items_product_id_idx" ON "sale_items" ("product_id");

CREATE INDEX IF NOT EXISTS "sale_items_sale_id_idx" ON "sale_items" ("sale_id");

CREATE TABLE IF NOT EXISTS "settings" (
  "id" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_key" ON "settings" ("key");

CREATE TABLE IF NOT EXISTS "sales" (
  "id" INTEGER NOT NULL,
  "cash_register_id" INTEGER NOT NULL,
  "client_id" INTEGER NOT NULL,
  "total" REAL NOT NULL,
  "subtotal" REAL NOT NULL DEFAULT 0,
  "tax_amount" REAL NOT NULL DEFAULT 0,
  "discount_total" REAL DEFAULT 0,
  "payment_method" TEXT DEFAULT 'CASH',
  "exchange_rate" REAL NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sales_payment_method_idx" ON "sales" ("payment_method");

CREATE INDEX IF NOT EXISTS "sales_client_id_created_at_idx" ON "sales" ("client_id", "created_at");

CREATE INDEX IF NOT EXISTS "sales_cash_register_id_created_at_idx" ON "sales" ("cash_register_id", "created_at");

CREATE INDEX IF NOT EXISTS "sales_created_at_idx" ON "sales" ("created_at");

CREATE INDEX IF NOT EXISTS "sales_client_id_idx" ON "sales" ("client_id");

CREATE INDEX IF NOT EXISTS "sales_cash_register_id_idx" ON "sales" ("cash_register_id");

CREATE TABLE IF NOT EXISTS "cash_registers" (
  "id" INTEGER NOT NULL,
  "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "opening_amount" REAL NOT NULL,
  "total_sales" REAL NOT NULL DEFAULT 0,
  "closed_at" DATETIME,
  "closing_amount" REAL,
  "difference" REAL,
  "status" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" INTEGER NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category_id" INTEGER,
  "price_purchase" REAL NOT NULL,
  "price_sale" REAL NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "min_stock" INTEGER DEFAULT 5,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  "supplier_id" INTEGER,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "products_supplier_id_idx" ON "products" ("supplier_id");

CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("sku");

CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" ("name");

CREATE INDEX IF NOT EXISTS "products_stock_min_stock_idx" ON "products" ("stock", "min_stock");

CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" ("category_id");

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products" ("sku");

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "ruc" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_ruc_key" ON "suppliers" ("ruc");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" INTEGER NOT NULL,
  "purchase_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_cost" REAL NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "purchase_items_product_id_idx" ON "purchase_items" ("product_id");

CREATE INDEX IF NOT EXISTS "purchase_items_purchase_id_idx" ON "purchase_items" ("purchase_id");

CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "security_question" TEXT,
  "security_answer_hash" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users" ("username");

CREATE TABLE IF NOT EXISTS "clients" (
  "id" INTEGER NOT NULL,
  "dni" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "code" TEXT NOT NULL,
  "tax_id" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "clients_dni_idx" ON "clients" ("dni");

CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "clients" ("name");

CREATE UNIQUE INDEX IF NOT EXISTS "clients_tax_id_key" ON "clients" ("tax_id");

CREATE UNIQUE INDEX IF NOT EXISTS "clients_code_key" ON "clients" ("code");

CREATE UNIQUE INDEX IF NOT EXISTS "clients_dni_key" ON "clients" ("dni");
