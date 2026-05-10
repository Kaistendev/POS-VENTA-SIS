//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/shared/errors.ts
var errors_exports = /* @__PURE__ */ __exportAll({
	BusinessRuleError: () => BusinessRuleError,
	ConflictError: () => ConflictError,
	DomainError: () => DomainError,
	NotFoundError: () => NotFoundError,
	ValidationError: () => ValidationError
});
var DomainError = class extends Error {};
var NotFoundError = class extends DomainError {
	code = "NOT_FOUND";
	constructor(entity, id) {
		super(id ? `${entity} no encontrado (${id})` : `${entity} no encontrado`);
		this.name = "NotFoundError";
	}
};
var ValidationError = class extends DomainError {
	code = "VALIDATION";
	errors;
	constructor(message, errors) {
		super(message);
		this.name = "ValidationError";
		this.errors = errors || [];
	}
};
var ConflictError = class extends DomainError {
	code = "CONFLICT";
	constructor(message) {
		super(message);
		this.name = "ConflictError";
	}
};
var BusinessRuleError = class extends DomainError {
	code = "BUSINESS_RULE";
	constructor(message) {
		super(message);
		this.name = "BusinessRuleError";
	}
};
//#endregion
export { ValidationError as a, NotFoundError as i, ConflictError as n, errors_exports as o, DomainError as r, BusinessRuleError as t };
