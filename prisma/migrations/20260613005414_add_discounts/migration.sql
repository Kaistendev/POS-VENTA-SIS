-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN "discount_amount" REAL DEFAULT 0;
ALTER TABLE "sale_items" ADD COLUMN "discount_name" TEXT;
ALTER TABLE "sale_items" ADD COLUMN "discount_type" TEXT;
ALTER TABLE "sale_items" ADD COLUMN "discount_value" REAL;
ALTER TABLE "sale_items" ADD COLUMN "final_unit_price" REAL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "discount_total" REAL DEFAULT 0;

-- CreateTable
CREATE TABLE "discounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applicable_to" TEXT NOT NULL DEFAULT 'ALL',
    "category_id" INTEGER,
    "min_purchase_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "discounts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_discounts" (
    "product_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,

    PRIMARY KEY ("product_id", "discount_id"),
    CONSTRAINT "product_discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
