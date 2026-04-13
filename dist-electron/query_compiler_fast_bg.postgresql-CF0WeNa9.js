//#region node_modules/@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs
var e = () => {};
e.prototype = e;
var t;
function n(e) {
	t = e;
}
var r = null;
function i() {
	return (r === null || r.byteLength === 0) && (r = new Uint8Array(t.memory.buffer)), r;
}
var a = new TextDecoder("utf-8", {
	ignoreBOM: !0,
	fatal: !0
});
a.decode();
var o = 2146435072, s = 0;
function c(e, t) {
	return s += t, s >= o && (a = new TextDecoder("utf-8", {
		ignoreBOM: !0,
		fatal: !0
	}), a.decode(), s = t), a.decode(i().subarray(e, e + t));
}
function l(e, t) {
	return e >>>= 0, c(e, t);
}
var u = 0, d = new TextEncoder();
"encodeInto" in d || (d.encodeInto = function(e, t) {
	let n = d.encode(e);
	return t.set(n), {
		read: e.length,
		written: n.length
	};
});
function f(e, t, n) {
	if (n === void 0) {
		let n = d.encode(e), r = t(n.length, 1) >>> 0;
		return i().subarray(r, r + n.length).set(n), u = n.length, r;
	}
	let r = e.length, a = t(r, 1) >>> 0, o = i(), s = 0;
	for (; s < r; s++) {
		let t = e.charCodeAt(s);
		if (t > 127) break;
		o[a + s] = t;
	}
	if (s !== r) {
		s !== 0 && (e = e.slice(s)), a = n(a, r, r = s + e.length * 3, 1) >>> 0;
		let t = i().subarray(a + s, a + r), o = d.encodeInto(e, t);
		s += o.written, a = n(a, r, s, 1) >>> 0;
	}
	return u = s, a;
}
var p = null;
function m() {
	return (p === null || p.buffer.detached === !0 || p.buffer.detached === void 0 && p.buffer !== t.memory.buffer) && (p = new DataView(t.memory.buffer)), p;
}
function h(e) {
	return e == null;
}
function g(e) {
	let t = typeof e;
	if (t == "number" || t == "boolean" || e == null) return `${e}`;
	if (t == "string") return `"${e}"`;
	if (t == "symbol") {
		let t = e.description;
		return t == null ? "Symbol" : `Symbol(${t})`;
	}
	if (t == "function") {
		let t = e.name;
		return typeof t == "string" && t.length > 0 ? `Function(${t})` : "Function";
	}
	if (Array.isArray(e)) {
		let t = e.length, n = "[";
		t > 0 && (n += g(e[0]));
		for (let r = 1; r < t; r++) n += ", " + g(e[r]);
		return n += "]", n;
	}
	let n = /\[object ([^\]]+)\]/.exec(toString.call(e)), r;
	if (n && n.length > 1) r = n[1];
	else return toString.call(e);
	if (r == "Object") try {
		return "Object(" + JSON.stringify(e) + ")";
	} catch {
		return "Object";
	}
	return e instanceof Error ? `${e.name}: ${e.message}
${e.stack}` : r;
}
function _(e, t) {
	return e >>>= 0, i().subarray(e / 1, e / 1 + t);
}
function v(e) {
	let n = t.__wbindgen_externrefs.get(e);
	return t.__externref_table_dealloc(e), n;
}
var y = typeof FinalizationRegistry > "u" ? {
	register: () => {},
	unregister: () => {}
} : new FinalizationRegistry((e) => t.__wbg_querycompiler_free(e >>> 0, 1)), b = class {
	__destroy_into_raw() {
		let e = this.__wbg_ptr;
		return this.__wbg_ptr = 0, y.unregister(this), e;
	}
	free() {
		let e = this.__destroy_into_raw();
		t.__wbg_querycompiler_free(e, 0);
	}
	compileBatch(e) {
		let n = f(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = u, i = t.querycompiler_compileBatch(this.__wbg_ptr, n, r);
		if (i[2]) throw v(i[1]);
		return v(i[0]);
	}
	constructor(e) {
		let n = t.querycompiler_new(e);
		if (n[2]) throw v(n[1]);
		return this.__wbg_ptr = n[0] >>> 0, y.register(this, this.__wbg_ptr, this), this;
	}
	compile(e) {
		let n = f(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = u, i = t.querycompiler_compile(this.__wbg_ptr, n, r);
		if (i[2]) throw v(i[1]);
		return v(i[0]);
	}
};
Symbol.dispose && (b.prototype[Symbol.dispose] = b.prototype.free);
function x(e, t) {
	return Error(l(e, t));
}
function S(e) {
	return Number(e);
}
function C(e, n) {
	let r = f(String(n), t.__wbindgen_malloc, t.__wbindgen_realloc), i = u;
	m().setInt32(e + 4, i, !0), m().setInt32(e + 0, r, !0);
}
function w(e) {
	let t = e, n = typeof t == "boolean" ? t : void 0;
	return h(n) ? 16777215 : +!!n;
}
function T(e, n) {
	let r = f(g(n), t.__wbindgen_malloc, t.__wbindgen_realloc), i = u;
	m().setInt32(e + 4, i, !0), m().setInt32(e + 0, r, !0);
}
function E(e, t) {
	return e in t;
}
function D(e) {
	let t = e;
	return typeof t == "object" && !!t;
}
function O(e) {
	return typeof e == "string";
}
function k(e) {
	return e === void 0;
}
function A(e, t) {
	return e == t;
}
function j(e, t) {
	let n = t, r = typeof n == "number" ? n : void 0;
	m().setFloat64(e + 8, h(r) ? 0 : r, !0), m().setInt32(e + 0, !h(r), !0);
}
function M(e, n) {
	let r = n, i = typeof r == "string" ? r : void 0;
	var a = h(i) ? 0 : f(i, t.__wbindgen_malloc, t.__wbindgen_realloc), o = u;
	m().setInt32(e + 4, o, !0), m().setInt32(e + 0, a, !0);
}
function N(e, t) {
	throw Error(l(e, t));
}
function P(e) {
	return Object.entries(e);
}
function F(e) {
	return e.getTime();
}
function ee(e, t) {
	return e[t >>> 0];
}
function I(e, t) {
	return e[t];
}
function L(e) {
	let t;
	try {
		t = e instanceof ArrayBuffer;
	} catch {
		t = !1;
	}
	return t;
}
function R(e) {
	let t;
	try {
		t = e instanceof Uint8Array;
	} catch {
		t = !1;
	}
	return t;
}
function z(e) {
	return Number.isSafeInteger(e);
}
function B(e) {
	return e.length;
}
function V(e) {
	return e.length;
}
function H() {
	return /* @__PURE__ */ new Date();
}
function U() {
	return {};
}
function W(e) {
	return new Uint8Array(e);
}
function G() {
	return /* @__PURE__ */ new Map();
}
function K() {
	return [];
}
function q(e, t, n) {
	Uint8Array.prototype.set.call(_(e, t), n);
}
function J(e, t, n) {
	e[t] = n;
}
function Y(e, t, n) {
	return e.set(t, n);
}
function X(e, t, n) {
	e[t >>> 0] = n;
}
function Z(e, t) {
	global.PRISMA_WASM_PANIC_REGISTRY.set_message(l(e, t));
}
function Q(e, t) {
	return l(e, t);
}
function $(e) {
	return BigInt.asUintN(64, e);
}
function te(e) {
	return e;
}
function ne(e) {
	return e;
}
function re() {
	let e = t.__wbindgen_externrefs, n = e.grow(4);
	e.set(0, void 0), e.set(n + 0, void 0), e.set(n + 1, null), e.set(n + 2, !0), e.set(n + 3, !1);
}
//#endregion
export { b as QueryCompiler, x as __wbg_Error_e83987f665cf5504, S as __wbg_Number_bb48ca12f395cd08, C as __wbg_String_8f0eb39a4a4c2f66, w as __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68, T as __wbg___wbindgen_debug_string_df47ffb5e35e6763, E as __wbg___wbindgen_in_bb933bd9e1b3bc0f, D as __wbg___wbindgen_is_object_c818261d21f283a4, O as __wbg___wbindgen_is_string_fbb76cb2940daafd, k as __wbg___wbindgen_is_undefined_2d472862bd29a478, A as __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147, j as __wbg___wbindgen_number_get_a20bf9b85341449d, M as __wbg___wbindgen_string_get_e4f06c90489ad01b, N as __wbg___wbindgen_throw_b855445ff6a94295, P as __wbg_entries_e171b586f8f6bdbf, F as __wbg_getTime_14776bfb48a1bff9, ee as __wbg_get_7bed016f185add81, I as __wbg_get_with_ref_key_1dc361bd10053bfe, L as __wbg_instanceof_ArrayBuffer_70beb1189ca63b38, R as __wbg_instanceof_Uint8Array_20c8e73002f7af98, z as __wbg_isSafeInteger_d216eda7911dde36, B as __wbg_length_69bca3cb64fc8748, V as __wbg_length_cdd215e10d9dd507, H as __wbg_new_0_f9740686d739025c, U as __wbg_new_1acc0b6eea89d040, W as __wbg_new_5a79be3ab53b8aa5, G as __wbg_new_68651c719dcda04e, K as __wbg_new_e17d9f43105b08be, q as __wbg_prototypesetcall_2a6620b6922694b2, J as __wbg_set_3f1d0b984ed272ed, Y as __wbg_set_907fb406c34a251d, X as __wbg_set_c213c871859d6500, Z as __wbg_set_message_82ae475bb413aa5c, n as __wbg_set_wasm, Q as __wbindgen_cast_2241b6af4c4b2941, $ as __wbindgen_cast_4625c577ab2ec9ee, te as __wbindgen_cast_9ae0607507abb057, ne as __wbindgen_cast_d6cd19b81560fd6e, re as __wbindgen_init_externref_table };
