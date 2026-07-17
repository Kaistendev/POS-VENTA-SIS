import { t as logger } from "./logger-BsWMrnsx.js";
import { i as Preprocessor, n as saveModelToFileSystem, r as DEFAULT_MODEL_CONFIG } from "./tfjsIO-BYN4OC05.js";
import { r as INTENT_TO_INDEX, t as INDEX_TO_INTENT } from "./types-CW-fkx8v.js";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as tf from "@tensorflow/tfjs";
import { DatabaseSync } from "node:sqlite";
//#region src/infrastructure/neural/models/IntentClassifierModel.ts
function buildSequentialModel(config = {}) {
	const cfg = {
		...DEFAULT_MODEL_CONFIG,
		...config
	};
	const model = tf.sequential({ name: "intent_classifier_seq" });
	model.add(tf.layers.embedding({
		inputDim: cfg.inputSize,
		outputDim: cfg.embeddingSize,
		inputLength: cfg.maxSequenceLength,
		maskZero: true
	}));
	model.add(tf.layers.globalAveragePooling1d());
	model.add(tf.layers.dense({
		units: cfg.hiddenSize,
		activation: "relu"
	}));
	model.add(tf.layers.dropout({ rate: cfg.dropoutRate }));
	model.add(tf.layers.dense({
		units: Math.floor(cfg.hiddenSize / 2),
		activation: "relu"
	}));
	model.add(tf.layers.dropout({ rate: cfg.dropoutRate * .5 }));
	model.add(tf.layers.dense({
		units: cfg.numClasses,
		activation: "softmax"
	}));
	model.compile({
		optimizer: tf.train.adam(cfg.learningRate),
		loss: "categoricalCrossentropy",
		metrics: ["accuracy"]
	});
	return model;
}
//#endregion
//#region src/infrastructure/neural/pipeline/splitter.ts
function shuffleArray(array) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
function stratifiedSplit(data, trainRatio = .7, valRatio = .15) {
	const grouped = {};
	data.forEach((ex) => {
		if (!grouped[ex.intent]) grouped[ex.intent] = [];
		grouped[ex.intent].push(ex);
	});
	const train = [];
	const val = [];
	const test = [];
	for (const intentExamples of Object.values(grouped)) {
		const shuffled = shuffleArray(intentExamples);
		const trainEnd = Math.floor(shuffled.length * trainRatio);
		const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);
		train.push(...shuffled.slice(0, trainEnd));
		val.push(...shuffled.slice(trainEnd, valEnd));
		test.push(...shuffled.slice(valEnd));
	}
	return {
		train,
		val,
		test
	};
}
//#endregion
//#region src/infrastructure/neural/dataset/raw.dataset.ts
var RAW_DATASET = [
	{
		id: "pq_001",
		query: "cual es el precio del arroz",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "arroz"
		}
	},
	{
		id: "pq_002",
		query: "cuanto vale el azúcar",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "azúcar"
		}
	},
	{
		id: "pq_003",
		query: "dame el precio del SKU BEB-001",
		intent: "product_query",
		entities: {
			query_type: "sku",
			sku: "BEB-001"
		}
	},
	{
		id: "pq_004",
		query: "cuanto cuesta la leche",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "leche"
		}
	},
	{
		id: "pq_005",
		query: "precio del pan de molde",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "pan de molde"
		}
	},
	{
		id: "pq_006",
		query: "cuál es el producto más caro",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_007",
		query: "dame el producto más costoso del inventario",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_008",
		query: "cuál es el producto más barato",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_009",
		query: "productos con poco stock",
		intent: "product_query",
		entities: { query_type: "low_stock" }
	},
	{
		id: "pq_010",
		query: "que productos tienen stock bajo",
		intent: "product_query",
		entities: { query_type: "low_stock" }
	},
	{
		id: "pq_011",
		query: "cuales son los productos con menos stock",
		intent: "product_query",
		entities: { query_type: "low_stock" }
	},
	{
		id: "pq_012",
		query: "busca producto llamado café",
		intent: "product_query",
		entities: {
			query_type: "search",
			product_name: "café"
		}
	},
	{
		id: "pq_013",
		query: "encuentra el producto con SKU LAT-456",
		intent: "product_query",
		entities: {
			query_type: "sku",
			sku: "LAT-456"
		}
	},
	{
		id: "pq_014",
		query: "cuanto stock tiene la cerveza",
		intent: "product_query",
		entities: {
			query_type: "stock",
			product_name: "cerveza"
		}
	},
	{
		id: "pq_015",
		query: "hay suficiente stock de galletas",
		intent: "product_query",
		entities: {
			query_type: "stock",
			product_name: "galletas"
		}
	},
	{
		id: "pq_016",
		query: "cual es el precio de venta del detergente",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "detergente"
		}
	},
	{
		id: "pq_017",
		query: "dame el producto mas caro",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_018",
		query: "producto más barato del inventario",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_019",
		query: "cuanto esta el precio del aceite",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "aceite"
		}
	},
	{
		id: "pq_020",
		query: "cuales son los productos mas vendidos",
		intent: "product_query",
		entities: { query_type: "top_sold" }
	},
	{
		id: "pq_021",
		query: "que productos se venden más",
		intent: "product_query",
		entities: { query_type: "top_sold" }
	},
	{
		id: "pq_022",
		query: "precio del kilo de pollo",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "pollo"
		}
	},
	{
		id: "pq_023",
		query: "cuanto cuesta el shampoo",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "shampoo"
		}
	},
	{
		id: "pq_024",
		query: "sku COM-001 precio y stock",
		intent: "product_query",
		entities: {
			query_type: "sku",
			sku: "COM-001"
		}
	},
	{
		id: "pq_025",
		query: "dame información del producto jabón",
		intent: "product_query",
		entities: {
			query_type: "search",
			product_name: "jabón"
		}
	},
	{
		id: "pq_026",
		query: "existe el producto con código REF-789",
		intent: "product_query",
		entities: {
			query_type: "sku",
			sku: "REF-789"
		}
	},
	{
		id: "pq_027",
		query: "cuanto vale el producto mas barato",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_028",
		query: "cuales productos tienen poco inventario",
		intent: "product_query",
		entities: { query_type: "low_stock" }
	},
	{
		id: "pq_029",
		query: "dime los productos que estan por agotarse",
		intent: "product_query",
		entities: { query_type: "low_stock" }
	},
	{
		id: "pq_030",
		query: "precio de la mantequilla",
		intent: "product_query",
		entities: {
			query_type: "price",
			product_name: "mantequilla"
		}
	},
	{
		id: "pq_031",
		query: "cual es el producto mas costoso",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_032",
		query: "dame el precio mas caro del inventario",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_033",
		query: "que producto tiene el mayor precio",
		intent: "product_query",
		entities: { query_type: "most_expensive" }
	},
	{
		id: "pq_034",
		query: "cual es el producto mas economico",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_035",
		query: "el producto con menor precio",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_036",
		query: "dame el producto mas barato",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "pq_037",
		query: "que producto vale menos",
		intent: "product_query",
		entities: { query_type: "cheapest" }
	},
	{
		id: "ec_001",
		query: "cuantos productos hay en total",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_002",
		query: "cuantos productos tengo registrados",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_003",
		query: "cuantos productos hay en el inventario",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_004",
		query: "cuantas categorías tienes",
		intent: "entity_count",
		entities: { entity_type: "category" }
	},
	{
		id: "ec_005",
		query: "cuantas categorias existen",
		intent: "entity_count",
		entities: { entity_type: "category" }
	},
	{
		id: "ec_006",
		query: "cuantos clientes hay registrados",
		intent: "entity_count",
		entities: { entity_type: "client" }
	},
	{
		id: "ec_007",
		query: "cuantos clientes tengo",
		intent: "entity_count",
		entities: { entity_type: "client" }
	},
	{
		id: "ec_008",
		query: "cuantos proveedores hay",
		intent: "entity_count",
		entities: { entity_type: "supplier" }
	},
	{
		id: "ec_009",
		query: "cuantos proveedores tienes registrados",
		intent: "entity_count",
		entities: { entity_type: "supplier" }
	},
	{
		id: "ec_010",
		query: "cuantas categorías hay en total",
		intent: "entity_count",
		entities: { entity_type: "category" }
	},
	{
		id: "ec_011",
		query: "cuantos productos existen en el sistema",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_012",
		query: "total de productos registrados",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_013",
		query: "numero de clientes",
		intent: "entity_count",
		entities: { entity_type: "client" }
	},
	{
		id: "ec_014",
		query: "cantidad de proveedores",
		intent: "entity_count",
		entities: { entity_type: "supplier" }
	},
	{
		id: "ec_015",
		query: "cuantas categorías de productos hay",
		intent: "entity_count",
		entities: { entity_type: "category" }
	},
	{
		id: "ec_016",
		query: "cuantos clientes están registrados en el sistema",
		intent: "entity_count",
		entities: { entity_type: "client" }
	},
	{
		id: "ec_017",
		query: "dime cuantos productos tengo",
		intent: "entity_count",
		entities: { entity_type: "product" }
	},
	{
		id: "ec_018",
		query: "cuantos proveedores tengo registrados",
		intent: "entity_count",
		entities: { entity_type: "supplier" }
	},
	{
		id: "ec_019",
		query: "cuantas categorias tengo",
		intent: "entity_count",
		entities: { entity_type: "category" }
	},
	{
		id: "ec_020",
		query: "total de clientes en la base de datos",
		intent: "entity_count",
		entities: { entity_type: "client" }
	},
	{
		id: "ec_021",
		query: "cuantas marcas de productos hay",
		intent: "entity_count",
		entities: { entity_type: "brand" }
	},
	{
		id: "ec_022",
		query: "cuantas marcas tengo registradas",
		intent: "entity_count",
		entities: { entity_type: "brand" }
	},
	{
		id: "ec_023",
		query: "cuantas unidades de medida existen",
		intent: "entity_count",
		entities: { entity_type: "unit" }
	},
	{
		id: "ec_024",
		query: "cuantas unidades de medida hay",
		intent: "entity_count",
		entities: { entity_type: "unit" }
	},
	{
		id: "ec_025",
		query: "cuantos usuarios hay en el sistema",
		intent: "entity_count",
		entities: { entity_type: "user" }
	},
	{
		id: "ec_026",
		query: "cuantos usuarios registrados tengo",
		intent: "entity_count",
		entities: { entity_type: "user" }
	},
	{
		id: "ec_027",
		query: "cuantas cajas registradoras hay",
		intent: "entity_count",
		entities: { entity_type: "cash_register" }
	},
	{
		id: "ec_028",
		query: "cuantos metodos de pago hay",
		intent: "entity_count",
		entities: { entity_type: "payment_method" }
	},
	{
		id: "cr_001",
		query: "registra un producto nuevo llamado te verde",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "te verde"
		}
	},
	{
		id: "cr_002",
		query: "crea un producto llamado café molido precio compra 5 precio venta 8",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "café molido",
			price_purchase: 5,
			price_sale: 8
		}
	},
	{
		id: "cr_003",
		query: "crea un cliente llamado juan perez con dni 12345678",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "juan perez",
			dni: "12345678"
		}
	},
	{
		id: "cr_004",
		query: "registra un cliente nuevo maria lopez",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "maria lopez"
		}
	},
	{
		id: "cr_005",
		query: "crear producto castañas precio compra 1.30 precio venta 2",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "castañas",
			price_purchase: 1.3,
			price_sale: 2
		}
	},
	{
		id: "cr_006",
		query: "añade un producto nuevo arroz integral",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "arroz integral"
		}
	},
	{
		id: "cr_007",
		query: "registra cliente pedro ramirez dni 87654321",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "pedro ramirez",
			dni: "87654321"
		}
	},
	{
		id: "cr_008",
		query: "crea producto leche descremada precio compra 2.50 precio venta 3.80",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "leche descremada",
			price_purchase: 2.5,
			price_sale: 3.8
		}
	},
	{
		id: "cr_009",
		query: "nuevo cliente ana garcia",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "ana garcia"
		}
	},
	{
		id: "cr_010",
		query: "agregar producto queso fresco precio venta 4.50 stock 20",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "queso fresco",
			price_sale: 4.5,
			stock: 20
		}
	},
	{
		id: "cr_011",
		query: "registrar producto jamon serrano",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "jamon serrano"
		}
	},
	{
		id: "cr_012",
		query: "crear cliente carlos martinez con dni 11223344",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "carlos martinez",
			dni: "11223344"
		}
	},
	{
		id: "cr_013",
		query: "añade cliente lucia fernandez",
		intent: "entity_creation",
		entities: {
			entity_type: "client",
			name: "lucia fernandez"
		}
	},
	{
		id: "cr_014",
		query: "nuevo producto galletas de chocolate precio compra 1.20 precio venta 2.50",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "galletas de chocolate",
			price_purchase: 1.2,
			price_sale: 2.5
		}
	},
	{
		id: "cr_015",
		query: "crea un producto nuevo llamado agua mineral",
		intent: "entity_creation",
		entities: {
			entity_type: "product",
			name: "agua mineral"
		}
	},
	{
		id: "cr_016",
		query: "registra proveedor distribuidora ABC ruc 20123456789",
		intent: "entity_creation",
		entities: {
			entity_type: "supplier",
			name: "distribuidora ABC",
			ruc: "20123456789"
		}
	},
	{
		id: "cr_017",
		query: "crear proveedor alimentos SAC",
		intent: "entity_creation",
		entities: {
			entity_type: "supplier",
			name: "alimentos SAC"
		}
	},
	{
		id: "cr_018",
		query: "registra categoria lacteos",
		intent: "entity_creation",
		entities: {
			entity_type: "category",
			name: "lacteos"
		}
	},
	{
		id: "cr_019",
		query: "crear categoria bebidas",
		intent: "entity_creation",
		entities: {
			entity_type: "category",
			name: "bebidas"
		}
	},
	{
		id: "cr_020",
		query: "agregar categoria limpieza",
		intent: "entity_creation",
		entities: {
			entity_type: "category",
			name: "limpieza"
		}
	},
	{
		id: "dm_001",
		query: "modifica el precio del arroz",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "arroz"
		}
	},
	{
		id: "dm_002",
		query: "actualiza el stock de la leche",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "leche"
		}
	},
	{
		id: "dm_003",
		query: "cambiar nombre del cliente juan",
		intent: "data_modification",
		entities: {
			entity_type: "client",
			name: "juan"
		}
	},
	{
		id: "dm_004",
		query: "editar precio del producto café",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "café"
		}
	},
	{
		id: "dm_005",
		query: "actualizar datos del cliente maria",
		intent: "data_modification",
		entities: {
			entity_type: "client",
			name: "maria"
		}
	},
	{
		id: "dm_006",
		query: "modifica el precio de venta del detergente",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "detergente"
		}
	},
	{
		id: "dm_007",
		query: "cambiar stock del producto galletas a 50",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "galletas"
		}
	},
	{
		id: "dm_008",
		query: "actualiza el nombre del proveedor distribuidora",
		intent: "data_modification",
		entities: {
			entity_type: "supplier",
			name: "distribuidora"
		}
	},
	{
		id: "dm_009",
		query: "editar información del producto pan",
		intent: "data_modification",
		entities: {
			entity_type: "product",
			name: "pan"
		}
	},
	{
		id: "dm_010",
		query: "modificar teléfono del cliente pedro",
		intent: "data_modification",
		entities: {
			entity_type: "client",
			name: "pedro"
		}
	},
	{
		id: "dd_001",
		query: "elimina el producto café",
		intent: "data_deletion",
		entities: {
			entity_type: "product",
			name: "café"
		}
	},
	{
		id: "dd_002",
		query: "borrar cliente pedro",
		intent: "data_deletion",
		entities: {
			entity_type: "client",
			name: "pedro"
		}
	},
	{
		id: "dd_003",
		query: "quitar producto galletas del inventario",
		intent: "data_deletion",
		entities: {
			entity_type: "product",
			name: "galletas"
		}
	},
	{
		id: "dd_004",
		query: "eliminar categoria lacteos",
		intent: "data_deletion",
		entities: {
			entity_type: "category",
			name: "lacteos"
		}
	},
	{
		id: "dd_005",
		query: "dar de baja al cliente juan perez",
		intent: "data_deletion",
		entities: {
			entity_type: "client",
			name: "juan perez"
		}
	},
	{
		id: "dd_006",
		query: "borrar proveedor distribuidora ABC",
		intent: "data_deletion",
		entities: {
			entity_type: "supplier",
			name: "distribuidora ABC"
		}
	},
	{
		id: "dd_007",
		query: "eliminar el producto arroz del sistema",
		intent: "data_deletion",
		entities: {
			entity_type: "product",
			name: "arroz"
		}
	},
	{
		id: "dd_008",
		query: "remover cliente ana garcia",
		intent: "data_deletion",
		entities: {
			entity_type: "client",
			name: "ana garcia"
		}
	},
	{
		id: "dd_009",
		query: "borrar categoria bebidas",
		intent: "data_deletion",
		entities: {
			entity_type: "category",
			name: "bebidas"
		}
	},
	{
		id: "dd_010",
		query: "eliminar producto queso fresco",
		intent: "data_deletion",
		entities: {
			entity_type: "product",
			name: "queso fresco"
		}
	},
	{
		id: "sd_001",
		query: "vende 2 cafes a juan perez",
		intent: "sale_draft",
		entities: {
			producto: "cafe",
			cantidad: 2,
			cliente: "juan perez"
		}
	},
	{
		id: "sd_002",
		query: "quiero comprar 3 arroz",
		intent: "sale_draft",
		entities: {
			producto: "arroz",
			cantidad: 3
		}
	},
	{
		id: "sd_003",
		query: "vende una leche a maria",
		intent: "sale_draft",
		entities: {
			producto: "leche",
			cantidad: 1,
			cliente: "maria"
		}
	},
	{
		id: "sd_004",
		query: "prepara carrito con pan y mantequilla",
		intent: "sale_draft",
		entities: {
			producto: "pan mantequilla",
			cantidad: 1
		}
	},
	{
		id: "sd_005",
		query: "vende 5 cervezas",
		intent: "sale_draft",
		entities: {
			producto: "cerveza",
			cantidad: 5
		}
	},
	{
		id: "sd_006",
		query: "arma una venta de 2 galletas y 1 jugo",
		intent: "sale_draft",
		entities: { cantidad: 2 }
	},
	{
		id: "sd_007",
		query: "quiero vender un detergente a carlos",
		intent: "sale_draft",
		entities: {
			producto: "detergente",
			cantidad: 1,
			cliente: "carlos"
		}
	},
	{
		id: "sd_008",
		query: "prepara venta de 10 unidades de arroz",
		intent: "sale_draft",
		entities: {
			producto: "arroz",
			cantidad: 10
		}
	},
	{
		id: "sd_009",
		query: "vende 2 shampoos a luis",
		intent: "sale_draft",
		entities: {
			producto: "shampoo",
			cantidad: 2,
			cliente: "luis"
		}
	},
	{
		id: "sd_010",
		query: "carrito con 3 aceites y 2 vinagres",
		intent: "sale_draft",
		entities: { cantidad: 3 }
	},
	{
		id: "sd_011",
		query: "haz una venta de un pan a maria",
		intent: "sale_draft",
		entities: {
			producto: "pan",
			cantidad: 1,
			cliente: "maria"
		}
	},
	{
		id: "sd_012",
		query: "registra venta de 4 botellas de agua",
		intent: "sale_draft",
		entities: {
			producto: "agua",
			cantidad: 4
		}
	},
	{
		id: "sd_013",
		query: "prepara ticket con 2 cafes y 1 tostada",
		intent: "sale_draft",
		entities: { cantidad: 2 }
	},
	{
		id: "sd_014",
		query: "vende 1 kilo de pollo a juan",
		intent: "sale_draft",
		entities: {
			producto: "pollo",
			cantidad: 1,
			cliente: "juan"
		}
	},
	{
		id: "sd_015",
		query: "comprar 6 huevos",
		intent: "sale_draft",
		entities: {
			producto: "huevos",
			cantidad: 6
		}
	},
	{
		id: "ss_001",
		query: "cuanto se vendio ayer",
		intent: "sales_summary",
		entities: { period: "yesterday" }
	},
	{
		id: "ss_002",
		query: "resumen de ventas de esta semana",
		intent: "sales_summary",
		entities: { period: "week" }
	},
	{
		id: "ss_003",
		query: "dame las ganancias del dia",
		intent: "sales_summary"
	},
	{
		id: "ss_004",
		query: "cuanto se vendio hoy",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_005",
		query: "ventas del mes actual",
		intent: "sales_summary",
		entities: { period: "month" }
	},
	{
		id: "ss_006",
		query: "total de ingresos de hoy",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_007",
		query: "cuanto dinero entro en caja hoy",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_008",
		query: "resumen de ganancias semanales",
		intent: "sales_summary",
		entities: { period: "week" }
	},
	{
		id: "ss_009",
		query: "dime las ventas del mes",
		intent: "sales_summary",
		entities: { period: "month" }
	},
	{
		id: "ss_010",
		query: "cuantas ventas se hicieron ayer",
		intent: "sales_summary",
		entities: { period: "yesterday" }
	},
	{
		id: "ss_011",
		query: "balance de ventas de hoy",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_012",
		query: "cuanto se facturo esta semana",
		intent: "sales_summary",
		entities: { period: "week" }
	},
	{
		id: "ss_013",
		query: "dame el reporte de ventas",
		intent: "sales_summary"
	},
	{
		id: "ss_014",
		query: "total vendido en el mes",
		intent: "sales_summary",
		entities: { period: "month" }
	},
	{
		id: "ss_015",
		query: "cuanto se recaudo hoy en efectivo",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_016",
		query: "ventas del dia de hoy",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_017",
		query: "resumen diario de ventas",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "ss_018",
		query: "cual es el total de ganancias",
		intent: "sales_summary"
	},
	{
		id: "ss_019",
		query: "cuanto se vendio la semana pasada",
		intent: "sales_summary",
		entities: { period: "last_week" }
	},
	{
		id: "ss_020",
		query: "ingresos del dia",
		intent: "sales_summary",
		entities: { period: "today" }
	},
	{
		id: "gn_001",
		query: "hola como estas",
		intent: "general"
	},
	{
		id: "gn_002",
		query: "quien eres",
		intent: "general"
	},
	{
		id: "gn_003",
		query: "que puedes hacer",
		intent: "general"
	},
	{
		id: "gn_004",
		query: "ayuda",
		intent: "general"
	},
	{
		id: "gn_005",
		query: "que productos estan por vencer",
		intent: "general"
	},
	{
		id: "ss_021",
		query: "quien compro la ultima venta",
		intent: "sales_summary"
	},
	{
		id: "ss_022",
		query: "a nombre de quien fue la ultima venta",
		intent: "sales_summary"
	},
	{
		id: "ss_023",
		query: "quien es el cliente que mas compro hoy",
		intent: "sales_summary"
	},
	{
		id: "ss_024",
		query: "quien gasto mas en el dia",
		intent: "sales_summary"
	},
	{
		id: "ss_025",
		query: "cual cliente compro mas",
		intent: "sales_summary"
	},
	{
		id: "ss_026",
		query: "quien es el top cliente del dia",
		intent: "sales_summary"
	},
	{
		id: "ss_027",
		query: "cliente que mas compro",
		intent: "sales_summary"
	},
	{
		id: "ss_028",
		query: "quien fue el comprador de la ultima venta",
		intent: "sales_summary"
	},
	{
		id: "ss_029",
		query: "el cliente que mas gasto",
		intent: "sales_summary"
	},
	{
		id: "ss_030",
		query: "quien ha comprado mas hoy",
		intent: "sales_summary"
	},
	{
		id: "gn_008",
		query: "gracias",
		intent: "general"
	},
	{
		id: "gn_009",
		query: "buenos dias",
		intent: "general"
	},
	{
		id: "gn_010",
		query: "buenas tardes",
		intent: "general"
	},
	{
		id: "gn_011",
		query: "adios",
		intent: "general"
	},
	{
		id: "gn_012",
		query: "chao",
		intent: "general"
	},
	{
		id: "gn_013",
		query: "de que se trata este sistema",
		intent: "general"
	},
	{
		id: "gn_014",
		query: "como funciona el pos",
		intent: "general"
	},
	{
		id: "gn_015",
		query: "quien me puede ayudar",
		intent: "general"
	},
	{
		id: "gn_016",
		query: "dime algo interesante",
		intent: "general"
	},
	{
		id: "gn_017",
		query: "como configurar el sistema",
		intent: "general"
	},
	{
		id: "gn_018",
		query: "que es un punto de venta",
		intent: "general"
	},
	{
		id: "gn_019",
		query: "necesito ayuda con el programa",
		intent: "general"
	},
	{
		id: "gn_020",
		query: "que tal",
		intent: "general"
	},
	{
		id: "gn_021",
		query: "bien y tu",
		intent: "general"
	},
	{
		id: "gn_022",
		query: "estas disponible",
		intent: "general"
	},
	{
		id: "gn_023",
		query: "puedes ayudarme con algo",
		intent: "general"
	},
	{
		id: "gn_024",
		query: "que haces",
		intent: "general"
	},
	{
		id: "gn_025",
		query: "dime un chiste",
		intent: "general"
	}
];
//#endregion
//#region src/infrastructure/neural/dataset/index.ts
var extraExamples = null;
function addExtraExamples(examples) {
	extraExamples = examples;
}
function getRawDataset() {
	if (extraExamples && extraExamples.length > 0) return [...RAW_DATASET, ...extraExamples];
	const extPath = join(process.cwd(), "src", "infrastructure", "neural", "dataset", "extra_dataset.json");
	if (existsSync(extPath)) try {
		const external = JSON.parse(readFileSync(extPath, "utf-8"));
		if (external.length > 0) return [...RAW_DATASET, ...external];
	} catch {}
	return RAW_DATASET;
}
//#endregion
//#region src/infrastructure/neural/models/trainer.ts
var IntentClassifierTrainer = class {
	preprocessor;
	constructor() {
		this.preprocessor = new Preprocessor();
	}
	prepareData() {
		const split = stratifiedSplit(getRawDataset(), .7, .15);
		const vocabulary = this.preprocessor.buildVocabulary(split.train, 1, DEFAULT_MODEL_CONFIG.inputSize);
		return {
			train: split.train,
			val: split.val,
			test: split.test,
			vocabulary
		};
	}
	async train(config = {}, epochs = 200, batchSize = 8, onEpochEnd) {
		const cfg = {
			...DEFAULT_MODEL_CONFIG,
			...config
		};
		const { train, val, vocabulary } = this.prepareData();
		cfg.inputSize = vocabulary.size;
		const model = buildSequentialModel(cfg);
		const xTrain = tf.tensor2d(this.preprocessor.batchToInputVectors(train, vocabulary, cfg.maxSequenceLength), [train.length, cfg.maxSequenceLength], "int32");
		const yTrain = tf.tensor2d(this.preprocessor.batchToOutputVectors(train, INTENT_TO_INDEX, cfg.numClasses), [train.length, cfg.numClasses], "float32");
		const xVal = tf.tensor2d(this.preprocessor.batchToInputVectors(val, vocabulary, cfg.maxSequenceLength), [val.length, cfg.maxSequenceLength], "int32");
		const yVal = tf.tensor2d(this.preprocessor.batchToOutputVectors(val, INTENT_TO_INDEX, cfg.numClasses), [val.length, cfg.numClasses], "float32");
		const earlyStopping = tf.callbacks.earlyStopping({
			monitor: "val_loss",
			patience: 30,
			minDelta: .001,
			verbose: 1
		});
		logger.info({
			trainSize: train.length,
			valSize: val.length,
			vocabSize: vocabulary.size
		}, "Starting NN training");
		const history = await model.fit(xTrain, yTrain, {
			epochs,
			batchSize,
			validationData: [xVal, yVal],
			callbacks: [earlyStopping, onEpochEnd ? { onEpochEnd: async (epoch, logs) => {
				if (logs) onEpochEnd(epoch, logs);
			} } : {}],
			verbose: 1
		});
		const result = {
			accuracy: history.history.acc?.[history.history.acc.length - 1] ?? 0,
			loss: history.history.loss?.[history.history.loss.length - 1] ?? 0,
			valAccuracy: history.history.val_acc?.[history.history.val_acc.length - 1] ?? 0,
			valLoss: history.history.val_loss?.[history.history.val_loss.length - 1] ?? 0,
			history,
			vocabulary,
			config: cfg
		};
		logger.info({ ...result }, "Training completed");
		tf.dispose([
			xTrain,
			yTrain,
			xVal,
			yVal
		]);
		model.dispose();
		return result;
	}
	async evaluate(model, test, vocabulary, config) {
		if (test.length === 0) return {
			accuracy: 0,
			precision: 0,
			recall: 0,
			f1Score: 0,
			confusionMatrix: [],
			perIntentMetrics: {}
		};
		const xTest = tf.tensor2d(this.preprocessor.batchToInputVectors(test, vocabulary, config.maxSequenceLength), [test.length, config.maxSequenceLength], "int32");
		const yTest = tf.tensor2d(this.preprocessor.batchToOutputVectors(test, INTENT_TO_INDEX, config.numClasses), [test.length, config.numClasses], "float32");
		const accuracy = (await model.evaluate(xTest, yTest, { batchSize: 8 }))[1].dataSync()[0];
		const predictions = model.predict(xTest);
		const predData = predictions.arraySync();
		const trueData = yTest.arraySync();
		const numClasses = config.numClasses;
		const confusionMatrix = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));
		for (let i = 0; i < predData.length; i++) {
			const predClass = predData[i].indexOf(Math.max(...predData[i]));
			const trueClass = trueData[i].indexOf(Math.max(...trueData[i]));
			confusionMatrix[trueClass][predClass]++;
		}
		const perIntentMetrics = {};
		let totalPrecision = 0;
		let totalRecall = 0;
		let totalF1 = 0;
		for (let i = 0; i < numClasses; i++) {
			const tp = confusionMatrix[i][i];
			const fp = confusionMatrix.reduce((sum, row) => sum + row[i], 0) - tp;
			const fn = confusionMatrix[i].reduce((sum, val) => sum + val, 0) - tp;
			const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
			const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
			const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
			const intent = INDEX_TO_INTENT[i] ?? `class_${i}`;
			perIntentMetrics[intent] = {
				precision,
				recall,
				f1
			};
			totalPrecision += precision;
			totalRecall += recall;
			totalF1 += f1;
		}
		tf.dispose([
			xTest,
			yTest,
			predictions
		]);
		return {
			accuracy,
			precision: totalPrecision / numClasses,
			recall: totalRecall / numClasses,
			f1Score: totalF1 / numClasses,
			confusionMatrix,
			perIntentMetrics
		};
	}
	async trainAndSave(modelPath, config = {}, epochs = 200) {
		const cfg = {
			...DEFAULT_MODEL_CONFIG,
			...config
		};
		const { train, val, test, vocabulary } = this.prepareData();
		cfg.inputSize = vocabulary.size;
		const model = buildSequentialModel(cfg);
		const xTrain = tf.tensor2d(this.preprocessor.batchToInputVectors(train, vocabulary, cfg.maxSequenceLength), [train.length, cfg.maxSequenceLength], "int32");
		const yTrain = tf.tensor2d(this.preprocessor.batchToOutputVectors(train, INTENT_TO_INDEX, cfg.numClasses), [train.length, cfg.numClasses], "float32");
		const xVal = val.length > 0 ? tf.tensor2d(this.preprocessor.batchToInputVectors(val, vocabulary, cfg.maxSequenceLength), [val.length, cfg.maxSequenceLength], "int32") : null;
		const yVal = val.length > 0 ? tf.tensor2d(this.preprocessor.batchToOutputVectors(val, INTENT_TO_INDEX, cfg.numClasses), [val.length, cfg.numClasses], "float32") : null;
		const fitOptions = {
			epochs,
			batchSize: 8,
			callbacks: [tf.callbacks.earlyStopping({
				monitor: "val_loss",
				patience: 50,
				minDelta: 1e-4
			})],
			verbose: 1
		};
		if (xVal && yVal) fitOptions.validationData = [xVal, yVal];
		else fitOptions.validationSplit = .1;
		const history = await model.fit(xTrain, yTrain, fitOptions);
		const result = {
			accuracy: history.history.acc?.[history.history.acc.length - 1] ?? 0,
			loss: history.history.loss?.[history.history.loss.length - 1] ?? 0,
			valAccuracy: history.history.val_acc?.[history.history.val_acc.length - 1] ?? 0,
			valLoss: history.history.val_loss?.[history.history.val_loss.length - 1] ?? 0,
			history,
			vocabulary,
			config: cfg
		};
		await saveModelToFileSystem(model, modelPath);
		logger.info({ modelPath }, "Model saved");
		const metadata = {
			vocabulary: {
				wordToIndex: vocabulary.wordToIndex,
				indexToWord: vocabulary.indexToWord,
				size: vocabulary.size
			},
			config: cfg,
			intents: Object.entries(INTENT_TO_INDEX).map(([name, idx]) => ({
				name,
				index: idx
			}))
		};
		const { writeFileSync } = await import("fs");
		writeFileSync(`${modelPath}/metadata.json`, JSON.stringify(metadata, null, 2));
		logger.info({ modelPath }, "Metadata saved");
		const metrics = test.length > 0 ? await this.evaluate(model, test, vocabulary, cfg) : void 0;
		if (metrics) logger.info({ metrics }, "Evaluation completed");
		tf.dispose([xTrain, yTrain]);
		if (xVal) tf.dispose(xVal);
		if (yVal) tf.dispose(yVal);
		model.dispose();
		return {
			result,
			metrics
		};
	}
};
//#endregion
//#region src/infrastructure/neural/training/AutoTrainService.ts
var INTENT_KEYWORDS = {
	product_query: [
		/precio|costoso?|caro|barato|cuest(a|e)|sku|costo|costar|valor/i,
		/producto|stock|inventario|existencia|disponible/i,
		/mas\s+caro|mas\s+barato|mas\s+economico/i,
		/categor[ií]a|marca|tipo\s+de\s+producto/i
	],
	entity_count: [
		/cu[aá]ntos?\s+(producto|cliente|categoria|proveedor)/i,
		/cu[aá]ntas?\s+(categor[ií]as|ventas|compras)/i,
		/total\s+de\s+(productos|clientes|usuarios)/i,
		/cu[aá]ntos?\s+(hay|tenemos|existen|registrados)/i
	],
	entity_creation: [
		/crea(r|r\s*un|r\s*una)?\s+(producto|cliente|nuev)/i,
		/registra(r)?\s+(producto|cliente|nuev)/i,
		/a[ñn]adir\s+(producto|cliente|nuev)/i,
		/nuev[oa]\s+(producto|cliente)/i
	],
	data_modification: [
		/modifica(r)?\s+|actualiza(r)?\s+|cambia(r)?\s+/i,
		/edita(r)?\s+/i,
		/quiero\s+(cambiar|modificar|actualizar)/i
	],
	data_deletion: [/elimina(r)?\s+|borra(r)?\s+|quit(a|ar)\s+/i, /eliminaci[oó]n|borrar|suprimir/i],
	sale_draft: [
		/vend(e|er|o)\s+/i,
		/compra(r)?\s+/i,
		/factura(r)?\s+|carrito|pedido/i,
		/preparar\s+(venta|pedido)/i
	],
	sales_summary: [
		/ventas?\s+(de\s+hoy|del\s+d[ií]a|seman|mes|a[ñn]o)/i,
		/ganancia|ingreso|recaudaci[oó]n|resumen\s+de\s+ventas/i,
		/cu[aá]ntas?\s+ventas/i,
		/total\s+(vendido|facturado|recaudado)/i,
		/reporte\s+de\s+ventas|dashboard/i
	],
	general: [
		/hola|buenos\s+d[ií]as|gracias|ayuda|qui[eé]n\s+eres/i,
		/funciona|como\s+se\s+usa|tutorial/i,
		/adios|chao|nos\s+vemos/i
	]
};
function autoLabel(query) {
	const q = query.toLowerCase();
	for (const [intent, patterns] of Object.entries(INTENT_KEYWORDS)) for (const pattern of patterns) if (pattern.test(q)) return intent;
	return "general";
}
var AutoTrainService = class {
	trainer;
	dbPath;
	constructor(dbPath) {
		this.trainer = new IntentClassifierTrainer();
		this.dbPath = dbPath || join(process.cwd(), "dev.sqlite3");
	}
	async collectFromLogs() {
		const db = new DatabaseSync(this.dbPath);
		try {
			const rows = db.prepare(`
        SELECT mensaje_usuario, nlu_output, created_at
        FROM ai_training_logs
        ORDER BY created_at DESC
        LIMIT 1000
      `).all();
			const examples = [];
			for (const row of rows) {
				let feedback = 0;
				if (row.nlu_output) try {
					const parsed = JSON.parse(row.nlu_output);
					if (parsed.feedback) feedback = parsed.feedback;
				} catch {}
				if (feedback !== 1 && feedback !== -1) continue;
				const intent = autoLabel(row.mensaje_usuario);
				examples.push({
					query: row.mensaje_usuario,
					intent,
					feedback,
					createdAt: row.created_at
				});
			}
			return examples;
		} finally {
			db.close();
		}
	}
	async retrain(options) {
		try {
			const positiveExamples = (await this.collectFromLogs()).filter((e) => e.feedback === 1);
			if (positiveExamples.length < 5) return {
				success: false,
				message: `Solo ${positiveExamples.length} ejemplos positivos. Se necesitan al menos 5 para reentrenar.`
			};
			const augmentedData = augmentDataset(positiveExamples);
			addExtraExamples(augmentedData.map((a, i) => ({
				id: `user_${Date.now()}_${i}`,
				query: a.query,
				intent: a.intent
			})));
			const modelDir = options?.modelDir || join(process.cwd(), "src", "infrastructure", "neural", "models", "model");
			const epochs = options?.epochs || 100;
			if (!existsSync(modelDir)) mkdirSync(modelDir, { recursive: true });
			const acc = (await this.trainer.trainAndSave(modelDir, void 0, epochs)).metrics?.accuracy ?? 0;
			logger.info({
				accuracy: acc,
				examples: positiveExamples.length
			}, "Model retrained successfully");
			writeFileSync(join(modelDir, "augmentation.json"), JSON.stringify({
				augmentedAt: (/* @__PURE__ */ new Date()).toISOString(),
				sourceExamples: positiveExamples.length,
				augmentedExamples: augmentedData.length,
				testAccuracy: acc
			}, null, 2));
			return {
				success: true,
				accuracy: acc,
				message: `Modelo reentrenado con ${positiveExamples.length} nuevos ejemplos. Accuracy: ${(acc * 100).toFixed(1)}%`
			};
		} catch (err) {
			logger.error({ err }, "Auto-retrain failed");
			return {
				success: false,
				message: `Error al reentrenar: ${err.message}`
			};
		}
	}
	async getStats() {
		const examples = await this.collectFromLogs();
		const positive = examples.filter((e) => e.feedback === 1);
		const negative = examples.filter((e) => e.feedback === -1);
		const distribution = {};
		for (const ex of examples) distribution[ex.intent] = (distribution[ex.intent] || 0) + 1;
		let lastTrainingDate = null;
		const metaPath = join(join(process.cwd(), "src", "infrastructure", "neural", "models", "model"), "metadata.json");
		if (existsSync(metaPath)) try {
			lastTrainingDate = JSON.parse(readFileSync(metaPath, "utf-8")).trainingDate || null;
		} catch {}
		return {
			totalLogs: examples.length,
			positiveExamples: positive.length,
			negativeExamples: negative.length,
			lastTrainingDate,
			retrainAvailable: positive.length >= 5,
			intentDistribution: distribution
		};
	}
	getAutoLabeledExamples() {
		const db = new DatabaseSync(this.dbPath);
		try {
			return db.prepare(`
        SELECT mensaje_usuario FROM ai_training_logs
        ORDER BY created_at DESC
        LIMIT 500
      `).all().map((r) => ({
				query: r.mensaje_usuario,
				intent: autoLabel(r.mensaje_usuario)
			}));
		} finally {
			db.close();
		}
	}
};
function augmentDataset(examples) {
	const augmented = [];
	const seen = /* @__PURE__ */ new Set();
	for (const ex of examples) {
		const key = ex.query.toLowerCase().trim();
		if (seen.has(key)) continue;
		seen.add(key);
		augmented.push({
			query: ex.query,
			intent: ex.intent
		});
		const q = ex.query;
		if (q.endsWith("?")) augmented.push({
			query: q.slice(0, -1),
			intent: ex.intent
		});
		if (!q.endsWith("?")) augmented.push({
			query: q + "?",
			intent: ex.intent
		});
		if (q.startsWith("cual ")) augmented.push({
			query: q.replace("cual ", "cuál "),
			intent: ex.intent
		});
	}
	return augmented;
}
//#endregion
export { AutoTrainService };
