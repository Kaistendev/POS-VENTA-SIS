import "dotenv/config";
import { BrowserWindow, app, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import * as path$1 from "node:path";
import { fileURLToPath as fileURLToPath$1 } from "node:url";
import * as runtime from "@prisma/client/runtime/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
//#region src/generated/prisma/internal/class.ts
var config = {
	"previewFeatures": [],
	"clientVersion": "7.7.0",
	"engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
	"activeProvider": "postgresql",
	"inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider     = \"postgresql\"\n  relationMode = \"prisma\"\n}\n\nmodel User {\n  id            Int      @id @default(autoincrement())\n  username      String   @unique @db.VarChar(255)\n  password_hash String   @db.VarChar(255)\n  role          String   @db.VarChar(50)\n  created_at    DateTime @default(now()) @map(\"created_at\")\n  updated_at    DateTime @updatedAt @map(\"updated_at\")\n\n  audit_logs AuditLog[]\n\n  @@map(\"users\")\n}\n\nmodel Client {\n  id         Int      @id @default(autoincrement())\n  dni        String   @unique @db.VarChar(20)\n  name       String   @db.VarChar(255)\n  phone      String?  @db.VarChar(50)\n  code       String   @unique @db.VarChar(50)\n  tax_id     String?  @unique @db.VarChar(50)\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  sales Sale[]\n\n  @@map(\"clients\")\n}\n\nmodel Category {\n  id         Int      @id @default(autoincrement())\n  name       String   @db.VarChar(255)\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  products Product[]\n\n  @@map(\"categories\")\n}\n\nmodel Product {\n  id             Int       @id @default(autoincrement())\n  sku            String    @unique @db.VarChar(100)\n  name           String    @db.VarChar(255)\n  description    String?   @db.Text\n  category_id    Int?\n  category       Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)\n  price_purchase Float     @map(\"price_purchase\")\n  price_sale     Float     @map(\"price_sale\")\n  stock          Int       @default(0)\n  min_stock      Int?      @default(5)\n  created_at     DateTime  @default(now()) @map(\"created_at\")\n  updated_at     DateTime  @updatedAt @map(\"updated_at\")\n\n  inventory_movements InventoryMovement[]\n  sale_items          SaleItem[]\n\n  @@index([category_id])\n  @@map(\"products\")\n}\n\nmodel CashRegister {\n  id             Int      @id @default(autoincrement())\n  opened_at      DateTime @default(now()) @map(\"opened_at\")\n  opening_amount Float    @map(\"opening_amount\")\n  total_sales    Float    @default(0) @map(\"total_sales\")\n  created_at     DateTime @default(now()) @map(\"created_at\")\n  updated_at     DateTime @updatedAt @map(\"updated_at\")\n\n  sales Sale[]\n\n  @@map(\"cash_registers\")\n}\n\nmodel Sale {\n  id               Int          @id @default(autoincrement())\n  cash_register_id Int\n  cash_register    CashRegister @relation(fields: [cash_register_id], references: [id])\n  client_id        Int\n  client           Client       @relation(fields: [client_id], references: [id])\n  total            Float\n  created_at       DateTime     @default(now()) @map(\"created_at\")\n  updated_at       DateTime     @updatedAt @map(\"updated_at\")\n\n  items SaleItem[]\n\n  @@index([cash_register_id])\n  @@index([client_id])\n  @@index([created_at])\n  @@map(\"sales\")\n}\n\nmodel SaleItem {\n  id             Int      @id @default(autoincrement())\n  sale_id        Int\n  sale           Sale     @relation(fields: [sale_id], references: [id], onDelete: Cascade)\n  product_id     Int\n  product        Product  @relation(fields: [product_id], references: [id])\n  quantity       Int\n  unit_price     Float\n  purchase_price Float\n  created_at     DateTime @default(now()) @map(\"created_at\")\n  updated_at     DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([sale_id])\n  @@index([product_id])\n  @@map(\"sale_items\")\n}\n\nmodel InventoryMovement {\n  id         Int      @id @default(autoincrement())\n  product_id Int\n  product    Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)\n  type       String   @db.VarChar(10) // ENTRADA | SALIDA\n  quantity   Int\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([product_id])\n  @@index([type])\n  @@map(\"inventory_movements\")\n}\n\nmodel AuditLog {\n  id         Int      @id @default(autoincrement())\n  user_id    Int\n  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)\n  action     String   @db.VarChar(100)\n  entity     String   @db.VarChar(100)\n  entity_id  Int\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([user_id])\n  @@index([entity])\n  @@index([created_at])\n  @@map(\"audit_logs\")\n}\n",
	"runtimeDataModel": {
		"models": {},
		"enums": {},
		"types": {}
	},
	"parameterizationSchema": {
		"strings": [],
		"graph": ""
	}
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"username\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password_hash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"audit_logs\",\"kind\":\"object\",\"type\":\"AuditLog\",\"relationName\":\"AuditLogToUser\"}],\"dbName\":\"users\"},\"Client\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"dni\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"code\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tax_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"sales\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"ClientToSale\"}],\"dbName\":\"clients\"},\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CategoryToProduct\"}],\"dbName\":\"categories\"},\"Product\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sku\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"category\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToProduct\"},{\"name\":\"price_purchase\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"price_purchase\"},{\"name\":\"price_sale\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"price_sale\"},{\"name\":\"stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"min_stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"inventory_movements\",\"kind\":\"object\",\"type\":\"InventoryMovement\",\"relationName\":\"InventoryMovementToProduct\"},{\"name\":\"sale_items\",\"kind\":\"object\",\"type\":\"SaleItem\",\"relationName\":\"ProductToSaleItem\"}],\"dbName\":\"products\"},\"CashRegister\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"opened_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"opened_at\"},{\"name\":\"opening_amount\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"opening_amount\"},{\"name\":\"total_sales\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"total_sales\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"sales\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"CashRegisterToSale\"}],\"dbName\":\"cash_registers\"},\"Sale\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"cash_register_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"cash_register\",\"kind\":\"object\",\"type\":\"CashRegister\",\"relationName\":\"CashRegisterToSale\"},{\"name\":\"client_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"client\",\"kind\":\"object\",\"type\":\"Client\",\"relationName\":\"ClientToSale\"},{\"name\":\"total\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"SaleItem\",\"relationName\":\"SaleToSaleItem\"}],\"dbName\":\"sales\"},\"SaleItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sale_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sale\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"SaleToSaleItem\"},{\"name\":\"product_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToSaleItem\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unit_price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"purchase_price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"sale_items\"},\"InventoryMovement\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"InventoryMovementToProduct\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"inventory_movements\"},\"AuditLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"user_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AuditLogToUser\"},{\"name\":\"action\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entity\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entity_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"audit_logs\"}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
	strings: JSON.parse("[\"where\",\"orderBy\",\"cursor\",\"user\",\"audit_logs\",\"_count\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"sales\",\"cash_register\",\"client\",\"sale\",\"products\",\"category\",\"product\",\"inventory_movements\",\"sale_items\",\"items\",\"Client.findUnique\",\"Client.findUniqueOrThrow\",\"Client.findFirst\",\"Client.findFirstOrThrow\",\"Client.findMany\",\"Client.createOne\",\"Client.createMany\",\"Client.createManyAndReturn\",\"Client.updateOne\",\"Client.updateMany\",\"Client.updateManyAndReturn\",\"Client.upsertOne\",\"Client.deleteOne\",\"Client.deleteMany\",\"Client.groupBy\",\"Client.aggregate\",\"Category.findUnique\",\"Category.findUniqueOrThrow\",\"Category.findFirst\",\"Category.findFirstOrThrow\",\"Category.findMany\",\"Category.createOne\",\"Category.createMany\",\"Category.createManyAndReturn\",\"Category.updateOne\",\"Category.updateMany\",\"Category.updateManyAndReturn\",\"Category.upsertOne\",\"Category.deleteOne\",\"Category.deleteMany\",\"Category.groupBy\",\"Category.aggregate\",\"Product.findUnique\",\"Product.findUniqueOrThrow\",\"Product.findFirst\",\"Product.findFirstOrThrow\",\"Product.findMany\",\"Product.createOne\",\"Product.createMany\",\"Product.createManyAndReturn\",\"Product.updateOne\",\"Product.updateMany\",\"Product.updateManyAndReturn\",\"Product.upsertOne\",\"Product.deleteOne\",\"Product.deleteMany\",\"Product.groupBy\",\"Product.aggregate\",\"CashRegister.findUnique\",\"CashRegister.findUniqueOrThrow\",\"CashRegister.findFirst\",\"CashRegister.findFirstOrThrow\",\"CashRegister.findMany\",\"CashRegister.createOne\",\"CashRegister.createMany\",\"CashRegister.createManyAndReturn\",\"CashRegister.updateOne\",\"CashRegister.updateMany\",\"CashRegister.updateManyAndReturn\",\"CashRegister.upsertOne\",\"CashRegister.deleteOne\",\"CashRegister.deleteMany\",\"CashRegister.groupBy\",\"CashRegister.aggregate\",\"Sale.findUnique\",\"Sale.findUniqueOrThrow\",\"Sale.findFirst\",\"Sale.findFirstOrThrow\",\"Sale.findMany\",\"Sale.createOne\",\"Sale.createMany\",\"Sale.createManyAndReturn\",\"Sale.updateOne\",\"Sale.updateMany\",\"Sale.updateManyAndReturn\",\"Sale.upsertOne\",\"Sale.deleteOne\",\"Sale.deleteMany\",\"Sale.groupBy\",\"Sale.aggregate\",\"SaleItem.findUnique\",\"SaleItem.findUniqueOrThrow\",\"SaleItem.findFirst\",\"SaleItem.findFirstOrThrow\",\"SaleItem.findMany\",\"SaleItem.createOne\",\"SaleItem.createMany\",\"SaleItem.createManyAndReturn\",\"SaleItem.updateOne\",\"SaleItem.updateMany\",\"SaleItem.updateManyAndReturn\",\"SaleItem.upsertOne\",\"SaleItem.deleteOne\",\"SaleItem.deleteMany\",\"SaleItem.groupBy\",\"SaleItem.aggregate\",\"InventoryMovement.findUnique\",\"InventoryMovement.findUniqueOrThrow\",\"InventoryMovement.findFirst\",\"InventoryMovement.findFirstOrThrow\",\"InventoryMovement.findMany\",\"InventoryMovement.createOne\",\"InventoryMovement.createMany\",\"InventoryMovement.createManyAndReturn\",\"InventoryMovement.updateOne\",\"InventoryMovement.updateMany\",\"InventoryMovement.updateManyAndReturn\",\"InventoryMovement.upsertOne\",\"InventoryMovement.deleteOne\",\"InventoryMovement.deleteMany\",\"InventoryMovement.groupBy\",\"InventoryMovement.aggregate\",\"AuditLog.findUnique\",\"AuditLog.findUniqueOrThrow\",\"AuditLog.findFirst\",\"AuditLog.findFirstOrThrow\",\"AuditLog.findMany\",\"AuditLog.createOne\",\"AuditLog.createMany\",\"AuditLog.createManyAndReturn\",\"AuditLog.updateOne\",\"AuditLog.updateMany\",\"AuditLog.updateManyAndReturn\",\"AuditLog.upsertOne\",\"AuditLog.deleteOne\",\"AuditLog.deleteMany\",\"AuditLog.groupBy\",\"AuditLog.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"user_id\",\"action\",\"entity\",\"entity_id\",\"created_at\",\"updated_at\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"product_id\",\"type\",\"quantity\",\"sale_id\",\"unit_price\",\"purchase_price\",\"cash_register_id\",\"client_id\",\"total\",\"opened_at\",\"opening_amount\",\"total_sales\",\"every\",\"some\",\"none\",\"sku\",\"name\",\"description\",\"category_id\",\"price_purchase\",\"price_sale\",\"stock\",\"min_stock\",\"dni\",\"phone\",\"code\",\"tax_id\",\"username\",\"password_hash\",\"role\",\"is\",\"isNot\",\"connectOrCreate\",\"upsert\",\"createMany\",\"set\",\"disconnect\",\"delete\",\"connect\",\"updateMany\",\"deleteMany\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
	graph: "-wNhkAEKBAAApgIAIKgBAAClAgAwqQEAAAkAEKoBAAClAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHYAQEAAAAB2QEBAJMCACHaAQEAkwIAIQEAAAABACALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAIUCACGsAQIAhQIAIa0BAQCTAgAhrgEBAJMCACGvAQIAhQIAIbABQACGAgAhsQFAAIYCACEBAwAA0QMAIAsDAACoAgAgqAEAAKcCADCpAQAAAwAQqgEAAKcCADCrAQIAAAABrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAADACABAAAAAQAgCgQAAKYCACCoAQAApQIAMKkBAAAJABCqAQAApQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIdgBAQCTAgAh2QEBAJMCACHaAQEAkwIAIQEEAADQAwAgAwAAAAkAIAEAAAoAMAIAAAEAIAMAAAAJACABAAAKADACAAABACADAAAACQAgAQAACgAwAgAAAQAgBwQAAM8DACCrAQIAAAABsAFAAAAAAbEBQAAAAAHYAQEAAAAB2QEBAAAAAdoBAQAAAAEBCwAADgAgBqsBAgAAAAGwAUAAAAABsQFAAAAAAdgBAQAAAAHZAQEAAAAB2gEBAAAAAQELAAAQADABCwAAEAAwBwQAAMIDACCrAQIArwIAIbABQACwAgAhsQFAALACACHYAQEArgIAIdkBAQCuAgAh2gEBAK4CACECAAAAAQAgCwAAEwAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIdgBAQCuAgAh2QEBAK4CACHaAQEArgIAIQIAAAAJACALAAAVACACAAAACQAgCwAAFQAgAwAAAAEAIBIAAA4AIBMAABMAIAEAAAABACABAAAACQAgBQUAAL0DACAYAAC-AwAgGQAAwQMAIBoAAMADACAbAAC_AwAgCagBAACkAgAwqQEAABwAEKoBAACkAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAh2AEBAPUBACHZAQEA9QEAIdoBAQD1AQAhAwAAAAkAIAEAABsAMBcAABwAIAMAAAAJACABAAAKADACAAABACAMHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHNAQEAkwIAIdQBAQAAAAHVAQEAlwIAIdYBAQAAAAHXAQEAAAABAQAAAB8AIAwfAACiAgAgIAAAowIAICcAAJ4CACCoAQAAoQIAMKkBAAAhABCqAQAAoQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcMBAgCFAgAhxAECAIUCACHFAQgAhwIAIQMfAAC7AwAgIAAAvAMAICcAALkDACAMHwAAogIAICAAAKMCACAnAACeAgAgqAEAAKECADCpAQAAIQAQqgEAAKECADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIcMBAgCFAgAhxAECAIUCACHFAQgAhwIAIQMAAAAhACABAAAiADACAAAjACADAAAAIQAgAQAAIgAwAgAAIwAgAQAAACEAIA0hAACgAgAgJAAAmQIAIKgBAACfAgAwqQEAACcAEKoBAACfAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhvQECAIUCACG_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_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAgAAAC8AIAsAAHUAIAurAQIArwIAIbABQACwAgAhsQFAALACACHMAQEArgIAIc0BAQCuAgAhzgEBAPUCACHPAQIA9gIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAgAAAC0AIAsAAHcAIAIAAAAtACALAAB3ACABAAAAKwAgAwAAAC8AIBIAAG8AIBMAAHUAIAEAAAAvACABAAAALQAgCAUAAPACACAYAADxAgAgGQAA9AIAIBoAAPMCACAbAADyAgAgzgEAAO8CACDPAQAA7wIAINMBAADvAgAgDqgBAACJAgAwqQEAAH8AEKoBAACJAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzAEBAPUBACHNAQEA9QEAIc4BAQCKAgAhzwECAIsCACHQAQgAgAIAIdEBCACAAgAh0gECAPQBACHTAQIAiwIAIQMAAAAtACABAAB-ADAXAAB_ACADAAAALQAgAQAALgAwAgAALwAgCh4AAIgCACCoAQAAhAIAMKkBAACFAQAQqgEAAIQCADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIQEAAACCAQAgAQAAAIIBACAKHgAAiAIAIKgBAACEAgAwqQEAAIUBABCqAQAAhAIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIQEeAADuAgAgAwAAAIUBACABAACGAQAwAgAAggEAIAMAAACFAQAgAQAAhgEAMAIAAIIBACADAAAAhQEAIAEAAIYBADACAACCAQAgBx4AAO0CACCrAQIAAAABsAFAAAAAAbEBQAAAAAHGAUAAAAABxwEIAAAAAcgBCAAAAAEBCwAAigEAIAarAQIAAAABsAFAAAAAAbEBQAAAAAHGAUAAAAABxwEIAAAAAcgBCAAAAAEBCwAAjAEAMAELAACMAQAwBx4AAOACACCrAQIArwIAIbABQACwAgAhsQFAALACACHGAUAAsAIAIccBCAC_AgAhyAEIAL8CACECAAAAggEAIAsAAI8BACAGqwECAK8CACGwAUAAsAIAIbEBQACwAgAhxgFAALACACHHAQgAvwIAIcgBCAC_AgAhAgAAAIUBACALAACRAQAgAgAAAIUBACALAACRAQAgAwAAAIIBACASAACKAQAgEwAAjwEAIAEAAACCAQAgAQAAAIUBACAFBQAA2wIAIBgAANwCACAZAADfAgAgGgAA3gIAIBsAAN0CACAJqAEAAIMCADCpAQAAmAEAEKoBAACDAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhxgFAAPYBACHHAQgAgAIAIcgBCACAAgAhAwAAAIUBACABAACXAQAwFwAAmAEAIAMAAACFAQAgAQAAhgEAMAIAAIIBACABAAAAIwAgAQAAACMAIAMAAAAhACABAAAiADACAAAjACADAAAAIQAgAQAAIgAwAgAAIwAgAwAAACEAIAEAACIAMAIAACMAIAkfAADYAgAgIAAA2QIAICcAANoCACCrAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxAECAAAAAcUBCAAAAAEBCwAAoAEAIAarAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxAECAAAAAcUBCAAAAAEBCwAAogEAMAELAACiAQAwCR8AAMkCACAgAADKAgAgJwAAywIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQIAAAAjACALAAClAQAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQIAAAAhACALAACnAQAgAgAAACEAIAsAAKcBACADAAAAIwAgEgAAoAEAIBMAAKUBACABAAAAIwAgAQAAACEAIAUFAADEAgAgGAAAxQIAIBkAAMgCACAaAADHAgAgGwAAxgIAIAmoAQAAggIAMKkBAACuAQAQqgEAAIICADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACHDAQIA9AEAIcQBAgD0AQAhxQEIAIACACEDAAAAIQAgAQAArQEAMBcAAK4BACADAAAAIQAgAQAAIgAwAgAAIwAgAQAAACkAIAEAAAApACADAAAAJwAgAQAAKAAwAgAAKQAgAwAAACcAIAEAACgAMAIAACkAIAMAAAAnACABAAAoADACAAApACAKIQAAwgIAICQAAMMCACCrAQIAAAABsAFAAAAAAbEBQAAAAAG9AQIAAAABvwECAAAAAcABAgAAAAHBAQgAAAABwgEIAAAAAQELAAC2AQAgCKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwAECAAAAAcEBCAAAAAHCAQgAAAABAQsAALgBADABCwAAuAEAMAohAADAAgAgJAAAwQIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvwECAK8CACHAAQIArwIAIcEBCAC_AgAhwgEIAL8CACECAAAAKQAgCwAAuwEAIAirAQIArwIAIbABQACwAgAhsQFAALACACG9AQIArwIAIb8BAgCvAgAhwAECAK8CACHBAQgAvwIAIcIBCAC_AgAhAgAAACcAIAsAAL0BACACAAAAJwAgCwAAvQEAIAMAAAApACASAAC2AQAgEwAAuwEAIAEAAAApACABAAAAJwAgBQUAALoCACAYAAC7AgAgGQAAvgIAIBoAAL0CACAbAAC8AgAgC6gBAAD_AQAwqQEAAMQBABCqAQAA_wEAMKsBAgD0AQAhsAFAAPYBACGxAUAA9gEAIb0BAgD0AQAhvwECAPQBACHAAQIA9AEAIcEBCACAAgAhwgEIAIACACEDAAAAJwAgAQAAwwEAMBcAAMQBACADAAAAJwAgAQAAKAAwAgAAKQAgAQAAADQAIAEAAAA0ACADAAAAMgAgAQAAMwAwAgAANAAgAwAAADIAIAEAADMAMAIAADQAIAMAAAAyACABAAAzADACAAA0ACAHJAAAuQIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG-AQEAAAABvwECAAAAAQELAADMAQAgBqsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG-AQEAAAABvwECAAAAAQELAADOAQAwAQsAAM4BADAHJAAAuAIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvgEBAK4CACG_AQIArwIAIQIAAAA0ACALAADRAQAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvgEBAK4CACG_AQIArwIAIQIAAAAyACALAADTAQAgAgAAADIAIAsAANMBACADAAAANAAgEgAAzAEAIBMAANEBACABAAAANAAgAQAAADIAIAUFAACzAgAgGAAAtAIAIBkAALcCACAaAAC2AgAgGwAAtQIAIAmoAQAA_gEAMKkBAADaAQAQqgEAAP4BADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACG9AQIA9AEAIb4BAQD1AQAhvwECAPQBACEDAAAAMgAgAQAA2QEAMBcAANoBACADAAAAMgAgAQAAMwAwAgAANAAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAIAwAAsgIAIKsBAgAAAAGsAQIAAAABrQEBAAAAAa4BAQAAAAGvAQIAAAABsAFAAAAAAbEBQAAAAAEBCwAA4gEAIAerAQIAAAABrAECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABAQsAAOQBADABCwAA5AEAMAgDAACxAgAgqwECAK8CACGsAQIArwIAIa0BAQCuAgAhrgEBAK4CACGvAQIArwIAIbABQACwAgAhsQFAALACACECAAAABQAgCwAA5wEAIAerAQIArwIAIawBAgCvAgAhrQEBAK4CACGuAQEArgIAIa8BAgCvAgAhsAFAALACACGxAUAAsAIAIQIAAAADACALAADpAQAgAgAAAAMAIAsAAOkBACADAAAABQAgEgAA4gEAIBMAAOcBACABAAAABQAgAQAAAAMAIAUFAACpAgAgGAAAqgIAIBkAAK0CACAaAACsAgAgGwAAqwIAIAqoAQAA8wEAMKkBAADwAQAQqgEAAPMBADCrAQIA9AEAIawBAgD0AQAhrQEBAPUBACGuAQEA9QEAIa8BAgD0AQAhsAFAAPYBACGxAUAA9gEAIQMAAAADACABAADvAQAwFwAA8AEAIAMAAAADACABAAAEADACAAAFACAKqAEAAPMBADCpAQAA8AEAEKoBAADzAQAwqwECAPQBACGsAQIA9AEAIa0BAQD1AQAhrgEBAPUBACGvAQIA9AEAIbABQAD2AQAhsQFAAPYBACENBQAA-AEAIBgAAP0BACAZAAD4AQAgGgAA-AEAIBsAAPgBACCyAQIAAAABswECAAAABLQBAgAAAAS1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAPwBACEOBQAA-AEAIBoAAPsBACAbAAD7AQAgsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD6AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABCwUAAPgBACAaAAD5AQAgGwAA-QEAILIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA9wEAIQsFAAD4AQAgGgAA-QEAIBsAAPkBACCyAUAAAAABswFAAAAABLQBQAAAAAS1AUAAAAABtgFAAAAAAbcBQAAAAAG4AUAAAAABuQFAAPcBACEIsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD4AQAhCLIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA-QEAIQ4FAAD4AQAgGgAA-wEAIBsAAPsBACCyAQEAAAABswEBAAAABLQBAQAAAAS1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAPoBACG6AQEAAAABuwEBAAAAAbwBAQAAAAELsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD7AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABDQUAAPgBACAYAAD9AQAgGQAA-AEAIBoAAPgBACAbAAD4AQAgsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD8AQAhCLIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgA_QEAIQmoAQAA_gEAMKkBAADaAQAQqgEAAP4BADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACG9AQIA9AEAIb4BAQD1AQAhvwECAPQBACELqAEAAP8BADCpAQAAxAEAEKoBAAD_AQAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhvQECAPQBACG_AQIA9AEAIcABAgD0AQAhwQEIAIACACHCAQgAgAIAIQ0FAAD4AQAgGAAA_QEAIBkAAP0BACAaAAD9AQAgGwAA_QEAILIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAgQIAIQ0FAAD4AQAgGAAA_QEAIBkAAP0BACAaAAD9AQAgGwAA_QEAILIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAgQIAIQmoAQAAggIAMKkBAACuAQAQqgEAAIICADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACHDAQIA9AEAIcQBAgD0AQAhxQEIAIACACEJqAEAAIMCADCpAQAAmAEAEKoBAACDAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhxgFAAPYBACHHAQgAgAIAIcgBCACAAgAhCh4AAIgCACCoAQAAhAIAMKkBAACFAQAQqgEAAIQCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHGAUAAhgIAIccBCACHAgAhyAEIAIcCACEIsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD4AQAhCLIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA-QEAIQiyAQgAAAABswEIAAAABLQBCAAAAAS1AQgAAAABtgEIAAAAAbcBCAAAAAG4AQgAAAABuQEIAP0BACEDyQEAACEAIMoBAAAhACDLAQAAIQAgDqgBAACJAgAwqQEAAH8AEKoBAACJAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzAEBAPUBACHNAQEA9QEAIc4BAQCKAgAhzwECAIsCACHQAQgAgAIAIdEBCACAAgAh0gECAPQBACHTAQIAiwIAIQ4FAACNAgAgGgAAkAIAIBsAAJACACCyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAI8CACG6AQEAAAABuwEBAAAAAbwBAQAAAAENBQAAjQIAIBgAAI4CACAZAACNAgAgGgAAjQIAIBsAAI0CACCyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAIwCACENBQAAjQIAIBgAAI4CACAZAACNAgAgGgAAjQIAIBsAAI0CACCyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAIwCACEIsgECAAAAAbMBAgAAAAW0AQIAAAAFtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgCNAgAhCLIBCAAAAAGzAQgAAAAFtAEIAAAABbUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAjgIAIQ4FAACNAgAgGgAAkAIAIBsAAJACACCyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAI8CACG6AQEAAAABuwEBAAAAAbwBAQAAAAELsgEBAAAAAbMBAQAAAAW0AQEAAAAFtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCQAgAhugEBAAAAAbsBAQAAAAG8AQEAAAABB6gBAACRAgAwqQEAAGcAEKoBAACRAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzQEBAPUBACEIIgAAlAIAIKgBAACSAgAwqQEAACsAEKoBAACSAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACELsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD7AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABA8kBAAAtACDKAQAALQAgywEAAC0AIAuoAQAAlQIAMKkBAABPABCqAQAAlQIAMKsBAgD0AQAhsAFAAPYBACGxAUAA9gEAIc0BAQD1AQAh1AEBAPUBACHVAQEAigIAIdYBAQD1AQAh1wEBAIoCACEMHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHUAQEAkwIAIdUBAQCXAgAh1gEBAJMCACHXAQEAlwIAIQuyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAJACACG6AQEAAAABuwEBAAAAAbwBAQAAAAEKJAAAmQIAIKgBAACYAgAwqQEAADIAEKoBAACYAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhvQECAIUCACG-AQEAkwIAIb8BAgCFAgAhEyMAAJwCACAlAACdAgAgJgAAngIAIKgBAACaAgAwqQEAAC0AEKoBAACaAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIdsBAAAtACDcAQAALQAgESMAAJwCACAlAACdAgAgJgAAngIAIKgBAACaAgAwqQEAAC0AEKoBAACaAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIQiyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAI0CACEKIgAAlAIAIKgBAACSAgAwqQEAACsAEKoBAACSAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHbAQAAKwAg3AEAACsAIAPJAQAAMgAgygEAADIAIMsBAAAyACADyQEAACcAIMoBAAAnACDLAQAAJwAgDSEAAKACACAkAACZAgAgqAEAAJ8CADCpAQAAJwAQqgEAAJ8CADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb8BAgCFAgAhwAECAIUCACHBAQgAhwIAIcIBCACHAgAhDh8AAKICACAgAACjAgAgJwAAngIAIKgBAAChAgAwqQEAACEAEKoBAAChAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhwwECAIUCACHEAQIAhQIAIcUBCACHAgAh2wEAACEAINwBAAAhACAMHwAAogIAICAAAKMCACAnAACeAgAgqAEAAKECADCpAQAAIQAQqgEAAKECADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACEMHgAAiAIAIKgBAACEAgAwqQEAAIUBABCqAQAAhAIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIdsBAACFAQAg3AEAAIUBACAOHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHUAQEAkwIAIdUBAQCXAgAh1gEBAJMCACHXAQEAlwIAIdsBAAA8ACDcAQAAPAAgCagBAACkAgAwqQEAABwAEKoBAACkAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAh2AEBAPUBACHZAQEA9QEAIdoBAQD1AQAhCgQAAKYCACCoAQAApQIAMKkBAAAJABCqAQAApQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIdgBAQCTAgAh2QEBAJMCACHaAQEAkwIAIQPJAQAAAwAgygEAAAMAIMsBAAADACALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAIUCACGsAQIAhQIAIa0BAQCTAgAhrgEBAJMCACGvAQIAhQIAIbABQACGAgAhsQFAAIYCACEMBAAApgIAIKgBAAClAgAwqQEAAAkAEKoBAAClAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAh2AEBAJMCACHZAQEAkwIAIdoBAQCTAgAh2wEAAAkAINwBAAAJACAAAAAAAAHgAQEAAAABBeABAgAAAAHmAQIAAAAB5wECAAAAAegBAgAAAAHpAQIAAAABAeABQAAAAAEFEgAA9wMAIBMAAPoDACDdAQAA-AMAIN4BAAD5AwAg4wEAAAEAIAMSAAD3AwAg3QEAAPgDACDjAQAAAQAgAAAAAAAFEgAA8gMAIBMAAPUDACDdAQAA8wMAIN4BAAD0AwAg4wEAAC8AIAMSAADyAwAg3QEAAPMDACDjAQAALwAgAAAAAAAF4AEIAAAAAeYBCAAAAAHnAQgAAAAB6AEIAAAAAekBCAAAAAEFEgAA6gMAIBMAAPADACDdAQAA6wMAIN4BAADvAwAg4wEAACMAIAUSAADoAwAgEwAA7QMAIN0BAADpAwAg3gEAAOwDACDjAQAALwAgAxIAAOoDACDdAQAA6wMAIOMBAAAjACADEgAA6AMAIN0BAADpAwAg4wEAAC8AIAAAAAAABRIAAN8DACATAADmAwAg3QEAAOADACDeAQAA5QMAIOMBAACCAQAgBRIAAN0DACATAADjAwAg3QEAAN4DACDeAQAA4gMAIOMBAAAfACALEgAAzAIAMBMAANECADDdAQAAzQIAMN4BAADOAgAw3wEAAM8CACDgAQAA0AIAMOEBAADQAgAw4gEAANACADDjAQAA0AIAMOQBAADSAgAw5QEAANMCADAIJAAAwwIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwQEIAAAAAcIBCAAAAAECAAAAKQAgEgAA1wIAIAMAAAApACASAADXAgAgEwAA1gIAIAELAADhAwAwDSEAAKACACAkAACZAgAgqAEAAJ8CADCpAQAAJwAQqgEAAJ8CADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvwECAIUCACHAAQIAhQIAIcEBCACHAgAhwgEIAIcCACECAAAAKQAgCwAA1gIAIAIAAADUAgAgCwAA1QIAIAuoAQAA0wIAMKkBAADUAgAQqgEAANMCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb8BAgCFAgAhwAECAIUCACHBAQgAhwIAIcIBCACHAgAhC6gBAADTAgAwqQEAANQCABCqAQAA0wIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvwECAIUCACHAAQIAhQIAIcEBCACHAgAhwgEIAIcCACEHqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvQECAK8CACG_AQIArwIAIcEBCAC_AgAhwgEIAL8CACEIJAAAwQIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvwECAK8CACHBAQgAvwIAIcIBCAC_AgAhCCQAAMMCACCrAQIAAAABsAFAAAAAAbEBQAAAAAG9AQIAAAABvwECAAAAAcEBCAAAAAHCAQgAAAABAxIAAN8DACDdAQAA4AMAIOMBAACCAQAgAxIAAN0DACDdAQAA3gMAIOMBAAAfACAEEgAAzAIAMN0BAADNAgAw3wEAAM8CACDjAQAA0AIAMAAAAAAACxIAAOECADATAADmAgAw3QEAAOICADDeAQAA4wIAMN8BAADkAgAg4AEAAOUCADDhAQAA5QIAMOIBAADlAgAw4wEAAOUCADDkAQAA5wIAMOUBAADoAgAwByAAANkCACAnAADaAgAgqwECAAAAAbABQAAAAAGxAUAAAAABxAECAAAAAcUBCAAAAAECAAAAIwAgEgAA7AIAIAMAAAAjACASAADsAgAgEwAA6wIAIAELAADcAwAwDB8AAKICACAgAACjAgAgJwAAngIAIKgBAAChAgAwqQEAACEAEKoBAAChAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACECAAAAIwAgCwAA6wIAIAIAAADpAgAgCwAA6gIAIAmoAQAA6AIAMKkBAADpAgAQqgEAAOgCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACEJqAEAAOgCADCpAQAA6QIAEKoBAADoAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhwwECAIUCACHEAQIAhQIAIcUBCACHAgAhBasBAgCvAgAhsAFAALACACGxAUAAsAIAIcQBAgCvAgAhxQEIAL8CACEHIAAAygIAICcAAMsCACCrAQIArwIAIbABQACwAgAhsQFAALACACHEAQIArwIAIcUBCAC_AgAhByAAANkCACAnAADaAgAgqwECAAAAAbABQAAAAAGxAUAAAAABxAECAAAAAcUBCAAAAAEEEgAA4QIAMN0BAADiAgAw3wEAAOQCACDjAQAA5QIAMAAAAAAAAAAB4AEBAAAAAQXgAQIAAAAB5gECAAAAAecBAgAAAAHoAQIAAAAB6QECAAAAAQcSAADVAwAgEwAA2gMAIN0BAADWAwAg3gEAANkDACDhAQAAKwAg4gEAACsAIOMBAABSACALEgAAgwMAMBMAAIgDADDdAQAAhAMAMN4BAACFAwAw3wEAAIYDACDgAQAAhwMAMOEBAACHAwAw4gEAAIcDADDjAQAAhwMAMOQBAACJAwAw5QEAAIoDADALEgAA-gIAMBMAAP4CADDdAQAA-wIAMN4BAAD8AgAw3wEAAP0CACDgAQAA0AIAMOEBAADQAgAw4gEAANACADDjAQAA0AIAMOQBAAD_AgAw5QEAANMCADAIIQAAwgIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb8BAgAAAAHAAQIAAAABwQEIAAAAAcIBCAAAAAECAAAAKQAgEgAAggMAIAMAAAApACASAACCAwAgEwAAgQMAIAELAADYAwAwAgAAACkAIAsAAIEDACACAAAA1AIAIAsAAIADACAHqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvwECAK8CACHAAQIArwIAIcEBCAC_AgAhwgEIAL8CACEIIQAAwAIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb8BAgCvAgAhwAECAK8CACHBAQgAvwIAIcIBCAC_AgAhCCEAAMICACCrAQIAAAABsAFAAAAAAbEBQAAAAAG_AQIAAAABwAECAAAAAcEBCAAAAAHCAQgAAAABBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABAgAAADQAIBIAAI4DACADAAAANAAgEgAAjgMAIBMAAI0DACABCwAA1wMAMAokAACZAgAgqAEAAJgCADCpAQAAMgAQqgEAAJgCADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvgEBAJMCACG_AQIAhQIAIQIAAAA0ACALAACNAwAgAgAAAIsDACALAACMAwAgCagBAACKAwAwqQEAAIsDABCqAQAAigMAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvgEBAJMCACG_AQIAhQIAIQmoAQAAigMAMKkBAACLAwAQqgEAAIoDADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb4BAQCTAgAhvwECAIUCACEFqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvgEBAK4CACG_AQIArwIAIQWrAQIArwIAIbABQACwAgAhsQFAALACACG-AQEArgIAIb8BAgCvAgAhBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABAxIAANUDACDdAQAA1gMAIOMBAABSACAEEgAAgwMAMN0BAACEAwAw3wEAAIYDACDjAQAAhwMAMAQSAAD6AgAw3QEAAPsCADDfAQAA_QIAIOMBAADQAgAwAAAAAAALEgAAmAMAMBMAAJ0DADDdAQAAmQMAMN4BAACaAwAw3wEAAJsDACDgAQAAnAMAMOEBAACcAwAw4gEAAJwDADDjAQAAnAMAMOQBAACeAwAw5QEAAJ8DADAMJQAAkAMAICYAAJEDACCrAQIAAAABsAFAAAAAAbEBQAAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABAgAAAC8AIBIAAKMDACADAAAALwAgEgAAowMAIBMAAKIDACABCwAA1AMAMBEjAACcAgAgJQAAnQIAICYAAJ4CACCoAQAAmgIAMKkBAAAtABCqAQAAmgIAMKsBAgAAAAGwAUAAhgIAIbEBQACGAgAhzAEBAAAAAc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhAgAAAC8AIAsAAKIDACACAAAAoAMAIAsAAKEDACAOqAEAAJ8DADCpAQAAoAMAEKoBAACfAwAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIQ6oAQAAnwMAMKkBAACgAwAQqgEAAJ8DADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHMAQEAkwIAIc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhCqsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhDCUAAPgCACAmAAD5AgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzAEBAK4CACHNAQEArgIAIc4BAQD1AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACEMJQAAkAMAICYAAJEDACCrAQIAAAABsAFAAAAAAbEBQAAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABBBIAAJgDADDdAQAAmQMAMN8BAACbAwAg4wEAAJwDADAAAAAAAAALEgAArAMAMBMAALADADDdAQAArQMAMN4BAACuAwAw3wEAAK8DACDgAQAA5QIAMOEBAADlAgAw4gEAAOUCADDjAQAA5QIAMOQBAACxAwAw5QEAAOgCADAHHwAA2AIAICcAANoCACCrAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxQEIAAAAAQIAAAAjACASAAC0AwAgAwAAACMAIBIAALQDACATAACzAwAgAQsAANMDADACAAAAIwAgCwAAswMAIAIAAADpAgAgCwAAsgMAIAWrAQIArwIAIbABQACwAgAhsQFAALACACHDAQIArwIAIcUBCAC_AgAhBx8AAMkCACAnAADLAgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhwwECAK8CACHFAQgAvwIAIQcfAADYAgAgJwAA2gIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHFAQgAAAABBBIAAKwDADDdAQAArQMAMN8BAACvAwAg4wEAAOUCADAGIwAAtwMAICUAALgDACAmAAC5AwAgzgEAAO8CACDPAQAA7wIAINMBAADvAgAgASIAAKUDACAAAAMfAAC7AwAgIAAAvAMAICcAALkDACABHgAA7gIAIAMeAADuAgAg1QEAAO8CACDXAQAA7wIAIAAAAAAACxIAAMMDADATAADIAwAw3QEAAMQDADDeAQAAxQMAMN8BAADGAwAg4AEAAMcDADDhAQAAxwMAMOIBAADHAwAw4wEAAMcDADDkAQAAyQMAMOUBAADKAwAwBqsBAgAAAAGtAQEAAAABrgEBAAAAAa8BAgAAAAGwAUAAAAABsQFAAAAAAQIAAAAFACASAADOAwAgAwAAAAUAIBIAAM4DACATAADNAwAgAQsAANIDADALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAAAAAawBAgCFAgAhrQEBAJMCACGuAQEAkwIAIa8BAgCFAgAhsAFAAIYCACGxAUAAhgIAIQIAAAAFACALAADNAwAgAgAAAMsDACALAADMAwAgCqgBAADKAwAwqQEAAMsDABCqAQAAygMAMKsBAgCFAgAhrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhCqgBAADKAwAwqQEAAMsDABCqAQAAygMAMKsBAgCFAgAhrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhBqsBAgCvAgAhrQEBAK4CACGuAQEArgIAIa8BAgCvAgAhsAFAALACACGxAUAAsAIAIQarAQIArwIAIa0BAQCuAgAhrgEBAK4CACGvAQIArwIAIbABQACwAgAhsQFAALACACEGqwECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABBBIAAMMDADDdAQAAxAMAMN8BAADGAwAg4wEAAMcDADAAAQQAANADACAGqwECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABBasBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHFAQgAAAABCqsBAgAAAAGwAUAAAAABsQFAAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAdABCAAAAAHRAQgAAAAB0gECAAAAAdMBAgAAAAEEqwECAAAAAbABQAAAAAGxAUAAAAABzQEBAAAAAQIAAABSACASAADVAwAgBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABB6sBAgAAAAGwAUAAAAABsQFAAAAAAb8BAgAAAAHAAQIAAAABwQEIAAAAAcIBCAAAAAEDAAAAKwAgEgAA1QMAIBMAANsDACAGAAAAKwAgCwAA2wMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAhBKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAhBasBAgAAAAGwAUAAAAABsQFAAAAAAcQBAgAAAAHFAQgAAAABCKsBAgAAAAGwAUAAAAABsQFAAAAAAc0BAQAAAAHUAQEAAAAB1QEBAAAAAdYBAQAAAAHXAQEAAAABAgAAAB8AIBIAAN0DACAGqwECAAAAAbABQAAAAAGxAUAAAAABxgFAAAAAAccBCAAAAAHIAQgAAAABAgAAAIIBACASAADfAwAgB6sBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwQEIAAAAAcIBCAAAAAEDAAAAPAAgEgAA3QMAIBMAAOQDACAKAAAAPAAgCwAA5AMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAh1AEBAK4CACHVAQEA9QIAIdYBAQCuAgAh1wEBAPUCACEIqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzQEBAK4CACHUAQEArgIAIdUBAQD1AgAh1gEBAK4CACHXAQEA9QIAIQMAAACFAQAgEgAA3wMAIBMAAOcDACAIAAAAhQEAIAsAAOcDACCrAQIArwIAIbABQACwAgAhsQFAALACACHGAUAAsAIAIccBCAC_AgAhyAEIAL8CACEGqwECAK8CACGwAUAAsAIAIbEBQACwAgAhxgFAALACACHHAQgAvwIAIcgBCAC_AgAhDSMAAI8DACAlAACQAwAgqwECAAAAAbABQAAAAAGxAUAAAAABzAEBAAAAAc0BAQAAAAHOAQEAAAABzwECAAAAAdABCAAAAAHRAQgAAAAB0gECAAAAAdMBAgAAAAECAAAALwAgEgAA6AMAIAgfAADYAgAgIAAA2QIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHEAQIAAAABxQEIAAAAAQIAAAAjACASAADqAwAgAwAAAC0AIBIAAOgDACATAADuAwAgDwAAAC0AIAsAAO4DACAjAAD3AgAgJQAA-AIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIc8BAgD2AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACENIwAA9wIAICUAAPgCACCrAQIArwIAIbABQACwAgAhsQFAALACACHMAQEArgIAIc0BAQCuAgAhzgEBAPUCACHPAQIA9gIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAwAAACEAIBIAAOoDACATAADxAwAgCgAAACEAIAsAAPEDACAfAADJAgAgIAAAygIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQgfAADJAgAgIAAAygIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQ0jAACPAwAgJgAAkQMAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAc8BAgAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABAgAAAC8AIBIAAPIDACADAAAALQAgEgAA8gMAIBMAAPYDACAPAAAALQAgCwAA9gMAICMAAPcCACAmAAD5AgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzAEBAK4CACHNAQEArgIAIc4BAQD1AgAhzwECAPYCACHQAQgAvwIAIdEBCAC_AgAh0gECAK8CACHTAQIA9gIAIQ0jAAD3AgAgJgAA-QIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIc8BAgD2AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACEGqwECAAAAAbABQAAAAAGxAUAAAAAB2AEBAAAAAdkBAQAAAAHaAQEAAAABAgAAAAEAIBIAAPcDACADAAAACQAgEgAA9wMAIBMAAPsDACAIAAAACQAgCwAA-wMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIdgBAQCuAgAh2QEBAK4CACHaAQEArgIAIQarAQIArwIAIbABQACwAgAhsQFAALACACHYAQEArgIAIdkBAQCuAgAh2gEBAK4CACECBAYCBQADAQMAAQEEBwAAAAAFBQAIGAAJGQAKGgALGwAMAAAAAAAFBQAIGAAJGQAKGgALGwAMAgUAGR4kDwQFABgfABAgAA4nKhICBQARHiUPAR4mAAIhAA8kABMEBQAXIywUJTUWJjYSAgUAFSIwEwEiMQABJAATAiU3ACY4AAEnOQABHjoAAAAFBQAdGAAeGQAfGgAgGwAhAAAAAAAFBQAdGAAeGQAfGgAgGwAhAAAFBQAmGAAnGQAoGgApGwAqAAAAAAAFBQAmGAAnGQAoGgApGwAqASN0FAEjehQFBQAvGAAwGQAxGgAyGwAzAAAAAAAFBQAvGAAwGQAxGgAyGwAzAAAFBQA4GAA5GQA6GgA7GwA8AAAAAAAFBQA4GAA5GQA6GgA7GwA8Ah8AECAADgIfABAgAA4FBQBBGABCGQBDGgBEGwBFAAAAAAAFBQBBGABCGQBDGgBEGwBFAiEADyQAEwIhAA8kABMFBQBKGABLGQBMGgBNGwBOAAAAAAAFBQBKGABLGQBMGgBNGwBOASQAEwEkABMFBQBTGABUGQBVGgBWGwBXAAAAAAAFBQBTGABUGQBVGgBWGwBXAQMAAQEDAAEFBQBcGABdGQBeGgBfGwBgAAAAAAAFBQBcGABdGQBeGgBfGwBgBgIBBwgBCAsBCQwBCg0BDA8BDREEDhIFDxQBEBYEERcGFBgBFRkBFhoEHB0HHR4NKCAOKTsOKj4OKz8OLEAOLUIOLkQEL0UaMEcOMUkEMkobM0sONEwONU0ENlAcN1EiOFMUOVQUOlYUO1cUPFgUPVoUPlwEP10jQF8UQWEEQmIkQ2MURGQURWUERmglR2krSGoTSWsTSmwTS20TTG4TTXATTnIET3MsUHYTUXgEUnktU3sTVHwTVX0EVoABLleBATRYgwEQWYQBEFqHARBbiAEQXIkBEF2LARBejQEEX44BNWCQARBhkgEEYpMBNmOUARBklQEQZZYBBGaZATdnmgE9aJsBD2mcAQ9qnQEPa54BD2yfAQ9toQEPbqMBBG-kAT5wpgEPcagBBHKpAT9zqgEPdKsBD3WsAQR2rwFAd7ABRnixARJ5sgESerMBEnu0ARJ8tQESfbcBEn65AQR_ugFHgAG8ARKBAb4BBIIBvwFIgwHAARKEAcEBEoUBwgEEhgHFAUmHAcYBT4gBxwEWiQHIARaKAckBFosBygEWjAHLARaNAc0BFo4BzwEEjwHQAVCQAdIBFpEB1AEEkgHVAVGTAdYBFpQB1wEWlQHYAQSWAdsBUpcB3AFYmAHdAQKZAd4BApoB3wECmwHgAQKcAeEBAp0B4wECngHlAQSfAeYBWaAB6AECoQHqAQSiAesBWqMB7AECpAHtAQKlAe4BBKYB8QFbpwHyAWE"
};
async function decodeBase64AsWasm(wasmBase64) {
	const { Buffer } = await import("node:buffer");
	const wasmArray = Buffer.from(wasmBase64, "base64");
	return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
	getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
	getQueryCompilerWasmModule: async () => {
		const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
		return await decodeBase64AsWasm(wasm);
	},
	importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
	return runtime.getPrismaClient(config);
}
runtime.PrismaClientKnownRequestError;
runtime.PrismaClientUnknownRequestError;
runtime.PrismaClientRustPanicError;
runtime.PrismaClientInitializationError;
runtime.PrismaClientValidationError;
runtime.sqltag;
runtime.empty;
runtime.join;
runtime.raw;
runtime.Sql;
runtime.Decimal;
runtime.Extensions.getExtensionContext;
runtime.NullTypes.DbNull, runtime.NullTypes.JsonNull, runtime.NullTypes.AnyNull;
runtime.DbNull;
runtime.JsonNull;
runtime.AnyNull;
runtime.makeStrictEnum({
	ReadUncommitted: "ReadUncommitted",
	ReadCommitted: "ReadCommitted",
	RepeatableRead: "RepeatableRead",
	Serializable: "Serializable"
});
runtime.Extensions.defineExtension;
//#endregion
//#region src/generated/prisma/client.ts
globalThis["__dirname"] = path$1.dirname(fileURLToPath$1(import.meta.url));
/**
* ## Prisma Client
* 
* Type-safe database client for TypeScript
* @example
* ```
* const prisma = new PrismaClient({
*   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
* })
* // Fetch zero or more Users
* const users = await prisma.user.findMany()
* ```
* 
* Read more in our [docs](https://pris.ly/d/client).
*/
var PrismaClient = getPrismaClientClass();
//#endregion
//#region src/main/prisma/client.ts
var { Pool } = pkg;
var globalForPrisma = globalThis;
if (!globalForPrisma.pool) globalForPrisma.pool = new Pool({ connectionString: process.env.DATABASE_URL });
var adapter = new PrismaPg(globalForPrisma.pool);
var prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
//#endregion
//#region src/common/schemas.ts
var productSchema = z.object({
	sku: z.string().min(1, "El SKU es obligatorio."),
	name: z.string().min(1, "El nombre es obligatorio."),
	description: z.string().optional(),
	category_id: z.coerce.number().int().positive().optional().nullable(),
	price_purchase: z.coerce.number().min(0, "El precio de compra no puede ser negativo."),
	price_sale: z.coerce.number().min(0, "El precio de venta no puede ser negativo."),
	stock: z.coerce.number().int().optional(),
	min_stock: z.coerce.number().int().min(0).optional().default(10)
});
var saleItemSchema = z.object({
	product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: z.coerce.number().min(0, "El precio unitario no puede ser negativo.")
});
var saleSchema = z.object({
	cash_register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
	client_id: z.coerce.number().int().optional(),
	client_dni: z.string().optional(),
	client_name: z.string().optional(),
	payment_method: z.enum(["CASH", "CARD"]).default("CASH"),
	items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto.")
});
z.object({ opening_amount: z.coerce.number().min(0, "El monto de apertura no puede ser negativo.") });
z.object({
	register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
	closing_amount: z.coerce.number().min(0, "El monto de cierre no puede ser negativo.")
});
var clientSchema = z.object({
	dni: z.string().min(1, "El DNI/Documento es obligatorio."),
	name: z.string().min(1, "El nombre es obligatorio."),
	phone: z.string().optional().nullable(),
	code: z.string().min(1, "El código de cliente es obligatorio."),
	tax_id: z.string().optional().nullable()
});
var categorySchema = z.object({ name: z.string().min(1, "El nombre de la categoría es obligatorio.").max(255) });
z.object({
	product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
	type: z.enum(["ENTRADA", "SALIDA"], { errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }) }),
	quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0.")
});
//#endregion
//#region src/main/services/ClientService.ts
var ClientService = class {
	/**
	* Obtiene todos los clientes con búsqueda opcional
	*/
	static async getAllClients(search) {
		const where = search ? { OR: [
			{ dni: {
				contains: search,
				mode: "insensitive"
			} },
			{ name: {
				contains: search,
				mode: "insensitive"
			} },
			{ code: {
				contains: search,
				mode: "insensitive"
			} },
			{ tax_id: {
				contains: search,
				mode: "insensitive"
			} }
		] } : {};
		return prisma.client.findMany({
			where,
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Obtiene un cliente por ID
	*/
	static async getClientById(id) {
		const client = await prisma.client.findUnique({ where: { id } });
		if (!client) throw new Error("Cliente no encontrado");
		return client;
	}
	/**
	* Crea un cliente y deja la trazabilidad de la creación
	*/
	static async createClient(clientData, userId = 1) {
		const validated = clientSchema.parse(clientData);
		if (await prisma.client.findFirst({ where: { dni: validated.dni } })) throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
		if (await prisma.client.findFirst({ where: { code: validated.code } })) throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			if (await prisma.client.findFirst({ where: { tax_id: validated.tax_id } })) throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await prisma.client.create({ data: validated });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CREATE_CLIENT",
			entity: "clients",
			entity_id: client.id
		} });
		return {
			success: true,
			id: client.id
		};
	}
	/**
	* Actualiza un cliente y deja la trazabilidad de la actualización
	*/
	static async updateClient(id, clientData, userId = 1) {
		if (!await prisma.client.findUnique({ where: { id } })) throw new Error("Cliente no encontrado");
		const validated = clientSchema.parse(clientData);
		if (await prisma.client.findFirst({ where: {
			dni: validated.dni,
			NOT: { id }
		} })) throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
		if (await prisma.client.findFirst({ where: {
			code: validated.code,
			NOT: { id }
		} })) throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			if (await prisma.client.findFirst({ where: {
				tax_id: validated.tax_id,
				NOT: { id }
			} })) throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await prisma.client.update({
			where: { id },
			data: validated
		});
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "UPDATE_CLIENT",
			entity: "clients",
			entity_id: client.id
		} });
		return {
			success: true,
			client
		};
	}
	/**
	* Elimina un cliente y deja la trazabilidad de la eliminación
	*/
	static async deleteClient(id, userId = 1) {
		if (!await prisma.client.findUnique({ where: { id } })) throw new Error("Cliente no encontrado");
		const salesCount = await prisma.sale.count({ where: { client_id: id } });
		if (salesCount > 0) throw new Error(`No se puede eliminar el cliente porque tiene ${salesCount} venta(s) asociada(s).`);
		await prisma.client.delete({ where: { id } });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: id
		} });
		return { success: true };
	}
};
//#endregion
//#region src/main/services/ProductService.ts
var ProductService = class {
	/**
	* Obtiene todos los productos con búsqueda opcional
	*/
	static async getAllProducts(search, categoryId) {
		const where = {};
		if (search) where.OR = [
			{ name: {
				contains: search,
				mode: "insensitive"
			} },
			{ sku: {
				contains: search,
				mode: "insensitive"
			} },
			{ description: {
				contains: search,
				mode: "insensitive"
			} }
		];
		if (categoryId) where.category_id = categoryId;
		return prisma.product.findMany({
			where,
			include: { category: true },
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Obtiene un producto por ID
	*/
	static async getProductById(id) {
		const product = await prisma.product.findUnique({
			where: { id },
			include: { category: true }
		});
		if (!product) throw new Error("Producto no encontrado");
		return product;
	}
	/**
	* Obtiene productos con stock bajo
	*/
	static async getLowStockProducts(threshold) {
		return prisma.product.findMany({
			where: { stock: { lte: prisma.product.fields.min_stock } },
			include: { category: true },
			orderBy: { stock: "asc" }
		});
	}
	/**
	* Crea un nuevo producto
	*/
	static async createProduct(productData, userId = 1) {
		const validated = productSchema.parse(productData);
		if (await prisma.product.findUnique({ where: { sku: validated.sku } })) throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
		if (validated.category_id) {
			if (!await prisma.category.findUnique({ where: { id: validated.category_id } })) throw new Error("La categoría especificada no existe.");
		}
		const initialStock = validated.stock || 0;
		const product = await prisma.product.create({ data: {
			sku: validated.sku,
			name: validated.name,
			price_sale: validated.price_sale,
			price_purchase: validated.price_purchase,
			description: validated.description,
			category_id: validated.category_id,
			min_stock: validated.min_stock,
			stock: initialStock
		} });
		if (initialStock > 0) await prisma.inventoryMovement.create({ data: {
			product_id: product.id,
			type: "ENTRADA",
			quantity: initialStock
		} });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CREATE_PRODUCT",
			entity: "products",
			entity_id: product.id
		} });
		return {
			success: true,
			id: product.id
		};
	}
	/**
	* Actualiza un producto existente
	*/
	static async updateProduct(id, productData, userId = 1) {
		const existingProduct = await prisma.product.findUnique({ where: { id } });
		if (!existingProduct) throw new Error("Producto no encontrado");
		const validated = productSchema.parse(productData);
		if (validated.sku !== existingProduct.sku) {
			if (await prisma.product.findUnique({ where: { sku: validated.sku } })) throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
		}
		if (validated.category_id) {
			if (!await prisma.category.findUnique({ where: { id: validated.category_id } })) throw new Error("La categoría especificada no existe.");
		}
		const product = await prisma.product.update({
			where: { id },
			data: {
				sku: validated.sku,
				name: validated.name,
				price_sale: validated.price_sale,
				price_purchase: validated.price_purchase,
				description: validated.description,
				category_id: validated.category_id,
				min_stock: validated.min_stock
			}
		});
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "UPDATE_PRODUCT",
			entity: "products",
			entity_id: product.id
		} });
		return {
			success: true,
			product
		};
	}
	/**
	* Elimina un producto
	*/
	static async deleteProduct(id, userId = 1) {
		if (!await prisma.product.findUnique({ where: { id } })) throw new Error("Producto no encontrado");
		const salesCount = await prisma.saleItem.count({ where: { product_id: id } });
		if (salesCount > 0) throw new Error(`No se puede eliminar el producto porque tiene ${salesCount} venta(s) asociada(s).`);
		await prisma.product.delete({ where: { id } });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "DELETE_PRODUCT",
			entity: "products",
			entity_id: id
		} });
		return { success: true };
	}
	/**
	* Añade stock inicial o adicional (ENTRADA)
	*/
	static async addStock(productId, quantity, userId = 1) {
		if (!await prisma.product.findUnique({ where: { id: productId } })) throw new Error("El producto no existe.");
		if (quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
		await prisma.product.update({
			where: { id: productId },
			data: { stock: { increment: quantity } }
		});
		await prisma.inventoryMovement.create({ data: {
			product_id: productId,
			type: "ENTRADA",
			quantity
		} });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "STOCK_ENTRADA",
			entity: "products",
			entity_id: productId
		} });
		return { success: true };
	}
	/**
	* Reduce stock (SALIDA) - Para devoluciones o ajustes
	*/
	static async removeStock(productId, quantity, userId = 1) {
		const product = await prisma.product.findUnique({ where: { id: productId } });
		if (!product) throw new Error("El producto no existe.");
		if (quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
		if (product.stock < quantity) throw new Error(`Stock insuficiente. Stock actual: ${product.stock}, Cantidad solicitada: ${quantity}`);
		await prisma.product.update({
			where: { id: productId },
			data: { stock: { decrement: quantity } }
		});
		await prisma.inventoryMovement.create({ data: {
			product_id: productId,
			type: "SALIDA",
			quantity
		} });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "STOCK_SALIDA",
			entity: "products",
			entity_id: productId
		} });
		return { success: true };
	}
	/**
	* Obtiene el historial de movimientos de un producto
	*/
	static async getInventoryMovements(productId, limit = 50) {
		if (!await prisma.product.findUnique({ where: { id: productId } })) throw new Error("El producto no existe.");
		return prisma.inventoryMovement.findMany({
			where: { product_id: productId },
			orderBy: { created_at: "desc" },
			take: limit
		});
	}
};
//#endregion
//#region src/main/services/SaleService.ts
var SaleService = class {
	/**
	* Obtiene todas las ventas con filtros opcionales
	*/
	static async getAllSales(startDate, endDate, clientId, cashRegisterId) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		if (clientId) where.client_id = clientId;
		if (cashRegisterId) where.cash_register_id = cashRegisterId;
		return prisma.sale.findMany({
			where,
			include: {
				client: true,
				cash_register: true
			},
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Obtiene una venta por ID con todos sus detalles
	*/
	static async getSaleDetails(id) {
		const sale = await prisma.sale.findUnique({
			where: { id },
			include: {
				items: { include: { product: true } },
				client: true,
				cash_register: true
			}
		});
		if (!sale) throw new Error("Venta no encontrada");
		return sale;
	}
	/**
	* Obtiene ventas del día actual
	*/
	static async getTodaySales() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		return prisma.sale.findMany({
			where: { created_at: {
				gte: startOfDay,
				lte: endOfDay
			} },
			include: {
				client: true,
				cash_register: true
			},
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Obtiene estadísticas de ventas
	*/
	static async getSalesStats(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const stats = await prisma.sale.aggregate({
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
		return {
			totalSales: stats._count.id,
			totalRevenue: stats._sum.total || 0,
			averageSale: stats._avg.total || 0
		};
	}
	/**
	* Registra una nueva venta con actualización de inventario
	*/
	static async registerSale(saleData, itemsData, userId = 1) {
		const validated = saleSchema.parse({
			...saleData,
			items: itemsData
		});
		if (!await prisma.cashRegister.findFirst({ where: {
			id: validated.cash_register_id,
			opened_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) }
		} })) throw new Error("La caja no está abierta o no existe.");
		let finalClientId = validated.client_id;
		if (validated.client_dni && validated.client_name && !finalClientId) {
			const existingClient = await prisma.client.findFirst({ where: { dni: validated.client_dni } });
			if (existingClient) finalClientId = existingClient.id;
			else finalClientId = (await prisma.client.create({ data: {
				dni: validated.client_dni,
				name: validated.client_name,
				code: `CLI-${Date.now()}`
			} })).id;
		}
		if (finalClientId) {
			if (!await prisma.client.findUnique({ where: { id: finalClientId } })) throw new Error("El cliente no existe.");
		}
		const saleId = await prisma.$transaction(async (tx) => {
			const productIds = validated.items.map((item) => item.product_id);
			const products = await tx.product.findMany({ where: { id: { in: productIds } } });
			const productMap = new Map(products.map((p) => [p.id, p]));
			for (const item of validated.items) {
				const product = productMap.get(item.product_id);
				if (!product) throw new Error(`El producto ID ${item.product_id} no existe.`);
				if (product.stock < item.quantity) throw new Error(`Stock insuficiente para "${product.name}". Stock actual: ${product.stock}, Cantidad solicitada: ${item.quantity}`);
			}
			const itemsWithPurchasePrice = validated.items.map((item) => {
				const product = productMap.get(item.product_id);
				return {
					...item,
					purchase_price: product?.price_purchase || 0
				};
			});
			const total = itemsWithPurchasePrice.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
			const sale = await tx.sale.create({ data: {
				cash_register_id: validated.cash_register_id,
				client_id: finalClientId || 1,
				total
			} });
			for (const item of itemsWithPurchasePrice) {
				await tx.saleItem.create({ data: {
					sale_id: sale.id,
					product_id: item.product_id,
					quantity: item.quantity,
					unit_price: item.unit_price,
					purchase_price: item.purchase_price
				} });
				await tx.product.update({
					where: { id: item.product_id },
					data: { stock: { decrement: item.quantity } }
				});
				await tx.inventoryMovement.create({ data: {
					product_id: item.product_id,
					type: "SALIDA",
					quantity: item.quantity
				} });
			}
			await tx.cashRegister.update({
				where: { id: validated.cash_register_id },
				data: { total_sales: { increment: total } }
			});
			return sale.id;
		});
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CREATE_SALE",
			entity: "sales",
			entity_id: saleId
		} });
		return {
			success: true,
			id: saleId
		};
	}
	/**
	* Anula una venta (devolución completa)
	*/
	static async cancelSale(saleId, userId = 1) {
		const sale = await prisma.sale.findUnique({
			where: { id: saleId },
			include: { items: true }
		});
		if (!sale) throw new Error("Venta no encontrada");
		await prisma.$transaction(async (tx) => {
			for (const item of sale.items) {
				await tx.product.update({
					where: { id: item.product_id },
					data: { stock: { increment: item.quantity } }
				});
				await tx.inventoryMovement.create({ data: {
					product_id: item.product_id,
					type: "ENTRADA",
					quantity: item.quantity
				} });
			}
			await tx.cashRegister.update({
				where: { id: sale.cash_register_id },
				data: { total_sales: { decrement: sale.total } }
			});
			await tx.sale.delete({ where: { id: saleId } });
		});
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CANCEL_SALE",
			entity: "sales",
			entity_id: saleId
		} });
		return { success: true };
	}
};
//#endregion
//#region src/main/repositories/UserRepository.ts
var UserRepository = class {
	/**
	* Find all users (without password hash)
	*/
	static async findAll() {
		return prisma.user.findMany({
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			},
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Find user by ID (without password hash)
	*/
	static async findById(id) {
		return prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	/**
	* Find user by username (with password hash for authentication)
	*/
	static async findByUsername(username) {
		return prisma.user.findUnique({ where: { username } });
	}
	/**
	* Create a new user
	*/
	static async create(data) {
		return prisma.user.create({
			data,
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	/**
	* Update an existing user
	*/
	static async update(id, data) {
		return prisma.user.update({
			where: { id },
			data,
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	/**
	* Delete a user by ID
	*/
	static async delete(id) {
		return prisma.user.delete({ where: { id } });
	}
	/**
	* Check if username exists
	*/
	static async exists(username, excludeId) {
		return !!await prisma.user.findFirst({
			where: {
				username,
				...excludeId && { id: { not: excludeId } }
			},
			select: { id: true }
		});
	}
	/**
	* Count total users
	*/
	static async count() {
		return prisma.user.count();
	}
};
//#endregion
//#region src/main/services/AuthService.ts
var AuthService = class {
	/**
	* Intenta iniciar sesión comparando el hash de la base de datos
	*/
	static async login(username, password) {
		try {
			const user = await UserRepository.findByUsername(username);
			if (!user) return {
				success: false,
				error: "Usuario no encontrado"
			};
			if (!await bcrypt.compare(password, user.password_hash)) return {
				success: false,
				error: "Contraseña incorrecta"
			};
			const { password_hash: _, ...userWithoutPassword } = user;
			return {
				success: true,
				user: userWithoutPassword
			};
		} catch (error) {
			console.error("Login error:", error);
			if (error.code === "P2025") return {
				success: false,
				error: "Usuario no encontrado"
			};
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	/**
	* Registra un nuevo usuario hasheando su contraseña
	*/
	static async register(userData) {
		try {
			if (await UserRepository.exists(userData.username)) return {
				success: false,
				error: `El usuario '${userData.username}' ya existe`
			};
			if (userData.password.length < 6) return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(userData.password, salt);
			const user = await UserRepository.create({
				username: userData.username,
				password_hash: hashedPassword,
				role: userData.role
			});
			return {
				success: true,
				user: {
					id: user.id,
					username: user.username,
					role: user.role,
					created_at: user.created_at,
					updated_at: user.updated_at
				}
			};
		} catch (error) {
			console.error("Register error:", error);
			if (error.code === "P2002") return {
				success: false,
				error: "El nombre de usuario ya está en uso"
			};
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	/**
	* Cambia la contraseña de un usuario
	*/
	static async changePassword(userId, oldPassword, newPassword) {
		try {
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) return {
				success: false,
				error: "Usuario no encontrado"
			};
			if (!await bcrypt.compare(oldPassword, user.password_hash)) return {
				success: false,
				error: "Contraseña actual incorrecta"
			};
			if (newPassword.length < 6) return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await UserRepository.update(userId, { password_hash: hashedPassword });
			return { success: true };
		} catch (error) {
			console.error("Change password error:", error);
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
};
//#endregion
//#region src/main/services/UserService.ts
var UserService = class {
	/**
	* Get all users (without password hashes)
	*/
	static async getAllUsers() {
		try {
			return await UserRepository.findAll();
		} catch (error) {
			console.error("Get all users error:", error);
			throw new Error("Error al obtener usuarios");
		}
	}
	/**
	* Get user by ID
	*/
	static async getUserById(id) {
		try {
			const user = await UserRepository.findById(id);
			if (!user) throw new Error("Usuario no encontrado");
			return user;
		} catch (error) {
			console.error("Get user by ID error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw new Error("Error al obtener usuario");
		}
	}
	/**
	* Create a new user
	*/
	static async createUser(data, createdBy) {
		try {
			if (await UserRepository.exists(data.username)) throw new Error(`El usuario '${data.username}' ya existe`);
			if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(data.password, salt);
			const user = await UserRepository.create({
				username: data.username,
				password_hash: hashedPassword,
				role: data.role
			});
			await prisma.auditLog.create({ data: {
				user_id: createdBy,
				action: "CREATE_USER",
				entity: "users",
				entity_id: user.id
			} });
			return user;
		} catch (error) {
			console.error("Create user error:", error);
			if (error.code === "P2002") throw new Error("El nombre de usuario ya está en uso");
			throw error;
		}
	}
	/**
	* Update an existing user
	*/
	static async updateUser(id, data, updatedBy) {
		try {
			if (data.username) {
				if (await UserRepository.exists(data.username, id)) throw new Error(`El usuario '${data.username}' ya existe`);
			}
			const user = await UserRepository.update(id, data);
			await prisma.auditLog.create({ data: {
				user_id: updatedBy,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: id
			} });
			return user;
		} catch (error) {
			console.error("Update user error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
	/**
	* Delete a user
	*/
	static async deleteUser(id, deletedBy) {
		try {
			if (!await UserRepository.findById(id)) throw new Error("Usuario no encontrado");
			if (id === deletedBy) throw new Error("No puedes eliminar tu propio usuario");
			await UserRepository.delete(id);
			await prisma.auditLog.create({ data: {
				user_id: deletedBy,
				action: "DELETE_USER",
				entity: "users",
				entity_id: id
			} });
			return { success: true };
		} catch (error) {
			console.error("Delete user error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
	/**
	* Change user password
	*/
	static async changePassword(userId, newPassword, changedBy) {
		try {
			if (newPassword.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await UserRepository.update(userId, { password_hash: hashedPassword });
			await prisma.auditLog.create({ data: {
				user_id: changedBy,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: userId
			} });
			return { success: true };
		} catch (error) {
			console.error("Change password error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
};
//#endregion
//#region src/main/repositories/DashboardRepository.ts
var DashboardRepository = class {
	static statsCache = null;
	static CACHE_DURATION = 3e4;
	/**
	* Obtiene estadísticas generales del dashboard
	*/
	static async getStats(startDate, endDate) {
		if (!startDate && !endDate && this.statsCache) {
			if (Date.now() - this.statsCache.timestamp < this.CACHE_DURATION) return this.statsCache.data;
		}
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const filterWhere = Object.keys(where).length === 0 ? { created_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) } } : where;
		const revenueResult = await prisma.sale.aggregate({
			where: filterWhere,
			_sum: { total: true }
		});
		const salesCount = await prisma.sale.count({ where: filterWhere });
		const totalProfit = (await prisma.sale.findMany({
			where: filterWhere,
			select: {
				id: true,
				total: true,
				items: { select: {
					quantity: true,
					unit_price: true,
					purchase_price: true
				} }
			}
		})).reduce((acc, sale) => {
			return acc + sale.items.reduce((itemAcc, item) => {
				return itemAcc + item.quantity * (item.unit_price - item.purchase_price);
			}, 0);
		}, 0);
		const activeProducts = await prisma.product.count({ where: { stock: { gt: 0 } } });
		const totalClients = await prisma.client.count();
		const lowStockCount = await prisma.product.count({ where: { stock: { lt: prisma.product.fields.min_stock } } });
		const result = {
			totalRevenue: revenueResult._sum.total || 0,
			totalProfit,
			totalSales: salesCount,
			activeProducts,
			totalClients,
			lowStockProducts: lowStockCount,
			averageSale: salesCount > 0 ? (revenueResult._sum.total || 0) / salesCount : 0
		};
		if (!startDate && !endDate) this.statsCache = {
			data: result,
			timestamp: Date.now()
		};
		return result;
	}
	/**
	* Invalida el cache de estadísticas
	*/
	static invalidateCache() {
		this.statsCache = null;
	}
	/**
	* Obtiene ventas de los últimos N días agrupadas por fecha
	*/
	static async getWeeklySales(days = 7) {
		const startDate = /* @__PURE__ */ new Date();
		startDate.setDate(startDate.getDate() - days);
		const groupedByDate = (await prisma.sale.findMany({
			where: { created_at: { gte: startDate } },
			select: {
				total: true,
				created_at: true
			},
			orderBy: { created_at: "asc" }
		})).reduce((acc, sale) => {
			const date = sale.created_at.toISOString().split("T")[0];
			if (!acc[date]) acc[date] = {
				date,
				total: 0,
				count: 0
			};
			acc[date].total += sale.total;
			acc[date].count += 1;
			return acc;
		}, {});
		return Object.values(groupedByDate);
	}
	/**
	* Obtiene productos con stock bajo
	*/
	static async getLowStockProducts(limit = 10) {
		return prisma.product.findMany({
			where: { stock: { lt: prisma.product.fields.min_stock } },
			include: { category: { select: { name: true } } },
			select: {
				id: true,
				sku: true,
				name: true,
				stock: true,
				min_stock: true,
				category: true
			},
			orderBy: { stock: "asc" },
			take: limit
		});
	}
	/**
	* Obtiene ventas por método de pago
	*/
	static async getSalesByPaymentMethod(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		return prisma.sale.groupBy({
			by: ["payment_method"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
	}
	/**
	* Obtiene top productos más vendidos
	*/
	static async getTopProducts(limit = 10, startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const topProducts = await prisma.saleItem.groupBy({
			by: ["product_id"],
			where,
			_sum: { quantity: true },
			_avg: { unit_price: true },
			_count: { id: true },
			orderBy: { _sum: { quantity: "desc" } },
			take: limit
		});
		const productIds = topProducts.map((item) => item.product_id);
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
			include: { category: true }
		});
		return topProducts.map((item) => {
			const product = products.find((p) => p.id === item.product_id);
			return {
				product_id: item.product_id,
				product_name: product?.name || "Unknown",
				product_sku: product?.sku || "Unknown",
				category: product?.category?.name || "Sin categoría",
				total_quantity: item._sum.quantity || 0,
				avg_price: item._avg.unit_price || 0,
				times_sold: item._count.id
			};
		});
	}
	/**
	* Obtiene top clientes por ventas
	*/
	static async getTopClients(limit = 10, startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const topClients = await prisma.sale.groupBy({
			by: ["client_id"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true },
			orderBy: { _sum: { total: "desc" } },
			take: limit
		});
		const clientIds = topClients.map((item) => item.client_id).filter((id) => id !== null);
		const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } });
		return topClients.map((item) => {
			const client = clients.find((c) => c.id === item.client_id);
			return {
				client_id: item.client_id,
				client_name: client?.name || "Cliente Desconocido",
				client_dni: client?.dni || "N/A",
				total_purchases: item._count.id,
				total_spent: item._sum.total || 0,
				avg_purchase: item._avg.total || 0
			};
		});
	}
	/**
	* Obtiene ventas por hora del día (para análisis de picos de venta)
	*/
	static async getSalesByHour(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const sales = await prisma.sale.findMany({
			where,
			select: {
				total: true,
				created_at: true
			}
		});
		const hours = Array.from({ length: 24 }, (_, i) => ({
			hour: i,
			total: 0,
			count: 0
		}));
		sales.forEach((sale) => {
			const hour = sale.created_at.getHours();
			hours[hour].total += sale.total;
			hours[hour].count += 1;
		});
		return hours;
	}
	/**
	* Obtiene resumen de caja (cash registers)
	*/
	static async getCashRegisterSummary(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.opened_at = {};
			if (startDate) where.opened_at.gte = startDate;
			if (endDate) where.opened_at.lte = endDate;
		}
		const registers = await prisma.cashRegister.findMany({
			where,
			select: {
				id: true,
				opened_at: true,
				opening_amount: true,
				total_sales: true
			},
			orderBy: { opened_at: "desc" }
		});
		return {
			registers,
			summary: registers.reduce((acc, reg) => {
				acc.totalRegisters += 1;
				acc.totalOpening += reg.opening_amount;
				acc.totalSales += reg.total_sales;
				return acc;
			}, {
				totalRegisters: 0,
				totalOpening: 0,
				totalSales: 0
			})
		};
	}
	/**
	* Obtiene métricas de inventario
	*/
	static async getInventoryMetrics() {
		const totalProducts = await prisma.product.count();
		const productsWithStock = await prisma.product.count({ where: { stock: { gt: 0 } } });
		const productsWithoutStock = await prisma.product.count({ where: { stock: { equals: 0 } } });
		const lowStockProducts = await prisma.product.count({ where: { stock: { lt: prisma.product.fields.min_stock } } });
		const inventoryValue = await prisma.product.aggregate({
			_sum: { price_purchase: true },
			where: { stock: { gt: 0 } }
		});
		const inventorySaleValue = await prisma.product.aggregate({
			_sum: { price_sale: true },
			where: { stock: { gt: 0 } }
		});
		const recentMovements = await prisma.inventoryMovement.findMany({
			take: 10,
			orderBy: { created_at: "desc" },
			include: { product: { select: {
				name: true,
				sku: true
			} } }
		});
		return {
			totalProducts,
			productsWithStock,
			productsWithoutStock,
			lowStockProducts,
			totalPurchaseValue: inventoryValue._sum.price_purchase || 0,
			totalSaleValue: inventorySaleValue._sum.price_sale || 0,
			potentialProfit: (inventorySaleValue._sum.price_sale || 0) - (inventoryValue._sum.price_purchase || 0),
			recentMovements
		};
	}
};
//#endregion
//#region src/main/services/CashRegisterService.ts
var CashRegisterService = class {
	/**
	* Obtiene la caja abierta del día actual
	*/
	static async getOpenRegister() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		return prisma.cashRegister.findFirst({
			where: { opened_at: { gte: startOfDay } },
			orderBy: { opened_at: "desc" }
		});
	}
	/**
	* Obtiene todas las cajas registradas con filtros opcionales
	*/
	static async getAllRegisters(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.opened_at = {};
			if (startDate) where.opened_at.gte = startDate;
			if (endDate) where.opened_at.lte = endDate;
		}
		return prisma.cashRegister.findMany({
			where,
			include: { _count: { select: { sales: true } } },
			orderBy: { opened_at: "desc" }
		});
	}
	/**
	* Obtiene los detalles de una caja específica
	*/
	static async getRegisterDetails(id) {
		const register = await prisma.cashRegister.findUnique({
			where: { id },
			include: { sales: { include: {
				client: true,
				items: { include: { product: true } }
			} } }
		});
		if (!register) throw new Error("Caja no encontrada");
		return register;
	}
	/**
	* Abre una nueva caja registradora
	*/
	static async openRegister(openingAmount, userId = 1) {
		if (isNaN(openingAmount) || openingAmount < 0) throw new Error("El monto de apertura no puede ser negativo.");
		if (await this.getOpenRegister()) throw new Error("Ya hay una caja abierta para el día de hoy.");
		const cashRegister = await prisma.cashRegister.create({ data: {
			opening_amount: Number(openingAmount),
			total_sales: 0
		} });
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "OPEN_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: cashRegister.id
		} });
		return {
			success: true,
			id: cashRegister.id
		};
	}
	/**
	* Cierra una caja registradora con conciliación
	*/
	static async closeRegister(registerId, closingAmount, userId = 1) {
		if (isNaN(closingAmount) || closingAmount < 0) throw new Error("El monto de cierre no puede ser negativo.");
		const register = await prisma.cashRegister.findUnique({ where: { id: Number(registerId) } });
		if (!register) throw new Error("Caja no encontrada.");
		const expectedCash = Number(register.opening_amount) + Number(register.total_sales);
		const difference = Number(closingAmount) - expectedCash;
		const salesCount = await prisma.sale.count({ where: {
			cash_register_id: register.id,
			created_at: { gte: register.opened_at }
		} });
		const status = difference === 0 ? "PERFECT" : difference > 0 ? "SURPLUS" : "MISSING";
		await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CLOSE_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: register.id
		} });
		return {
			success: true,
			registerId: register.id,
			openingAmount: register.opening_amount,
			totalSales: register.total_sales,
			expectedCash,
			realCash: Number(closingAmount),
			difference,
			status,
			salesCount
		};
	}
	/**
	* Obtiene el resumen del día para una caja específica
	*/
	static async getDailySummary(registerId) {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		const register = await prisma.cashRegister.findFirst({ where: {
			id: registerId,
			opened_at: { gte: startOfDay }
		} });
		if (!register) throw new Error("Caja no encontrada o no está abierta hoy.");
		const salesStats = await prisma.sale.aggregate({
			where: {
				cash_register_id: registerId,
				created_at: {
					gte: startOfDay,
					lte: endOfDay
				}
			},
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
		const salesByPayment = await prisma.sale.groupBy({
			by: ["payment_method"],
			where: {
				cash_register_id: registerId,
				created_at: {
					gte: startOfDay,
					lte: endOfDay
				}
			},
			_count: { id: true },
			_sum: { total: true }
		});
		return {
			register,
			totalSales: salesStats._count.id,
			totalRevenue: salesStats._sum.total || 0,
			averageSale: salesStats._avg.total || 0,
			salesByPayment
		};
	}
};
//#endregion
//#region src/main/repositories/CategoryRepository.ts
var CategoryRepository = class {
	/**
	* Obtiene todas las categorías con búsqueda opcional
	*/
	static async findAll(search) {
		const where = search ? { name: {
			contains: search,
			mode: "insensitive"
		} } : {};
		return prisma.category.findMany({
			where,
			orderBy: { name: "asc" }
		});
	}
	/**
	* Obtiene una categoría por ID
	*/
	static async findById(id) {
		const category = await prisma.category.findUnique({
			where: { id },
			include: { products: { select: {
				id: true,
				name: true,
				sku: true,
				stock: true
			} } }
		});
		if (!category) throw new Error("Categoría no encontrada");
		return category;
	}
	/**
	* Crea una nueva categoría
	*/
	static async create(categoryData, userId) {
		const validated = categorySchema.parse(categoryData);
		if (await prisma.category.findFirst({ where: { name: validated.name } })) throw new Error(`La categoría "${validated.name}" ya existe.`);
		const category = await prisma.category.create({ data: validated });
		if (userId) await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "CREATE_CATEGORY",
			entity: "categories",
			entity_id: category.id
		} });
		return category;
	}
	/**
	* Actualiza una categoría
	*/
	static async update(id, categoryData, userId) {
		if (!await prisma.category.findUnique({ where: { id } })) throw new Error("Categoría no encontrada");
		const validated = categorySchema.parse(categoryData);
		if (await prisma.category.findFirst({ where: {
			name: validated.name,
			NOT: { id }
		} })) throw new Error(`La categoría "${validated.name}" ya existe.`);
		const category = await prisma.category.update({
			where: { id },
			data: validated
		});
		if (userId) await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "UPDATE_CATEGORY",
			entity: "categories",
			entity_id: category.id
		} });
		return category;
	}
	/**
	* Elimina una categoría
	*/
	static async delete(id, userId) {
		if (!await prisma.category.findUnique({ where: { id } })) throw new Error("Categoría no encontrada");
		const productsCount = await prisma.product.count({ where: { category_id: id } });
		if (productsCount > 0) throw new Error(`No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asociado(s).`);
		await prisma.category.delete({ where: { id } });
		if (userId) await prisma.auditLog.create({ data: {
			user_id: userId,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: id
		} });
		return { success: true };
	}
};
//#endregion
//#region src/main/utils/ipcWrapper.ts
/**
* Wraps an IPC handler to provide consistent error handling and optional Zod validation.
*/
function wrapIpc(handler, schema) {
	return async (_event, ...args) => {
		try {
			if (schema && args.length > 0) {
				const result = schema.safeParse(args[0]);
				if (!result.success) return {
					success: false,
					message: "Error de validación: " + result.error.issues.map((e) => e.message).join(", "),
					errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
				};
				args[0] = result.data;
			}
			const data = await handler(...args);
			if (data && typeof data === "object" && "success" in data) return data;
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error("IPC Error:", error);
			if (error instanceof ZodError) return {
				success: false,
				message: "Error de validación: " + error.issues.map((e) => e.message).join(", ")
			};
			return {
				success: false,
				message: error.message || "Ocurrió un error inesperado en el sistema"
			};
		}
	};
}
//#endregion
//#region src/main/ipc.ts
function setupIpcHandlers() {
	/**
	* HEALTH CHECK
	*/
	ipcMain.handle("health:check", async () => {
		try {
			await prisma.$queryRaw`SELECT 1`;
			return {
				success: true,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (error) {
			return {
				success: false,
				database: "disconnected",
				error: error.message,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	});
	/**
	* DASHBOARD
	*/
	ipcMain.handle("dashboard:getStats", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getWeeklySales", async (_, days) => {
		try {
			return await DashboardRepository.getWeeklySales(days);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getLowStock", async (_, limit) => {
		try {
			return await DashboardRepository.getLowStockProducts(limit);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getSalesByPaymentMethod(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopProducts", async (_, limit, startDate, endDate) => {
		try {
			return await DashboardRepository.getTopProducts(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopClients", async (_, limit, startDate, endDate) => {
		try {
			return await DashboardRepository.getTopClients(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByHour", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getSalesByHour(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getCashSummary", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getCashRegisterSummary(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await DashboardRepository.getInventoryMetrics();
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:invalidateCache", async () => {
		try {
			DashboardRepository.invalidateCache();
			return { success: true };
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	/**
	* CASH REGISTERS
	*/
	ipcMain.handle("cash:getOpen", async () => {
		try {
			return await CashRegisterService.getOpenRegister();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("cash:getAll", async (_, startDate, endDate) => {
		try {
			return await CashRegisterService.getAllRegisters(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cajas"
			};
		}
	});
	ipcMain.handle("cash:getDetails", async (_, id) => {
		try {
			return await CashRegisterService.getRegisterDetails(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de caja"
			};
		}
	});
	ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
		try {
			return await CashRegisterService.getDailySummary(registerId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener resumen del día"
			};
		}
	});
	ipcMain.handle("cash:open", wrapIpc((amount, userId) => CashRegisterService.openRegister(amount, userId)));
	ipcMain.handle("cash:close", wrapIpc((id, amount, userId) => CashRegisterService.closeRegister(id, amount, userId)));
	/**
	* AUTH
	*/
	ipcMain.handle("auth:login", async (_, username, password) => {
		try {
			return await AuthService.login(username, password);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error de autenticación"
			};
		}
	});
	/**
	* CLIENTS
	*/
	ipcMain.handle("clients:getAll", async (_, search) => {
		try {
			return await ClientService.getAllClients(search);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener clientes"
			};
		}
	});
	ipcMain.handle("clients:getById", async (_, id) => {
		try {
			return await ClientService.getClientById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cliente"
			};
		}
	});
	ipcMain.handle("clients:create", wrapIpc((clientData, userId) => ClientService.createClient(clientData, userId), clientSchema));
	ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) => ClientService.updateClient(id, clientData, userId)));
	ipcMain.handle("clients:delete", async (_, id, userId) => {
		try {
			return await ClientService.deleteClient(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar cliente"
			};
		}
	});
	/**
	* PRODUCTS
	*/
	ipcMain.handle("products:getAll", async (_, search, categoryId) => {
		try {
			return await ProductService.getAllProducts(search, categoryId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener productos"
			};
		}
	});
	ipcMain.handle("products:getById", async (_, id) => {
		try {
			return await ProductService.getProductById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener producto"
			};
		}
	});
	ipcMain.handle("products:getLowStock", async () => {
		try {
			return await ProductService.getLowStockProducts();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener productos con stock bajo"
			};
		}
	});
	ipcMain.handle("products:create", wrapIpc((productData, userId) => ProductService.createProduct(productData, userId), productSchema));
	ipcMain.handle("products:update", wrapIpc((id, productData, userId) => ProductService.updateProduct(id, productData, userId)));
	ipcMain.handle("products:delete", async (_, id, userId) => {
		try {
			return await ProductService.deleteProduct(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar producto"
			};
		}
	});
	ipcMain.handle("products:addStock", async (_, productId, quantity, userId) => {
		try {
			return await ProductService.addStock(productId, quantity, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al añadir stock"
			};
		}
	});
	ipcMain.handle("products:removeStock", async (_, productId, quantity, userId) => {
		try {
			return await ProductService.removeStock(productId, quantity, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al reducir stock"
			};
		}
	});
	ipcMain.handle("products:getMovements", async (_, productId, limit) => {
		try {
			return await ProductService.getInventoryMovements(productId, limit);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener movimientos"
			};
		}
	});
	/**
	* SALES
	*/
	ipcMain.handle("sales:getAll", async (_, startDate, endDate, clientId, cashRegisterId) => {
		try {
			return await SaleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas"
			};
		}
	});
	ipcMain.handle("sales:getToday", async () => {
		try {
			return await SaleService.getTodaySales();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas del día"
			};
		}
	});
	ipcMain.handle("sales:getStats", async (_, startDate, endDate) => {
		try {
			return await SaleService.getSalesStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener estadísticas"
			};
		}
	});
	ipcMain.handle("sales:getDetails", async (_, saleId) => {
		try {
			return await SaleService.getSaleDetails(saleId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de venta"
			};
		}
	});
	ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
		return SaleService.registerSale(saleData, itemsData, userId);
	}, saleSchema.omit({ items: true })));
	ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
		try {
			return await SaleService.cancelSale(saleId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cancelar venta"
			};
		}
	});
	/**
	* CATEGORIES
	*/
	ipcMain.handle("categories:getAll", async (_, search) => {
		try {
			return await CategoryRepository.findAll(search);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("categories:getById", async (_, id) => {
		try {
			return await CategoryRepository.findById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener categoría"
			};
		}
	});
	ipcMain.handle("categories:create", wrapIpc((categoryData, userId) => CategoryRepository.create(categoryData, userId), categorySchema));
	ipcMain.handle("categories:update", wrapIpc((id, categoryData, userId) => CategoryRepository.update(id, categoryData, userId)));
	ipcMain.handle("categories:delete", async (_, id, userId) => {
		try {
			return await CategoryRepository.delete(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	/**
	* USERS
	*/
	ipcMain.handle("users:getAll", async () => {
		try {
			return await UserService.getAllUsers();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener usuarios"
			};
		}
	});
	ipcMain.handle("users:getById", async (_, id) => {
		try {
			return await UserService.getUserById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener usuario"
			};
		}
	});
	ipcMain.handle("users:create", async (_, userData, createdBy) => {
		try {
			return {
				success: true,
				user: await UserService.createUser(userData, createdBy)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al crear usuario"
			};
		}
	});
	ipcMain.handle("users:update", async (_, id, userData, updatedBy) => {
		try {
			return {
				success: true,
				user: await UserService.updateUser(id, userData, updatedBy)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al actualizar usuario"
			};
		}
	});
	ipcMain.handle("users:delete", async (_, id, deletedBy) => {
		try {
			return await UserService.deleteUser(id, deletedBy);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar usuario"
			};
		}
	});
	ipcMain.handle("users:changePassword", async (_, userId, newPassword, changedBy) => {
		try {
			return await UserService.changePassword(userId, newPassword, changedBy);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cambiar contraseña"
			};
		}
	});
}
//#endregion
//#region src/main/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
var win;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
async function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: path.join(__dirname, "index.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		},
		autoHideMenuBar: true
	});
	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else win.loadFile(path.join(process.env.DIST, "index.html"));
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.whenReady().then(async () => {
	try {
		await prisma.$connect();
		console.log("✅ Prisma connected to PostgreSQL successfully.");
	} catch (err) {
		console.error("❌ Failed to connect to PostgreSQL:", err);
	}
	setupIpcHandlers();
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
//#endregion
