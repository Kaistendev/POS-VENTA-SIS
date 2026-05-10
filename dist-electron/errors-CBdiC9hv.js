//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = /* @__PURE__ */ ((t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
})({
	BusinessRuleError: () => o,
	ConflictError: () => a,
	DomainError: () => n,
	NotFoundError: () => r,
	ValidationError: () => i
}), n = class extends Error {}, r = class extends n {
	code = "NOT_FOUND";
	constructor(e, t) {
		super(t ? `${e} no encontrado (${t})` : `${e} no encontrado`), this.name = "NotFoundError";
	}
}, i = class extends n {
	code = "VALIDATION";
	errors;
	constructor(e, t) {
		super(e), this.name = "ValidationError", this.errors = t || [];
	}
}, a = class extends n {
	code = "CONFLICT";
	constructor(e) {
		super(e), this.name = "ConflictError";
	}
}, o = class extends n {
	code = "BUSINESS_RULE";
	constructor(e) {
		super(e), this.name = "BusinessRuleError";
	}
};
//#endregion
export { i as a, r as i, a as n, t as o, n as r, o as t };
