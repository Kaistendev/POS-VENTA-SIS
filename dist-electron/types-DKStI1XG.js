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
export { INTENT_LABELS as n, INDEX_TO_INTENT as t };
