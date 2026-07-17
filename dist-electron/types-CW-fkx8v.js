//#region src/infrastructure/neural/types.ts
var INTENT_LABELS = [
	"product_query",
	"entity_count",
	"entity_creation",
	"data_modification",
	"data_deletion",
	"sale_draft",
	"sales_summary",
	"general"
];
var INTENT_TO_INDEX = {
	product_query: 0,
	entity_count: 1,
	entity_creation: 2,
	data_modification: 3,
	data_deletion: 4,
	sale_draft: 5,
	sales_summary: 6,
	general: 7
};
var INDEX_TO_INTENT = {
	0: "product_query",
	1: "entity_count",
	2: "entity_creation",
	3: "data_modification",
	4: "data_deletion",
	5: "sale_draft",
	6: "sales_summary",
	7: "general"
};
//#endregion
export { INTENT_LABELS as n, INTENT_TO_INDEX as r, INDEX_TO_INTENT as t };
