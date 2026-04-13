import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import * as r from "node:path";
import i from "node:path";
import { fileURLToPath as a } from "node:url";
import { PrismaPg as o } from "@prisma/adapter-pg";
import s from "pg";
import c from "crypto";
//#region \0rolldown/runtime.js
var l = Object.create, u = Object.defineProperty, d = Object.getOwnPropertyDescriptor, f = Object.getOwnPropertyNames, p = Object.getPrototypeOf, m = Object.prototype.hasOwnProperty, h = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), g = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = f(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !m.call(e, s) && s !== n && u(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = d(t, s)) || r.enumerable
	});
	return e;
}, _ = (e, t, n) => (n = e == null ? {} : l(p(e)), g(t || !e || !e.__esModule ? u(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), v = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}), y = /* @__PURE__ */ h(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, {
		AnyNull: () => E,
		AnyNullClass: () => C,
		DbNull: () => ie,
		DbNullClass: () => ne,
		Decimal: () => Nt,
		JsonNull: () => T,
		JsonNullClass: () => re,
		NullTypes: () => w,
		ObjectEnumValue: () => S,
		PrismaClientInitializationError: () => f,
		PrismaClientKnownRequestError: () => p,
		PrismaClientRustError: () => g,
		PrismaClientRustPanicError: () => _,
		PrismaClientUnknownRequestError: () => v,
		PrismaClientValidationError: () => y,
		Sql: () => Pt,
		empty: () => Lt,
		hasBatchIndex: () => u,
		isAnyNull: () => se,
		isDbNull: () => ae,
		isJsonNull: () => oe,
		isObjectEnumValue: () => D,
		join: () => Ft,
		raw: () => It,
		sql: () => Rt
	}), t.exports = c(l);
	function u(e) {
		return typeof e.batchRequestIdx == "number";
	}
	function d(e, t) {
		Object.defineProperty(e, "name", {
			value: t,
			configurable: !0
		});
	}
	var f = class e extends Error {
		clientVersion;
		errorCode;
		retryable;
		constructor(t, n, r) {
			super(t), this.name = "PrismaClientInitializationError", this.clientVersion = n, this.errorCode = r, Error.captureStackTrace(e);
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientInitializationError";
		}
	};
	d(f, "PrismaClientInitializationError");
	var p = class extends Error {
		code;
		meta;
		clientVersion;
		batchRequestIdx;
		constructor(e, { code: t, clientVersion: n, meta: r, batchRequestIdx: i }) {
			super(e), this.name = "PrismaClientKnownRequestError", this.code = t, this.clientVersion = n, this.meta = r, Object.defineProperty(this, "batchRequestIdx", {
				value: i,
				enumerable: !1,
				writable: !0
			});
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientKnownRequestError";
		}
	};
	d(p, "PrismaClientKnownRequestError");
	function m(e) {
		if (e.fields?.message) {
			let t = e.fields?.message;
			return e.fields?.file && (t += ` in ${e.fields.file}`, e.fields?.line && (t += `:${e.fields.line}`), e.fields?.column && (t += `:${e.fields.column}`)), e.fields?.reason && (t += `
${e.fields?.reason}`), t;
		}
		return "Unknown error";
	}
	function h(e) {
		return e.fields?.message === "PANIC";
	}
	var g = class extends Error {
		clientVersion;
		_isPanic;
		constructor({ clientVersion: e, error: t }) {
			let n = m(t);
			super(n ?? "Unknown error"), this._isPanic = h(t), this.clientVersion = e;
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientRustError";
		}
		isPanic() {
			return this._isPanic;
		}
	};
	d(g, "PrismaClientRustError");
	var _ = class extends Error {
		clientVersion;
		constructor(e, t) {
			super(e), this.name = "PrismaClientRustPanicError", this.clientVersion = t;
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientRustPanicError";
		}
	};
	d(_, "PrismaClientRustPanicError");
	var v = class extends Error {
		clientVersion;
		batchRequestIdx;
		constructor(e, { clientVersion: t, batchRequestIdx: n }) {
			super(e), this.name = "PrismaClientUnknownRequestError", this.clientVersion = t, Object.defineProperty(this, "batchRequestIdx", {
				value: n,
				writable: !0,
				enumerable: !1
			});
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientUnknownRequestError";
		}
	};
	d(v, "PrismaClientUnknownRequestError");
	var y = class extends Error {
		name = "PrismaClientValidationError";
		clientVersion;
		constructor(e, { clientVersion: t }) {
			super(e), this.clientVersion = t;
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientValidationError";
		}
	};
	d(y, "PrismaClientValidationError");
	var b = Symbol(), x = Symbol.for("prisma.objectEnumValue"), S = class {
		[x] = !0;
		#e;
		constructor(e) {
			e === b ? this.#e = `Prisma.${this._getName()}` : this.#e = `new Prisma.${this._getNamespace()}.${this._getName()}()`;
		}
		_getName() {
			return this.constructor.name;
		}
		toString() {
			return this.#e;
		}
	};
	function ee(e, t) {
		Object.defineProperty(e, "name", {
			value: t,
			configurable: !0
		});
	}
	var te = class extends S {
		_getNamespace() {
			return "NullTypes";
		}
	}, ne = class extends te {};
	ee(ne, "DbNull");
	var re = class extends te {};
	ee(re, "JsonNull");
	var C = class extends te {};
	ee(C, "AnyNull");
	var w = {
		DbNull: ne,
		JsonNull: re,
		AnyNull: C
	}, ie = new ne(b), T = new re(b), E = new C(b);
	function D(e) {
		return typeof e == "object" && !!e && e[x] === !0;
	}
	function ae(e) {
		return e === ie;
	}
	function oe(e) {
		return e === T;
	}
	function se(e) {
		return e === E;
	}
	var ce = 9e15, O = 1e9, le = "0123456789abcdef", ue = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058", de = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789", fe = {
		precision: 20,
		rounding: 4,
		modulo: 1,
		toExpNeg: -7,
		toExpPos: 21,
		minE: -ce,
		maxE: ce,
		crypto: !1
	}, k, A, j = !0, pe = "[DecimalError] ", me = pe + "Invalid argument: ", he = pe + "Precision limit exceeded", ge = pe + "crypto unavailable", _e = "[object Decimal]", M = Math.floor, N = Math.pow, ve = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i, ye = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i, be = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i, P = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i, xe = 1e7, F = 7, Se = 9007199254740991, Ce = ue.length - 1, we = de.length - 1, I = { toStringTag: _e };
	I.absoluteValue = I.abs = function() {
		var e = new this.constructor(this);
		return e.s < 0 && (e.s = 1), B(e);
	}, I.ceil = function() {
		return B(new this.constructor(this), this.e + 1, 2);
	}, I.clampedTo = I.clamp = function(e, t) {
		var n, r = this, i = r.constructor;
		if (e = new i(e), t = new i(t), !e.s || !t.s) return new i(NaN);
		if (e.gt(t)) throw Error(me + t);
		return n = r.cmp(e), n < 0 ? e : r.cmp(t) > 0 ? t : new i(r);
	}, I.comparedTo = I.cmp = function(e) {
		var t, n, r, i, a = this, o = a.d, s = (e = new a.constructor(e)).d, c = a.s, l = e.s;
		if (!o || !s) return !c || !l ? NaN : c === l ? o === s ? 0 : !o ^ c < 0 ? 1 : -1 : c;
		if (!o[0] || !s[0]) return o[0] ? c : s[0] ? -l : 0;
		if (c !== l) return c;
		if (a.e !== e.e) return a.e > e.e ^ c < 0 ? 1 : -1;
		for (r = o.length, i = s.length, t = 0, n = r < i ? r : i; t < n; ++t) if (o[t] !== s[t]) return o[t] > s[t] ^ c < 0 ? 1 : -1;
		return r === i ? 0 : r > i ^ c < 0 ? 1 : -1;
	}, I.cosine = I.cos = function() {
		var e, t, n = this, r = n.constructor;
		return n.d ? n.d[0] ? (e = r.precision, t = r.rounding, r.precision = e + Math.max(n.e, n.sd()) + F, r.rounding = 1, n = De(r, Ge(r, n)), r.precision = e, r.rounding = t, B(A == 2 || A == 3 ? n.neg() : n, e, t, !0)) : new r(1) : new r(NaN);
	}, I.cubeRoot = I.cbrt = function() {
		var e, t, n, r, i, a, o, s, c, l, u = this, d = u.constructor;
		if (!u.isFinite() || u.isZero()) return new d(u);
		for (j = !1, a = u.s * N(u.s * u, 1 / 3), !a || Math.abs(a) == Infinity ? (n = L(u.d), e = u.e, (a = (e - n.length + 1) % 3) && (n += a == 1 || a == -2 ? "0" : "00"), a = N(n, 1 / 3), e = M((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2)), a == Infinity ? n = "5e" + e : (n = a.toExponential(), n = n.slice(0, n.indexOf("e") + 1) + e), r = new d(n), r.s = u.s) : r = new d(a.toString()), o = (e = d.precision) + 3;;) if (s = r, c = s.times(s).times(s), l = c.plus(u), r = z(l.plus(u).times(s), l.plus(c), o + 2, 1), L(s.d).slice(0, o) === (n = L(r.d)).slice(0, o)) if (n = n.slice(o - 3, o + 1), n == "9999" || !i && n == "4999") {
			if (!i && (B(s, e + 1, 0), s.times(s).times(s).eq(u))) {
				r = s;
				break;
			}
			o += 4, i = 1;
		} else {
			(!+n || !+n.slice(1) && n.charAt(0) == "5") && (B(r, e + 1, 1), t = !r.times(r).times(r).eq(u));
			break;
		}
		return j = !0, B(r, e, d.rounding, t);
	}, I.decimalPlaces = I.dp = function() {
		var e, t = this.d, n = NaN;
		if (t) {
			if (e = t.length - 1, n = (e - M(this.e / F)) * F, e = t[e], e) for (; e % 10 == 0; e /= 10) n--;
			n < 0 && (n = 0);
		}
		return n;
	}, I.dividedBy = I.div = function(e) {
		return z(this, new this.constructor(e));
	}, I.dividedToIntegerBy = I.divToInt = function(e) {
		var t = this, n = t.constructor;
		return B(z(t, new n(e), 0, 1, 1), n.precision, n.rounding);
	}, I.equals = I.eq = function(e) {
		return this.cmp(e) === 0;
	}, I.floor = function() {
		return B(new this.constructor(this), this.e + 1, 3);
	}, I.greaterThan = I.gt = function(e) {
		return this.cmp(e) > 0;
	}, I.greaterThanOrEqualTo = I.gte = function(e) {
		var t = this.cmp(e);
		return t == 1 || t === 0;
	}, I.hyperbolicCosine = I.cosh = function() {
		var e, t, n, r, i, a = this, o = a.constructor, s = new o(1);
		if (!a.isFinite()) return new o(a.s ? Infinity : NaN);
		if (a.isZero()) return s;
		n = o.precision, r = o.rounding, o.precision = n + Math.max(a.e, a.sd()) + 4, o.rounding = 1, i = a.d.length, i < 32 ? (e = Math.ceil(i / 3), t = (1 / We(4, e)).toString()) : (e = 16, t = "2.3283064365386962890625e-10"), a = Ue(o, 1, a.times(t), new o(1), !0);
		for (var c, l = e, u = new o(8); l--;) c = a.times(a), a = s.minus(c.times(u.minus(c.times(u))));
		return B(a, o.precision = n, o.rounding = r, !0);
	}, I.hyperbolicSine = I.sinh = function() {
		var e, t, n, r, i = this, a = i.constructor;
		if (!i.isFinite() || i.isZero()) return new a(i);
		if (t = a.precision, n = a.rounding, a.precision = t + Math.max(i.e, i.sd()) + 4, a.rounding = 1, r = i.d.length, r < 3) i = Ue(a, 2, i, i, !0);
		else {
			e = 1.4 * Math.sqrt(r), e = e > 16 ? 16 : e | 0, i = i.times(1 / We(5, e)), i = Ue(a, 2, i, i, !0);
			for (var o, s = new a(5), c = new a(16), l = new a(20); e--;) o = i.times(i), i = i.times(s.plus(o.times(c.times(o).plus(l))));
		}
		return a.precision = t, a.rounding = n, B(i, t, n, !0);
	}, I.hyperbolicTangent = I.tanh = function() {
		var e, t, n = this, r = n.constructor;
		return n.isFinite() ? n.isZero() ? new r(n) : (e = r.precision, t = r.rounding, r.precision = e + 7, r.rounding = 1, z(n.sinh(), n.cosh(), r.precision = e, r.rounding = t)) : new r(n.s);
	}, I.inverseCosine = I.acos = function() {
		var e = this, t = e.constructor, n = e.abs().cmp(1), r = t.precision, i = t.rounding;
		return n === -1 ? e.isZero() ? je(t, r + 4, i).times(.5) : (t.precision = r + 6, t.rounding = 1, e = new t(1).minus(e).div(e.plus(1)).sqrt().atan(), t.precision = r, t.rounding = i, e.times(2)) : n === 0 ? e.isNeg() ? je(t, r, i) : new t(0) : new t(NaN);
	}, I.inverseHyperbolicCosine = I.acosh = function() {
		var e, t, n = this, r = n.constructor;
		return n.lte(1) ? new r(n.eq(1) ? 0 : NaN) : n.isFinite() ? (e = r.precision, t = r.rounding, r.precision = e + Math.max(Math.abs(n.e), n.sd()) + 4, r.rounding = 1, j = !1, n = n.times(n).minus(1).sqrt().plus(n), j = !0, r.precision = e, r.rounding = t, n.ln()) : new r(n);
	}, I.inverseHyperbolicSine = I.asinh = function() {
		var e, t, n = this, r = n.constructor;
		return !n.isFinite() || n.isZero() ? new r(n) : (e = r.precision, t = r.rounding, r.precision = e + 2 * Math.max(Math.abs(n.e), n.sd()) + 6, r.rounding = 1, j = !1, n = n.times(n).plus(1).sqrt().plus(n), j = !0, r.precision = e, r.rounding = t, n.ln());
	}, I.inverseHyperbolicTangent = I.atanh = function() {
		var e, t, n, r, i = this, a = i.constructor;
		return i.isFinite() ? i.e >= 0 ? new a(i.abs().eq(1) ? i.s / 0 : i.isZero() ? i : NaN) : (e = a.precision, t = a.rounding, r = i.sd(), Math.max(r, e) < 2 * -i.e - 1 ? B(new a(i), e, t, !0) : (a.precision = n = r - i.e, i = z(i.plus(1), new a(1).minus(i), n + e, 1), a.precision = e + 4, a.rounding = 1, i = i.ln(), a.precision = e, a.rounding = t, i.times(.5))) : new a(NaN);
	}, I.inverseSine = I.asin = function() {
		var e, t, n, r, i = this, a = i.constructor;
		return i.isZero() ? new a(i) : (t = i.abs().cmp(1), n = a.precision, r = a.rounding, t === -1 ? (a.precision = n + 6, a.rounding = 1, i = i.div(new a(1).minus(i.times(i)).sqrt().plus(1)).atan(), a.precision = n, a.rounding = r, i.times(2)) : t === 0 ? (e = je(a, n + 4, r).times(.5), e.s = i.s, e) : new a(NaN));
	}, I.inverseTangent = I.atan = function() {
		var e, t, n, r, i, a, o, s, c, l = this, u = l.constructor, d = u.precision, f = u.rounding;
		if (!l.isFinite()) {
			if (!l.s) return new u(NaN);
			if (d + 4 <= we) return o = je(u, d + 4, f).times(.5), o.s = l.s, o;
		} else if (l.isZero()) return new u(l);
		else if (l.abs().eq(1) && d + 4 <= we) return o = je(u, d + 4, f).times(.25), o.s = l.s, o;
		for (u.precision = s = d + 10, u.rounding = 1, n = Math.min(28, s / F + 2 | 0), e = n; e; --e) l = l.div(l.times(l).plus(1).sqrt().plus(1));
		for (j = !1, t = Math.ceil(s / F), r = 1, c = l.times(l), o = new u(l), i = l; e !== -1;) if (i = i.times(c), a = o.minus(i.div(r += 2)), i = i.times(c), o = a.plus(i.div(r += 2)), o.d[t] !== void 0) for (e = t; o.d[e] === a.d[e] && e--;);
		return n && (o = o.times(2 << n - 1)), j = !0, B(o, u.precision = d, u.rounding = f, !0);
	}, I.isFinite = function() {
		return !!this.d;
	}, I.isInteger = I.isInt = function() {
		return !!this.d && M(this.e / F) > this.d.length - 2;
	}, I.isNaN = function() {
		return !this.s;
	}, I.isNegative = I.isNeg = function() {
		return this.s < 0;
	}, I.isPositive = I.isPos = function() {
		return this.s > 0;
	}, I.isZero = function() {
		return !!this.d && this.d[0] === 0;
	}, I.lessThan = I.lt = function(e) {
		return this.cmp(e) < 0;
	}, I.lessThanOrEqualTo = I.lte = function(e) {
		return this.cmp(e) < 1;
	}, I.logarithm = I.log = function(e) {
		var t, n, r, i, a, o, s, c, l = this, u = l.constructor, d = u.precision, f = u.rounding, p = 5;
		if (e == null) e = new u(10), t = !0;
		else {
			if (e = new u(e), n = e.d, e.s < 0 || !n || !n[0] || e.eq(1)) return new u(NaN);
			t = e.eq(10);
		}
		if (n = l.d, l.s < 0 || !n || !n[0] || l.eq(1)) return new u(n && !n[0] ? -Infinity : l.s == 1 ? n ? 0 : Infinity : NaN);
		if (t) if (n.length > 1) a = !0;
		else {
			for (i = n[0]; i % 10 == 0;) i /= 10;
			a = i !== 1;
		}
		if (j = !1, s = d + p, o = Re(l, s), r = t ? Ae(u, s + 10) : Re(e, s), c = z(o, r, s, 1), Te(c.d, i = d, f)) do
			if (s += 10, o = Re(l, s), r = t ? Ae(u, s + 10) : Re(e, s), c = z(o, r, s, 1), !a) {
				+L(c.d).slice(i + 1, i + 15) + 1 == 0x5af3107a4000 && (c = B(c, d + 1, 0));
				break;
			}
		while (Te(c.d, i += 10, f));
		return j = !0, B(c, d, f);
	}, I.minus = I.sub = function(e) {
		var t, n, r, i, a, o, s, c, l, u, d, f, p = this, m = p.constructor;
		if (e = new m(e), !p.d || !e.d) return !p.s || !e.s ? e = new m(NaN) : p.d ? e.s = -e.s : e = new m(e.d || p.s !== e.s ? p : NaN), e;
		if (p.s != e.s) return e.s = -e.s, p.plus(e);
		if (l = p.d, f = e.d, s = m.precision, c = m.rounding, !l[0] || !f[0]) {
			if (f[0]) e.s = -e.s;
			else if (l[0]) e = new m(p);
			else return new m(c === 3 ? -0 : 0);
			return j ? B(e, s, c) : e;
		}
		if (n = M(e.e / F), u = M(p.e / F), l = l.slice(), a = u - n, a) {
			for (d = a < 0, d ? (t = l, a = -a, o = f.length) : (t = f, n = u, o = l.length), r = Math.max(Math.ceil(s / F), o) + 2, a > r && (a = r, t.length = 1), t.reverse(), r = a; r--;) t.push(0);
			t.reverse();
		} else {
			for (r = l.length, o = f.length, d = r < o, d && (o = r), r = 0; r < o; r++) if (l[r] != f[r]) {
				d = l[r] < f[r];
				break;
			}
			a = 0;
		}
		for (d && (t = l, l = f, f = t, e.s = -e.s), o = l.length, r = f.length - o; r > 0; --r) l[o++] = 0;
		for (r = f.length; r > a;) {
			if (l[--r] < f[r]) {
				for (i = r; i && l[--i] === 0;) l[i] = xe - 1;
				--l[i], l[r] += xe;
			}
			l[r] -= f[r];
		}
		for (; l[--o] === 0;) l.pop();
		for (; l[0] === 0; l.shift()) --n;
		return l[0] ? (e.d = l, e.e = ke(l, n), j ? B(e, s, c) : e) : new m(c === 3 ? -0 : 0);
	}, I.modulo = I.mod = function(e) {
		var t, n = this, r = n.constructor;
		return e = new r(e), !n.d || !e.s || e.d && !e.d[0] ? new r(NaN) : !e.d || n.d && !n.d[0] ? B(new r(n), r.precision, r.rounding) : (j = !1, r.modulo == 9 ? (t = z(n, e.abs(), 0, 3, 1), t.s *= e.s) : t = z(n, e, 0, r.modulo, 1), t = t.times(e), j = !0, n.minus(t));
	}, I.naturalExponential = I.exp = function() {
		return Le(this);
	}, I.naturalLogarithm = I.ln = function() {
		return Re(this);
	}, I.negated = I.neg = function() {
		var e = new this.constructor(this);
		return e.s = -e.s, B(e);
	}, I.plus = I.add = function(e) {
		var t, n, r, i, a, o, s, c, l, u, d = this, f = d.constructor;
		if (e = new f(e), !d.d || !e.d) return !d.s || !e.s ? e = new f(NaN) : d.d || (e = new f(e.d || d.s === e.s ? d : NaN)), e;
		if (d.s != e.s) return e.s = -e.s, d.minus(e);
		if (l = d.d, u = e.d, s = f.precision, c = f.rounding, !l[0] || !u[0]) return u[0] || (e = new f(d)), j ? B(e, s, c) : e;
		if (a = M(d.e / F), r = M(e.e / F), l = l.slice(), i = a - r, i) {
			for (i < 0 ? (n = l, i = -i, o = u.length) : (n = u, r = a, o = l.length), a = Math.ceil(s / F), o = a > o ? a + 1 : o + 1, i > o && (i = o, n.length = 1), n.reverse(); i--;) n.push(0);
			n.reverse();
		}
		for (o = l.length, i = u.length, o - i < 0 && (i = o, n = u, u = l, l = n), t = 0; i;) t = (l[--i] = l[i] + u[i] + t) / xe | 0, l[i] %= xe;
		for (t && (l.unshift(t), ++r), o = l.length; l[--o] == 0;) l.pop();
		return e.d = l, e.e = ke(l, r), j ? B(e, s, c) : e;
	}, I.precision = I.sd = function(e) {
		var t, n = this;
		if (e !== void 0 && e !== !!e && e !== 1 && e !== 0) throw Error(me + e);
		return n.d ? (t = Me(n.d), e && n.e + 1 > t && (t = n.e + 1)) : t = NaN, t;
	}, I.round = function() {
		var e = this, t = e.constructor;
		return B(new t(e), e.e + 1, t.rounding);
	}, I.sine = I.sin = function() {
		var e, t, n = this, r = n.constructor;
		return n.isFinite() ? n.isZero() ? new r(n) : (e = r.precision, t = r.rounding, r.precision = e + Math.max(n.e, n.sd()) + F, r.rounding = 1, n = He(r, Ge(r, n)), r.precision = e, r.rounding = t, B(A > 2 ? n.neg() : n, e, t, !0)) : new r(NaN);
	}, I.squareRoot = I.sqrt = function() {
		var e, t, n, r, i, a, o = this, s = o.d, c = o.e, l = o.s, u = o.constructor;
		if (l !== 1 || !s || !s[0]) return new u(!l || l < 0 && (!s || s[0]) ? NaN : s ? o : Infinity);
		for (j = !1, l = Math.sqrt(+o), l == 0 || l == Infinity ? (t = L(s), (t.length + c) % 2 == 0 && (t += "0"), l = Math.sqrt(t), c = M((c + 1) / 2) - (c < 0 || c % 2), l == Infinity ? t = "5e" + c : (t = l.toExponential(), t = t.slice(0, t.indexOf("e") + 1) + c), r = new u(t)) : r = new u(l.toString()), n = (c = u.precision) + 3;;) if (a = r, r = a.plus(z(o, a, n + 2, 1)).times(.5), L(a.d).slice(0, n) === (t = L(r.d)).slice(0, n)) if (t = t.slice(n - 3, n + 1), t == "9999" || !i && t == "4999") {
			if (!i && (B(a, c + 1, 0), a.times(a).eq(o))) {
				r = a;
				break;
			}
			n += 4, i = 1;
		} else {
			(!+t || !+t.slice(1) && t.charAt(0) == "5") && (B(r, c + 1, 1), e = !r.times(r).eq(o));
			break;
		}
		return j = !0, B(r, c, u.rounding, e);
	}, I.tangent = I.tan = function() {
		var e, t, n = this, r = n.constructor;
		return n.isFinite() ? n.isZero() ? new r(n) : (e = r.precision, t = r.rounding, r.precision = e + 10, r.rounding = 1, n = n.sin(), n.s = 1, n = z(n, new r(1).minus(n.times(n)).sqrt(), e + 10, 0), r.precision = e, r.rounding = t, B(A == 2 || A == 4 ? n.neg() : n, e, t, !0)) : new r(NaN);
	}, I.times = I.mul = function(e) {
		var t, n, r, i, a, o, s, c, l, u = this, d = u.constructor, f = u.d, p = (e = new d(e)).d;
		if (e.s *= u.s, !f || !f[0] || !p || !p[0]) return new d(!e.s || f && !f[0] && !p || p && !p[0] && !f ? NaN : !f || !p ? e.s / 0 : e.s * 0);
		for (n = M(u.e / F) + M(e.e / F), c = f.length, l = p.length, c < l && (a = f, f = p, p = a, o = c, c = l, l = o), a = [], o = c + l, r = o; r--;) a.push(0);
		for (r = l; --r >= 0;) {
			for (t = 0, i = c + r; i > r;) s = a[i] + p[r] * f[i - r - 1] + t, a[i--] = s % xe | 0, t = s / xe | 0;
			a[i] = (a[i] + t) % xe | 0;
		}
		for (; !a[--o];) a.pop();
		return t ? ++n : a.shift(), e.d = a, e.e = ke(a, n), j ? B(e, d.precision, d.rounding) : e;
	}, I.toBinary = function(e, t) {
		return Ke(this, 2, e, t);
	}, I.toDecimalPlaces = I.toDP = function(e, t) {
		var n = this, r = n.constructor;
		return n = new r(n), e === void 0 ? n : (R(e, 0, O), t === void 0 ? t = r.rounding : R(t, 0, 8), B(n, e + n.e + 1, t));
	}, I.toExponential = function(e, t) {
		var n, r = this, i = r.constructor;
		return e === void 0 ? n = Oe(r, !0) : (R(e, 0, O), t === void 0 ? t = i.rounding : R(t, 0, 8), r = B(new i(r), e + 1, t), n = Oe(r, !0, e + 1)), r.isNeg() && !r.isZero() ? "-" + n : n;
	}, I.toFixed = function(e, t) {
		var n, r, i = this, a = i.constructor;
		return e === void 0 ? n = Oe(i) : (R(e, 0, O), t === void 0 ? t = a.rounding : R(t, 0, 8), r = B(new a(i), e + i.e + 1, t), n = Oe(r, !1, e + r.e + 1)), i.isNeg() && !i.isZero() ? "-" + n : n;
	}, I.toFraction = function(e) {
		var t, n, r, i, a, o, s, c, l, u, d, f, p = this, m = p.d, h = p.constructor;
		if (!m) return new h(p);
		if (l = n = new h(1), r = c = new h(0), t = new h(r), a = t.e = Me(m) - p.e - 1, o = a % F, t.d[0] = N(10, o < 0 ? F + o : o), e == null) e = a > 0 ? t : l;
		else {
			if (s = new h(e), !s.isInt() || s.lt(l)) throw Error(me + s);
			e = s.gt(t) ? a > 0 ? t : l : s;
		}
		for (j = !1, s = new h(L(m)), u = h.precision, h.precision = a = m.length * F * 2; d = z(s, t, 0, 1, 1), i = n.plus(d.times(r)), i.cmp(e) != 1;) n = r, r = i, i = l, l = c.plus(d.times(i)), c = i, i = t, t = s.minus(d.times(i)), s = i;
		return i = z(e.minus(n), r, 0, 1, 1), c = c.plus(i.times(l)), n = n.plus(i.times(r)), c.s = l.s = p.s, f = z(l, r, a, 1).minus(p).abs().cmp(z(c, n, a, 1).minus(p).abs()) < 1 ? [l, r] : [c, n], h.precision = u, j = !0, f;
	}, I.toHexadecimal = I.toHex = function(e, t) {
		return Ke(this, 16, e, t);
	}, I.toNearest = function(e, t) {
		var n = this, r = n.constructor;
		if (n = new r(n), e == null) {
			if (!n.d) return n;
			e = new r(1), t = r.rounding;
		} else {
			if (e = new r(e), t === void 0 ? t = r.rounding : R(t, 0, 8), !n.d) return e.s ? n : e;
			if (!e.d) return e.s &&= n.s, e;
		}
		return e.d[0] ? (j = !1, n = z(n, e, 0, t, 1).times(e), j = !0, B(n)) : (e.s = n.s, n = e), n;
	}, I.toNumber = function() {
		return +this;
	}, I.toOctal = function(e, t) {
		return Ke(this, 8, e, t);
	}, I.toPower = I.pow = function(e) {
		var t, n, r, i, a, o, s = this, c = s.constructor, l = +(e = new c(e));
		if (!s.d || !e.d || !s.d[0] || !e.d[0]) return new c(N(+s, l));
		if (s = new c(s), s.eq(1)) return s;
		if (r = c.precision, a = c.rounding, e.eq(1)) return B(s, r, a);
		if (t = M(e.e / F), t >= e.d.length - 1 && (n = l < 0 ? -l : l) <= Se) return i = Pe(c, s, n, r), e.s < 0 ? new c(1).div(i) : B(i, r, a);
		if (o = s.s, o < 0) {
			if (t < e.d.length - 1) return new c(NaN);
			if (e.d[t] & 1 || (o = 1), s.e == 0 && s.d[0] == 1 && s.d.length == 1) return s.s = o, s;
		}
		return n = N(+s, l), t = n == 0 || !isFinite(n) ? M(l * (Math.log("0." + L(s.d)) / Math.LN10 + s.e + 1)) : new c(n + "").e, t > c.maxE + 1 || t < c.minE - 1 ? new c(t > 0 ? o / 0 : 0) : (j = !1, c.rounding = s.s = 1, n = Math.min(12, (t + "").length), i = Le(e.times(Re(s, r + n)), r), i.d && (i = B(i, r + 5, 1), Te(i.d, r, a) && (t = r + 10, i = B(Le(e.times(Re(s, t + n)), t), t + 5, 1), +L(i.d).slice(r + 1, r + 15) + 1 == 0x5af3107a4000 && (i = B(i, r + 1, 0)))), i.s = o, j = !0, c.rounding = a, B(i, r, a));
	}, I.toPrecision = function(e, t) {
		var n, r = this, i = r.constructor;
		return e === void 0 ? n = Oe(r, r.e <= i.toExpNeg || r.e >= i.toExpPos) : (R(e, 1, O), t === void 0 ? t = i.rounding : R(t, 0, 8), r = B(new i(r), e, t), n = Oe(r, e <= r.e || r.e <= i.toExpNeg, e)), r.isNeg() && !r.isZero() ? "-" + n : n;
	}, I.toSignificantDigits = I.toSD = function(e, t) {
		var n = this, r = n.constructor;
		return e === void 0 ? (e = r.precision, t = r.rounding) : (R(e, 1, O), t === void 0 ? t = r.rounding : R(t, 0, 8)), B(new r(n), e, t);
	}, I.toString = function() {
		var e = this, t = e.constructor, n = Oe(e, e.e <= t.toExpNeg || e.e >= t.toExpPos);
		return e.isNeg() && !e.isZero() ? "-" + n : n;
	}, I.truncated = I.trunc = function() {
		return B(new this.constructor(this), this.e + 1, 1);
	}, I.valueOf = I.toJSON = function() {
		var e = this, t = e.constructor, n = Oe(e, e.e <= t.toExpNeg || e.e >= t.toExpPos);
		return e.isNeg() ? "-" + n : n;
	};
	function L(e) {
		var t, n, r, i = e.length - 1, a = "", o = e[0];
		if (i > 0) {
			for (a += o, t = 1; t < i; t++) r = e[t] + "", n = F - r.length, n && (a += Ne(n)), a += r;
			o = e[t], r = o + "", n = F - r.length, n && (a += Ne(n));
		} else if (o === 0) return "0";
		for (; o % 10 == 0;) o /= 10;
		return a + o;
	}
	function R(e, t, n) {
		if (e !== ~~e || e < t || e > n) throw Error(me + e);
	}
	function Te(e, t, n, r) {
		var i, a, o, s;
		for (a = e[0]; a >= 10; a /= 10) --t;
		return --t < 0 ? (t += F, i = 0) : (i = Math.ceil((t + 1) / F), t %= F), a = N(10, F - t), s = e[i] % a | 0, r == null ? t < 3 ? (t == 0 ? s = s / 100 | 0 : t == 1 && (s = s / 10 | 0), o = n < 4 && s == 99999 || n > 3 && s == 49999 || s == 5e4 || s == 0) : o = (n < 4 && s + 1 == a || n > 3 && s + 1 == a / 2) && (e[i + 1] / a / 100 | 0) == N(10, t - 2) - 1 || (s == a / 2 || s == 0) && (e[i + 1] / a / 100 | 0) == 0 : t < 4 ? (t == 0 ? s = s / 1e3 | 0 : t == 1 ? s = s / 100 | 0 : t == 2 && (s = s / 10 | 0), o = (r || n < 4) && s == 9999 || !r && n > 3 && s == 4999) : o = ((r || n < 4) && s + 1 == a || !r && n > 3 && s + 1 == a / 2) && (e[i + 1] / a / 1e3 | 0) == N(10, t - 3) - 1, o;
	}
	function Ee(e, t, n) {
		for (var r, i = [0], a, o = 0, s = e.length; o < s;) {
			for (a = i.length; a--;) i[a] *= t;
			for (i[0] += le.indexOf(e.charAt(o++)), r = 0; r < i.length; r++) i[r] > n - 1 && (i[r + 1] === void 0 && (i[r + 1] = 0), i[r + 1] += i[r] / n | 0, i[r] %= n);
		}
		return i.reverse();
	}
	function De(e, t) {
		var n, r, i;
		if (t.isZero()) return t;
		r = t.d.length, r < 32 ? (n = Math.ceil(r / 3), i = (1 / We(4, n)).toString()) : (n = 16, i = "2.3283064365386962890625e-10"), e.precision += n, t = Ue(e, 1, t.times(i), new e(1));
		for (var a = n; a--;) {
			var o = t.times(t);
			t = o.times(o).minus(o).times(8).plus(1);
		}
		return e.precision -= n, t;
	}
	var z = /* @__PURE__ */ function() {
		function e(e, t, n) {
			var r, i = 0, a = e.length;
			for (e = e.slice(); a--;) r = e[a] * t + i, e[a] = r % n | 0, i = r / n | 0;
			return i && e.unshift(i), e;
		}
		function t(e, t, n, r) {
			var i, a;
			if (n != r) a = n > r ? 1 : -1;
			else for (i = a = 0; i < n; i++) if (e[i] != t[i]) {
				a = e[i] > t[i] ? 1 : -1;
				break;
			}
			return a;
		}
		function n(e, t, n, r) {
			for (var i = 0; n--;) e[n] -= i, i = +(e[n] < t[n]), e[n] = i * r + e[n] - t[n];
			for (; !e[0] && e.length > 1;) e.shift();
		}
		return function(r, i, a, o, s, c) {
			var l, u, d, f, p, m, h, g, _, v, y, b, x, S, ee, te, ne, re, C, w, ie = r.constructor, T = r.s == i.s ? 1 : -1, E = r.d, D = i.d;
			if (!E || !E[0] || !D || !D[0]) return new ie(!r.s || !i.s || (E ? D && E[0] == D[0] : !D) ? NaN : E && E[0] == 0 || !D ? T * 0 : T / 0);
			for (c ? (p = 1, u = r.e - i.e) : (c = xe, p = F, u = M(r.e / p) - M(i.e / p)), C = D.length, ne = E.length, _ = new ie(T), v = _.d = [], d = 0; D[d] == (E[d] || 0); d++);
			if (D[d] > (E[d] || 0) && u--, a == null ? (S = a = ie.precision, o = ie.rounding) : S = s ? a + (r.e - i.e) + 1 : a, S < 0) v.push(1), m = !0;
			else {
				if (S = S / p + 2 | 0, d = 0, C == 1) {
					for (f = 0, D = D[0], S++; (d < ne || f) && S--; d++) ee = f * c + (E[d] || 0), v[d] = ee / D | 0, f = ee % D | 0;
					m = f || d < ne;
				} else {
					for (f = c / (D[0] + 1) | 0, f > 1 && (D = e(D, f, c), E = e(E, f, c), C = D.length, ne = E.length), te = C, y = E.slice(0, C), b = y.length; b < C;) y[b++] = 0;
					w = D.slice(), w.unshift(0), re = D[0], D[1] >= c / 2 && ++re;
					do
						f = 0, l = t(D, y, C, b), l < 0 ? (x = y[0], C != b && (x = x * c + (y[1] || 0)), f = x / re | 0, f > 1 ? (f >= c && (f = c - 1), h = e(D, f, c), g = h.length, b = y.length, l = t(h, y, g, b), l == 1 && (f--, n(h, C < g ? w : D, g, c))) : (f == 0 && (l = f = 1), h = D.slice()), g = h.length, g < b && h.unshift(0), n(y, h, b, c), l == -1 && (b = y.length, l = t(D, y, C, b), l < 1 && (f++, n(y, C < b ? w : D, b, c))), b = y.length) : l === 0 && (f++, y = [0]), v[d++] = f, l && y[0] ? y[b++] = E[te] || 0 : (y = [E[te]], b = 1);
					while ((te++ < ne || y[0] !== void 0) && S--);
					m = y[0] !== void 0;
				}
				v[0] || v.shift();
			}
			if (p == 1) _.e = u, k = m;
			else {
				for (d = 1, f = v[0]; f >= 10; f /= 10) d++;
				_.e = d + u * p - 1, B(_, s ? a + _.e + 1 : a, o, m);
			}
			return _;
		};
	}();
	function B(e, t, n, r) {
		var i, a, o, s, c, l, u, d, f, p = e.constructor;
		out: if (t != null) {
			if (d = e.d, !d) return e;
			for (i = 1, s = d[0]; s >= 10; s /= 10) i++;
			if (a = t - i, a < 0) a += F, o = t, u = d[f = 0], c = u / N(10, i - o - 1) % 10 | 0;
			else if (f = Math.ceil((a + 1) / F), s = d.length, f >= s) if (r) {
				for (; s++ <= f;) d.push(0);
				u = c = 0, i = 1, a %= F, o = a - F + 1;
			} else break out;
			else {
				for (u = s = d[f], i = 1; s >= 10; s /= 10) i++;
				a %= F, o = a - F + i, c = o < 0 ? 0 : u / N(10, i - o - 1) % 10 | 0;
			}
			if (r = r || t < 0 || d[f + 1] !== void 0 || (o < 0 ? u : u % N(10, i - o - 1)), l = n < 4 ? (c || r) && (n == 0 || n == (e.s < 0 ? 3 : 2)) : c > 5 || c == 5 && (n == 4 || r || n == 6 && (a > 0 ? o > 0 ? u / N(10, i - o) : 0 : d[f - 1]) % 10 & 1 || n == (e.s < 0 ? 8 : 7)), t < 1 || !d[0]) return d.length = 0, l ? (t -= e.e + 1, d[0] = N(10, (F - t % F) % F), e.e = -t || 0) : d[0] = e.e = 0, e;
			if (a == 0 ? (d.length = f, s = 1, f--) : (d.length = f + 1, s = N(10, F - a), d[f] = o > 0 ? (u / N(10, i - o) % N(10, o) | 0) * s : 0), l) for (;;) if (f == 0) {
				for (a = 1, o = d[0]; o >= 10; o /= 10) a++;
				for (o = d[0] += s, s = 1; o >= 10; o /= 10) s++;
				a != s && (e.e++, d[0] == xe && (d[0] = 1));
				break;
			} else {
				if (d[f] += s, d[f] != xe) break;
				d[f--] = 0, s = 1;
			}
			for (a = d.length; d[--a] === 0;) d.pop();
		}
		return j && (e.e > p.maxE ? (e.d = null, e.e = NaN) : e.e < p.minE && (e.e = 0, e.d = [0])), e;
	}
	function Oe(e, t, n) {
		if (!e.isFinite()) return ze(e);
		var r, i = e.e, a = L(e.d), o = a.length;
		return t ? (n && (r = n - o) > 0 ? a = a.charAt(0) + "." + a.slice(1) + Ne(r) : o > 1 && (a = a.charAt(0) + "." + a.slice(1)), a = a + (e.e < 0 ? "e" : "e+") + e.e) : i < 0 ? (a = "0." + Ne(-i - 1) + a, n && (r = n - o) > 0 && (a += Ne(r))) : i >= o ? (a += Ne(i + 1 - o), n && (r = n - i - 1) > 0 && (a = a + "." + Ne(r))) : ((r = i + 1) < o && (a = a.slice(0, r) + "." + a.slice(r)), n && (r = n - o) > 0 && (i + 1 === o && (a += "."), a += Ne(r))), a;
	}
	function ke(e, t) {
		var n = e[0];
		for (t *= F; n >= 10; n /= 10) t++;
		return t;
	}
	function Ae(e, t, n) {
		if (t > Ce) throw j = !0, n && (e.precision = n), Error(he);
		return B(new e(ue), t, 1, !0);
	}
	function je(e, t, n) {
		if (t > we) throw Error(he);
		return B(new e(de), t, n, !0);
	}
	function Me(e) {
		var t = e.length - 1, n = t * F + 1;
		if (t = e[t], t) {
			for (; t % 10 == 0; t /= 10) n--;
			for (t = e[0]; t >= 10; t /= 10) n++;
		}
		return n;
	}
	function Ne(e) {
		for (var t = ""; e--;) t += "0";
		return t;
	}
	function Pe(e, t, n, r) {
		var i, a = new e(1), o = Math.ceil(r / F + 4);
		for (j = !1;;) {
			if (n % 2 && (a = a.times(t), qe(a.d, o) && (i = !0)), n = M(n / 2), n === 0) {
				n = a.d.length - 1, i && a.d[n] === 0 && ++a.d[n];
				break;
			}
			t = t.times(t), qe(t.d, o);
		}
		return j = !0, a;
	}
	function Fe(e) {
		return e.d[e.d.length - 1] & 1;
	}
	function Ie(e, t, n) {
		for (var r, i, a = new e(t[0]), o = 0; ++o < t.length;) {
			if (i = new e(t[o]), !i.s) {
				a = i;
				break;
			}
			r = a.cmp(i), (r === n || r === 0 && a.s === n) && (a = i);
		}
		return a;
	}
	function Le(e, t) {
		var n, r, i, a, o, s, c, l = 0, u = 0, d = 0, f = e.constructor, p = f.rounding, m = f.precision;
		if (!e.d || !e.d[0] || e.e > 17) return new f(e.d ? e.d[0] ? e.s < 0 ? 0 : Infinity : 1 : e.s ? e.s < 0 ? 0 : e : NaN);
		for (t == null ? (j = !1, c = m) : c = t, s = new f(.03125); e.e > -2;) e = e.times(s), d += 5;
		for (r = Math.log(N(2, d)) / Math.LN10 * 2 + 5 | 0, c += r, n = a = o = new f(1), f.precision = c;;) {
			if (a = B(a.times(e), c, 1), n = n.times(++u), s = o.plus(z(a, n, c, 1)), L(s.d).slice(0, c) === L(o.d).slice(0, c)) {
				for (i = d; i--;) o = B(o.times(o), c, 1);
				if (t == null) if (l < 3 && Te(o.d, c - r, p, l)) f.precision = c += 10, n = a = s = new f(1), u = 0, l++;
				else return B(o, f.precision = m, p, j = !0);
				else return f.precision = m, o;
			}
			o = s;
		}
	}
	function Re(e, t) {
		var n, r, i, a, o, s, c, l, u, d, f, p = 1, m = 10, h = e, g = h.d, _ = h.constructor, v = _.rounding, y = _.precision;
		if (h.s < 0 || !g || !g[0] || !h.e && g[0] == 1 && g.length == 1) return new _(g && !g[0] ? -Infinity : h.s == 1 ? g ? 0 : h : NaN);
		if (t == null ? (j = !1, u = y) : u = t, _.precision = u += m, n = L(g), r = n.charAt(0), Math.abs(a = h.e) < 0x5543df729c000) {
			for (; r < 7 && r != 1 || r == 1 && n.charAt(1) > 3;) h = h.times(e), n = L(h.d), r = n.charAt(0), p++;
			a = h.e, r > 1 ? (h = new _("0." + n), a++) : h = new _(r + "." + n.slice(1));
		} else return l = Ae(_, u + 2, y).times(a + ""), h = Re(new _(r + "." + n.slice(1)), u - m).plus(l), _.precision = y, t == null ? B(h, y, v, j = !0) : h;
		for (d = h, c = o = h = z(h.minus(1), h.plus(1), u, 1), f = B(h.times(h), u, 1), i = 3;;) {
			if (o = B(o.times(f), u, 1), l = c.plus(z(o, new _(i), u, 1)), L(l.d).slice(0, u) === L(c.d).slice(0, u)) if (c = c.times(2), a !== 0 && (c = c.plus(Ae(_, u + 2, y).times(a + ""))), c = z(c, new _(p), u, 1), t == null) if (Te(c.d, u - m, v, s)) _.precision = u += m, l = o = h = z(d.minus(1), d.plus(1), u, 1), f = B(h.times(h), u, 1), i = s = 1;
			else return B(c, _.precision = y, v, j = !0);
			else return _.precision = y, c;
			c = l, i += 2;
		}
	}
	function ze(e) {
		return String(e.s * e.s / 0);
	}
	function Be(e, t) {
		var n, r, i;
		for ((n = t.indexOf(".")) > -1 && (t = t.replace(".", "")), (r = t.search(/e/i)) > 0 ? (n < 0 && (n = r), n += +t.slice(r + 1), t = t.substring(0, r)) : n < 0 && (n = t.length), r = 0; t.charCodeAt(r) === 48; r++);
		for (i = t.length; t.charCodeAt(i - 1) === 48; --i);
		if (t = t.slice(r, i), t) {
			if (i -= r, e.e = n = n - r - 1, e.d = [], r = (n + 1) % F, n < 0 && (r += F), r < i) {
				for (r && e.d.push(+t.slice(0, r)), i -= F; r < i;) e.d.push(+t.slice(r, r += F));
				t = t.slice(r), r = F - t.length;
			} else r -= i;
			for (; r--;) t += "0";
			e.d.push(+t), j && (e.e > e.constructor.maxE ? (e.d = null, e.e = NaN) : e.e < e.constructor.minE && (e.e = 0, e.d = [0]));
		} else e.e = 0, e.d = [0];
		return e;
	}
	function Ve(e, t) {
		var n, r, i, a, o, s, c, l, u;
		if (t.indexOf("_") > -1) {
			if (t = t.replace(/(\d)_(?=\d)/g, "$1"), P.test(t)) return Be(e, t);
		} else if (t === "Infinity" || t === "NaN") return +t || (e.s = NaN), e.e = NaN, e.d = null, e;
		if (ye.test(t)) n = 16, t = t.toLowerCase();
		else if (ve.test(t)) n = 2;
		else if (be.test(t)) n = 8;
		else throw Error(me + t);
		for (a = t.search(/p/i), a > 0 ? (c = +t.slice(a + 1), t = t.substring(2, a)) : t = t.slice(2), a = t.indexOf("."), o = a >= 0, r = e.constructor, o && (t = t.replace(".", ""), s = t.length, a = s - a, i = Pe(r, new r(n), a, a * 2)), l = Ee(t, n, xe), u = l.length - 1, a = u; l[a] === 0; --a) l.pop();
		return a < 0 ? new r(e.s * 0) : (e.e = ke(l, u), e.d = l, j = !1, o && (e = z(e, i, s * 4)), c && (e = e.times(Math.abs(c) < 54 ? N(2, c) : Nt.pow(2, c))), j = !0, e);
	}
	function He(e, t) {
		var n, r = t.d.length;
		if (r < 3) return t.isZero() ? t : Ue(e, 2, t, t);
		n = 1.4 * Math.sqrt(r), n = n > 16 ? 16 : n | 0, t = t.times(1 / We(5, n)), t = Ue(e, 2, t, t);
		for (var i, a = new e(5), o = new e(16), s = new e(20); n--;) i = t.times(t), t = t.times(a.plus(i.times(o.times(i).minus(s))));
		return t;
	}
	function Ue(e, t, n, r, i) {
		var a, o, s, c, l = 1, u = e.precision, d = Math.ceil(u / F);
		for (j = !1, c = n.times(n), s = new e(r);;) {
			if (o = z(s.times(c), new e(t++ * t++), u, 1), s = i ? r.plus(o) : r.minus(o), r = z(o.times(c), new e(t++ * t++), u, 1), o = s.plus(r), o.d[d] !== void 0) {
				for (a = d; o.d[a] === s.d[a] && a--;);
				if (a == -1) break;
			}
			a = s, s = r, r = o, o = a, l++;
		}
		return j = !0, o.d.length = d + 1, o;
	}
	function We(e, t) {
		for (var n = e; --t;) n *= e;
		return n;
	}
	function Ge(e, t) {
		var n, r = t.s < 0, i = je(e, e.precision, 1), a = i.times(.5);
		if (t = t.abs(), t.lte(a)) return A = r ? 4 : 1, t;
		if (n = t.divToInt(i), n.isZero()) A = r ? 3 : 2;
		else {
			if (t = t.minus(n.times(i)), t.lte(a)) return A = Fe(n) ? r ? 2 : 3 : r ? 4 : 1, t;
			A = Fe(n) ? r ? 1 : 4 : r ? 3 : 2;
		}
		return t.minus(i).abs();
	}
	function Ke(e, t, n, r) {
		var i, a, o, s, c, l, u, d, f, p = e.constructor, m = n !== void 0;
		if (m ? (R(n, 1, O), r === void 0 ? r = p.rounding : R(r, 0, 8)) : (n = p.precision, r = p.rounding), !e.isFinite()) u = ze(e);
		else {
			for (u = Oe(e), o = u.indexOf("."), m ? (i = 2, t == 16 ? n = n * 4 - 3 : t == 8 && (n = n * 3 - 2)) : i = t, o >= 0 && (u = u.replace(".", ""), f = new p(1), f.e = u.length - o, f.d = Ee(Oe(f), 10, i), f.e = f.d.length), d = Ee(u, 10, i), a = c = d.length; d[--c] == 0;) d.pop();
			if (!d[0]) u = m ? "0p+0" : "0";
			else {
				if (o < 0 ? a-- : (e = new p(e), e.d = d, e.e = a, e = z(e, f, n, r, 0, i), d = e.d, a = e.e, l = k), o = d[n], s = i / 2, l ||= d[n + 1] !== void 0, l = r < 4 ? (o !== void 0 || l) && (r === 0 || r === (e.s < 0 ? 3 : 2)) : o > s || o === s && (r === 4 || l || r === 6 && d[n - 1] & 1 || r === (e.s < 0 ? 8 : 7)), d.length = n, l) for (; ++d[--n] > i - 1;) d[n] = 0, n || (++a, d.unshift(1));
				for (c = d.length; !d[c - 1]; --c);
				for (o = 0, u = ""; o < c; o++) u += le.charAt(d[o]);
				if (m) {
					if (c > 1) if (t == 16 || t == 8) {
						for (o = t == 16 ? 4 : 3, --c; c % o; c++) u += "0";
						for (d = Ee(u, i, t), c = d.length; !d[c - 1]; --c);
						for (o = 1, u = "1."; o < c; o++) u += le.charAt(d[o]);
					} else u = u.charAt(0) + "." + u.slice(1);
					u = u + (a < 0 ? "p" : "p+") + a;
				} else if (a < 0) {
					for (; ++a;) u = "0" + u;
					u = "0." + u;
				} else if (++a > c) for (a -= c; a--;) u += "0";
				else a < c && (u = u.slice(0, a) + "." + u.slice(a));
			}
			u = (t == 16 ? "0x" : t == 2 ? "0b" : t == 8 ? "0o" : "") + u;
		}
		return e.s < 0 ? "-" + u : u;
	}
	function qe(e, t) {
		if (e.length > t) return e.length = t, !0;
	}
	function Je(e) {
		return new this(e).abs();
	}
	function Ye(e) {
		return new this(e).acos();
	}
	function Xe(e) {
		return new this(e).acosh();
	}
	function Ze(e, t) {
		return new this(e).plus(t);
	}
	function Qe(e) {
		return new this(e).asin();
	}
	function $e(e) {
		return new this(e).asinh();
	}
	function et(e) {
		return new this(e).atan();
	}
	function tt(e) {
		return new this(e).atanh();
	}
	function nt(e, t) {
		e = new this(e), t = new this(t);
		var n, r = this.precision, i = this.rounding, a = r + 4;
		return !e.s || !t.s ? n = new this(NaN) : !e.d && !t.d ? (n = je(this, a, 1).times(t.s > 0 ? .25 : .75), n.s = e.s) : !t.d || e.isZero() ? (n = t.s < 0 ? je(this, r, i) : new this(0), n.s = e.s) : !e.d || t.isZero() ? (n = je(this, a, 1).times(.5), n.s = e.s) : t.s < 0 ? (this.precision = a, this.rounding = 1, n = this.atan(z(e, t, a, 1)), t = je(this, a, 1), this.precision = r, this.rounding = i, n = e.s < 0 ? n.minus(t) : n.plus(t)) : n = this.atan(z(e, t, a, 1)), n;
	}
	function rt(e) {
		return new this(e).cbrt();
	}
	function it(e) {
		return B(e = new this(e), e.e + 1, 2);
	}
	function at(e, t, n) {
		return new this(e).clamp(t, n);
	}
	function ot(e) {
		if (!e || typeof e != "object") throw Error(pe + "Object expected");
		var t, n, r, i = e.defaults === !0, a = [
			"precision",
			1,
			O,
			"rounding",
			0,
			8,
			"toExpNeg",
			-ce,
			0,
			"toExpPos",
			0,
			ce,
			"maxE",
			0,
			ce,
			"minE",
			-ce,
			0,
			"modulo",
			0,
			9
		];
		for (t = 0; t < a.length; t += 3) if (n = a[t], i && (this[n] = fe[n]), (r = e[n]) !== void 0) if (M(r) === r && r >= a[t + 1] && r <= a[t + 2]) this[n] = r;
		else throw Error(me + n + ": " + r);
		if (n = "crypto", i && (this[n] = fe[n]), (r = e[n]) !== void 0) if (r === !0 || r === !1 || r === 0 || r === 1) if (r) if (typeof crypto < "u" && crypto && (crypto.getRandomValues || crypto.randomBytes)) this[n] = !0;
		else throw Error(ge);
		else this[n] = !1;
		else throw Error(me + n + ": " + r);
		return this;
	}
	function st(e) {
		return new this(e).cos();
	}
	function ct(e) {
		return new this(e).cosh();
	}
	function lt(e) {
		var t, n, r;
		function i(e) {
			var t, n, r, a = this;
			if (!(a instanceof i)) return new i(e);
			if (a.constructor = i, mt(e)) {
				a.s = e.s, j ? !e.d || e.e > i.maxE ? (a.e = NaN, a.d = null) : e.e < i.minE ? (a.e = 0, a.d = [0]) : (a.e = e.e, a.d = e.d.slice()) : (a.e = e.e, a.d = e.d ? e.d.slice() : e.d);
				return;
			}
			if (r = typeof e, r === "number") {
				if (e === 0) {
					a.s = 1 / e < 0 ? -1 : 1, a.e = 0, a.d = [0];
					return;
				}
				if (e < 0 ? (e = -e, a.s = -1) : a.s = 1, e === ~~e && e < 1e7) {
					for (t = 0, n = e; n >= 10; n /= 10) t++;
					j ? t > i.maxE ? (a.e = NaN, a.d = null) : t < i.minE ? (a.e = 0, a.d = [0]) : (a.e = t, a.d = [e]) : (a.e = t, a.d = [e]);
					return;
				}
				if (e * 0 != 0) {
					e || (a.s = NaN), a.e = NaN, a.d = null;
					return;
				}
				return Be(a, e.toString());
			}
			if (r === "string") return (n = e.charCodeAt(0)) === 45 ? (e = e.slice(1), a.s = -1) : (n === 43 && (e = e.slice(1)), a.s = 1), P.test(e) ? Be(a, e) : Ve(a, e);
			if (r === "bigint") return e < 0 ? (e = -e, a.s = -1) : a.s = 1, Be(a, e.toString());
			throw Error(me + e);
		}
		if (i.prototype = I, i.ROUND_UP = 0, i.ROUND_DOWN = 1, i.ROUND_CEIL = 2, i.ROUND_FLOOR = 3, i.ROUND_HALF_UP = 4, i.ROUND_HALF_DOWN = 5, i.ROUND_HALF_EVEN = 6, i.ROUND_HALF_CEIL = 7, i.ROUND_HALF_FLOOR = 8, i.EUCLID = 9, i.config = i.set = ot, i.clone = lt, i.isDecimal = mt, i.abs = Je, i.acos = Ye, i.acosh = Xe, i.add = Ze, i.asin = Qe, i.asinh = $e, i.atan = et, i.atanh = tt, i.atan2 = nt, i.cbrt = rt, i.ceil = it, i.clamp = at, i.cos = st, i.cosh = ct, i.div = ut, i.exp = dt, i.floor = ft, i.hypot = pt, i.ln = ht, i.log = gt, i.log10 = vt, i.log2 = _t, i.max = yt, i.min = bt, i.mod = xt, i.mul = St, i.pow = Ct, i.random = V, i.round = wt, i.sign = Tt, i.sin = Et, i.sinh = Dt, i.sqrt = Ot, i.sub = kt, i.sum = At, i.tan = jt, i.tanh = Mt, i.trunc = H, e === void 0 && (e = {}), e && e.defaults !== !0) for (r = [
			"precision",
			"rounding",
			"toExpNeg",
			"toExpPos",
			"maxE",
			"minE",
			"modulo",
			"crypto"
		], t = 0; t < r.length;) e.hasOwnProperty(n = r[t++]) || (e[n] = this[n]);
		return i.config(e), i;
	}
	function ut(e, t) {
		return new this(e).div(t);
	}
	function dt(e) {
		return new this(e).exp();
	}
	function ft(e) {
		return B(e = new this(e), e.e + 1, 3);
	}
	function pt() {
		var e, t, n = new this(0);
		for (j = !1, e = 0; e < arguments.length;) if (t = new this(arguments[e++]), t.d) n.d && (n = n.plus(t.times(t)));
		else {
			if (t.s) return j = !0, new this(Infinity);
			n = t;
		}
		return j = !0, n.sqrt();
	}
	function mt(e) {
		return e instanceof Nt || e && e.toStringTag === _e || !1;
	}
	function ht(e) {
		return new this(e).ln();
	}
	function gt(e, t) {
		return new this(e).log(t);
	}
	function _t(e) {
		return new this(e).log(2);
	}
	function vt(e) {
		return new this(e).log(10);
	}
	function yt() {
		return Ie(this, arguments, -1);
	}
	function bt() {
		return Ie(this, arguments, 1);
	}
	function xt(e, t) {
		return new this(e).mod(t);
	}
	function St(e, t) {
		return new this(e).mul(t);
	}
	function Ct(e, t) {
		return new this(e).pow(t);
	}
	function V(e) {
		var t, n, r, i, a = 0, o = new this(1), s = [];
		if (e === void 0 ? e = this.precision : R(e, 1, O), r = Math.ceil(e / F), !this.crypto) for (; a < r;) s[a++] = Math.random() * 1e7 | 0;
		else if (crypto.getRandomValues) for (t = crypto.getRandomValues(new Uint32Array(r)); a < r;) i = t[a], i >= 429e7 ? t[a] = crypto.getRandomValues(new Uint32Array(1))[0] : s[a++] = i % 1e7;
		else if (crypto.randomBytes) {
			for (t = crypto.randomBytes(r *= 4); a < r;) i = t[a] + (t[a + 1] << 8) + (t[a + 2] << 16) + ((t[a + 3] & 127) << 24), i >= 214e7 ? crypto.randomBytes(4).copy(t, a) : (s.push(i % 1e7), a += 4);
			a = r / 4;
		} else throw Error(ge);
		for (r = s[--a], e %= F, r && e && (i = N(10, F - e), s[a] = (r / i | 0) * i); s[a] === 0; a--) s.pop();
		if (a < 0) n = 0, s = [0];
		else {
			for (n = -1; s[0] === 0; n -= F) s.shift();
			for (r = 1, i = s[0]; i >= 10; i /= 10) r++;
			r < F && (n -= F - r);
		}
		return o.e = n, o.d = s, o;
	}
	function wt(e) {
		return B(e = new this(e), e.e + 1, this.rounding);
	}
	function Tt(e) {
		return e = new this(e), e.d ? e.d[0] ? e.s : 0 * e.s : e.s || NaN;
	}
	function Et(e) {
		return new this(e).sin();
	}
	function Dt(e) {
		return new this(e).sinh();
	}
	function Ot(e) {
		return new this(e).sqrt();
	}
	function kt(e, t) {
		return new this(e).sub(t);
	}
	function At() {
		var e = 0, t = arguments, n = new this(t[e]);
		for (j = !1; n.s && ++e < t.length;) n = n.plus(t[e]);
		return j = !0, B(n, this.precision, this.rounding);
	}
	function jt(e) {
		return new this(e).tan();
	}
	function Mt(e) {
		return new this(e).tanh();
	}
	function H(e) {
		return B(e = new this(e), e.e + 1, 1);
	}
	I[Symbol.for("nodejs.util.inspect.custom")] = I.toString, I[Symbol.toStringTag] = "Decimal";
	var Nt = I.constructor = lt(fe);
	ue = new Nt(ue), de = new Nt(de);
	var Pt = class e {
		constructor(t, n) {
			if (t.length - 1 !== n.length) throw t.length === 0 ? TypeError("Expected at least 1 string") : TypeError(`Expected ${t.length} strings to have ${t.length - 1} values`);
			let r = n.reduce((t, n) => t + (n instanceof e ? n.values.length : 1), 0);
			this.values = Array(r), this.strings = Array(r + 1), this.strings[0] = t[0];
			let i = 0, a = 0;
			for (; i < n.length;) {
				let r = n[i++], o = t[i];
				if (r instanceof e) {
					this.strings[a] += r.strings[0];
					let e = 0;
					for (; e < r.values.length;) this.values[a++] = r.values[e++], this.strings[a] = r.strings[e];
					this.strings[a] += o;
				} else this.values[a++] = r, this.strings[a] = o;
			}
		}
		get sql() {
			let e = this.strings.length, t = 1, n = this.strings[0];
			for (; t < e;) n += `?${this.strings[t++]}`;
			return n;
		}
		get statement() {
			let e = this.strings.length, t = 1, n = this.strings[0];
			for (; t < e;) n += `:${t}${this.strings[t++]}`;
			return n;
		}
		get text() {
			let e = this.strings.length, t = 1, n = this.strings[0];
			for (; t < e;) n += `$${t}${this.strings[t++]}`;
			return n;
		}
		inspect() {
			return {
				sql: this.sql,
				statement: this.statement,
				text: this.text,
				values: this.values
			};
		}
	};
	function Ft(e, t = ",", n = "", r = "") {
		if (e.length === 0) throw TypeError("Expected `join([])` to be called with an array of multiple elements, but got an empty array");
		return new Pt([
			n,
			...Array(e.length - 1).fill(t),
			r
		], e);
	}
	function It(e) {
		return new Pt([e], []);
	}
	var Lt = It("");
	function Rt(e, ...t) {
		return new Pt(e, t);
	}
})), b = /* @__PURE__ */ _((/* @__PURE__ */ h(((e, t) => {
	var n = Object.create, r = Object.defineProperty, i = Object.getOwnPropertyDescriptor, a = Object.getOwnPropertyNames, o = Object.getPrototypeOf, s = Object.prototype.hasOwnProperty, c = (e, t) => () => (e && (t = e(e = 0)), t), l = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), u = (e, t) => {
		for (var n in t) r(e, n, {
			get: t[n],
			enumerable: !0
		});
	}, d = (e, t, n, o) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of a(t)) !s.call(e, c) && c !== n && r(e, c, {
			get: () => t[c],
			enumerable: !(o = i(t, c)) || o.enumerable
		});
		return e;
	}, f = (e, t, i) => (i = e == null ? {} : n(o(e)), d(t || !e || !e.__esModule ? r(i, "default", {
		value: e,
		enumerable: !0
	}) : i, e)), p = (e) => d(r({}, "__esModule", { value: !0 }), e), m = l((e, t) => {
		t.exports = {
			name: "@prisma/engines-version",
			version: "7.6.0-1.75cbdc1eb7150937890ad5465d861175c6624711",
			main: "index.js",
			types: "index.d.ts",
			license: "Apache-2.0",
			author: "Tim Suchanek <suchanek@prisma.io>",
			prisma: { enginesVersion: "75cbdc1eb7150937890ad5465d861175c6624711" },
			repository: {
				type: "git",
				url: "https://github.com/prisma/engines-wrapper.git",
				directory: "packages/engines-version"
			},
			devDependencies: {
				"@types/node": "18.19.76",
				typescript: "4.9.5"
			},
			files: ["index.js", "index.d.ts"],
			scripts: { build: "tsc -d" }
		};
	}), h = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.enginesVersion = void 0, e.enginesVersion = m().prisma.enginesVersion;
	}), g = l((e, t) => {
		t.exports = (e) => {
			let t = e.match(/^[ \t]*(?=\S)/gm);
			return t ? t.reduce((e, t) => Math.min(e, t.length), Infinity) : 0;
		};
	}), _ = l((e, t) => {
		t.exports = (e, t = 1, n) => {
			if (n = {
				indent: " ",
				includeEmptyLines: !1,
				...n
			}, typeof e != "string") throw TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof e}\``);
			if (typeof t != "number") throw TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof t}\``);
			if (typeof n.indent != "string") throw TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof n.indent}\``);
			if (t === 0) return e;
			let r = n.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
			return e.replace(r, n.indent.repeat(t));
		};
	}), b = l((e, t) => {
		t.exports = (e = {}) => {
			let t;
			if (e.repoUrl) t = e.repoUrl;
			else if (e.user && e.repo) t = `https://github.com/${e.user}/${e.repo}`;
			else throw Error("You need to specify either the `repoUrl` option or both the `user` and `repo` options");
			let n = new URL(`${t}/issues/new`);
			for (let t of [
				"body",
				"title",
				"labels",
				"template",
				"milestone",
				"assignee",
				"projects"
			]) {
				let r = e[t];
				if (r !== void 0) {
					if (t === "labels" || t === "projects") {
						if (!Array.isArray(r)) throw TypeError(`The \`${t}\` option should be an array`);
						r = r.join(",");
					}
					n.searchParams.set(t, r);
				}
			}
			return n.toString();
		}, t.exports.default = t.exports;
	}), x = l((e, t) => {
		t.exports = function() {
			function e(e, t, n, r, i) {
				return e < t || n < t ? e > n ? n + 1 : e + 1 : r === i ? t : t + 1;
			}
			return function(t, n) {
				if (t === n) return 0;
				if (t.length > n.length) {
					var r = t;
					t = n, n = r;
				}
				for (var i = t.length, a = n.length; i > 0 && t.charCodeAt(i - 1) === n.charCodeAt(a - 1);) i--, a--;
				for (var o = 0; o < i && t.charCodeAt(o) === n.charCodeAt(o);) o++;
				if (i -= o, a -= o, i === 0 || a < 3) return a;
				var s = 0, c, l, u, d, f, p, m, h, g, _, v, y, b = [];
				for (c = 0; c < i; c++) b.push(c + 1), b.push(t.charCodeAt(o + c));
				for (var x = b.length - 1; s < a - 3;) for (g = n.charCodeAt(o + (l = s)), _ = n.charCodeAt(o + (u = s + 1)), v = n.charCodeAt(o + (d = s + 2)), y = n.charCodeAt(o + (f = s + 3)), p = s += 4, c = 0; c < x; c += 2) m = b[c], h = b[c + 1], l = e(m, l, u, g, h), u = e(l, u, d, _, h), d = e(u, d, f, v, h), p = e(d, f, p, y, h), b[c] = p, f = d, d = u, u = l, l = m;
				for (; s < a;) for (g = n.charCodeAt(o + (l = s)), p = ++s, c = 0; c < x; c += 2) m = b[c], b[c] = p = e(m, l, p, g, b[c + 1]), l = m;
				return p;
			};
		}();
	}), S = c(() => {}), ee = c(() => {}), te = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.anumber = t, e.abytes = r, e.ahash = i, e.aexists = a, e.aoutput = o;
		function t(e) {
			if (!Number.isSafeInteger(e) || e < 0) throw Error("positive integer expected, got " + e);
		}
		function n(e) {
			return e instanceof Uint8Array || ArrayBuffer.isView(e) && e.constructor.name === "Uint8Array";
		}
		function r(e, ...t) {
			if (!n(e)) throw Error("Uint8Array expected");
			if (t.length > 0 && !t.includes(e.length)) throw Error("Uint8Array expected of length " + t + ", got length=" + e.length);
		}
		function i(e) {
			if (typeof e != "function" || typeof e.create != "function") throw Error("Hash should be wrapped by utils.wrapConstructor");
			t(e.outputLen), t(e.blockLen);
		}
		function a(e, t = !0) {
			if (e.destroyed) throw Error("Hash instance has been destroyed");
			if (t && e.finished) throw Error("Hash#digest() has already been called");
		}
		function o(e, t) {
			r(e);
			let n = t.outputLen;
			if (e.length < n) throw Error("digestInto() expects output buffer of length at least " + n);
		}
	}), ne = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.add5L = e.add5H = e.add4H = e.add4L = e.add3H = e.add3L = e.rotlBL = e.rotlBH = e.rotlSL = e.rotlSH = e.rotr32L = e.rotr32H = e.rotrBL = e.rotrBH = e.rotrSL = e.rotrSH = e.shrSL = e.shrSH = e.toBig = void 0, e.fromBig = r, e.split = i, e.add = v;
		var t = BigInt(2 ** 32 - 1), n = BigInt(32);
		function r(e, r = !1) {
			return r ? {
				h: Number(e & t),
				l: Number(e >> n & t)
			} : {
				h: Number(e >> n & t) | 0,
				l: Number(e & t) | 0
			};
		}
		function i(e, t = !1) {
			let n = new Uint32Array(e.length), i = new Uint32Array(e.length);
			for (let a = 0; a < e.length; a++) {
				let { h: o, l: s } = r(e[a], t);
				[n[a], i[a]] = [o, s];
			}
			return [n, i];
		}
		var a = (e, t) => BigInt(e >>> 0) << n | BigInt(t >>> 0);
		e.toBig = a;
		var o = (e, t, n) => e >>> n;
		e.shrSH = o;
		var s = (e, t, n) => e << 32 - n | t >>> n;
		e.shrSL = s;
		var c = (e, t, n) => e >>> n | t << 32 - n;
		e.rotrSH = c;
		var l = (e, t, n) => e << 32 - n | t >>> n;
		e.rotrSL = l;
		var u = (e, t, n) => e << 64 - n | t >>> n - 32;
		e.rotrBH = u;
		var d = (e, t, n) => e >>> n - 32 | t << 64 - n;
		e.rotrBL = d;
		var f = (e, t) => t;
		e.rotr32H = f;
		var p = (e, t) => e;
		e.rotr32L = p;
		var m = (e, t, n) => e << n | t >>> 32 - n;
		e.rotlSH = m;
		var h = (e, t, n) => t << n | e >>> 32 - n;
		e.rotlSL = h;
		var g = (e, t, n) => t << n - 32 | e >>> 64 - n;
		e.rotlBH = g;
		var _ = (e, t, n) => e << n - 32 | t >>> 64 - n;
		e.rotlBL = _;
		function v(e, t, n, r) {
			let i = (t >>> 0) + (r >>> 0);
			return {
				h: e + n + (i / 2 ** 32 | 0) | 0,
				l: i | 0
			};
		}
		var y = (e, t, n) => (e >>> 0) + (t >>> 0) + (n >>> 0);
		e.add3L = y;
		var b = (e, t, n, r) => t + n + r + (e / 2 ** 32 | 0) | 0;
		e.add3H = b;
		var x = (e, t, n, r) => (e >>> 0) + (t >>> 0) + (n >>> 0) + (r >>> 0);
		e.add4L = x;
		var S = (e, t, n, r, i) => t + n + r + i + (e / 2 ** 32 | 0) | 0;
		e.add4H = S;
		var ee = (e, t, n, r, i) => (e >>> 0) + (t >>> 0) + (n >>> 0) + (r >>> 0) + (i >>> 0);
		e.add5L = ee;
		var te = (e, t, n, r, i, a) => t + n + r + i + a + (e / 2 ** 32 | 0) | 0;
		e.add5H = te, e.default = {
			fromBig: r,
			split: i,
			toBig: a,
			shrSH: o,
			shrSL: s,
			rotrSH: c,
			rotrSL: l,
			rotrBH: u,
			rotrBL: d,
			rotr32H: f,
			rotr32L: p,
			rotlSH: m,
			rotlSL: h,
			rotlBH: g,
			rotlBL: _,
			add: v,
			add3L: y,
			add3H: b,
			add4L: x,
			add4H: S,
			add5H: te,
			add5L: ee
		};
	}), re = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.crypto = void 0;
		var t = v("node:crypto");
		e.crypto = t && typeof t == "object" && "webcrypto" in t ? t.webcrypto : t && typeof t == "object" && "randomBytes" in t ? t : void 0;
	}), C = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.Hash = e.nextTick = e.byteSwapIfBE = e.isLE = void 0, e.isBytes = r, e.u8 = i, e.u32 = a, e.createView = o, e.rotr = s, e.rotl = c, e.byteSwap = l, e.byteSwap32 = u, e.bytesToHex = f, e.hexToBytes = h, e.asyncLoop = g, e.utf8ToBytes = _, e.toBytes = v, e.concatBytes = y, e.checkOpts = b, e.wrapConstructor = x, e.wrapConstructorWithOpts = S, e.wrapXOFConstructorWithOpts = ee, e.randomBytes = ne;
		var t = re(), n = te();
		function r(e) {
			return e instanceof Uint8Array || ArrayBuffer.isView(e) && e.constructor.name === "Uint8Array";
		}
		function i(e) {
			return new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
		}
		function a(e) {
			return new Uint32Array(e.buffer, e.byteOffset, Math.floor(e.byteLength / 4));
		}
		function o(e) {
			return new DataView(e.buffer, e.byteOffset, e.byteLength);
		}
		function s(e, t) {
			return e << 32 - t | e >>> t;
		}
		function c(e, t) {
			return e << t | e >>> 32 - t >>> 0;
		}
		e.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
		function l(e) {
			return e << 24 & 4278190080 | e << 8 & 16711680 | e >>> 8 & 65280 | e >>> 24 & 255;
		}
		e.byteSwapIfBE = e.isLE ? (e) => e : (e) => l(e);
		function u(e) {
			for (let t = 0; t < e.length; t++) e[t] = l(e[t]);
		}
		var d = Array.from({ length: 256 }, (e, t) => t.toString(16).padStart(2, "0"));
		function f(e) {
			(0, n.abytes)(e);
			let t = "";
			for (let n = 0; n < e.length; n++) t += d[e[n]];
			return t;
		}
		var p = {
			_0: 48,
			_9: 57,
			A: 65,
			F: 70,
			a: 97,
			f: 102
		};
		function m(e) {
			if (e >= p._0 && e <= p._9) return e - p._0;
			if (e >= p.A && e <= p.F) return e - (p.A - 10);
			if (e >= p.a && e <= p.f) return e - (p.a - 10);
		}
		function h(e) {
			if (typeof e != "string") throw Error("hex string expected, got " + typeof e);
			let t = e.length, n = t / 2;
			if (t % 2) throw Error("hex string expected, got unpadded hex of length " + t);
			let r = new Uint8Array(n);
			for (let t = 0, i = 0; t < n; t++, i += 2) {
				let n = m(e.charCodeAt(i)), a = m(e.charCodeAt(i + 1));
				if (n === void 0 || a === void 0) {
					let t = e[i] + e[i + 1];
					throw Error("hex string expected, got non-hex character \"" + t + "\" at index " + i);
				}
				r[t] = n * 16 + a;
			}
			return r;
		}
		e.nextTick = async () => {};
		async function g(t, n, r) {
			let i = Date.now();
			for (let a = 0; a < t; a++) {
				r(a);
				let t = Date.now() - i;
				t >= 0 && t < n || (await (0, e.nextTick)(), i += t);
			}
		}
		function _(e) {
			if (typeof e != "string") throw Error("utf8ToBytes expected string, got " + typeof e);
			return new Uint8Array(new TextEncoder().encode(e));
		}
		function v(e) {
			return typeof e == "string" && (e = _(e)), (0, n.abytes)(e), e;
		}
		function y(...e) {
			let t = 0;
			for (let r = 0; r < e.length; r++) {
				let i = e[r];
				(0, n.abytes)(i), t += i.length;
			}
			let r = new Uint8Array(t);
			for (let t = 0, n = 0; t < e.length; t++) {
				let i = e[t];
				r.set(i, n), n += i.length;
			}
			return r;
		}
		e.Hash = class {
			clone() {
				return this._cloneInto();
			}
		};
		function b(e, t) {
			if (t !== void 0 && {}.toString.call(t) !== "[object Object]") throw Error("Options should be object or undefined");
			return Object.assign(e, t);
		}
		function x(e) {
			let t = (t) => e().update(v(t)).digest(), n = e();
			return t.outputLen = n.outputLen, t.blockLen = n.blockLen, t.create = () => e(), t;
		}
		function S(e) {
			let t = (t, n) => e(n).update(v(t)).digest(), n = e({});
			return t.outputLen = n.outputLen, t.blockLen = n.blockLen, t.create = (t) => e(t), t;
		}
		function ee(e) {
			let t = (t, n) => e(n).update(v(t)).digest(), n = e({});
			return t.outputLen = n.outputLen, t.blockLen = n.blockLen, t.create = (t) => e(t), t;
		}
		function ne(e = 32) {
			if (t.crypto && typeof t.crypto.getRandomValues == "function") return t.crypto.getRandomValues(new Uint8Array(e));
			if (t.crypto && typeof t.crypto.randomBytes == "function") return t.crypto.randomBytes(e);
			throw Error("crypto.getRandomValues must be defined");
		}
	}), w = l((e) => {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.shake256 = e.shake128 = e.keccak_512 = e.keccak_384 = e.keccak_256 = e.keccak_224 = e.sha3_512 = e.sha3_384 = e.sha3_256 = e.sha3_224 = e.Keccak = void 0, e.keccakP = _;
		var t = te(), n = ne(), r = C(), i = [], a = [], o = [], s = BigInt(0), c = BigInt(1), l = BigInt(2), u = BigInt(7), d = BigInt(256), f = BigInt(113);
		for (let e = 0, t = c, n = 1, r = 0; e < 24; e++) {
			[n, r] = [r, (2 * n + 3 * r) % 5], i.push(2 * (5 * r + n)), a.push((e + 1) * (e + 2) / 2 % 64);
			let p = s;
			for (let e = 0; e < 7; e++) t = (t << c ^ (t >> u) * f) % d, t & l && (p ^= c << (c << BigInt(e)) - c);
			o.push(p);
		}
		var [p, m] = (0, n.split)(o, !0), h = (e, t, r) => r > 32 ? (0, n.rotlBH)(e, t, r) : (0, n.rotlSH)(e, t, r), g = (e, t, r) => r > 32 ? (0, n.rotlBL)(e, t, r) : (0, n.rotlSL)(e, t, r);
		function _(e, t = 24) {
			let n = new Uint32Array(10);
			for (let r = 24 - t; r < 24; r++) {
				for (let t = 0; t < 10; t++) n[t] = e[t] ^ e[t + 10] ^ e[t + 20] ^ e[t + 30] ^ e[t + 40];
				for (let t = 0; t < 10; t += 2) {
					let r = (t + 8) % 10, i = (t + 2) % 10, a = n[i], o = n[i + 1], s = h(a, o, 1) ^ n[r], c = g(a, o, 1) ^ n[r + 1];
					for (let n = 0; n < 50; n += 10) e[t + n] ^= s, e[t + n + 1] ^= c;
				}
				let t = e[2], o = e[3];
				for (let n = 0; n < 24; n++) {
					let r = a[n], s = h(t, o, r), c = g(t, o, r), l = i[n];
					t = e[l], o = e[l + 1], e[l] = s, e[l + 1] = c;
				}
				for (let t = 0; t < 50; t += 10) {
					for (let r = 0; r < 10; r++) n[r] = e[t + r];
					for (let r = 0; r < 10; r++) e[t + r] ^= ~n[(r + 2) % 10] & n[(r + 4) % 10];
				}
				e[0] ^= p[r], e[1] ^= m[r];
			}
			n.fill(0);
		}
		var v = class e extends r.Hash {
			constructor(e, n, i, a = !1, o = 24) {
				if (super(), this.blockLen = e, this.suffix = n, this.outputLen = i, this.enableXOF = a, this.rounds = o, this.pos = 0, this.posOut = 0, this.finished = !1, this.destroyed = !1, (0, t.anumber)(i), 0 >= this.blockLen || this.blockLen >= 200) throw Error("Sha3 supports only keccak-f1600 function");
				this.state = new Uint8Array(200), this.state32 = (0, r.u32)(this.state);
			}
			keccak() {
				r.isLE || (0, r.byteSwap32)(this.state32), _(this.state32, this.rounds), r.isLE || (0, r.byteSwap32)(this.state32), this.posOut = 0, this.pos = 0;
			}
			update(e) {
				(0, t.aexists)(this);
				let { blockLen: n, state: i } = this;
				e = (0, r.toBytes)(e);
				let a = e.length;
				for (let t = 0; t < a;) {
					let r = Math.min(n - this.pos, a - t);
					for (let n = 0; n < r; n++) i[this.pos++] ^= e[t++];
					this.pos === n && this.keccak();
				}
				return this;
			}
			finish() {
				if (this.finished) return;
				this.finished = !0;
				let { state: e, suffix: t, pos: n, blockLen: r } = this;
				e[n] ^= t, t & 128 && n === r - 1 && this.keccak(), e[r - 1] ^= 128, this.keccak();
			}
			writeInto(e) {
				(0, t.aexists)(this, !1), (0, t.abytes)(e), this.finish();
				let n = this.state, { blockLen: r } = this;
				for (let t = 0, i = e.length; t < i;) {
					this.posOut >= r && this.keccak();
					let a = Math.min(r - this.posOut, i - t);
					e.set(n.subarray(this.posOut, this.posOut + a), t), this.posOut += a, t += a;
				}
				return e;
			}
			xofInto(e) {
				if (!this.enableXOF) throw Error("XOF is not possible for this instance");
				return this.writeInto(e);
			}
			xof(e) {
				return (0, t.anumber)(e), this.xofInto(new Uint8Array(e));
			}
			digestInto(e) {
				if ((0, t.aoutput)(e, this), this.finished) throw Error("digest() was already called");
				return this.writeInto(e), this.destroy(), e;
			}
			digest() {
				return this.digestInto(new Uint8Array(this.outputLen));
			}
			destroy() {
				this.destroyed = !0, this.state.fill(0);
			}
			_cloneInto(t) {
				let { blockLen: n, suffix: r, outputLen: i, rounds: a, enableXOF: o } = this;
				return t ||= new e(n, r, i, o, a), t.state32.set(this.state32), t.pos = this.pos, t.posOut = this.posOut, t.finished = this.finished, t.rounds = a, t.suffix = r, t.outputLen = i, t.enableXOF = o, t.destroyed = this.destroyed, t;
			}
		};
		e.Keccak = v;
		var y = (e, t, n) => (0, r.wrapConstructor)(() => new v(t, e, n));
		e.sha3_224 = y(6, 144, 224 / 8), e.sha3_256 = y(6, 136, 256 / 8), e.sha3_384 = y(6, 104, 384 / 8), e.sha3_512 = y(6, 72, 512 / 8), e.keccak_224 = y(1, 144, 224 / 8), e.keccak_256 = y(1, 136, 256 / 8), e.keccak_384 = y(1, 104, 384 / 8), e.keccak_512 = y(1, 72, 512 / 8);
		var b = (e, t, n) => (0, r.wrapXOFConstructorWithOpts)((r = {}) => new v(t, e, r.dkLen === void 0 ? n : r.dkLen, !0));
		e.shake128 = b(31, 168, 128 / 8), e.shake256 = b(31, 136, 256 / 8);
	}), ie = l((e, t) => {
		var { sha3_512: n } = w(), r = 24, i = 32, a = (e = 4, t = Math.random) => {
			let n = "";
			for (; n.length < e;) n += Math.floor(t() * 36).toString(36);
			return n;
		};
		function o(e) {
			let t = 0n;
			for (let n of e.values()) {
				let e = BigInt(n);
				t = (t << 8n) + e;
			}
			return t;
		}
		var s = (e = "") => o(n(e)).toString(36).slice(1), c = Array.from({ length: 26 }, (e, t) => String.fromCharCode(t + 97)), l = (e) => c[Math.floor(e() * c.length)], u = ({ globalObj: e = typeof global < "u" ? global : typeof window < "u" ? window : {}, random: t = Math.random } = {}) => {
			let n = Object.keys(e).toString();
			return s(n.length ? n + a(i, t) : a(i, t)).substring(0, i);
		}, d = (e) => () => e++, f = 476782367, p = ({ random: e = Math.random, counter: t = d(Math.floor(e() * f)), length: n = r, fingerprint: i = u({ random: e }) } = {}) => function() {
			let r = l(e), o = Date.now().toString(36), c = t().toString(36);
			return `${r + s(`${o + a(n, e) + c + i}`).substring(1, n)}`;
		}, m = p(), h = (e, { minLength: t = 2, maxLength: n = i } = {}) => {
			let r = e.length, a = /^[0-9a-z]+$/;
			try {
				if (typeof e == "string" && r >= t && r <= n && a.test(e)) return !0;
			} finally {}
			return !1;
		};
		t.exports.getConstants = () => ({
			defaultLength: r,
			bigLength: i
		}), t.exports.init = p, t.exports.createId = m, t.exports.bufToBigInt = o, t.exports.createCounter = d, t.exports.createFingerprint = u, t.exports.isCuid = h;
	}), T = l((e, t) => {
		var { createId: n, init: r, getConstants: i, isCuid: a } = ie();
		t.exports.createId = n, t.exports.init = r, t.exports.getConstants = i, t.exports.isCuid = a;
	}), E = {};
	u(E, {
		AnyNull: () => ud.AnyNull,
		DMMF: () => wt,
		DbNull: () => ud.DbNull,
		Debug: () => Ge,
		Decimal: () => dd.Decimal,
		Extensions: () => D,
		JsonNull: () => ud.JsonNull,
		NullTypes: () => ud.NullTypes,
		ObjectEnumValue: () => ud.ObjectEnumValue,
		PrismaClientInitializationError: () => $.PrismaClientInitializationError,
		PrismaClientKnownRequestError: () => $.PrismaClientKnownRequestError,
		PrismaClientRustPanicError: () => $.PrismaClientRustPanicError,
		PrismaClientUnknownRequestError: () => $.PrismaClientUnknownRequestError,
		PrismaClientValidationError: () => $.PrismaClientValidationError,
		Public: () => se,
		Sql: () => ld.Sql,
		createParam: () => pr,
		defineDmmfProperty: () => Pr,
		deserializeJsonObject: () => ka,
		deserializeRawResult: () => _u,
		dmmfToRuntimeDataModel: () => fe,
		empty: () => ld.empty,
		getPrismaClient: () => Yu,
		getRuntime: () => cd,
		isAnyNull: () => ud.isAnyNull,
		isDbNull: () => ud.isDbNull,
		isJsonNull: () => ud.isJsonNull,
		isObjectEnumValue: () => ud.isObjectEnumValue,
		join: () => ld.join,
		makeStrictEnum: () => $u,
		makeTypedQueryFactory: () => Br,
		raw: () => ld.raw,
		serializeJsonQuery: () => br,
		skip: () => gr,
		sqltag: () => ld.sql,
		warnOnce: () => yt
	}), t.exports = p(E);
	var D = {};
	u(D, {
		defineExtension: () => ae,
		getExtensionContext: () => oe
	});
	function ae(e) {
		return typeof e == "function" ? e : (t) => t.$extends(e);
	}
	function oe(e) {
		return e;
	}
	var se = {};
	u(se, { validator: () => ce });
	function ce(...e) {
		return (e) => e;
	}
	var O = class {
		_map = /* @__PURE__ */ new Map();
		get(e) {
			return this._map.get(e)?.value;
		}
		set(e, t) {
			this._map.set(e, { value: t });
		}
		getOrCreate(e, t) {
			let n = this._map.get(e);
			if (n) return n.value;
			let r = t();
			return this.set(e, r), r;
		}
	};
	function le(e) {
		return e.substring(0, 1).toLowerCase() + e.substring(1);
	}
	function ue(e, t) {
		let n = {};
		for (let r of e) {
			let e = r[t];
			n[e] = r;
		}
		return n;
	}
	function de(e) {
		let t;
		return { get() {
			return t ||= { value: e() }, t.value;
		} };
	}
	function fe(e) {
		return {
			models: k(e.models),
			enums: k(e.enums),
			types: k(e.types)
		};
	}
	function k(e) {
		let t = {};
		for (let { name: n, ...r } of e) t[n] = r;
		return t;
	}
	var A = y(), j = {};
	u(j, {
		$: () => M,
		bgBlack: () => ke,
		bgBlue: () => Ne,
		bgCyan: () => Fe,
		bgGreen: () => je,
		bgMagenta: () => Pe,
		bgRed: () => Ae,
		bgWhite: () => Ie,
		bgYellow: () => Me,
		black: () => we,
		blue: () => Te,
		bold: () => ye,
		cyan: () => De,
		dim: () => be,
		gray: () => B,
		green: () => L,
		grey: () => Oe,
		hidden: () => Se,
		inverse: () => F,
		italic: () => P,
		magenta: () => Ee,
		red: () => I,
		reset: () => ve,
		strikethrough: () => Ce,
		underline: () => xe,
		white: () => z,
		yellow: () => R
	});
	var pe, me, he, ge, _e = !0;
	typeof process < "u" && ({FORCE_COLOR: pe, NODE_DISABLE_COLORS: me, NO_COLOR: he, TERM: ge} = process.env || {}, _e = process.stdout && process.stdout.isTTY);
	var M = { enabled: !me && he == null && ge !== "dumb" && (pe != null && pe !== "0" || _e) };
	function N(e, t) {
		let n = RegExp(`\\x1b\\[${t}m`, "g"), r = `\x1B[${e}m`, i = `\x1B[${t}m`;
		return function(e) {
			return !M.enabled || e == null ? e : r + (~("" + e).indexOf(i) ? e.replace(n, i + r) : e) + i;
		};
	}
	var ve = N(0, 0), ye = N(1, 22), be = N(2, 22), P = N(3, 23), xe = N(4, 24), F = N(7, 27), Se = N(8, 28), Ce = N(9, 29), we = N(30, 39), I = N(31, 39), L = N(32, 39), R = N(33, 39), Te = N(34, 39), Ee = N(35, 39), De = N(36, 39), z = N(37, 39), B = N(90, 39), Oe = N(90, 39), ke = N(40, 49), Ae = N(41, 49), je = N(42, 49), Me = N(43, 49), Ne = N(44, 49), Pe = N(45, 49), Fe = N(46, 49), Ie = N(47, 49), Le = 100, Re = [
		"green",
		"yellow",
		"blue",
		"magenta",
		"cyan",
		"red"
	], ze = [], Be = Date.now(), Ve = 0, He = typeof process < "u" ? process.env : {};
	globalThis.DEBUG ??= He.DEBUG ?? "", globalThis.DEBUG_COLORS ??= He.DEBUG_COLORS ? He.DEBUG_COLORS === "true" : !0;
	var Ue = {
		enable(e) {
			typeof e == "string" && (globalThis.DEBUG = e);
		},
		disable() {
			let e = globalThis.DEBUG;
			return globalThis.DEBUG = "", e;
		},
		enabled(e) {
			let t = globalThis.DEBUG.split(",").map((e) => e.replace(/[.+?^${}()|[\]\\]/g, "\\$&")), n = t.some((t) => t === "" || t[0] === "-" ? !1 : e.match(RegExp(t.split("*").join(".*") + "$"))), r = t.some((t) => t === "" || t[0] !== "-" ? !1 : e.match(RegExp(t.slice(1).split("*").join(".*") + "$")));
			return n && !r;
		},
		log: (...e) => {
			let [t, n, ...r] = e;
			(console.warn ?? console.log)(`${t} ${n}`, ...r);
		},
		formatters: {}
	};
	function We(e) {
		let t = {
			color: Re[Ve++ % Re.length],
			enabled: Ue.enabled(e),
			namespace: e,
			log: Ue.log,
			extend: () => {}
		};
		return new Proxy((...e) => {
			let { enabled: n, namespace: r, color: i, log: a } = t;
			if (e.length !== 0 && ze.push([r, ...e]), ze.length > Le && ze.shift(), Ue.enabled(r) || n) {
				let t = e.map((e) => typeof e == "string" ? e : Ke(e)), n = `+${Date.now() - Be}ms`;
				Be = Date.now(), globalThis.DEBUG_COLORS ? a(j[i](ye(r)), ...t, j[i](n)) : a(r, ...t, n);
			}
		}, {
			get: (e, n) => t[n],
			set: (e, n, r) => t[n] = r
		});
	}
	var Ge = new Proxy(We, {
		get: (e, t) => Ue[t],
		set: (e, t, n) => Ue[t] = n
	});
	function Ke(e, t = 2) {
		let n = /* @__PURE__ */ new Set();
		return JSON.stringify(e, (e, t) => {
			if (typeof t == "object" && t) {
				if (n.has(t)) return "[Circular *]";
				n.add(t);
			} else if (typeof t == "bigint") return t.toString();
			return t;
		}, t);
	}
	function qe(e = 7500) {
		let t = ze.map(([e, ...t]) => `${e} ${t.map((e) => typeof e == "string" ? e : JSON.stringify(e)).join(" ")}`).join("\n");
		return t.length < e ? t : t.slice(-e);
	}
	function Je() {
		ze.length = 0;
	}
	function Ye(e, t) {
		throw Error(t);
	}
	var Xe = f(g(), 1);
	function Ze(e) {
		let t = (0, Xe.default)(e);
		if (t === 0) return e;
		let n = RegExp(`^[ \\t]{${t}}`, "gm");
		return e.replace(n, "");
	}
	var Qe = "prisma+postgres:";
	function $e(e) {
		return e?.toString().startsWith(`${Qe}//`) ?? !1;
	}
	function et(e) {
		if (!$e(e)) return !1;
		let { host: t } = new URL(e);
		return t.includes("localhost") || t.includes("127.0.0.1") || t.includes("[::1]");
	}
	var tt = {};
	u(tt, {
		error: () => st,
		info: () => ot,
		log: () => it,
		query: () => ct,
		should: () => rt,
		tags: () => nt,
		warn: () => at
	});
	var nt = {
		error: I("prisma:error"),
		warn: R("prisma:warn"),
		info: De("prisma:info"),
		query: Te("prisma:query")
	}, rt = { warn: () => !process.env.PRISMA_DISABLE_WARNINGS };
	function it(...e) {
		console.log(...e);
	}
	function at(e, ...t) {
		rt.warn() && console.warn(`${nt.warn} ${e}`, ...t);
	}
	function ot(e, ...t) {
		console.info(`${nt.info} ${e}`, ...t);
	}
	function st(e, ...t) {
		console.error(`${nt.error} ${e}`, ...t);
	}
	function ct(e, ...t) {
		console.log(`${nt.query} ${e}`, ...t);
	}
	function lt({ onlyFirst: e = !1 } = {}) {
		let t = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
		return new RegExp(t, e ? void 0 : "g");
	}
	var ut = lt();
	function dt(e) {
		if (typeof e != "string") throw TypeError(`Expected a \`string\`, got \`${typeof e}\``);
		return e.replace(ut, "");
	}
	var ft = f(v("node:path"));
	function pt(e) {
		return ft.default.sep === ft.default.posix.sep ? e : e.split(ft.default.sep).join(ft.default.posix.sep);
	}
	function mt(e, t) {
		return Object.prototype.hasOwnProperty.call(e, t);
	}
	function ht(e, t) {
		let n = {};
		for (let r of Object.keys(e)) n[r] = t(e[r], r);
		return n;
	}
	function gt(e, t) {
		if (e.length === 0) return;
		let n = e[0];
		for (let r = 1; r < e.length; r++) t(n, e[r]) < 0 && (n = e[r]);
		return n;
	}
	function _t(e, t) {
		Object.defineProperty(e, "name", {
			value: t,
			configurable: !0
		});
	}
	var vt = /* @__PURE__ */ new Set(), yt = (e, t, ...n) => {
		vt.has(e) || (vt.add(e), at(t, ...n));
	};
	function bt(e) {
		return e instanceof Date || Object.prototype.toString.call(e) === "[object Date]";
	}
	function xt(e) {
		return e.toString() !== "Invalid Date";
	}
	var St = y();
	function Ct(e) {
		return St.Decimal.isDecimal(e) ? !0 : typeof e == "object" && !!e && typeof e.s == "number" && typeof e.e == "number" && typeof e.toFixed == "function" && Array.isArray(e.d);
	}
	var V = y(), wt = {};
	u(wt, {
		ModelAction: () => Et,
		datamodelEnumToSchemaEnum: () => Tt
	});
	function Tt(e) {
		return {
			name: e.name,
			values: e.values.map((e) => e.name)
		};
	}
	var Et = ((e) => (e.findUnique = "findUnique", e.findUniqueOrThrow = "findUniqueOrThrow", e.findFirst = "findFirst", e.findFirstOrThrow = "findFirstOrThrow", e.findMany = "findMany", e.create = "create", e.createMany = "createMany", e.createManyAndReturn = "createManyAndReturn", e.update = "update", e.updateMany = "updateMany", e.updateManyAndReturn = "updateManyAndReturn", e.upsert = "upsert", e.delete = "delete", e.deleteMany = "deleteMany", e.groupBy = "groupBy", e.count = "count", e.aggregate = "aggregate", e.findRaw = "findRaw", e.aggregateRaw = "aggregateRaw", e))(Et || {}), Dt = f(_()), Ot = f(v("node:fs")), kt = {
		keyword: De,
		entity: De,
		value: (e) => ye(Te(e)),
		punctuation: Te,
		directive: De,
		function: De,
		variable: (e) => ye(Te(e)),
		string: (e) => ye(L(e)),
		boolean: R,
		number: De,
		comment: B
	}, At = (e) => e, jt = {}, Mt = 0, H = {
		manual: jt.Prism && jt.Prism.manual,
		disableWorkerMessageHandler: jt.Prism && jt.Prism.disableWorkerMessageHandler,
		util: {
			encode: function(e) {
				if (e instanceof Nt) {
					let t = e;
					return new Nt(t.type, H.util.encode(t.content), t.alias);
				} else return Array.isArray(e) ? e.map(H.util.encode) : e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
			},
			type: function(e) {
				return Object.prototype.toString.call(e).slice(8, -1);
			},
			objId: function(e) {
				return e.__id || Object.defineProperty(e, "__id", { value: ++Mt }), e.__id;
			},
			clone: function e(t, n) {
				let r, i, a = H.util.type(t);
				switch (n ||= {}, a) {
					case "Object":
						if (i = H.util.objId(t), n[i]) return n[i];
						r = {}, n[i] = r;
						for (let i in t) t.hasOwnProperty(i) && (r[i] = e(t[i], n));
						return r;
					case "Array": return i = H.util.objId(t), n[i] ? n[i] : (r = [], n[i] = r, t.forEach(function(t, i) {
						r[i] = e(t, n);
					}), r);
					default: return t;
				}
			}
		},
		languages: {
			extend: function(e, t) {
				let n = H.util.clone(H.languages[e]);
				for (let e in t) n[e] = t[e];
				return n;
			},
			insertBefore: function(e, t, n, r) {
				r ||= H.languages;
				let i = r[e], a = {};
				for (let e in i) if (i.hasOwnProperty(e)) {
					if (e == t) for (let e in n) n.hasOwnProperty(e) && (a[e] = n[e]);
					n.hasOwnProperty(e) || (a[e] = i[e]);
				}
				let o = r[e];
				return r[e] = a, H.languages.DFS(H.languages, function(t, n) {
					n === o && t != e && (this[t] = a);
				}), a;
			},
			DFS: function e(t, n, r, i) {
				i ||= {};
				let a = H.util.objId;
				for (let o in t) if (t.hasOwnProperty(o)) {
					n.call(t, o, t[o], r || o);
					let s = t[o], c = H.util.type(s);
					c === "Object" && !i[a(s)] ? (i[a(s)] = !0, e(s, n, null, i)) : c === "Array" && !i[a(s)] && (i[a(s)] = !0, e(s, n, o, i));
				}
			}
		},
		plugins: {},
		highlight: function(e, t, n) {
			let r = {
				code: e,
				grammar: t,
				language: n
			};
			return H.hooks.run("before-tokenize", r), r.tokens = H.tokenize(r.code, r.grammar), H.hooks.run("after-tokenize", r), Nt.stringify(H.util.encode(r.tokens), r.language);
		},
		matchGrammar: function(e, t, n, r, i, a, o) {
			for (let h in n) {
				if (!n.hasOwnProperty(h) || !n[h]) continue;
				if (h == o) return;
				let g = n[h];
				g = H.util.type(g) === "Array" ? g : [g];
				for (let o = 0; o < g.length; ++o) {
					let _ = g[o], v = _.inside, y = !!_.lookbehind, b = !!_.greedy, x = 0, S = _.alias;
					if (b && !_.pattern.global) {
						let e = _.pattern.toString().match(/[imuy]*$/)[0];
						_.pattern = RegExp(_.pattern.source, e + "g");
					}
					_ = _.pattern || _;
					for (let o = r, g = i; o < t.length; g += t[o].length, ++o) {
						let r = t[o];
						if (t.length > e.length) return;
						if (r instanceof Nt) continue;
						if (b && o != t.length - 1) {
							_.lastIndex = g;
							var s = _.exec(e);
							if (!s) break;
							var c = s.index + (y ? s[1].length : 0), l = s.index + s[0].length, u = o, d = g;
							for (let e = t.length; u < e && (d < l || !t[u].type && !t[u - 1].greedy); ++u) d += t[u].length, c >= d && (++o, g = d);
							if (t[o] instanceof Nt) continue;
							f = u - o, r = e.slice(g, d), s.index -= g;
						} else {
							_.lastIndex = 0;
							var s = _.exec(r), f = 1;
						}
						if (!s) {
							if (a) break;
							continue;
						}
						y && (x = s[1] ? s[1].length : 0);
						var c = s.index + x, s = s[0].slice(x), l = c + s.length, p = r.slice(0, c), m = r.slice(l);
						let i = [o, f];
						p && (++o, g += p.length, i.push(p));
						let ee = new Nt(h, v ? H.tokenize(s, v) : s, S, s, b);
						if (i.push(ee), m && i.push(m), Array.prototype.splice.apply(t, i), f != 1 && H.matchGrammar(e, t, n, o, g, !0, h), a) break;
					}
				}
			}
		},
		tokenize: function(e, t) {
			let n = [e], r = t.rest;
			if (r) {
				for (let e in r) t[e] = r[e];
				delete t.rest;
			}
			return H.matchGrammar(e, n, t, 0, 0, !1), n;
		},
		hooks: {
			all: {},
			add: function(e, t) {
				let n = H.hooks.all;
				n[e] = n[e] || [], n[e].push(t);
			},
			run: function(e, t) {
				let n = H.hooks.all[e];
				if (!(!n || !n.length)) for (var r = 0, i; i = n[r++];) i(t);
			}
		},
		Token: Nt
	};
	H.languages.clike = {
		comment: [{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: !0
		}, {
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: !0,
			greedy: !0
		}],
		string: {
			pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
			greedy: !0
		},
		"class-name": {
			pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
			lookbehind: !0,
			inside: { punctuation: /[.\\]/ }
		},
		keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
		boolean: /\b(?:true|false)\b/,
		function: /\w+(?=\()/,
		number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
		operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
		punctuation: /[{}[\];(),.:]/
	}, H.languages.javascript = H.languages.extend("clike", {
		"class-name": [H.languages.clike["class-name"], {
			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
			lookbehind: !0
		}],
		keyword: [{
			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
			lookbehind: !0
		}, {
			pattern: /(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: !0
		}],
		number: /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
		function: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
		operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
	}), H.languages.javascript["class-name"][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/, H.languages.insertBefore("javascript", "keyword", {
		regex: {
			pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=\s*($|[\r\n,.;})\]]))/,
			lookbehind: !0,
			greedy: !0
		},
		"function-variable": {
			pattern: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
			alias: "function"
		},
		parameter: [
			{
				pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
				lookbehind: !0,
				inside: H.languages.javascript
			},
			{
				pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
				inside: H.languages.javascript
			},
			{
				pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
				lookbehind: !0,
				inside: H.languages.javascript
			},
			{
				pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
				lookbehind: !0,
				inside: H.languages.javascript
			}
		],
		constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
	}), H.languages.markup && H.languages.markup.tag.addInlined("script", "javascript"), H.languages.js = H.languages.javascript, H.languages.typescript = H.languages.extend("javascript", {
		keyword: /\b(?:abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield)\b/,
		builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/
	}), H.languages.ts = H.languages.typescript;
	function Nt(e, t, n, r, i) {
		this.type = e, this.content = t, this.alias = n, this.length = (r || "").length | 0, this.greedy = !!i;
	}
	Nt.stringify = function(e, t) {
		return typeof e == "string" ? e : Array.isArray(e) ? e.map(function(e) {
			return Nt.stringify(e, t);
		}).join("") : Pt(e.type)(e.content);
	};
	function Pt(e) {
		return kt[e] || At;
	}
	function Ft(e) {
		return It(e, H.languages.javascript);
	}
	function It(e, t) {
		return H.tokenize(e, t).map((e) => Nt.stringify(e)).join("");
	}
	function Lt(e) {
		return Ze(e);
	}
	var Rt = class e {
		firstLineNumber;
		lines;
		static read(t) {
			let n;
			try {
				n = Ot.default.readFileSync(t, "utf-8");
			} catch {
				return null;
			}
			return e.fromContent(n);
		}
		static fromContent(t) {
			return new e(1, t.split(/\r?\n/));
		}
		constructor(e, t) {
			this.firstLineNumber = e, this.lines = t;
		}
		get lastLineNumber() {
			return this.firstLineNumber + this.lines.length - 1;
		}
		mapLineAt(t, n) {
			if (t < this.firstLineNumber || t > this.lines.length + this.firstLineNumber) return this;
			let r = t - this.firstLineNumber, i = [...this.lines];
			return i[r] = n(i[r]), new e(this.firstLineNumber, i);
		}
		mapLines(t) {
			return new e(this.firstLineNumber, this.lines.map((e, n) => t(e, this.firstLineNumber + n)));
		}
		lineAt(e) {
			return this.lines[e - this.firstLineNumber];
		}
		prependSymbolAt(e, t) {
			return this.mapLines((n, r) => r === e ? `${t} ${n}` : `  ${n}`);
		}
		slice(t, n) {
			return new e(t, Lt(this.lines.slice(t - 1, n).join("\n")).split("\n"));
		}
		highlight() {
			let t = Ft(this.toString());
			return new e(this.firstLineNumber, t.split("\n"));
		}
		toString() {
			return this.lines.join("\n");
		}
	}, zt = {
		red: I,
		gray: B,
		dim: be,
		bold: ye,
		underline: xe,
		highlightSource: (e) => e.highlight()
	}, Bt = {
		red: (e) => e,
		gray: (e) => e,
		dim: (e) => e,
		bold: (e) => e,
		underline: (e) => e,
		highlightSource: (e) => e
	};
	function U({ message: e, originalMethod: t, isPanic: n, callArguments: r }) {
		return {
			functionName: `prisma.${t}()`,
			message: e,
			isPanic: n ?? !1,
			callArguments: r
		};
	}
	function Vt({ callsite: e, message: t, originalMethod: n, isPanic: r, callArguments: i }, a) {
		let o = U({
			message: t,
			originalMethod: n,
			isPanic: r,
			callArguments: i
		});
		if (!e || typeof window < "u" || process.env.NODE_ENV === "production") return o;
		let s = e.getLocation();
		if (!s || !s.lineNumber || !s.columnNumber) return o;
		let c = Math.max(1, s.lineNumber - 3), l = Rt.read(s.fileName)?.slice(c, s.lineNumber), u = l?.lineAt(s.lineNumber);
		if (l && u) {
			let e = Ht(u), t = W(u);
			if (!t) return o;
			o.functionName = `${t.code})`, o.location = s, r || (l = l.mapLineAt(s.lineNumber, (e) => e.slice(0, t.openingBraceIndex))), l = a.highlightSource(l);
			let n = String(l.lastLineNumber).length;
			if (o.contextLines = l.mapLines((e, t) => a.gray(String(t).padStart(n)) + " " + e).mapLines((e) => a.dim(e)).prependSymbolAt(s.lineNumber, a.bold(a.red("→"))), i) {
				let t = e + n + 1;
				t += 2, o.callArguments = (0, Dt.default)(i, t).slice(t);
			}
		}
		return o;
	}
	function W(e) {
		let t = Object.keys(Et).join("|"), n = new RegExp(String.raw`\.(${t})\(`).exec(e);
		if (n) {
			let t = n.index + n[0].length, r = e.lastIndexOf(" ", n.index) + 1;
			return {
				code: e.slice(r, t),
				openingBraceIndex: t
			};
		}
		return null;
	}
	function Ht(e) {
		let t = 0;
		for (let n = 0; n < e.length; n++) {
			if (e.charAt(n) !== " ") return t;
			t++;
		}
		return t;
	}
	function Ut({ functionName: e, location: t, message: n, isPanic: r, contextLines: i, callArguments: a }, o) {
		let s = [""], c = t ? " in" : ":";
		if (r ? (s.push(o.red(`Oops, an unknown error occurred! This is ${o.bold("on us")}, you did nothing wrong.`)), s.push(o.red(`It occurred in the ${o.bold(`\`${e}\``)} invocation${c}`))) : s.push(o.red(`Invalid ${o.bold(`\`${e}\``)} invocation${c}`)), t && s.push(o.underline(Wt(t))), i) {
			s.push("");
			let e = [i.toString()];
			a && (e.push(a), e.push(o.dim(")"))), s.push(e.join("")), a && s.push("");
		} else s.push(""), a && s.push(a), s.push("");
		return s.push(n), s.join("\n");
	}
	function Wt(e) {
		let t = [e.fileName];
		return e.lineNumber && t.push(String(e.lineNumber)), e.columnNumber && t.push(String(e.columnNumber)), t.join(":");
	}
	function Gt(e) {
		let t = e.showColors ? zt : Bt, n;
		return n = Vt(e, t), Ut(n, t);
	}
	var Kt = f(x());
	function qt(e, t, n) {
		let r = Zt(Yt(Jt(e)));
		r ? mn(r, t, n) : t.addErrorMessage(() => "Unknown error");
	}
	function Jt(e) {
		return e.errors.flatMap((e) => e.kind === "Union" ? Jt(e) : [e]);
	}
	function Yt(e) {
		let t = /* @__PURE__ */ new Map(), n = [];
		for (let r of e) {
			if (r.kind !== "InvalidArgumentType") {
				n.push(r);
				continue;
			}
			let e = `${r.selectionPath.join(".")}:${r.argumentPath.join(".")}`, i = t.get(e);
			i ? t.set(e, {
				...r,
				argument: {
					...r.argument,
					typeNames: Xt(i.argument.typeNames, r.argument.typeNames)
				}
			}) : t.set(e, r);
		}
		return n.push(...t.values()), n;
	}
	function Xt(e, t) {
		return [...new Set(e.concat(t))];
	}
	function Zt(e) {
		return gt(e, (e, t) => {
			let n = Qt(e), r = Qt(t);
			return n === r ? $t(e) - $t(t) : n - r;
		});
	}
	function Qt(e) {
		let t = 0;
		return Array.isArray(e.selectionPath) && (t += e.selectionPath.length), Array.isArray(e.argumentPath) && (t += e.argumentPath.length), t;
	}
	function $t(e) {
		switch (e.kind) {
			case "InvalidArgumentValue":
			case "ValueTooLarge": return 20;
			case "InvalidArgumentType": return 10;
			case "RequiredArgumentMissing": return -10;
			default: return 0;
		}
	}
	var en = class {
		constructor(e, t) {
			this.name = e, this.value = t;
		}
		isRequired = !1;
		makeRequired() {
			return this.isRequired = !0, this;
		}
		write(e) {
			let { colors: { green: t } } = e.context;
			e.addMarginSymbol(t(this.isRequired ? "+" : "?")), e.write(t(this.name)), this.isRequired || e.write(t("?")), e.write(t(": ")), typeof this.value == "string" ? e.write(t(this.value)) : e.write(this.value);
		}
	};
	ee();
	var tn = class {
		constructor(e = 0, t) {
			this.context = t, this.currentIndent = e;
		}
		lines = [];
		currentLine = "";
		currentIndent = 0;
		marginSymbol;
		afterNextNewLineCallback;
		write(e) {
			return typeof e == "string" ? this.currentLine += e : e.write(this), this;
		}
		writeJoined(e, t, n = (e, t) => t.write(e)) {
			let r = t.length - 1;
			for (let i = 0; i < t.length; i++) n(t[i], this), i !== r && this.write(e);
			return this;
		}
		writeLine(e) {
			return this.write(e).newLine();
		}
		newLine() {
			this.lines.push(this.indentedCurrentLine()), this.currentLine = "", this.marginSymbol = void 0;
			let e = this.afterNextNewLineCallback;
			return this.afterNextNewLineCallback = void 0, e?.(), this;
		}
		withIndent(e) {
			return this.indent(), e(this), this.unindent(), this;
		}
		afterNextNewline(e) {
			return this.afterNextNewLineCallback = e, this;
		}
		indent() {
			return this.currentIndent++, this;
		}
		unindent() {
			return this.currentIndent > 0 && this.currentIndent--, this;
		}
		addMarginSymbol(e) {
			return this.marginSymbol = e, this;
		}
		toString() {
			return this.lines.concat(this.indentedCurrentLine()).join("\n");
		}
		getCurrentLineLength() {
			return this.currentLine.length;
		}
		indentedCurrentLine() {
			let e = this.currentLine.padStart(this.currentLine.length + 2 * this.currentIndent);
			return this.marginSymbol ? this.marginSymbol + e.slice(1) : e;
		}
	};
	S();
	var nn = class {
		constructor(e) {
			this.value = e;
		}
		write(e) {
			e.write(this.value);
		}
		markAsError() {
			this.value.markAsError();
		}
	}, rn = (e) => e, an = {
		bold: rn,
		red: rn,
		green: rn,
		dim: rn,
		enabled: !1
	}, on = {
		bold: ye,
		red: I,
		green: L,
		dim: be,
		enabled: !0
	}, sn = { write(e) {
		e.writeLine(",");
	} }, cn = class {
		constructor(e) {
			this.contents = e;
		}
		isUnderlined = !1;
		color = (e) => e;
		underline() {
			return this.isUnderlined = !0, this;
		}
		setColor(e) {
			return this.color = e, this;
		}
		write(e) {
			let t = e.getCurrentLineLength();
			e.write(this.color(this.contents)), this.isUnderlined && e.afterNextNewline(() => {
				e.write(" ".repeat(t)).writeLine(this.color("~".repeat(this.contents.length)));
			});
		}
	}, ln = class {
		hasError = !1;
		markAsError() {
			return this.hasError = !0, this;
		}
	}, un = class extends ln {
		items = [];
		addItem(e) {
			return this.items.push(new nn(e)), this;
		}
		getField(e) {
			return this.items[e];
		}
		getPrintWidth() {
			return this.items.length === 0 ? 2 : Math.max(...this.items.map((e) => e.value.getPrintWidth())) + 2;
		}
		write(e) {
			if (this.items.length === 0) {
				this.writeEmpty(e);
				return;
			}
			this.writeWithItems(e);
		}
		writeEmpty(e) {
			let t = new cn("[]");
			this.hasError && t.setColor(e.context.colors.red).underline(), e.write(t);
		}
		writeWithItems(e) {
			let { colors: t } = e.context;
			e.writeLine("[").withIndent(() => e.writeJoined(sn, this.items).newLine()).write("]"), this.hasError && e.afterNextNewline(() => {
				e.writeLine(t.red("~".repeat(this.getPrintWidth())));
			});
		}
		asObject() {}
	}, dn = class e extends ln {
		fields = {};
		suggestions = [];
		addField(e) {
			this.fields[e.name] = e;
		}
		addSuggestion(e) {
			this.suggestions.push(e);
		}
		getField(e) {
			return this.fields[e];
		}
		getDeepField(t) {
			let [n, ...r] = t, i = this.getField(n);
			if (!i) return;
			let a = i;
			for (let t of r) {
				let n;
				if (a.value instanceof e ? n = a.value.getField(t) : a.value instanceof un && (n = a.value.getField(Number(t))), !n) return;
				a = n;
			}
			return a;
		}
		getDeepFieldValue(e) {
			return e.length === 0 ? this : this.getDeepField(e)?.value;
		}
		hasField(e) {
			return !!this.getField(e);
		}
		removeAllFields() {
			this.fields = {};
		}
		removeField(e) {
			delete this.fields[e];
		}
		getFields() {
			return this.fields;
		}
		isEmpty() {
			return Object.keys(this.fields).length === 0;
		}
		getFieldValue(e) {
			return this.getField(e)?.value;
		}
		getDeepSubSelectionValue(t) {
			let n = this;
			for (let r of t) {
				if (!(n instanceof e)) return;
				let t = n.getSubSelectionValue(r);
				if (!t) return;
				n = t;
			}
			return n;
		}
		getDeepSelectionParent(t) {
			let n = this.getSelectionParent();
			if (!n) return;
			let r = n;
			for (let n of t) {
				let t = r.value.getFieldValue(n);
				if (!t || !(t instanceof e)) return;
				let i = t.getSelectionParent();
				if (!i) return;
				r = i;
			}
			return r;
		}
		getSelectionParent() {
			let e = this.getField("select")?.value.asObject();
			if (e) return {
				kind: "select",
				value: e
			};
			let t = this.getField("include")?.value.asObject();
			if (t) return {
				kind: "include",
				value: t
			};
		}
		getSubSelectionValue(e) {
			return this.getSelectionParent()?.value.fields[e].value;
		}
		getPrintWidth() {
			let e = Object.values(this.fields);
			return e.length == 0 ? 2 : Math.max(...e.map((e) => e.getPrintWidth())) + 2;
		}
		write(e) {
			let t = Object.values(this.fields);
			if (t.length === 0 && this.suggestions.length === 0) {
				this.writeEmpty(e);
				return;
			}
			this.writeWithContents(e, t);
		}
		asObject() {
			return this;
		}
		writeEmpty(e) {
			let t = new cn("{}");
			this.hasError && t.setColor(e.context.colors.red).underline(), e.write(t);
		}
		writeWithContents(e, t) {
			e.writeLine("{").withIndent(() => {
				e.writeJoined(sn, [...t, ...this.suggestions]).newLine();
			}), e.write("}"), this.hasError && e.afterNextNewline(() => {
				e.writeLine(e.context.colors.red("~".repeat(this.getPrintWidth())));
			});
		}
	}, fn = class extends ln {
		constructor(e) {
			super(), this.text = e;
		}
		getPrintWidth() {
			return this.text.length;
		}
		write(e) {
			let t = new cn(this.text);
			this.hasError && t.underline().setColor(e.context.colors.red), e.write(t);
		}
		asObject() {}
	}, pn = class {
		fields = [];
		addField(e, t) {
			return this.fields.push({ write(n) {
				let { green: r, dim: i } = n.context.colors;
				n.write(r(i(`${e}: ${t}`))).addMarginSymbol(r(i("+")));
			} }), this;
		}
		write(e) {
			let { colors: { green: t } } = e.context;
			e.writeLine(t("{")).withIndent(() => {
				e.writeJoined(sn, this.fields).newLine();
			}).write(t("}")).addMarginSymbol(t("+"));
		}
	};
	function mn(e, t, n) {
		switch (e.kind) {
			case "MutuallyExclusiveFields":
				hn(e, t);
				break;
			case "IncludeOnScalar":
				gn(e, t);
				break;
			case "EmptySelection":
				_n(e, t, n);
				break;
			case "UnknownSelectionField":
				xn(e, t);
				break;
			case "InvalidSelectionValue":
				Sn(e, t);
				break;
			case "UnknownArgument":
				Cn(e, t);
				break;
			case "UnknownInputField":
				wn(e, t);
				break;
			case "RequiredArgumentMissing":
				En(e, t);
				break;
			case "InvalidArgumentType":
				On(e, t);
				break;
			case "InvalidArgumentValue":
				kn(e, t);
				break;
			case "ValueTooLarge":
				An(e, t);
				break;
			case "SomeFieldsMissing":
				jn(e, t);
				break;
			case "TooManyFieldsGiven":
				Mn(e, t);
				break;
			case "Union":
				qt(e, t, n);
				break;
			default: throw Error("not implemented: " + e.kind);
		}
	}
	function hn(e, t) {
		let n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		n && (n.getField(e.firstField)?.markAsError(), n.getField(e.secondField)?.markAsError()), t.addErrorMessage((t) => `Please ${t.bold("either")} use ${t.green(`\`${e.firstField}\``)} or ${t.green(`\`${e.secondField}\``)}, but ${t.red("not both")} at the same time.`);
	}
	function gn(e, t) {
		let [n, r] = zn(e.selectionPath), i = e.outputType, a = t.arguments.getDeepSelectionParent(n)?.value;
		if (a && (a.getField(r)?.markAsError(), i)) for (let e of i.fields) e.isRelation && a.addSuggestion(new en(e.name, "true"));
		t.addErrorMessage((e) => {
			let t = `Invalid scalar field ${e.red(`\`${r}\``)} for ${e.bold("include")} statement`;
			return i ? t += ` on model ${e.bold(i.name)}. ${Bn(e)}` : t += ".", t += `
Note that ${e.bold("include")} statements only accept relation fields.`, t;
		});
	}
	function _n(e, t, n) {
		let r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		if (r) {
			let n = r.getField("omit")?.value.asObject();
			if (n) {
				vn(e, t, n);
				return;
			}
			if (r.hasField("select")) {
				yn(e, t);
				return;
			}
		}
		if (n?.[le(e.outputType.name)]) {
			bn(e, t);
			return;
		}
		t.addErrorMessage(() => `Unknown field at "${e.selectionPath.join(".")} selection"`);
	}
	function vn(e, t, n) {
		n.removeAllFields();
		for (let t of e.outputType.fields) n.addSuggestion(new en(t.name, "false"));
		t.addErrorMessage((t) => `The ${t.red("omit")} statement includes every field of the model ${t.bold(e.outputType.name)}. At least one field must be included in the result`);
	}
	function yn(e, t) {
		let n = e.outputType, r = t.arguments.getDeepSelectionParent(e.selectionPath)?.value, i = r?.isEmpty() ?? !1;
		r && (r.removeAllFields(), Nn(r, n)), t.addErrorMessage((e) => i ? `The ${e.red("`select`")} statement for type ${e.bold(n.name)} must not be empty. ${Bn(e)}` : `The ${e.red("`select`")} statement for type ${e.bold(n.name)} needs ${e.bold("at least one truthy value")}.`);
	}
	function bn(e, t) {
		let n = new pn();
		for (let t of e.outputType.fields) t.isRelation || n.addField(t.name, "false");
		let r = new en("omit", n).makeRequired();
		if (e.selectionPath.length === 0) t.arguments.addSuggestion(r);
		else {
			let [n, i] = zn(e.selectionPath), a = t.arguments.getDeepSelectionParent(n)?.value.asObject()?.getField(i);
			if (a) {
				let e = a?.value.asObject() ?? new dn();
				e.addSuggestion(r), a.value = e;
			}
		}
		t.addErrorMessage((t) => `The global ${t.red("omit")} configuration excludes every field of the model ${t.bold(e.outputType.name)}. At least one field must be included in the result`);
	}
	function xn(e, t) {
		let n = Ln(e.selectionPath, t);
		if (n.parentKind !== "unknown") {
			n.field.markAsError();
			let t = n.parent;
			switch (n.parentKind) {
				case "select":
					Nn(t, e.outputType);
					break;
				case "include":
					Pn(t, e.outputType);
					break;
				case "omit":
					Fn(t, e.outputType);
					break;
			}
		}
		t.addErrorMessage((t) => {
			let r = [`Unknown field ${t.red(`\`${n.fieldName}\``)}`];
			return n.parentKind !== "unknown" && r.push(`for ${t.bold(n.parentKind)} statement`), r.push(`on model ${t.bold(`\`${e.outputType.name}\``)}.`), r.push(Bn(t)), r.join(" ");
		});
	}
	function Sn(e, t) {
		let n = Ln(e.selectionPath, t);
		n.parentKind !== "unknown" && n.field.value.markAsError(), t.addErrorMessage((t) => `Invalid value for selection field \`${t.red(n.fieldName)}\`: ${e.underlyingError}`);
	}
	function Cn(e, t) {
		let n = e.argumentPath[0], r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		r && (r.getField(n)?.markAsError(), In(r, e.arguments)), t.addErrorMessage((t) => Tn(t, n, e.arguments.map((e) => e.name)));
	}
	function wn(e, t) {
		let [n, r] = zn(e.argumentPath), i = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		if (i) {
			i.getDeepField(e.argumentPath)?.markAsError();
			let t = i.getDeepFieldValue(n)?.asObject();
			t && Rn(t, e.inputType);
		}
		t.addErrorMessage((t) => Tn(t, r, e.inputType.fields.map((e) => e.name)));
	}
	function Tn(e, t, n) {
		let r = [`Unknown argument \`${e.red(t)}\`.`], i = Un(t, n);
		return i && r.push(`Did you mean \`${e.green(i)}\`?`), n.length > 0 && r.push(Bn(e)), r.join(" ");
	}
	function En(e, t) {
		let n;
		t.addErrorMessage((e) => n?.value instanceof fn && n.value.text === "null" ? `Argument \`${e.green(a)}\` must not be ${e.red("null")}.` : `Argument \`${e.green(a)}\` is missing.`);
		let r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		if (!r) return;
		let [i, a] = zn(e.argumentPath), o = new pn(), s = r.getDeepFieldValue(i)?.asObject();
		if (s) {
			if (n = s.getField(a), n && s.removeField(a), e.inputTypes.length === 1 && e.inputTypes[0].kind === "object") {
				for (let t of e.inputTypes[0].fields) o.addField(t.name, t.typeNames.join(" | "));
				s.addSuggestion(new en(a, o).makeRequired());
			} else {
				let t = e.inputTypes.map(Dn).join(" | ");
				s.addSuggestion(new en(a, t).makeRequired());
			}
			if (e.dependentArgumentPath) {
				r.getDeepField(e.dependentArgumentPath)?.markAsError();
				let [, n] = zn(e.dependentArgumentPath);
				t.addErrorMessage((e) => `Argument \`${e.green(a)}\` is required because argument \`${e.green(n)}\` was provided.`);
			}
		}
	}
	function Dn(e) {
		return e.kind === "list" ? `${Dn(e.elementType)}[]` : e.name;
	}
	function On(e, t) {
		let n = e.argument.name, r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		r && r.getDeepFieldValue(e.argumentPath)?.markAsError(), t.addErrorMessage((t) => {
			let r = Vn("or", e.argument.typeNames.map((e) => t.green(e)));
			return `Argument \`${t.bold(n)}\`: Invalid value provided. Expected ${r}, provided ${t.red(e.inferredType)}.`;
		});
	}
	function kn(e, t) {
		let n = e.argument.name, r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		r && r.getDeepFieldValue(e.argumentPath)?.markAsError(), t.addErrorMessage((t) => {
			let r = [`Invalid value for argument \`${t.bold(n)}\``];
			if (e.underlyingError && r.push(`: ${e.underlyingError}`), r.push("."), e.argument.typeNames.length > 0) {
				let n = Vn("or", e.argument.typeNames.map((e) => t.green(e)));
				r.push(` Expected ${n}.`);
			}
			return r.join("");
		});
	}
	function An(e, t) {
		let n = e.argument.name, r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(), i;
		if (r) {
			let t = r.getDeepField(e.argumentPath)?.value;
			t?.markAsError(), t instanceof fn && (i = t.text);
		}
		t.addErrorMessage((e) => {
			let t = ["Unable to fit value"];
			return i && t.push(e.red(i)), t.push(`into a 64-bit signed integer for field \`${e.bold(n)}\``), t.join(" ");
		});
	}
	function jn(e, t) {
		let n = e.argumentPath[e.argumentPath.length - 1], r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
		if (r) {
			let t = r.getDeepFieldValue(e.argumentPath)?.asObject();
			t && Rn(t, e.inputType);
		}
		t.addErrorMessage((t) => {
			let r = [`Argument \`${t.bold(n)}\` of type ${t.bold(e.inputType.name)} needs`];
			return e.constraints.minFieldCount === 1 ? e.constraints.requiredFields ? r.push(`${t.green("at least one of")} ${Vn("or", e.constraints.requiredFields.map((e) => `\`${t.bold(e)}\``))} arguments.`) : r.push(`${t.green("at least one")} argument.`) : r.push(`${t.green(`at least ${e.constraints.minFieldCount}`)} arguments.`), r.push(Bn(t)), r.join(" ");
		});
	}
	function Mn(e, t) {
		let n = e.argumentPath[e.argumentPath.length - 1], r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(), i = [];
		if (r) {
			let t = r.getDeepFieldValue(e.argumentPath)?.asObject();
			t && (t.markAsError(), i = Object.keys(t.getFields()));
		}
		t.addErrorMessage((t) => {
			let r = [`Argument \`${t.bold(n)}\` of type ${t.bold(e.inputType.name)} needs`];
			return e.constraints.minFieldCount === 1 && e.constraints.maxFieldCount == 1 ? r.push(`${t.green("exactly one")} argument,`) : e.constraints.maxFieldCount == 1 ? r.push(`${t.green("at most one")} argument,`) : r.push(`${t.green(`at most ${e.constraints.maxFieldCount}`)} arguments,`), r.push(`but you provided ${Vn("and", i.map((e) => t.red(e)))}. Please choose`), e.constraints.maxFieldCount === 1 ? r.push("one.") : r.push(`${e.constraints.maxFieldCount}.`), r.join(" ");
		});
	}
	function Nn(e, t) {
		for (let n of t.fields) e.hasField(n.name) || e.addSuggestion(new en(n.name, "true"));
	}
	function Pn(e, t) {
		for (let n of t.fields) n.isRelation && !e.hasField(n.name) && e.addSuggestion(new en(n.name, "true"));
	}
	function Fn(e, t) {
		for (let n of t.fields) !e.hasField(n.name) && !n.isRelation && e.addSuggestion(new en(n.name, "true"));
	}
	function In(e, t) {
		for (let n of t) e.hasField(n.name) || e.addSuggestion(new en(n.name, n.typeNames.join(" | ")));
	}
	function Ln(e, t) {
		let [n, r] = zn(e), i = t.arguments.getDeepSubSelectionValue(n)?.asObject();
		if (!i) return {
			parentKind: "unknown",
			fieldName: r
		};
		let a = i.getFieldValue("select")?.asObject(), o = i.getFieldValue("include")?.asObject(), s = i.getFieldValue("omit")?.asObject(), c = a?.getField(r);
		return a && c ? {
			parentKind: "select",
			parent: a,
			field: c,
			fieldName: r
		} : (c = o?.getField(r), o && c ? {
			parentKind: "include",
			field: c,
			parent: o,
			fieldName: r
		} : (c = s?.getField(r), s && c ? {
			parentKind: "omit",
			field: c,
			parent: s,
			fieldName: r
		} : {
			parentKind: "unknown",
			fieldName: r
		}));
	}
	function Rn(e, t) {
		if (t.kind === "object") for (let n of t.fields) e.hasField(n.name) || e.addSuggestion(new en(n.name, n.typeNames.join(" | ")));
	}
	function zn(e) {
		let t = [...e], n = t.pop();
		if (!n) throw Error("unexpected empty path");
		return [t, n];
	}
	function Bn({ green: e, enabled: t }) {
		return "Available options are " + (t ? `listed in ${e("green")}` : "marked with ?") + ".";
	}
	function Vn(e, t) {
		if (t.length === 1) return t[0];
		let n = [...t], r = n.pop();
		return `${n.join(", ")} ${e} ${r}`;
	}
	var Hn = 3;
	function Un(e, t) {
		let n = Infinity, r;
		for (let i of t) {
			let t = (0, Kt.default)(e, i);
			t > Hn || t < n && (n = t, r = i);
		}
		return r;
	}
	var Wn = y(), Gn = class {
		modelName;
		name;
		typeName;
		isList;
		isEnum;
		constructor(e, t, n, r, i) {
			this.modelName = e, this.name = t, this.typeName = n, this.isList = r, this.isEnum = i;
		}
		_toGraphQLInputType() {
			return `${this.isList ? "List" : ""}${this.isEnum ? "Enum" : ""}${this.typeName}FieldRefInput<${this.modelName}>`;
		}
	};
	function Kn(e) {
		return e instanceof Gn;
	}
	var qn = ": ", Jn = class {
		constructor(e, t) {
			this.name = e, this.value = t;
		}
		hasError = !1;
		markAsError() {
			this.hasError = !0;
		}
		getPrintWidth() {
			return this.name.length + this.value.getPrintWidth() + qn.length;
		}
		write(e) {
			let t = new cn(this.name);
			this.hasError && t.underline().setColor(e.context.colors.red), e.write(t).write(qn).write(this.value);
		}
	}, Yn = class {
		arguments;
		errorMessages = [];
		constructor(e) {
			this.arguments = e;
		}
		write(e) {
			e.write(this.arguments);
		}
		addErrorMessage(e) {
			this.errorMessages.push(e);
		}
		renderAllMessages(e) {
			return this.errorMessages.map((t) => t(e)).join("\n");
		}
	};
	function Xn(e) {
		return new Yn(Zn(e));
	}
	function Zn(e) {
		let t = new dn();
		for (let [n, r] of Object.entries(e)) {
			let e = new Jn(n, Qn(r));
			t.addField(e);
		}
		return t;
	}
	function Qn(e) {
		return typeof e == "string" ? new fn(JSON.stringify(e)) : typeof e == "number" || typeof e == "boolean" ? new fn(String(e)) : typeof e == "bigint" ? new fn(`${e}n`) : e === null ? new fn("null") : e === void 0 ? new fn("undefined") : Ct(e) ? new fn(`new Prisma.Decimal("${e.toFixed()}")`) : e instanceof Uint8Array ? Buffer.isBuffer(e) ? new fn(`Buffer.alloc(${e.byteLength})`) : new fn(`new Uint8Array(${e.byteLength})`) : e instanceof Date ? new fn(`new Date("${xt(e) ? e.toISOString() : "Invalid Date"}")`) : (0, Wn.isObjectEnumValue)(e) ? new fn(`Prisma.${e._getName()}`) : Kn(e) ? new fn(`prisma.${le(e.modelName)}.$fields.${e.name}`) : Array.isArray(e) ? $n(e) : typeof e == "object" ? Zn(e) : new fn(Object.prototype.toString.call(e));
	}
	function $n(e) {
		let t = new un();
		for (let n of e) t.addItem(Qn(n));
		return t;
	}
	function er(e, t) {
		let n = t === "pretty" ? on : an;
		return {
			message: e.renderAllMessages(n),
			args: new tn(0, { colors: n }).write(e).toString()
		};
	}
	function tr({ args: e, errors: t, errorFormat: n, callsite: r, originalMethod: i, clientVersion: a, globalOmit: o }) {
		let s = Xn(e);
		for (let e of t) mn(e, s, o);
		let { message: c, args: l } = er(s, n), u = Gt({
			message: c,
			callsite: r,
			originalMethod: i,
			showColors: n === "pretty",
			callArguments: l
		});
		throw new V.PrismaClientValidationError(u, { clientVersion: a });
	}
	function nr(e) {
		return e.replace(/^./, (e) => e.toLowerCase());
	}
	function rr(e, t, n) {
		let r = nr(n);
		return !t.result || !(t.result.$allModels || t.result[r]) ? e : ir({
			...e,
			...ar(t.name, e, t.result.$allModels),
			...ar(t.name, e, t.result[r])
		});
	}
	function ir(e) {
		let t = new O(), n = (r, i) => t.getOrCreate(r, () => i.has(r) ? [r] : (i.add(r), e[r] ? e[r].needs.flatMap((e) => n(e, i)) : [r]));
		return ht(e, (e) => ({
			...e,
			needs: n(e.name, /* @__PURE__ */ new Set())
		}));
	}
	function ar(e, t, n) {
		return n ? ht(n, ({ needs: e, compute: n }, r) => ({
			name: r,
			needs: e ? Object.keys(e).filter((t) => e[t]) : [],
			compute: or(t, r, n)
		})) : {};
	}
	function or(e, t, n) {
		let r = e?.[t]?.compute;
		return r ? (e) => n({
			...e,
			[t]: r(e)
		}) : n;
	}
	function sr(e, t) {
		if (!t) return e;
		let n = { ...e };
		for (let r of Object.values(t)) if (e[r.name]) for (let e of r.needs) n[e] = !0;
		return n;
	}
	function cr(e, t) {
		if (!t) return e;
		let n = { ...e };
		for (let r of Object.values(t)) if (!e[r.name]) for (let e of r.needs) delete n[e];
		return n;
	}
	var lr = class {
		constructor(e, t) {
			this.extension = e, this.previous = t;
		}
		computedFieldsCache = new O();
		modelExtensionsCache = new O();
		queryCallbacksCache = new O();
		clientExtensions = de(() => this.extension.client ? {
			...this.previous?.getAllClientExtensions(),
			...this.extension.client
		} : this.previous?.getAllClientExtensions());
		batchCallbacks = de(() => {
			let e = this.previous?.getAllBatchQueryCallbacks() ?? [], t = this.extension.query?.$__internalBatch;
			return t ? e.concat(t) : e;
		});
		getAllComputedFields(e) {
			return this.computedFieldsCache.getOrCreate(e, () => rr(this.previous?.getAllComputedFields(e), this.extension, e));
		}
		getAllClientExtensions() {
			return this.clientExtensions.get();
		}
		getAllModelExtensions(e) {
			return this.modelExtensionsCache.getOrCreate(e, () => {
				let t = nr(e);
				return !this.extension.model || !(this.extension.model[t] || this.extension.model.$allModels) ? this.previous?.getAllModelExtensions(e) : {
					...this.previous?.getAllModelExtensions(e),
					...this.extension.model.$allModels,
					...this.extension.model[t]
				};
			});
		}
		getAllQueryCallbacks(e, t) {
			return this.queryCallbacksCache.getOrCreate(`${e}:${t}`, () => {
				let n = this.previous?.getAllQueryCallbacks(e, t) ?? [], r = [], i = this.extension.query;
				return !i || !(i[e] || i.$allModels || i[t] || i.$allOperations) ? n : (i[e] !== void 0 && (i[e][t] !== void 0 && r.push(i[e][t]), i[e].$allOperations !== void 0 && r.push(i[e].$allOperations)), e !== "$none" && i.$allModels !== void 0 && (i.$allModels[t] !== void 0 && r.push(i.$allModels[t]), i.$allModels.$allOperations !== void 0 && r.push(i.$allModels.$allOperations)), i[t] !== void 0 && r.push(i[t]), i.$allOperations !== void 0 && r.push(i.$allOperations), n.concat(r));
			});
		}
		getAllBatchQueryCallbacks() {
			return this.batchCallbacks.get();
		}
	}, ur = class e {
		constructor(e) {
			this.head = e;
		}
		static empty() {
			return new e();
		}
		static single(t) {
			return new e(new lr(t));
		}
		isEmpty() {
			return this.head === void 0;
		}
		append(t) {
			return new e(new lr(t, this.head));
		}
		getAllComputedFields(e) {
			return this.head?.getAllComputedFields(e);
		}
		getAllClientExtensions() {
			return this.head?.getAllClientExtensions();
		}
		getAllModelExtensions(e) {
			return this.head?.getAllModelExtensions(e);
		}
		getAllQueryCallbacks(e, t) {
			return this.head?.getAllQueryCallbacks(e, t) ?? [];
		}
		getAllBatchQueryCallbacks() {
			return this.head?.getAllBatchQueryCallbacks() ?? [];
		}
	}, dr = class {
		constructor(e) {
			this.name = e;
		}
	};
	function fr(e) {
		return e instanceof dr;
	}
	function pr(e) {
		return new dr(e);
	}
	var mr = Symbol(), hr = class {
		constructor(e) {
			if (e !== mr) throw Error("Skip instance can not be constructed directly");
		}
		ifUndefined(e) {
			return e === void 0 ? gr : e;
		}
	}, gr = new hr(mr);
	function _r(e) {
		return e instanceof hr;
	}
	var vr = {
		findUnique: "findUnique",
		findUniqueOrThrow: "findUniqueOrThrow",
		findFirst: "findFirst",
		findFirstOrThrow: "findFirstOrThrow",
		findMany: "findMany",
		count: "aggregate",
		create: "createOne",
		createMany: "createMany",
		createManyAndReturn: "createManyAndReturn",
		update: "updateOne",
		updateMany: "updateMany",
		updateManyAndReturn: "updateManyAndReturn",
		upsert: "upsertOne",
		delete: "deleteOne",
		deleteMany: "deleteMany",
		executeRaw: "executeRaw",
		queryRaw: "queryRaw",
		aggregate: "aggregate",
		groupBy: "groupBy",
		runCommandRaw: "runCommandRaw",
		findRaw: "findRaw",
		aggregateRaw: "aggregateRaw"
	}, yr = "explicitly `undefined` values are not allowed";
	function br({ modelName: e, action: t, args: n, runtimeDataModel: r, extensions: i = ur.empty(), callsite: a, clientMethod: o, errorFormat: s, clientVersion: c, previewFeatures: l, globalOmit: u, wrapRawValues: d }) {
		let f = new Nr({
			runtimeDataModel: r,
			modelName: e,
			action: t,
			rootArgs: n,
			callsite: a,
			extensions: i,
			selectionPath: [],
			argumentPath: [],
			originalMethod: o,
			errorFormat: s,
			clientVersion: c,
			previewFeatures: l,
			globalOmit: u,
			wrapRawValues: d
		});
		return {
			modelName: e,
			action: vr[t],
			query: xr(n, f)
		};
	}
	function xr({ select: e, include: t, ...n } = {}, r) {
		let i = n.omit;
		return delete n.omit, {
			arguments: Or(n, r),
			selection: Sr(e, t, i, r)
		};
	}
	function Sr(e, t, n, r) {
		return e ? (t ? r.throwValidationError({
			kind: "MutuallyExclusiveFields",
			firstField: "include",
			secondField: "select",
			selectionPath: r.getSelectionPath()
		}) : n && r.throwValidationError({
			kind: "MutuallyExclusiveFields",
			firstField: "omit",
			secondField: "select",
			selectionPath: r.getSelectionPath()
		}), Er(e, r)) : Cr(r, t, n);
	}
	function Cr(e, t, n) {
		let r = {};
		return e.modelOrType && !e.isRawAction() && (r.$composites = !0, r.$scalars = !0), t && wr(r, t, e), Tr(r, n, e), r;
	}
	function wr(e, t, n) {
		for (let [r, i] of Object.entries(t)) {
			if (_r(i)) continue;
			let t = n.nestSelection(r);
			if (Mr(i, t), i === !1 || i === void 0) {
				e[r] = !1;
				continue;
			}
			let a = n.findField(r);
			if (a && a.kind !== "object" && n.throwValidationError({
				kind: "IncludeOnScalar",
				selectionPath: n.getSelectionPath().concat(r),
				outputType: n.getOutputTypeDescription()
			}), a) {
				e[r] = xr(i === !0 ? {} : i, t);
				continue;
			}
			if (i === !0) {
				e[r] = !0;
				continue;
			}
			e[r] = xr(i, t);
		}
	}
	function Tr(e, t, n) {
		let r = n.getComputedFields(), i = cr({
			...n.getGlobalOmit(),
			...t
		}, r);
		for (let [t, a] of Object.entries(i)) {
			if (_r(a)) continue;
			Mr(a, n.nestSelection(t));
			let i = n.findField(t);
			r?.[t] && !i || (e[t] = !a);
		}
	}
	function Er(e, t) {
		let n = {}, r = t.getComputedFields(), i = sr(e, r);
		for (let [e, a] of Object.entries(i)) {
			if (_r(a)) continue;
			let i = t.nestSelection(e);
			Mr(a, i);
			let o = t.findField(e);
			if (!(r?.[e] && !o)) {
				if (a === !1 || a === void 0 || _r(a)) {
					n[e] = !1;
					continue;
				}
				if (a === !0) {
					o?.kind === "object" ? n[e] = xr({}, i) : n[e] = !0;
					continue;
				}
				n[e] = xr(a, i);
			}
		}
		return n;
	}
	function Dr(e, t) {
		if (e === null) return null;
		if (typeof e == "string" || typeof e == "number" || typeof e == "boolean") return e;
		if (typeof e == "bigint") return {
			$type: "BigInt",
			value: String(e)
		};
		if (bt(e)) {
			if (xt(e)) return {
				$type: "DateTime",
				value: e.toISOString()
			};
			t.throwValidationError({
				kind: "InvalidArgumentValue",
				selectionPath: t.getSelectionPath(),
				argumentPath: t.getArgumentPath(),
				argument: {
					name: t.getArgumentName(),
					typeNames: ["Date"]
				},
				underlyingError: "Provided Date object is invalid"
			});
		}
		if (fr(e)) return {
			$type: "Param",
			value: e.name
		};
		if (Kn(e)) return {
			$type: "FieldRef",
			value: {
				_ref: e.name,
				_container: e.modelName
			}
		};
		if (Array.isArray(e)) return kr(e, t);
		if (ArrayBuffer.isView(e)) {
			let { buffer: t, byteOffset: n, byteLength: r } = e;
			return {
				$type: "Bytes",
				value: Buffer.from(t, n, r).toString("base64")
			};
		}
		if (Ar(e)) return e.values;
		if (Ct(e)) return {
			$type: "Decimal",
			value: e.toFixed()
		};
		if ((0, A.isObjectEnumValue)(e)) {
			let t = e._getName();
			if (t !== "DbNull" && t !== "JsonNull" && t !== "AnyNull") throw Error(`Invalid ObjectEnumValue: expected DbNull, JsonNull, or AnyNull, got ${t}`);
			return {
				$type: "Enum",
				value: t
			};
		}
		if (jr(e)) return e.toJSON();
		if (typeof e == "object") return Or(e, t);
		t.throwValidationError({
			kind: "InvalidArgumentValue",
			selectionPath: t.getSelectionPath(),
			argumentPath: t.getArgumentPath(),
			argument: {
				name: t.getArgumentName(),
				typeNames: []
			},
			underlyingError: `We could not serialize ${Object.prototype.toString.call(e)} value. Serialize the object to JSON or implement a ".toJSON()" method on it`
		});
	}
	function Or(e, t) {
		if (t.shouldWrapRawValues() && e.$type) return {
			$type: "Raw",
			value: e
		};
		let n = {};
		for (let r in e) {
			let i = e[r], a = t.nestArgument(r);
			_r(i) || (i === void 0 ? t.isPreviewFeatureOn("strictUndefinedChecks") && t.throwValidationError({
				kind: "InvalidArgumentValue",
				argumentPath: a.getArgumentPath(),
				selectionPath: t.getSelectionPath(),
				argument: {
					name: t.getArgumentName(),
					typeNames: []
				},
				underlyingError: yr
			}) : n[r] = Dr(i, a));
		}
		return n;
	}
	function kr(e, t) {
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = t.nestArgument(String(r)), a = e[r];
			if (a === void 0 || _r(a)) {
				let e = a === void 0 ? "undefined" : "Prisma.skip";
				t.throwValidationError({
					kind: "InvalidArgumentValue",
					selectionPath: i.getSelectionPath(),
					argumentPath: i.getArgumentPath(),
					argument: {
						name: `${t.getArgumentName()}[${r}]`,
						typeNames: []
					},
					underlyingError: `Can not use \`${e}\` value within array. Use \`null\` or filter out \`${e}\` values`
				});
			}
			n.push(Dr(a, i));
		}
		return n;
	}
	function Ar(e) {
		return typeof e == "object" && !!e && e.__prismaRawParameters__ === !0;
	}
	function jr(e) {
		return typeof e == "object" && !!e && typeof e.toJSON == "function";
	}
	function Mr(e, t) {
		e === void 0 && t.isPreviewFeatureOn("strictUndefinedChecks") && t.throwValidationError({
			kind: "InvalidSelectionValue",
			selectionPath: t.getSelectionPath(),
			underlyingError: yr
		});
	}
	var Nr = class e {
		constructor(e) {
			this.params = e, this.params.modelName && (this.modelOrType = this.params.runtimeDataModel.models[this.params.modelName] ?? this.params.runtimeDataModel.types[this.params.modelName]);
		}
		modelOrType;
		throwValidationError(e) {
			tr({
				errors: [e],
				originalMethod: this.params.originalMethod,
				args: this.params.rootArgs ?? {},
				callsite: this.params.callsite,
				errorFormat: this.params.errorFormat,
				clientVersion: this.params.clientVersion,
				globalOmit: this.params.globalOmit
			});
		}
		getSelectionPath() {
			return this.params.selectionPath;
		}
		getArgumentPath() {
			return this.params.argumentPath;
		}
		getArgumentName() {
			return this.params.argumentPath[this.params.argumentPath.length - 1];
		}
		getOutputTypeDescription() {
			if (!(!this.params.modelName || !this.modelOrType)) return {
				name: this.params.modelName,
				fields: this.modelOrType.fields.map((e) => ({
					name: e.name,
					typeName: "boolean",
					isRelation: e.kind === "object"
				}))
			};
		}
		isRawAction() {
			return [
				"executeRaw",
				"queryRaw",
				"runCommandRaw",
				"findRaw",
				"aggregateRaw"
			].includes(this.params.action);
		}
		isPreviewFeatureOn(e) {
			return this.params.previewFeatures.includes(e);
		}
		shouldWrapRawValues() {
			return this.params.wrapRawValues ?? !0;
		}
		getComputedFields() {
			if (this.params.modelName) return this.params.extensions.getAllComputedFields(this.params.modelName);
		}
		findField(e) {
			return this.modelOrType?.fields.find((t) => t.name === e);
		}
		nestSelection(t) {
			let n = this.findField(t), r = n?.kind === "object" ? n.type : void 0;
			return new e({
				...this.params,
				modelName: r,
				selectionPath: this.params.selectionPath.concat(t)
			});
		}
		getGlobalOmit() {
			return this.params.modelName && this.shouldApplyGlobalOmit() ? this.params.globalOmit?.[le(this.params.modelName)] ?? {} : {};
		}
		shouldApplyGlobalOmit() {
			switch (this.params.action) {
				case "findFirst":
				case "findFirstOrThrow":
				case "findUniqueOrThrow":
				case "findMany":
				case "upsert":
				case "findUnique":
				case "createManyAndReturn":
				case "create":
				case "update":
				case "updateManyAndReturn":
				case "delete": return !0;
				case "executeRaw":
				case "aggregateRaw":
				case "runCommandRaw":
				case "findRaw":
				case "createMany":
				case "deleteMany":
				case "groupBy":
				case "updateMany":
				case "count":
				case "aggregate":
				case "queryRaw": return !1;
				default: Ye(this.params.action, "Unknown action");
			}
		}
		nestArgument(t) {
			return new e({
				...this.params,
				argumentPath: this.params.argumentPath.concat(t)
			});
		}
	};
	function Pr(e, t) {
		let n = de(() => Fr(t));
		Object.defineProperty(e, "dmmf", { get: () => n.get() });
	}
	function Fr(e) {
		return { datamodel: {
			models: Ir(e.models),
			enums: Ir(e.enums),
			types: Ir(e.types)
		} };
	}
	function Ir(e) {
		return Object.entries(e).map(([e, t]) => ({
			name: e,
			...t
		}));
	}
	var Lr = /* @__PURE__ */ new WeakMap(), Rr = "$$PrismaTypedSql", zr = class {
		constructor(e, t) {
			Lr.set(this, {
				sql: e,
				values: t
			}), Object.defineProperty(this, Rr, { value: Rr });
		}
		get sql() {
			return Lr.get(this).sql;
		}
		get values() {
			return Lr.get(this).values;
		}
	};
	function Br(e) {
		return (...t) => new zr(e, t);
	}
	function Vr(e) {
		return e != null && e[Rr] === Rr;
	}
	var Hr = y(), Ur = v("node:async_hooks"), Wr = v("node:events");
	function Gr(e) {
		return {
			getKeys() {
				return Object.keys(e);
			},
			getPropertyValue(t) {
				return e[t];
			}
		};
	}
	function Kr(e, t) {
		return {
			getKeys() {
				return [e];
			},
			getPropertyValue() {
				return t();
			}
		};
	}
	function qr(e) {
		let t = new O();
		return {
			getKeys() {
				return e.getKeys();
			},
			getPropertyValue(n) {
				return t.getOrCreate(n, () => e.getPropertyValue(n));
			},
			getPropertyDescriptor(t) {
				return e.getPropertyDescriptor?.(t);
			}
		};
	}
	var Jr = {
		enumerable: !0,
		configurable: !0,
		writable: !0
	};
	function Yr(e) {
		let t = new Set(e);
		return {
			getPrototypeOf: () => Object.prototype,
			getOwnPropertyDescriptor: () => Jr,
			has: (e, n) => t.has(n),
			set: (e, n, r) => t.add(n) && Reflect.set(e, n, r),
			ownKeys: () => [...t]
		};
	}
	var Xr = Symbol.for("nodejs.util.inspect.custom");
	function Zr(e, t) {
		let n = Qr(t), r = /* @__PURE__ */ new Set(), i = new Proxy(e, {
			get(e, t) {
				if (r.has(t)) return e[t];
				let i = n.get(t);
				return i ? i.getPropertyValue(t) : e[t];
			},
			has(e, t) {
				if (r.has(t)) return !0;
				let i = n.get(t);
				return i ? i.has?.(t) ?? !0 : Reflect.has(e, t);
			},
			ownKeys(e) {
				let t = $r(Reflect.ownKeys(e), n), i = $r(Array.from(n.keys()), n);
				return [...new Set([
					...t,
					...i,
					...r
				])];
			},
			set(e, t, i) {
				return n.get(t)?.getPropertyDescriptor?.(t)?.writable === !1 ? !1 : (r.add(t), Reflect.set(e, t, i));
			},
			getOwnPropertyDescriptor(e, t) {
				let r = Reflect.getOwnPropertyDescriptor(e, t);
				if (r && !r.configurable) return r;
				let i = n.get(t);
				return i ? i.getPropertyDescriptor ? {
					...Jr,
					...i?.getPropertyDescriptor(t)
				} : Jr : r;
			},
			defineProperty(e, t, n) {
				return r.add(t), Reflect.defineProperty(e, t, n);
			},
			getPrototypeOf: () => Object.prototype
		});
		return i[Xr] = function() {
			let e = { ...this };
			return delete e[Xr], e;
		}, i;
	}
	function Qr(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = n.getKeys();
			for (let r of e) t.set(r, n);
		}
		return t;
	}
	function $r(e, t) {
		return e.filter((e) => t.get(e)?.has?.(e) ?? !0);
	}
	function ei(e) {
		return {
			getKeys() {
				return e;
			},
			has() {
				return !1;
			},
			getPropertyValue() {}
		};
	}
	function G(e) {
		if (e === void 0) return "";
		let t = Xn(e);
		return new tn(0, { colors: an }).write(t).toString();
	}
	var ti = "<unknown>";
	function ni(e) {
		return e.split("\n").reduce(function(e, t) {
			var n = ai(t) || si(t) || ui(t) || mi(t) || fi(t);
			return n && e.push(n), e;
		}, []);
	}
	var ri = /^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|rsc|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i, ii = /\((\S*)(?::(\d+))(?::(\d+))\)/;
	function ai(e) {
		var t = ri.exec(e);
		if (!t) return null;
		var n = t[2] && t[2].indexOf("native") === 0, r = t[2] && t[2].indexOf("eval") === 0, i = ii.exec(t[2]);
		return r && i != null && (t[2] = i[1], t[3] = i[2], t[4] = i[3]), {
			file: n ? null : t[2],
			methodName: t[1] || ti,
			arguments: n ? [t[2]] : [],
			lineNumber: t[3] ? +t[3] : null,
			column: t[4] ? +t[4] : null
		};
	}
	var oi = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|rsc|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
	function si(e) {
		var t = oi.exec(e);
		return t ? {
			file: t[2],
			methodName: t[1] || ti,
			arguments: [],
			lineNumber: +t[3],
			column: t[4] ? +t[4] : null
		} : null;
	}
	var ci = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|rsc|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i, li = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
	function ui(e) {
		var t = ci.exec(e);
		if (!t) return null;
		var n = t[3] && t[3].indexOf(" > eval") > -1, r = li.exec(t[3]);
		return n && r != null && (t[3] = r[1], t[4] = r[2], t[5] = null), {
			file: t[3],
			methodName: t[1] || ti,
			arguments: t[2] ? t[2].split(",") : [],
			lineNumber: t[4] ? +t[4] : null,
			column: t[5] ? +t[5] : null
		};
	}
	var di = /^\s*(?:([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$/i;
	function fi(e) {
		var t = di.exec(e);
		return t ? {
			file: t[3],
			methodName: t[1] || ti,
			arguments: [],
			lineNumber: +t[4],
			column: t[5] ? +t[5] : null
		} : null;
	}
	var pi = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
	function mi(e) {
		var t = pi.exec(e);
		return t ? {
			file: t[2],
			methodName: t[1] || ti,
			arguments: [],
			lineNumber: +t[3],
			column: t[4] ? +t[4] : null
		} : null;
	}
	var hi = class {
		getLocation() {
			return null;
		}
	}, gi = class {
		_error;
		constructor() {
			this._error = /* @__PURE__ */ Error();
		}
		getLocation() {
			let e = this._error.stack;
			if (!e) return null;
			let t = ni(e).find((e) => {
				if (!e.file) return !1;
				let t = pt(e.file);
				return t !== "<anonymous>" && !t.includes("@prisma") && !t.includes("/packages/client/src/runtime/") && !t.endsWith("/runtime/client.js") && !t.startsWith("internal/") && !e.methodName.includes("new ") && !e.methodName.includes("getCallSite") && !e.methodName.includes("Proxy.") && e.methodName.split(".").length < 4;
			});
			return !t || !t.file ? null : {
				fileName: t.file,
				lineNumber: t.lineNumber,
				columnNumber: t.column
			};
		}
	};
	function _i(e) {
		return e === "minimal" ? typeof $EnabledCallSite == "function" && e !== "minimal" ? new $EnabledCallSite() : new hi() : new gi();
	}
	var vi = {
		_avg: !0,
		_count: !0,
		_sum: !0,
		_min: !0,
		_max: !0
	};
	function yi(e = {}) {
		let t = bi(e);
		return Object.entries(t).reduce((e, [t, n]) => (vi[t] === void 0 ? e[t] = n : e.select[t] = { select: n }, e), { select: {} });
	}
	function bi(e = {}) {
		return typeof e._count == "boolean" ? {
			...e,
			_count: { _all: e._count }
		} : e;
	}
	function xi(e = {}) {
		return (t) => (typeof e._count == "boolean" && (t._count = t._count._all), t);
	}
	function Si(e, t) {
		return t({
			action: "aggregate",
			unpacker: xi(e),
			argsMapper: yi
		})(e);
	}
	function Ci(e = {}) {
		let { select: t, ...n } = e;
		return yi(typeof t == "object" ? {
			...n,
			_count: t
		} : {
			...n,
			_count: { _all: !0 }
		});
	}
	function wi(e = {}) {
		return typeof e.select == "object" ? (t) => xi(e)(t)._count : (t) => xi(e)(t)._count._all;
	}
	function Ti(e, t) {
		return t({
			action: "count",
			unpacker: wi(e),
			argsMapper: Ci
		})(e);
	}
	function Ei(e = {}) {
		let t = yi(e);
		if (Array.isArray(t.by)) for (let e of t.by) typeof e == "string" && (t.select[e] = !0);
		else typeof t.by == "string" && (t.select[t.by] = !0);
		return t;
	}
	function Di(e = {}) {
		return (t) => (typeof e?._count == "boolean" && t.forEach((e) => {
			e._count = e._count._all;
		}), t);
	}
	function Oi(e, t) {
		return t({
			action: "groupBy",
			unpacker: Di(e),
			argsMapper: Ei
		})(e);
	}
	function ki(e, t, n) {
		if (t === "aggregate") return (e) => Si(e, n);
		if (t === "count") return (e) => Ti(e, n);
		if (t === "groupBy") return (e) => Oi(e, n);
	}
	function Ai(e, t) {
		let n = ue(t.fields.filter((e) => !e.relationName), "name");
		return new Proxy({}, {
			get(t, r) {
				if (r in t || typeof r == "symbol") return t[r];
				let i = n[r];
				if (i) return new Gn(e, r, i.type, i.isList, i.kind === "enum");
			},
			...Yr(Object.keys(n))
		});
	}
	var ji = (e) => Array.isArray(e) ? e : e.split("."), Mi = (e, t) => ji(t).reduce((e, t) => e && e[t], e), Ni = (e, t, n) => ji(t).reduceRight((t, n, r, i) => Object.assign({}, Mi(e, i.slice(0, r)), { [n]: t }), n);
	function Pi(e, t) {
		return e === void 0 || t === void 0 ? [] : [
			...t,
			"select",
			e
		];
	}
	function Fi(e, t, n) {
		return t === void 0 ? e ?? {} : Ni(t, n, e || !0);
	}
	function Ii(e, t, n, r, i, a) {
		let o = e._runtimeDataModel.models[t].fields.reduce((e, t) => ({
			...e,
			[t.name]: t
		}), {});
		return (s) => {
			let c = _i(e._errorFormat), l = Pi(r, i), u = Fi(s, a, l), d = n({
				dataPath: l,
				callsite: c
			})(u), f = Li(e, t);
			return new Proxy(d, {
				get(t, r) {
					if (!f.includes(r)) return t[r];
					let i = [
						o[r].type,
						n,
						r
					], a = [l, u];
					return Ii(e, ...i, ...a);
				},
				...Yr([...f, ...Object.getOwnPropertyNames(d)])
			});
		};
	}
	function Li(e, t) {
		return e._runtimeDataModel.models[t].fields.filter((e) => e.kind === "object").map((e) => e.name);
	}
	var Ri = [
		"findUnique",
		"findUniqueOrThrow",
		"findFirst",
		"findFirstOrThrow",
		"create",
		"update",
		"upsert",
		"delete"
	], zi = [
		"aggregate",
		"count",
		"groupBy"
	];
	function Bi(e, t) {
		let n = e._extensions.getAllModelExtensions(t) ?? {};
		return Zr({}, [
			Vi(e, t),
			Ui(e, t),
			Gr(n),
			Kr("name", () => t),
			Kr("$name", () => t),
			Kr("$parent", () => e._appliedParent)
		]);
	}
	function Vi(e, t) {
		let n = nr(t), r = Object.keys(Et).concat("count");
		return {
			getKeys() {
				return r;
			},
			getPropertyValue(r) {
				let i = r, a = (a) => (o) => {
					let s = _i(e._errorFormat);
					return e._createPrismaPromise((c) => {
						let l = {
							args: o,
							dataPath: [],
							action: i,
							model: t,
							clientMethod: `${n}.${r}`,
							jsModelName: n,
							transaction: c,
							callsite: s
						};
						return e._request({
							...l,
							...a
						});
					}, {
						action: i,
						args: o,
						model: t
					});
				};
				return Ri.includes(i) ? Ii(e, t, a) : Hi(r) ? ki(e, r, a) : a({});
			}
		};
	}
	function Hi(e) {
		return zi.includes(e);
	}
	function Ui(e, t) {
		return qr(Kr("fields", () => {
			let n = e._runtimeDataModel.models[t];
			return Ai(t, n);
		}));
	}
	function Wi(e) {
		return e.replace(/^./, (e) => e.toUpperCase());
	}
	var Gi = Symbol();
	function Ki(e) {
		let t = [
			K(e),
			qi(e),
			Kr(Gi, () => e),
			Kr("$parent", () => e._appliedParent)
		], n = e._extensions.getAllClientExtensions();
		return n && t.push(Gr(n)), Zr(e, t);
	}
	function K(e) {
		let t = Object.getPrototypeOf(e._originalClient), n = [...new Set(Object.getOwnPropertyNames(t))];
		return {
			getKeys() {
				return n;
			},
			getPropertyValue(t) {
				return e[t];
			}
		};
	}
	function qi(e) {
		let t = Object.keys(e._runtimeDataModel.models), n = t.map(nr), r = [...new Set(t.concat(n))];
		return qr({
			getKeys() {
				return r;
			},
			getPropertyValue(t) {
				let n = Wi(t);
				if (e._runtimeDataModel.models[n] !== void 0) return Bi(e, n);
				if (e._runtimeDataModel.models[t] !== void 0) return Bi(e, t);
			},
			getPropertyDescriptor(e) {
				if (!n.includes(e)) return { enumerable: !1 };
			}
		});
	}
	function Ji(e) {
		return e[Gi] ? e[Gi] : e;
	}
	function Yi(e) {
		return typeof e == "function" ? e(this) : Ki(Object.create(this._originalClient, {
			_extensions: { value: this._extensions.append(e) },
			_appliedParent: {
				value: this,
				configurable: !0
			},
			$on: { value: void 0 }
		}));
	}
	function q({ result: e, modelName: t, select: n, omit: r, extensions: i }) {
		let a = i.getAllComputedFields(t);
		if (!a) return e;
		let o = [], s = [];
		for (let t of Object.values(a)) {
			if (r) {
				if (r[t.name]) continue;
				let e = t.needs.filter((e) => r[e]);
				e.length > 0 && s.push(ei(e));
			} else if (n) {
				if (!n[t.name]) continue;
				let e = t.needs.filter((e) => !n[e]);
				e.length > 0 && s.push(ei(e));
			}
			Xi(e, t.needs) && o.push(Zi(t, Zr(e, o)));
		}
		return o.length > 0 || s.length > 0 ? Zr(e, [...o, ...s]) : e;
	}
	function Xi(e, t) {
		return t.every((t) => mt(e, t));
	}
	function Zi(e, t) {
		return qr(Kr(e.name, () => e.compute(t)));
	}
	function Qi({ visitor: e, result: t, args: n, runtimeDataModel: r, modelName: i }) {
		if (Array.isArray(t)) {
			for (let a = 0; a < t.length; a++) t[a] = Qi({
				result: t[a],
				args: n,
				modelName: i,
				runtimeDataModel: r,
				visitor: e
			});
			return t;
		}
		let a = e(t, i, n) ?? t;
		return n.include && $i({
			includeOrSelect: n.include,
			result: a,
			parentModelName: i,
			runtimeDataModel: r,
			visitor: e
		}), n.select && $i({
			includeOrSelect: n.select,
			result: a,
			parentModelName: i,
			runtimeDataModel: r,
			visitor: e
		}), a;
	}
	function $i({ includeOrSelect: e, result: t, parentModelName: n, runtimeDataModel: r, visitor: i }) {
		for (let [a, o] of Object.entries(e)) {
			if (!o || t[a] == null || _r(o)) continue;
			let e = r.models[n].fields.find((e) => e.name === a);
			if (!e || e.kind !== "object" || !e.relationName) continue;
			let s = typeof o == "object" ? o : {};
			t[a] = Qi({
				visitor: i,
				result: t[a],
				args: s,
				modelName: e.type,
				runtimeDataModel: r
			});
		}
	}
	function ea({ result: e, modelName: t, args: n, extensions: r, runtimeDataModel: i, globalOmit: a }) {
		return r.isEmpty() || typeof e != "object" || !e || !i.models[t] ? e : Qi({
			result: e,
			args: n ?? {},
			modelName: t,
			runtimeDataModel: i,
			visitor: (e, t, n) => {
				let i = nr(t);
				return q({
					result: e,
					modelName: i,
					select: n.select,
					omit: n.select ? void 0 : {
						...a?.[i],
						...n.omit
					},
					extensions: r
				});
			}
		});
	}
	var ta = y(), na = [
		"$connect",
		"$disconnect",
		"$on",
		"$use",
		"$extends"
	];
	function ra(e) {
		if (e instanceof ta.Sql) return ia(e);
		if (Vr(e)) return aa(e);
		if (Array.isArray(e)) {
			let t = [e[0]];
			for (let n = 1; n < e.length; n++) t[n] = oa(e[n]);
			return t;
		}
		let t = {};
		for (let n in e) t[n] = oa(e[n]);
		return t;
	}
	function ia(e) {
		return new ta.Sql(e.strings, e.values);
	}
	function aa(e) {
		return new zr(e.sql, e.values);
	}
	function oa(e) {
		if (typeof e != "object" || !e || (0, ta.isObjectEnumValue)(e) || Kn(e) || _r(e)) return e;
		if (Ct(e)) return new ta.Decimal(e.toFixed());
		if (bt(e)) return /* @__PURE__ */ new Date(+e);
		if (ArrayBuffer.isView(e)) return e.slice(0);
		if (Array.isArray(e)) {
			let t = e.length, n;
			for (n = Array(t); t--;) n[t] = oa(e[t]);
			return n;
		}
		if (typeof e == "object") {
			let t = {};
			for (let n in e) n === "__proto__" ? Object.defineProperty(t, n, {
				value: oa(e[n]),
				configurable: !0,
				enumerable: !0,
				writable: !0
			}) : t[n] = oa(e[n]);
			return t;
		}
		Ye(e, "Unknown value");
	}
	function sa(e, t, n, r = 0) {
		return e._createPrismaPromise((i) => {
			let a = t.customDataProxyFetch;
			return "transaction" in t && i !== void 0 && (t.transaction?.kind === "batch" && t.transaction.lock.then(), t.transaction = i), r === n.length ? e._executeRequest(t) : n[r]({
				model: t.model,
				operation: t.model ? t.action : t.clientMethod,
				args: ra(t.args ?? {}),
				__internalParams: t,
				query: (i, o = t) => {
					let s = o.customDataProxyFetch;
					return o.customDataProxyFetch = fa(a, s), o.args = i, sa(e, o, n, r + 1);
				}
			});
		});
	}
	function ca(e, t) {
		let { jsModelName: n, action: r, clientMethod: i } = t, a = n ? r : i;
		return e._extensions.isEmpty() ? e._executeRequest(t) : sa(e, t, e._extensions.getAllQueryCallbacks(n ?? "$none", a));
	}
	function la(e) {
		return (t) => {
			let n = { requests: t }, r = t[0].extensions.getAllBatchQueryCallbacks();
			return r.length ? ua(n, r, 0, e) : e(n);
		};
	}
	function ua(e, t, n, r) {
		if (n === t.length) return r(e);
		let i = e.customDataProxyFetch, a = e.requests[0].transaction;
		return t[n]({
			args: {
				queries: e.requests.map((e) => ({
					model: e.modelName,
					operation: e.action,
					args: e.args
				})),
				transaction: a ? { isolationLevel: a.kind === "batch" ? a.isolationLevel : void 0 } : void 0
			},
			__internalParams: e,
			query(a, o = e) {
				let s = o.customDataProxyFetch;
				return o.customDataProxyFetch = fa(i, s), ua(o, t, n + 1, r);
			}
		});
	}
	var da = (e) => e;
	function fa(e = da, t = da) {
		return (n) => e(t(n));
	}
	function pa({ dataPath: e, modelName: t, args: n, runtimeDataModel: r }) {
		let i = {
			modelName: t,
			args: n ?? {}
		}, a = ma(e);
		if (!a || a.length === 0) return i;
		let o = t, s = n ?? {};
		for (let t of a) {
			let n = r.models[o];
			if (!n) return i;
			let a = n.fields.find((e) => e.name === t);
			if (!a) throw Error(`Could not resolve relation field "${t}" on model "${o}" from dataPath "${e.join(".")}"`);
			if (a.kind !== "object" || !a.relationName) return i;
			o = a.type, s = ha(s, t);
		}
		return {
			modelName: o,
			args: s
		};
	}
	function ma(e) {
		let t = [];
		for (let n = 0; n < e.length; n += 2) {
			let r = e[n], i = e[n + 1];
			if (r !== "select" && r !== "include" || i === void 0) return;
			t.push(i);
		}
		return t;
	}
	function ha(e, t) {
		let n = e.select?.[t];
		if (ga(n)) return n;
		let r = e.include?.[t];
		return ga(r) ? r : {};
	}
	function ga(e) {
		return !!e && typeof e == "object" && !Array.isArray(e);
	}
	var _a = y(), va = y();
	function J(e, t) {
		throw Error(t);
	}
	function ya(e, t) {
		return e === t || e !== null && t !== null && typeof e == "object" && typeof t == "object" && Object.keys(e).length === Object.keys(t).length && Object.keys(e).every((n) => ya(e[n], t[n]));
	}
	function ba(e, t) {
		let n = Object.keys(e), r = Object.keys(t);
		return (n.length < r.length ? n : r).every((n) => {
			if (typeof e[n] == typeof t[n] && typeof e[n] != "object") return e[n] === t[n];
			if (va.Decimal.isDecimal(e[n]) || va.Decimal.isDecimal(t[n])) {
				let r = xa(e[n]), i = xa(t[n]);
				return r && i && r.equals(i);
			} else if (e[n] instanceof Uint8Array || t[n] instanceof Uint8Array) {
				let r = Sa(e[n]), i = Sa(t[n]);
				return r && i && r.equals(i);
			} else {
				if (e[n] instanceof Date || t[n] instanceof Date) return Ca(e[n])?.getTime() === Ca(t[n])?.getTime();
				if (typeof e[n] == "bigint" || typeof t[n] == "bigint") return wa(e[n]) === wa(t[n]);
				if (typeof e[n] == "number" || typeof t[n] == "number") return Ta(e[n]) === Ta(t[n]);
			}
			return ya(e[n], t[n]);
		});
	}
	function xa(e) {
		return va.Decimal.isDecimal(e) ? e : typeof e == "number" || typeof e == "string" ? new va.Decimal(e) : void 0;
	}
	function Sa(e) {
		return Buffer.isBuffer(e) ? e : e instanceof Uint8Array ? Buffer.from(e.buffer, e.byteOffset, e.byteLength) : typeof e == "string" ? Buffer.from(e, "base64") : void 0;
	}
	function Ca(e) {
		return e instanceof Date ? e : typeof e == "string" || typeof e == "number" ? new Date(e) : void 0;
	}
	function wa(e) {
		return typeof e == "bigint" ? e : typeof e == "number" || typeof e == "string" ? BigInt(e) : void 0;
	}
	function Ta(e) {
		return typeof e == "number" ? e : typeof e == "string" ? Number(e) : void 0;
	}
	function Ea(e) {
		return JSON.stringify(e, (e, t) => typeof t == "bigint" ? t.toString() : ArrayBuffer.isView(t) ? Buffer.from(t.buffer, t.byteOffset, t.byteLength).toString("base64") : t);
	}
	function Da(e) {
		return typeof e == "object" && !!e && typeof e.$type == "string";
	}
	function Oa(e, t) {
		let n = {};
		for (let r of Object.keys(e)) n[r] = t(e[r], r);
		return n;
	}
	function ka(e) {
		return e === null ? e : Array.isArray(e) ? e.map(ka) : typeof e == "object" ? Da(e) ? Aa(e) : e.constructor !== null && e.constructor.name !== "Object" ? e : Oa(e, ka) : e;
	}
	function Aa({ $type: e, value: t }) {
		switch (e) {
			case "BigInt": return BigInt(t);
			case "Bytes": {
				let { buffer: e, byteOffset: n, byteLength: r } = Buffer.from(t, "base64");
				return new Uint8Array(e, n, r);
			}
			case "DateTime": return new Date(t);
			case "Decimal": return new _a.Decimal(t);
			case "Json": return JSON.parse(t);
			case "Raw": return t;
			case "FieldRef": throw Error("FieldRef tagged values cannot be deserialized to JavaScript values");
			case "Enum": return t;
			default: J(t, "Unknown tagged value");
		}
	}
	function ja(e) {
		return e.name === "DriverAdapterError" && typeof e.cause == "object";
	}
	var Y = {
		Int32: 0,
		Int64: 1,
		Float: 2,
		Double: 3,
		Numeric: 4,
		Boolean: 5,
		Character: 6,
		Text: 7,
		Date: 8,
		Time: 9,
		DateTime: 10,
		Json: 11,
		Enum: 12,
		Bytes: 13,
		Set: 14,
		Uuid: 15,
		Int32Array: 64,
		Int64Array: 65,
		FloatArray: 66,
		DoubleArray: 67,
		NumericArray: 68,
		BooleanArray: 69,
		CharacterArray: 70,
		TextArray: 71,
		DateArray: 72,
		TimeArray: 73,
		DateTimeArray: 74,
		JsonArray: 75,
		EnumArray: 76,
		BytesArray: 77,
		UuidArray: 78,
		UnknownNumber: 128
	}, Ma = class extends Error {
		name = "UserFacingError";
		code;
		meta;
		constructor(e, t, n) {
			super(e), this.code = t, this.meta = n ?? {};
		}
		toQueryResponseErrorObject() {
			return {
				error: this.message,
				user_facing_error: {
					is_panic: !1,
					message: this.message,
					meta: this.meta,
					error_code: this.code
				}
			};
		}
	};
	function Na(e) {
		if (!ja(e)) throw e;
		let t = Fa(e), n = Ia(e);
		throw !t || !n ? e : new Ma(n, t, { driverAdapterError: e });
	}
	function Pa(e) {
		throw ja(e) ? new Ma(`Raw query failed. Code: \`${e.cause.originalCode ?? "N/A"}\`. Message: \`${e.cause.originalMessage ?? Ia(e)}\``, "P2010", { driverAdapterError: e }) : e;
	}
	function Fa(e) {
		switch (e.cause.kind) {
			case "AuthenticationFailed": return "P1000";
			case "DatabaseNotReachable": return "P1001";
			case "DatabaseDoesNotExist": return "P1003";
			case "SocketTimeout": return "P1008";
			case "DatabaseAlreadyExists": return "P1009";
			case "DatabaseAccessDenied": return "P1010";
			case "TlsConnectionError": return "P1011";
			case "ConnectionClosed": return "P1017";
			case "TransactionAlreadyClosed": return "P1018";
			case "LengthMismatch": return "P2000";
			case "UniqueConstraintViolation": return "P2002";
			case "ForeignKeyConstraintViolation": return "P2003";
			case "InvalidInputValue": return "P2007";
			case "UnsupportedNativeDataType": return "P2010";
			case "NullConstraintViolation": return "P2011";
			case "ValueOutOfRange": return "P2020";
			case "TableDoesNotExist": return "P2021";
			case "ColumnNotFound": return "P2022";
			case "InvalidIsolationLevel":
			case "InconsistentColumnData": return "P2023";
			case "MissingFullTextSearchIndex": return "P2030";
			case "TransactionWriteConflict": return "P2034";
			case "GenericJs": return "P2036";
			case "TooManyConnections": return "P2037";
			case "postgres":
			case "sqlite":
			case "mysql":
			case "mssql": return;
			default: J(e.cause, `Unknown error: ${e.cause}`);
		}
	}
	function Ia(e) {
		switch (e.cause.kind) {
			case "AuthenticationFailed": return `Authentication failed against the database server, the provided database credentials for \`${e.cause.user ?? "(not available)"}\` are not valid`;
			case "DatabaseNotReachable": {
				let t = e.cause.host && e.cause.port ? `${e.cause.host}:${e.cause.port}` : e.cause.host;
				return `Can't reach database server${t ? ` at ${t}` : ""}`;
			}
			case "DatabaseDoesNotExist": return `Database \`${e.cause.db ?? "(not available)"}\` does not exist on the database server`;
			case "SocketTimeout": return "Operation has timed out";
			case "DatabaseAlreadyExists": return `Database \`${e.cause.db ?? "(not available)"}\` already exists on the database server`;
			case "DatabaseAccessDenied": return `User was denied access on the database \`${e.cause.db ?? "(not available)"}\``;
			case "TlsConnectionError": return `Error opening a TLS connection: ${e.cause.reason}`;
			case "ConnectionClosed": return "Server has closed the connection.";
			case "TransactionAlreadyClosed": return e.cause.cause;
			case "LengthMismatch": return `The provided value for the column is too long for the column's type. Column: ${e.cause.column ?? "(not available)"}`;
			case "UniqueConstraintViolation": return `Unique constraint failed on the ${La(e.cause.constraint)}`;
			case "ForeignKeyConstraintViolation": return `Foreign key constraint violated on the ${La(e.cause.constraint)}`;
			case "UnsupportedNativeDataType": return `Failed to deserialize column of type '${e.cause.type}'. If you're using $queryRaw and this column is explicitly marked as \`Unsupported\` in your Prisma schema, try casting this column to any supported Prisma type such as \`String\`.`;
			case "NullConstraintViolation": return `Null constraint violation on the ${La(e.cause.constraint)}`;
			case "ValueOutOfRange": return `Value out of range for the type: ${e.cause.cause}`;
			case "TableDoesNotExist": return `The table \`${e.cause.table ?? "(not available)"}\` does not exist in the current database.`;
			case "ColumnNotFound": return `The column \`${e.cause.column ?? "(not available)"}\` does not exist in the current database.`;
			case "InvalidIsolationLevel": return `Error in connector: Conversion error: ${e.cause.level}`;
			case "InconsistentColumnData": return `Inconsistent column data: ${e.cause.cause}`;
			case "MissingFullTextSearchIndex": return "Cannot find a fulltext index to use for the native search, try adding a @@fulltext([Fields...]) to your schema";
			case "TransactionWriteConflict": return "Transaction failed due to a write conflict or a deadlock. Please retry your transaction";
			case "GenericJs": return `Error in external connector (id ${e.cause.id})`;
			case "TooManyConnections": return `Too many database connections opened: ${e.cause.cause}`;
			case "InvalidInputValue": return `Invalid input value: ${e.cause.message}`;
			case "sqlite":
			case "postgres":
			case "mysql":
			case "mssql": return;
			default: J(e.cause, `Unknown error: ${e.cause}`);
		}
	}
	function La(e) {
		return e && "fields" in e ? `fields: (${e.fields.map((e) => `\`${e}\``).join(", ")})` : e && "index" in e ? `constraint: \`${e.index}\`` : e && "foreignKey" in e ? "foreign key" : "(not available)";
	}
	function Ra(e) {
		if (typeof e != "object" || !e) return !1;
		let t = e;
		return "$type" in t && t.$type === "Param" || "prisma__type" in t && t.prisma__type === "param";
	}
	function za(e) {
		return "prisma__type" in e ? e.prisma__value?.name : e.value.name;
	}
	function Ba(e, t) {
		let n = {};
		for (let [r, i] of Object.entries(e)) if (n[r] = i, Ra(i)) {
			let e = za(i);
			e && e in t && (n[r] = t[e]);
		}
		return n;
	}
	function Va(e, t, n = {}) {
		let r = e.map((e) => t.keys.reduce((t, n) => (t[n] = ka(e[n]), t), {})), i = new Set(t.nestedSelection);
		return t.arguments.map((a) => {
			let o = Ba(a, n), s = r.findIndex((e) => ba(e, o));
			if (s === -1) return t.expectNonEmpty ? new Ma("An operation failed because it depends on one or more records that were required but not found", "P2025") : null;
			{
				let t = Object.entries(e[s]).filter(([e]) => i.has(e));
				return Object.fromEntries(t);
			}
		});
	}
	var Ha = y(), X = class extends Ma {
		name = "DataMapperError";
		constructor(e, t) {
			super(e, "P2023", t);
		}
	}, Ua = /* @__PURE__ */ new WeakMap();
	function Wa(e) {
		let t = Ua.get(e);
		return t || (t = Object.entries(e), Ua.set(e, t)), t;
	}
	function Ga(e, t, n) {
		switch (t.type) {
			case "affectedRows":
				if (typeof e != "number") throw new X(`Expected an affected rows count, got: ${typeof e} (${e})`);
				return { count: e };
			case "object": return Ka(e, t.fields, n, t.skipNulls);
			case "field": return Ya(e, "<result>", t.fieldType, n);
			default: J(t, `Invalid data mapping type: '${t.type}'`);
		}
	}
	function Ka(e, t, n, r) {
		if (e === null) return null;
		if (Array.isArray(e)) {
			let i = e;
			return r && (i = i.filter((e) => e !== null)), i.map((e) => qa(e, t, n));
		}
		if (typeof e == "object") return qa(e, t, n);
		if (typeof e == "string") {
			let i;
			try {
				i = JSON.parse(e);
			} catch (e) {
				throw new X("Expected an array or object, got a string that is not valid JSON", { cause: e });
			}
			return Ka(i, t, n, r);
		}
		throw new X(`Expected an array or an object, got: ${typeof e}`);
	}
	function qa(e, t, n) {
		if (typeof e != "object") throw new X(`Expected an object, but got '${typeof e}'`);
		let r = {};
		for (let [i, a] of Wa(t)) switch (a.type) {
			case "affectedRows": throw new X(`Unexpected 'AffectedRows' node in data mapping for field '${i}'`);
			case "object": {
				let { serializedName: t, fields: o, skipNulls: s } = a;
				if (t !== null && !Object.hasOwn(e, t)) throw new X(`Missing data field (Object): '${i}'; node: ${JSON.stringify(a)}; data: ${JSON.stringify(e)}`);
				r[i] = Ka(t === null ? e : e[t], o, n, s);
				break;
			}
			case "field":
				{
					let t = a.dbName;
					if (Object.hasOwn(e, t)) r[i] = Ja(e[t], t, a.fieldType, n);
					else throw new X(`Missing data field (Value): '${t}'; node: ${JSON.stringify(a)}; data: ${JSON.stringify(e)}`);
				}
				break;
			default: J(a, `DataMapper: Invalid data mapping node type: '${a.type}'`);
		}
		return r;
	}
	function Ja(e, t, n, r) {
		return e === null ? n.arity === "list" ? [] : null : n.arity === "list" ? e.map((e, i) => Ya(e, `${t}[${i}]`, n, r)) : Ya(e, t, n, r);
	}
	function Ya(e, t, n, r) {
		switch (n.type) {
			case "unsupported": return e;
			case "string":
				if (typeof e != "string") throw new X(`Expected a string in column '${t}', got ${typeof e}: ${e}`);
				return e;
			case "int": switch (typeof e) {
				case "number": return Math.trunc(e);
				case "string": {
					let n = Math.trunc(Number(e));
					if (Number.isNaN(n) || !Number.isFinite(n)) throw new X(`Expected an integer in column '${t}', got string: ${e}`);
					if (!Number.isSafeInteger(n)) throw new X(`Integer value in column '${t}' is too large to represent as a JavaScript number without loss of precision, got: ${e}. Consider using BigInt type.`);
					return n;
				}
				default: throw new X(`Expected an integer in column '${t}', got ${typeof e}: ${e}`);
			}
			case "bigint":
				if (typeof e != "number" && typeof e != "string") throw new X(`Expected a bigint in column '${t}', got ${typeof e}: ${e}`);
				return {
					$type: "BigInt",
					value: e
				};
			case "float":
				if (typeof e == "number") return e;
				if (typeof e == "string") {
					let n = Number(e);
					if (Number.isNaN(n) && !/^[-+]?nan$/.test(e.toLowerCase())) throw new X(`Expected a float in column '${t}', got string: ${e}`);
					return n;
				}
				throw new X(`Expected a float in column '${t}', got ${typeof e}: ${e}`);
			case "boolean":
				if (typeof e == "boolean") return e;
				if (typeof e == "number") return e === 1;
				if (typeof e == "string") {
					if (e === "true" || e === "TRUE" || e === "1") return !0;
					if (e === "false" || e === "FALSE" || e === "0") return !1;
					throw new X(`Expected a boolean in column '${t}', got ${typeof e}: ${e}`);
				}
				if (Array.isArray(e) || e instanceof Uint8Array) {
					for (let t of e) if (t !== 0) return !0;
					return !1;
				}
				throw new X(`Expected a boolean in column '${t}', got ${typeof e}: ${e}`);
			case "decimal":
				if (typeof e != "number" && typeof e != "string" && !Ha.Decimal.isDecimal(e)) throw new X(`Expected a decimal in column '${t}', got ${typeof e}: ${e}`);
				return {
					$type: "Decimal",
					value: e
				};
			case "datetime":
				if (typeof e == "string") return {
					$type: "DateTime",
					value: Za(e)
				};
				if (typeof e == "number" || e instanceof Date) return {
					$type: "DateTime",
					value: e
				};
				throw new X(`Expected a date in column '${t}', got ${typeof e}: ${e}`);
			case "object": return {
				$type: "Json",
				value: Ea(e)
			};
			case "json": return {
				$type: "Json",
				value: `${e}`
			};
			case "bytes":
				switch (n.encoding) {
					case "base64":
						if (typeof e != "string") throw new X(`Expected a base64-encoded byte array in column '${t}', got ${typeof e}: ${e}`);
						return {
							$type: "Bytes",
							value: e
						};
					case "hex":
						if (typeof e != "string" || !e.startsWith("\\x")) throw new X(`Expected a hex-encoded byte array in column '${t}', got ${typeof e}: ${e}`);
						return {
							$type: "Bytes",
							value: Buffer.from(e.slice(2), "hex").toString("base64")
						};
					case "array":
						if (Array.isArray(e) || e instanceof Uint8Array) return {
							$type: "Bytes",
							value: Buffer.from(e).toString("base64")
						};
						throw new X(`Expected a byte array in column '${t}', got ${typeof e}: ${e}`);
					default: J(n.encoding, `DataMapper: Unknown bytes encoding: ${n.encoding}`);
				}
				break;
			case "enum": {
				let t = r[n.name];
				if (t === void 0) throw new X(`Unknown enum '${n.name}'`);
				let i = t[`${e}`];
				if (i === void 0) throw new X(`Value '${e}' not found in enum '${n.name}'`);
				return i;
			}
			default: J(n, `DataMapper: Unknown result type: ${n.type}`);
		}
	}
	var Xa = /\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?$/;
	function Za(e) {
		let t = Xa.exec(e);
		if (t === null) return `${e}T00:00:00Z`;
		let n = e, [r, i, a] = t;
		if (i !== void 0 && i !== "Z" && a === void 0 ? n = `${e}:00` : i === void 0 && (n = `${e}Z`), r.length === e.length) return `1970-01-01T${n}`;
		let o = t.index - 1;
		return n[o] === " " && (n = `${n.slice(0, o)}T${n.slice(o + 1)}`), n;
	}
	function Qa(e) {
		if (typeof e != "object") return e;
		var t, n, r = Object.prototype.toString.call(e);
		if (r === "[object Object]") {
			if (e.constructor !== Object && typeof e.constructor == "function") for (t in n = new e.constructor(), e) e.hasOwnProperty(t) && n[t] !== e[t] && (n[t] = Qa(e[t]));
			else for (t in n = {}, e) t === "__proto__" ? Object.defineProperty(n, t, {
				value: Qa(e[t]),
				configurable: !0,
				enumerable: !0,
				writable: !0
			}) : n[t] = Qa(e[t]);
			return n;
		}
		if (r === "[object Array]") {
			for (t = e.length, n = Array(t); t--;) n[t] = Qa(e[t]);
			return n;
		}
		return r === "[object Set]" ? (n = /* @__PURE__ */ new Set(), e.forEach(function(e) {
			n.add(Qa(e));
		}), n) : r === "[object Map]" ? (n = /* @__PURE__ */ new Map(), e.forEach(function(e, t) {
			n.set(Qa(t), Qa(e));
		}), n) : r === "[object Date]" ? /* @__PURE__ */ new Date(+e) : r === "[object RegExp]" ? (n = new RegExp(e.source, e.flags), n.lastIndex = e.lastIndex, n) : r === "[object DataView]" ? new e.constructor(Qa(e.buffer)) : r === "[object ArrayBuffer]" ? e.slice(0) : r.slice(-6) === "Array]" ? new e.constructor(e) : e;
	}
	function $a(e) {
		let t = Object.entries(e);
		return t.length === 0 ? "" : (t.sort(([e], [t]) => e.localeCompare(t)), `/*${t.map(([e, t]) => `${encodeURIComponent(e)}='${encodeURIComponent(t).replace(/'/g, "\\'")}'`).join(",")}*/`);
	}
	function eo(e, t) {
		let n = {};
		for (let r of e) {
			let e = r(Qa(t));
			for (let [t, r] of Object.entries(e)) r !== void 0 && (n[t] = r);
		}
		return n;
	}
	function to(e, t) {
		return $a(eo(e, t));
	}
	function no(e, t) {
		return t ? `${e} ${t}` : e;
	}
	var ro;
	(function(e) {
		e[e.INTERNAL = 0] = "INTERNAL", e[e.SERVER = 1] = "SERVER", e[e.CLIENT = 2] = "CLIENT", e[e.PRODUCER = 3] = "PRODUCER", e[e.CONSUMER = 4] = "CONSUMER";
	})(ro ||= {});
	function io(e) {
		switch (e) {
			case "postgresql":
			case "postgres":
			case "prisma+postgres": return "postgresql";
			case "sqlserver": return "mssql";
			case "mysql":
			case "sqlite":
			case "cockroachdb":
			case "mongodb": return e;
			default: J(e, `Unknown provider: ${e}`);
		}
	}
	async function ao({ query: e, tracingHelper: t, provider: n, onQuery: r, execute: i }) {
		let a = r === void 0 ? i : async () => {
			let t = /* @__PURE__ */ new Date(), n = performance.now(), a = await i();
			return r({
				timestamp: t,
				duration: performance.now() - n,
				query: e.sql,
				params: e.args
			}), a;
		};
		return t.isEnabled() ? await t.runInChildSpan({
			name: "db_query",
			kind: ro.CLIENT,
			attributes: {
				"db.query.text": e.sql,
				"db.system.name": io(n)
			}
		}, a) : a();
	}
	function oo(e, t) {
		var n = "000000000" + e;
		return n.substr(n.length - t);
	}
	var so = f(v("node:os"), 1);
	function co() {
		try {
			return so.default.hostname();
		} catch {
			return process.env._CLUSTER_NETWORK_NAME_ || process.env.COMPUTERNAME || "hostname";
		}
	}
	var lo = 2, uo = oo(process.pid.toString(36), lo), fo = co(), po = fo.length, mo = oo(fo.split("").reduce(function(e, t) {
		return +e + t.charCodeAt(0);
	}, +po + 36).toString(36), lo);
	function ho() {
		return uo + mo;
	}
	function go(e) {
		return typeof e == "string" && /^c[a-z0-9]{20,32}$/.test(e);
	}
	function _o(e) {
		let t = 36 ** 4, n = 0;
		function r() {
			return oo((Math.random() * t << 0).toString(36), 4);
		}
		function i() {
			return n = n < t ? n : 0, n++, n - 1;
		}
		function a() {
			var t = "c", n = (/* @__PURE__ */ new Date()).getTime().toString(36), a = oo(i().toString(36), 4), o = e(), s = r() + r();
			return t + n + a + o + s;
		}
		return a.fingerprint = e, a.isCuid = go, a;
	}
	var vo = _o(ho), yo = f(T()), bo = v("node:crypto"), xo = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict", So = 128, Co, wo;
	function To(e) {
		!Co || Co.length < e ? (Co = Buffer.allocUnsafe(e * So), bo.webcrypto.getRandomValues(Co), wo = 0) : wo + e > Co.length && (bo.webcrypto.getRandomValues(Co), wo = 0), wo += e;
	}
	function Eo(e = 21) {
		To(e |= 0);
		let t = "";
		for (let n = wo - e; n < wo; n++) t += xo[Co[n] & 63];
		return t;
	}
	var Do = f(v("node:crypto"), 1), Oo = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", ko = 32, Ao = 16, jo = 10, Mo = 0xffffffffffff, No;
	(function(e) {
		e.Base32IncorrectEncoding = "B32_ENC_INVALID", e.DecodeTimeInvalidCharacter = "DEC_TIME_CHAR", e.DecodeTimeValueMalformed = "DEC_TIME_MALFORMED", e.EncodeTimeNegative = "ENC_TIME_NEG", e.EncodeTimeSizeExceeded = "ENC_TIME_SIZE_EXCEED", e.EncodeTimeValueMalformed = "ENC_TIME_MALFORMED", e.PRNGDetectFailure = "PRNG_DETECT", e.ULIDInvalid = "ULID_INVALID", e.Unexpected = "UNEXPECTED", e.UUIDInvalid = "UUID_INVALID";
	})(No ||= {});
	var Po = class extends Error {
		constructor(e, t) {
			super(`${t} (${e})`), this.name = "ULIDError", this.code = e;
		}
	};
	function Fo(e) {
		let t = Math.floor(e() * ko);
		return t === ko && (t = ko - 1), Oo.charAt(t);
	}
	function Io(e) {
		let t = Lo(), n = t && (t.crypto || t.msCrypto) || (typeof Do.default < "u" ? Do.default : null);
		if (typeof n?.getRandomValues == "function") return () => {
			let e = new Uint8Array(1);
			return n.getRandomValues(e), e[0] / 255;
		};
		if (typeof n?.randomBytes == "function") return () => n.randomBytes(1).readUInt8() / 255;
		if (Do.default?.randomBytes) return () => Do.default.randomBytes(1).readUInt8() / 255;
		throw new Po(No.PRNGDetectFailure, "Failed to find a reliable PRNG");
	}
	function Lo() {
		return Bo() ? self : typeof window < "u" ? window : typeof global < "u" ? global : typeof globalThis < "u" ? globalThis : null;
	}
	function Ro(e, t) {
		let n = "";
		for (; e > 0; e--) n = Fo(t) + n;
		return n;
	}
	function zo(e, t = jo) {
		if (isNaN(e)) throw new Po(No.EncodeTimeValueMalformed, `Time must be a number: ${e}`);
		if (e > Mo) throw new Po(No.EncodeTimeSizeExceeded, `Cannot encode a time larger than ${Mo}: ${e}`);
		if (e < 0) throw new Po(No.EncodeTimeNegative, `Time must be positive: ${e}`);
		if (Number.isInteger(e) === !1) throw new Po(No.EncodeTimeValueMalformed, `Time must be an integer: ${e}`);
		let n, r = "";
		for (let i = t; i > 0; i--) n = e % ko, r = Oo.charAt(n) + r, e = (e - n) / ko;
		return r;
	}
	function Bo() {
		return typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope;
	}
	function Vo(e, t) {
		let n = t || Io();
		return zo(!e || isNaN(e) ? Date.now() : e, jo) + Ro(Ao, n);
	}
	var Z = [];
	for (let e = 0; e < 256; ++e) Z.push((e + 256).toString(16).slice(1));
	function Ho(e, t = 0) {
		return (Z[e[t + 0]] + Z[e[t + 1]] + Z[e[t + 2]] + Z[e[t + 3]] + "-" + Z[e[t + 4]] + Z[e[t + 5]] + "-" + Z[e[t + 6]] + Z[e[t + 7]] + "-" + Z[e[t + 8]] + Z[e[t + 9]] + "-" + Z[e[t + 10]] + Z[e[t + 11]] + Z[e[t + 12]] + Z[e[t + 13]] + Z[e[t + 14]] + Z[e[t + 15]]).toLowerCase();
	}
	var Uo = v("node:crypto"), Wo = new Uint8Array(256), Go = Wo.length;
	function Ko() {
		return Go > Wo.length - 16 && ((0, Uo.randomFillSync)(Wo), Go = 0), Wo.slice(Go, Go += 16);
	}
	var qo = { randomUUID: v("node:crypto").randomUUID };
	function Jo(e, t, n) {
		if (qo.randomUUID && !t && !e) return qo.randomUUID();
		e ||= {};
		let r = e.random ?? e.rng?.() ?? Ko();
		if (r.length < 16) throw Error("Random bytes length must be >= 16");
		if (r[6] = r[6] & 15 | 64, r[8] = r[8] & 63 | 128, t) {
			if (n ||= 0, n < 0 || n + 16 > t.length) throw RangeError(`UUID byte range ${n}:${n + 15} is out of buffer bounds`);
			for (let e = 0; e < 16; ++e) t[n + e] = r[e];
			return t;
		}
		return Ho(r);
	}
	var Yo = Jo, Xo = {};
	function Zo(e, t, n) {
		let r;
		if (e) r = $o(e.random ?? e.rng?.() ?? Ko(), e.msecs, e.seq, t, n);
		else {
			let e = Date.now(), i = Ko();
			Qo(Xo, e, i), r = $o(i, Xo.msecs, Xo.seq, t, n);
		}
		return t ?? Ho(r);
	}
	function Qo(e, t, n) {
		return e.msecs ??= -Infinity, e.seq ??= 0, t > e.msecs ? (e.seq = n[6] << 23 | n[7] << 16 | n[8] << 8 | n[9], e.msecs = t) : (e.seq = e.seq + 1 | 0, e.seq === 0 && e.msecs++), e;
	}
	function $o(e, t, n, r, i = 0) {
		if (e.length < 16) throw Error("Random bytes length must be >= 16");
		if (!r) r = new Uint8Array(16), i = 0;
		else if (i < 0 || i + 16 > r.length) throw RangeError(`UUID byte range ${i}:${i + 15} is out of buffer bounds`);
		return t ??= Date.now(), n ??= e[6] * 127 << 24 | e[7] << 16 | e[8] << 8 | e[9], r[i++] = t / 1099511627776 & 255, r[i++] = t / 4294967296 & 255, r[i++] = t / 16777216 & 255, r[i++] = t / 65536 & 255, r[i++] = t / 256 & 255, r[i++] = t & 255, r[i++] = 112 | n >>> 28 & 15, r[i++] = n >>> 20 & 255, r[i++] = 128 | n >>> 14 & 63, r[i++] = n >>> 6 & 255, r[i++] = n << 2 & 255 | e[10] & 3, r[i++] = e[11], r[i++] = e[12], r[i++] = e[13], r[i++] = e[14], r[i++] = e[15], r;
	}
	var es = Zo, ts = class {
		#e = {};
		constructor() {
			this.register("uuid", new rs()), this.register("cuid", new is()), this.register("ulid", new as()), this.register("nanoid", new os()), this.register("product", new ss());
		}
		snapshot() {
			return Object.create(this.#e, { now: { value: new ns() } });
		}
		register(e, t) {
			this.#e[e] = t;
		}
	}, ns = class {
		#e;
		generate() {
			return this.#e === void 0 && (this.#e = /* @__PURE__ */ new Date()), this.#e.toISOString();
		}
	}, rs = class {
		generate(e) {
			if (e === 4) return Yo();
			if (e === 7) return es();
			throw Error("Invalid UUID generator arguments");
		}
	}, is = class {
		generate(e) {
			if (e === 1) return vo();
			if (e === 2) return (0, yo.createId)();
			throw Error("Invalid CUID generator arguments");
		}
	}, as = class {
		generate() {
			return Vo();
		}
	}, os = class {
		generate(e) {
			if (typeof e == "number") return Eo(e);
			if (e === void 0) return Eo();
			throw Error("Invalid Nanoid generator arguments");
		}
	}, ss = class {
		generate(e, t) {
			if (e === void 0 || t === void 0) throw Error("Invalid Product generator arguments");
			return Array.isArray(e) && Array.isArray(t) ? e.flatMap((e) => t.map((t) => [e, t])) : Array.isArray(e) ? e.map((e) => [e, t]) : Array.isArray(t) ? t.map((t) => [e, t]) : [[e, t]];
		}
	};
	function cs(e, t) {
		return e == null ? e : typeof e == "string" ? cs(JSON.parse(e), t) : Array.isArray(e) ? ds(e, t) : ls(e, t);
	}
	function ls(e, t) {
		if (t.pagination) {
			let { skip: n, take: r, cursor: i } = t.pagination;
			if (n !== null && n > 0 || r === 0 || i !== null && !ba(e, i)) return null;
		}
		return us(e, t.nested);
	}
	function us(e, t) {
		for (let [n, r] of Object.entries(t)) e[n] = cs(e[n], r);
		return e;
	}
	function ds(e, t) {
		if (t.distinct !== null) {
			let n = t.linkingFields === null ? t.distinct : [...t.distinct, ...t.linkingFields];
			e = fs(e, n);
		}
		return t.pagination && (e = ps(e, t.pagination, t.linkingFields)), t.reverse && e.reverse(), Object.keys(t.nested).length === 0 ? e : e.map((e) => us(e, t.nested));
	}
	function fs(e, t) {
		let n = /* @__PURE__ */ new Set(), r = [];
		for (let i of e) {
			let e = hs(i, t);
			n.has(e) || (n.add(e), r.push(i));
		}
		return r;
	}
	function ps(e, t, n) {
		if (n === null) return ms(e, t);
		let r = /* @__PURE__ */ new Map();
		for (let t of e) {
			let e = hs(t, n);
			r.has(e) || r.set(e, []), r.get(e).push(t);
		}
		let i = Array.from(r.entries());
		return i.sort(([e], [t]) => e < t ? -1 : +(e > t)), i.flatMap(([, e]) => ms(e, t));
	}
	function ms(e, { cursor: t, skip: n, take: r }) {
		let i = t === null ? 0 : e.findIndex((e) => ba(e, t));
		if (i === -1) return [];
		let a = i + (n ?? 0), o = r === null ? e.length : a + r;
		return e.slice(a, o);
	}
	function hs(e, t, n) {
		let r = t.map((t, r) => n?.[r] ? e[t] === null ? null : n[r](e[t]) : e[t]);
		return JSON.stringify(r);
	}
	function gs(e) {
		return typeof e == "object" && !!e && e.prisma__type === "param";
	}
	function _s(e) {
		return typeof e == "object" && !!e && e.prisma__type === "generatorCall";
	}
	function vs(e, t, n, r) {
		let i = e.args.map((e) => ys(e, t, n));
		switch (e.type) {
			case "rawSql": return [Cs(e.sql, i, e.argTypes)];
			case "templateSql": return (e.chunkable ? Ds(e.fragments, i, r) : [i]).map((t) => {
				let n = bs(e.fragments, e.placeholderFormat, t, e.argTypes);
				if (r !== void 0 && n.args.length > r) throw new Ma("The query parameter limit supported by your database is exceeded.", "P2029");
				return n;
			});
			default: J(e.type, "Invalid query type");
		}
	}
	function ys(e, t, n) {
		for (; ws(e);) if (gs(e)) {
			let n = t[e.prisma__value.name];
			if (n === void 0) throw Error(`Missing value for query variable ${e.prisma__value.name}`);
			e = e.prisma__value.type === "DateTime" && typeof n == "string" ? new Date(n) : n;
		} else if (_s(e)) {
			let { name: r, args: i } = e.prisma__value, a = n[r];
			if (!a) throw Error(`Encountered an unknown generator '${r}'`);
			e = a.generate(...i.map((e) => ys(e, t, n)));
		} else J(e, `Unexpected unevaluated value type: ${e}`);
		return Array.isArray(e) && (e = e.map((e) => ys(e, t, n))), e;
	}
	function bs(e, t, n, r) {
		let i = "", a = { placeholderNumber: 1 }, o = [], s = [];
		for (let c of Ts(e, n, r)) {
			if (i += xs(c, t, a), c.type === "stringChunk") continue;
			let e = o.length, n = o.push(...Es(c)) - e;
			if (c.argType.arity === "tuple") {
				if (n % c.argType.elements.length !== 0) throw Error(`Malformed query template. Expected the number of parameters to match the tuple arity, but got ${n} parameters for a tuple of arity ${c.argType.elements.length}.`);
				for (let e = 0; e < n / c.argType.elements.length; e++) s.push(...c.argType.elements);
			} else for (let e = 0; e < n; e++) s.push(c.argType);
		}
		return {
			sql: i,
			args: o,
			argTypes: s
		};
	}
	function xs(e, t, n) {
		let r = e.type;
		switch (r) {
			case "parameter": return Ss(t, n.placeholderNumber++);
			case "stringChunk": return e.chunk;
			case "parameterTuple": return `(${e.value.length == 0 ? "NULL" : e.value.map(() => {
				let r = Ss(t, n.placeholderNumber++);
				return `${e.itemPrefix}${r}${e.itemSuffix}`;
			}).join(e.itemSeparator)})`;
			case "parameterTupleList": return e.value.map((r) => {
				let i = r.map(() => Ss(t, n.placeholderNumber++)).join(e.itemSeparator);
				return `${e.itemPrefix}${i}${e.itemSuffix}`;
			}).join(e.groupSeparator);
			default: J(r, "Invalid fragment type");
		}
	}
	function Ss(e, t) {
		return e.hasNumbering ? `${e.prefix}${t}` : e.prefix;
	}
	function Cs(e, t, n) {
		return {
			sql: e,
			args: t,
			argTypes: n
		};
	}
	function ws(e) {
		return gs(e) || _s(e);
	}
	function* Ts(e, t, n) {
		let r = 0;
		for (let i of e) switch (i.type) {
			case "parameter":
				if (r >= t.length) throw Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);
				yield {
					...i,
					value: t[r],
					argType: n?.[r]
				}, r++;
				break;
			case "stringChunk":
				yield i;
				break;
			case "parameterTuple": {
				if (r >= t.length) throw Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);
				let e = t[r];
				yield {
					...i,
					value: Array.isArray(e) ? e : [e],
					argType: n?.[r]
				}, r++;
				break;
			}
			case "parameterTupleList": {
				if (r >= t.length) throw Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);
				let e = t[r];
				if (!Array.isArray(e)) throw Error("Malformed query template. Tuple list expected.");
				if (e.length === 0) throw Error("Malformed query template. Tuple list cannot be empty.");
				for (let t of e) if (!Array.isArray(t)) throw Error("Malformed query template. Tuple expected.");
				yield {
					...i,
					value: e,
					argType: n?.[r]
				}, r++;
				break;
			}
		}
	}
	function* Es(e) {
		switch (e.type) {
			case "parameter":
				yield e.value;
				break;
			case "stringChunk": break;
			case "parameterTuple":
				yield* e.value;
				break;
			case "parameterTupleList":
				for (let t of e.value) yield* t;
				break;
		}
	}
	function Ds(e, t, n) {
		let r = 0, i = 0;
		for (let n of Ts(e, t, void 0)) {
			let e = 0;
			for (let t of Es(n)) e++;
			i = Math.max(i, e), r += e;
		}
		let a = [[]];
		for (let o of Ts(e, t, void 0)) switch (o.type) {
			case "parameter":
				for (let e of a) e.push(o.value);
				break;
			case "stringChunk": break;
			case "parameterTuple": {
				let e = o.value.length, t = [];
				if (n && a.length === 1 && e === i && r > n && r - e < n) {
					let i = n - (r - e);
					t = Os(o.value, i);
				} else t = [o.value];
				a = a.flatMap((e) => t.map((t) => [...e, t]));
				break;
			}
			case "parameterTupleList": {
				let e = o.value.reduce((e, t) => e + t.length, 0), t = [], s = [], c = 0;
				for (let l of o.value) n && a.length === 1 && e === i && s.length > 0 && r - e + c + l.length > n && (t.push(s), s = [], c = 0), s.push(l), c += l.length;
				s.length > 0 && t.push(s), a = a.flatMap((e) => t.map((t) => [...e, t]));
				break;
			}
		}
		return a;
	}
	function Os(e, t) {
		let n = [];
		for (let r = 0; r < e.length; r += t) n.push(e.slice(r, r + t));
		return n;
	}
	function ks(e) {
		return e.rows.map((t) => t.reduce((t, n, r) => (t[e.columnNames[r]] = n, t), {}));
	}
	function As(e) {
		return {
			columns: e.columnNames,
			types: e.columnTypes.map((e) => Ms(e)),
			rows: e.rows.map((t) => t.map((t, n) => js(t, e.columnTypes[n])))
		};
	}
	function js(e, t) {
		if (e === null) return null;
		switch (t) {
			case Y.Int32: switch (typeof e) {
				case "number": return Math.trunc(e);
				case "string": return Math.trunc(Number(e));
				default: throw Error(`Cannot serialize value of type ${typeof e} as Int32`);
			}
			case Y.Int32Array:
				if (!Array.isArray(e)) throw Error(`Cannot serialize value of type ${typeof e} as Int32Array`);
				return e.map((e) => js(e, Y.Int32));
			case Y.Int64: switch (typeof e) {
				case "number": return BigInt(Math.trunc(e));
				case "string": return e;
				default: throw Error(`Cannot serialize value of type ${typeof e} as Int64`);
			}
			case Y.Int64Array:
				if (!Array.isArray(e)) throw Error(`Cannot serialize value of type ${typeof e} as Int64Array`);
				return e.map((e) => js(e, Y.Int64));
			case Y.Json: switch (typeof e) {
				case "string": return JSON.parse(e);
				default: throw Error(`Cannot serialize value of type ${typeof e} as Json`);
			}
			case Y.JsonArray:
				if (!Array.isArray(e)) throw Error(`Cannot serialize value of type ${typeof e} as JsonArray`);
				return e.map((e) => js(e, Y.Json));
			case Y.Boolean: switch (typeof e) {
				case "boolean": return e;
				case "string": return e === "true" || e === "1";
				case "number": return e === 1;
				default: throw Error(`Cannot serialize value of type ${typeof e} as Boolean`);
			}
			case Y.BooleanArray:
				if (!Array.isArray(e)) throw Error(`Cannot serialize value of type ${typeof e} as BooleanArray`);
				return e.map((e) => js(e, Y.Boolean));
			default: return e;
		}
	}
	function Ms(e) {
		switch (e) {
			case Y.Int32: return "int";
			case Y.Int64: return "bigint";
			case Y.Float: return "float";
			case Y.Double: return "double";
			case Y.Text: return "string";
			case Y.Enum: return "enum";
			case Y.Bytes: return "bytes";
			case Y.Boolean: return "bool";
			case Y.Character: return "char";
			case Y.Numeric: return "decimal";
			case Y.Json: return "json";
			case Y.Uuid: return "uuid";
			case Y.DateTime: return "datetime";
			case Y.Date: return "date";
			case Y.Time: return "time";
			case Y.Int32Array: return "int-array";
			case Y.Int64Array: return "bigint-array";
			case Y.FloatArray: return "float-array";
			case Y.DoubleArray: return "double-array";
			case Y.TextArray: return "string-array";
			case Y.EnumArray: return "string-array";
			case Y.BytesArray: return "bytes-array";
			case Y.BooleanArray: return "bool-array";
			case Y.CharacterArray: return "char-array";
			case Y.NumericArray: return "decimal-array";
			case Y.JsonArray: return "json-array";
			case Y.UuidArray: return "uuid-array";
			case Y.DateTimeArray: return "datetime-array";
			case Y.DateArray: return "date-array";
			case Y.TimeArray: return "time-array";
			case Y.UnknownNumber: return "unknown";
			case Y.Set: return "string";
			default: J(e, `Unexpected column type: ${e}`);
		}
	}
	function Ns(e, t, n) {
		if (!t.every((t) => Ps(e, t))) throw new Ma(Fs(e, n), Is(n), n.context);
	}
	function Ps(e, t) {
		switch (t.type) {
			case "rowCountEq": return Array.isArray(e) ? e.length === t.args : e === null ? t.args === 0 : t.args === 1;
			case "rowCountNeq": return Array.isArray(e) ? e.length !== t.args : e === null ? t.args !== 0 : t.args !== 1;
			case "affectedRowCountEq": return e === t.args;
			case "never": return !1;
			default: J(t, `Unknown rule type: ${t.type}`);
		}
	}
	function Fs(e, t) {
		switch (t.errorIdentifier) {
			case "RELATION_VIOLATION": return `The change you are trying to make would violate the required relation '${t.context.relation}' between the \`${t.context.modelA}\` and \`${t.context.modelB}\` models.`;
			case "MISSING_RECORD": return `An operation failed because it depends on one or more records that were required but not found. No record was found for ${t.context.operation}.`;
			case "MISSING_RELATED_RECORD": {
				let e = t.context.neededFor ? ` (needed to ${t.context.neededFor})` : "";
				return `An operation failed because it depends on one or more records that were required but not found. No '${t.context.model}' record${e} was found for ${t.context.operation} on ${t.context.relationType} relation '${t.context.relation}'.`;
			}
			case "INCOMPLETE_CONNECT_INPUT": return `An operation failed because it depends on one or more records that were required but not found. Expected ${t.context.expectedRows} records to be connected, found only ${Array.isArray(e) ? e.length : e}.`;
			case "INCOMPLETE_CONNECT_OUTPUT": return `The required connected records were not found. Expected ${t.context.expectedRows} records to be connected after connect operation on ${t.context.relationType} relation '${t.context.relation}', found ${Array.isArray(e) ? e.length : e}.`;
			case "RECORDS_NOT_CONNECTED": return `The records for relation \`${t.context.relation}\` between the \`${t.context.parent}\` and \`${t.context.child}\` models are not connected.`;
			default: J(t, `Unknown error identifier: ${t}`);
		}
	}
	function Is(e) {
		switch (e.errorIdentifier) {
			case "RELATION_VIOLATION": return "P2014";
			case "RECORDS_NOT_CONNECTED": return "P2017";
			case "INCOMPLETE_CONNECT_OUTPUT": return "P2018";
			case "MISSING_RECORD":
			case "MISSING_RELATED_RECORD":
			case "INCOMPLETE_CONNECT_INPUT": return "P2025";
			default: J(e, `Unknown error identifier: ${e}`);
		}
	}
	var Ls = class e {
		#e;
		#t = new ts();
		#n;
		#r;
		#i;
		#a;
		#o;
		constructor({ onQuery: e, tracingHelper: t, serializer: n, rawSerializer: r, provider: i, connectionInfo: a }) {
			this.#e = e, this.#n = t, this.#r = n, this.#i = r ?? n, this.#a = i, this.#o = a;
		}
		static forSql(t) {
			return new e({
				onQuery: t.onQuery,
				tracingHelper: t.tracingHelper,
				serializer: ks,
				rawSerializer: As,
				provider: t.provider,
				connectionInfo: t.connectionInfo
			});
		}
		async run(e, t) {
			let { value: n } = await this.interpretNode(e, {
				...t,
				generators: this.#t.snapshot()
			}).catch((e) => Na(e));
			return n;
		}
		async interpretNode(e, t) {
			switch (e.type) {
				case "value": return { value: ys(e.args, t.scope, t.generators) };
				case "seq": {
					let n;
					for (let r of e.args) n = await this.interpretNode(r, t);
					return n ?? { value: void 0 };
				}
				case "get": return { value: t.scope[e.args.name] };
				case "let": {
					let n = Object.create(t.scope);
					for (let r of e.args.bindings) {
						let { value: e } = await this.interpretNode(r.expr, {
							...t,
							scope: n
						});
						n[r.name] = e;
					}
					return this.interpretNode(e.args.expr, {
						...t,
						scope: n
					});
				}
				case "getFirstNonEmpty":
					for (let n of e.args.names) {
						let e = t.scope[n];
						if (!Rs(e)) return { value: e };
					}
					return { value: [] };
				case "concat": {
					let n = await Promise.all(e.args.map((e) => this.interpretNode(e, t).then((e) => e.value)));
					return { value: n.length > 0 ? n.reduce((e, t) => e.concat(zs(t)), []) : [] };
				}
				case "sum": {
					let n = await Promise.all(e.args.map((e) => this.interpretNode(e, t).then((e) => e.value)));
					return { value: n.length > 0 ? n.reduce((e, t) => Bs(e) + Bs(t)) : 0 };
				}
				case "execute": {
					let n = vs(e.args, t.scope, t.generators, this.#s()), r = 0;
					for (let i of n) {
						let n = qs(i, t.sqlCommenter);
						r += await this.#l(n, t.queryable, () => t.queryable.executeRaw(Ys(n)).catch((t) => e.args.type === "rawSql" ? Pa(t) : Na(t)));
					}
					return { value: r };
				}
				case "query": {
					let n = vs(e.args, t.scope, t.generators, this.#s()), r;
					for (let i of n) {
						let n = qs(i, t.sqlCommenter), a = await this.#l(n, t.queryable, () => t.queryable.queryRaw(Ys(n)).catch((t) => e.args.type === "rawSql" ? Pa(t) : Na(t)));
						r === void 0 ? r = a : (r.rows.push(...a.rows), r.lastInsertId = a.lastInsertId);
					}
					return {
						value: e.args.type === "rawSql" ? this.#i(r) : this.#r(r),
						lastInsertId: r?.lastInsertId
					};
				}
				case "reverse": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args, t);
					return {
						value: Array.isArray(n) ? n.reverse() : n,
						lastInsertId: r
					};
				}
				case "unique": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args, t);
					if (!Array.isArray(n)) return {
						value: n,
						lastInsertId: r
					};
					if (n.length > 1) throw Error(`Expected zero or one element, got ${n.length}`);
					return {
						value: n[0] ?? null,
						lastInsertId: r
					};
				}
				case "required": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args, t);
					if (Rs(n)) throw Error("Required value is empty");
					return {
						value: n,
						lastInsertId: r
					};
				}
				case "mapField": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.records, t);
					return {
						value: Hs(n, e.args.field),
						lastInsertId: r
					};
				}
				case "join": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.parent, t);
					return n === null ? {
						value: null,
						lastInsertId: r
					} : {
						value: Us(n, await Promise.all(e.args.children.map(async (e) => ({
							joinExpr: e,
							childRecords: (await this.interpretNode(e.child, t)).value
						}))), e.args.canAssumeStrictEquality),
						lastInsertId: r
					};
				}
				case "transaction": {
					if (!t.transactionManager.enabled) return this.interpretNode(e.args, t);
					let n = t.transactionManager.manager, r = await n.startInternalTransaction(), i = await n.getTransaction(r, "query");
					try {
						let a = await this.interpretNode(e.args, {
							...t,
							queryable: i
						});
						return await n.commitTransaction(r.id), a;
					} catch (e) {
						throw await n.rollbackTransaction(r.id), e;
					}
				}
				case "dataMap": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.expr, t);
					return {
						value: Ga(n, e.args.structure, e.args.enums),
						lastInsertId: r
					};
				}
				case "validate": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.expr, t);
					return Ns(n, e.args.rules, e.args), {
						value: n,
						lastInsertId: r
					};
				}
				case "if": {
					let { value: n } = await this.interpretNode(e.args.value, t);
					return Ps(n, e.args.rule) ? await this.interpretNode(e.args.then, t) : await this.interpretNode(e.args.else, t);
				}
				case "unit": return { value: void 0 };
				case "diff": {
					let { value: n } = await this.interpretNode(e.args.from, t), { value: r } = await this.interpretNode(e.args.to, t), i = (t) => t === null ? null : hs(Vs(t), e.args.fields), a = new Set(zs(r).map(i));
					return { value: zs(n).filter((e) => !a.has(i(e))) };
				}
				case "process": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.expr, t), i = Ys(e.args.operations);
					return Js(i, t.scope, t.generators), {
						value: cs(n, i),
						lastInsertId: r
					};
				}
				case "initializeRecord": {
					let { lastInsertId: n } = await this.interpretNode(e.args.expr, t), r = {};
					for (let [i, a] of Object.entries(e.args.fields)) r[i] = Gs(a, n, t.scope, t.generators);
					return {
						value: r,
						lastInsertId: n
					};
				}
				case "mapRecord": {
					let { value: n, lastInsertId: r } = await this.interpretNode(e.args.expr, t), i = n === null ? {} : Vs(n);
					for (let [n, r] of Object.entries(e.args.fields)) i[n] = Ks(r, i[n], t.scope, t.generators);
					return {
						value: i,
						lastInsertId: r
					};
				}
				default: J(e, `Unexpected node type: ${e.type}`);
			}
		}
		#s() {
			return this.#o?.maxBindValues === void 0 ? this.#c() : this.#o.maxBindValues;
		}
		#c() {
			if (this.#a !== void 0) switch (this.#a) {
				case "cockroachdb":
				case "postgres":
				case "postgresql":
				case "prisma+postgres": return 32766;
				case "mysql": return 65535;
				case "sqlite": return 999;
				case "sqlserver": return 2098;
				case "mongodb": return;
				default: J(this.#a, `Unexpected provider: ${this.#a}`);
			}
		}
		#l(e, t, n) {
			return ao({
				query: e,
				execute: n,
				provider: this.#a ?? t.provider,
				tracingHelper: this.#n,
				onQuery: this.#e
			});
		}
	};
	function Rs(e) {
		return Array.isArray(e) ? e.length === 0 : e == null;
	}
	function zs(e) {
		return Array.isArray(e) ? e : [e];
	}
	function Bs(e) {
		if (typeof e == "number") return e;
		if (typeof e == "string") return Number(e);
		throw Error(`Expected number, got ${typeof e}`);
	}
	function Vs(e) {
		if (typeof e == "object" && e) return e;
		throw Error(`Expected object, got ${typeof e}`);
	}
	function Hs(e, t) {
		return Array.isArray(e) ? e.map((e) => Hs(e, t)) : typeof e == "object" && e ? e[t] ?? null : e;
	}
	function Us(e, t, n) {
		for (let { joinExpr: r, childRecords: i } of t) {
			let t = r.on.map(([e]) => e), a = r.on.map(([, e]) => e), o = {}, s = Array.isArray(e) ? e : [e];
			for (let e of s) {
				let n = Vs(e), i = hs(n, t);
				o[i] || (o[i] = []), o[i].push(n), r.isRelationUnique ? n[r.parentField] = null : n[r.parentField] = [];
			}
			let c = n ? void 0 : Ws(s, t);
			for (let e of Array.isArray(i) ? i : [i]) {
				if (e === null) continue;
				let t = hs(Vs(e), a, c);
				for (let n of o[t] ?? []) r.isRelationUnique ? n[r.parentField] = e : n[r.parentField].push(e);
			}
		}
		return e;
	}
	function Ws(e, t) {
		function n(e) {
			switch (e) {
				case "number": return Number;
				case "string": return String;
				case "boolean": return Boolean;
				case "bigint": return BigInt;
				default: return;
			}
		}
		let r = Array.from({ length: t.length }), i = 0;
		for (let a of e) {
			let e = Vs(a);
			for (let [a, o] of t.entries()) if (e[o] !== null && r[a] === void 0) {
				let t = n(typeof e[o]);
				t !== void 0 && (r[a] = t), i++;
			}
			if (i === t.length) break;
		}
		return r;
	}
	function Gs(e, t, n, r) {
		switch (e.type) {
			case "value": return ys(e.value, n, r);
			case "lastInsertId": return t;
			default: J(e, `Unexpected field initializer type: ${e.type}`);
		}
	}
	function Ks(e, t, n, r) {
		switch (e.type) {
			case "set": return ys(e.value, n, r);
			case "add": return Bs(t) + Bs(ys(e.value, n, r));
			case "subtract": return Bs(t) - Bs(ys(e.value, n, r));
			case "multiply": return Bs(t) * Bs(ys(e.value, n, r));
			case "divide": {
				let i = Bs(t), a = Bs(ys(e.value, n, r));
				return a === 0 ? null : i / a;
			}
			default: J(e, `Unexpected field operation type: ${e.type}`);
		}
	}
	function qs(e, t) {
		if (!t || t.plugins.length === 0) return e;
		let n = to(t.plugins, {
			query: t.queryInfo,
			sql: e.sql
		});
		return n ? {
			...e,
			sql: no(e.sql, n)
		} : e;
	}
	function Js(e, t, n) {
		let r = e.pagination?.cursor;
		if (r) for (let [e, i] of Object.entries(r)) r[e] = ys(i, t, n);
		for (let r of Object.values(e.nested)) Js(r, t, n);
	}
	function Ys(e) {
		return Qa(e);
	}
	function Xs(e) {
		return new Qs(e).deserialize();
	}
	function Zs(e) {
		return Buffer.from(e, "base64url");
	}
	var Qs = class {
		#e;
		#t;
		#n = 0;
		constructor(e) {
			this.#e = e;
			let t = Zs(e.graph);
			this.#t = new DataView(t.buffer, t.byteOffset, t.byteLength);
		}
		deserialize() {
			let { inputNodeCount: e, outputNodeCount: t, rootCount: n } = this.#s(), r = this.#c(e), i = this.#l(t), a = this.#u(n);
			return {
				strings: this.#e.strings,
				inputNodes: r,
				outputNodes: i,
				roots: a
			};
		}
		#r() {
			let e = 0, t = 0, n;
			do
				n = this.#t.getUint8(this.#n++), e |= (n & 127) << t, t += 7;
			while (n >= 128);
			return e;
		}
		#i() {
			let e = this.#r();
			return e === 0 ? void 0 : e - 1;
		}
		#a() {
			let e = this.#t.getUint8(this.#n);
			return this.#n += 1, e;
		}
		#o() {
			let e = this.#t.getUint16(this.#n, !0);
			return this.#n += 2, e;
		}
		#s() {
			return {
				inputNodeCount: this.#r(),
				outputNodeCount: this.#r(),
				rootCount: this.#r()
			};
		}
		#c(e) {
			let t = [];
			for (let n = 0; n < e; n++) {
				let e = this.#r(), n = {};
				for (let t = 0; t < e; t++) {
					let e = this.#r(), t = this.#o(), r = this.#i(), i = this.#i(), a = { flags: this.#a() };
					t !== 0 && (a.scalarMask = t), r !== void 0 && (a.childNodeId = r), i !== void 0 && (a.enumNameIndex = i), n[e] = a;
				}
				t.push({ edges: n });
			}
			return t;
		}
		#l(e) {
			let t = [];
			for (let n = 0; n < e; n++) {
				let e = this.#r(), n = {};
				for (let t = 0; t < e; t++) {
					let e = this.#r(), t = this.#i(), r = this.#i(), i = {};
					t !== void 0 && (i.argsNodeId = t), r !== void 0 && (i.outputNodeId = r), n[e] = i;
				}
				t.push({ edges: n });
			}
			return t;
		}
		#u(e) {
			let t = {};
			for (let n = 0; n < e; n++) {
				let e = this.#r(), n = this.#i(), r = this.#i(), i = this.#e.strings[e], a = {};
				n !== void 0 && (a.argsNodeId = n), r !== void 0 && (a.outputNodeId = r), t[i] = a;
			}
			return t;
		}
	}, $s = class e {
		#e;
		#t;
		#n;
		constructor(e, t) {
			this.#e = e, this.#n = t, this.#t = /* @__PURE__ */ new Map();
			for (let t = 0; t < e.strings.length; t++) this.#t.set(e.strings[t], t);
		}
		static deserialize(t, n) {
			return new e(Xs(t), n);
		}
		static fromData(t, n) {
			return new e(t, n);
		}
		root(e) {
			let t = this.#e.roots[e];
			if (t) return {
				argsNodeId: t.argsNodeId,
				outputNodeId: t.outputNodeId
			};
		}
		inputNode(e) {
			if (!(e === void 0 || e < 0 || e >= this.#e.inputNodes.length)) return { id: e };
		}
		outputNode(e) {
			if (!(e === void 0 || e < 0 || e >= this.#e.outputNodes.length)) return { id: e };
		}
		inputEdge(e, t) {
			if (!e) return;
			let n = this.#e.inputNodes[e.id];
			if (!n) return;
			let r = this.#t.get(t);
			if (r === void 0) return;
			let i = n.edges[r];
			if (i) return {
				flags: i.flags,
				childNodeId: i.childNodeId,
				scalarMask: i.scalarMask ?? 0,
				enumNameIndex: i.enumNameIndex
			};
		}
		outputEdge(e, t) {
			if (!e) return;
			let n = this.#e.outputNodes[e.id];
			if (!n) return;
			let r = this.#t.get(t);
			if (r === void 0) return;
			let i = n.edges[r];
			if (i) return {
				argsNodeId: i.argsNodeId,
				outputNodeId: i.outputNodeId
			};
		}
		enumValues(e) {
			if (e?.enumNameIndex === void 0) return;
			let t = this.#e.strings[e.enumNameIndex];
			if (t) return this.#n(t);
		}
		getString(e) {
			return this.#e.strings[e];
		}
	}, ec = {
		ParamScalar: 1,
		ParamEnum: 2,
		ParamListScalar: 4,
		ParamListEnum: 8,
		ListObject: 16,
		Object: 32
	}, tc = {
		String: 1,
		Int: 2,
		BigInt: 4,
		Float: 8,
		Decimal: 16,
		Boolean: 32,
		DateTime: 64,
		Json: 128,
		Bytes: 256
	};
	function nc(e, t) {
		return (e.flags & t) !== 0;
	}
	function rc(e) {
		return e.scalarMask;
	}
	var ic = new Set([
		"DateTime",
		"Decimal",
		"BigInt",
		"Bytes",
		"Json",
		"Raw"
	]);
	function ac(e) {
		if (e == null) return { kind: "null" };
		if (typeof e == "string" || typeof e == "number" || typeof e == "boolean") return {
			kind: "primitive",
			value: e
		};
		if (Array.isArray(e)) return {
			kind: "array",
			items: e
		};
		if (typeof e == "object") {
			let t = e;
			if ("$type" in t && typeof t.$type == "string") {
				let e = t.$type;
				return ic.has(e) ? {
					kind: "taggedScalar",
					tag: e,
					value: t.value
				} : {
					kind: "structural",
					value: t.value
				};
			}
			return {
				kind: "object",
				entries: t
			};
		}
		return {
			kind: "structural",
			value: e
		};
	}
	function oc(e) {
		return typeof e == "object" && !!e && !Array.isArray(e) && !("$type" in e);
	}
	function sc(e) {
		return typeof e == "object" && !!e && "$type" in e && typeof e.$type == "string";
	}
	function cc(e, t) {
		let n = new uc(t), r = e.modelName ? `${e.modelName}.${e.action}` : e.action, i = t.root(r);
		return {
			parameterizedQuery: {
				...e,
				query: n.parameterizeFieldSelection(e.query, i?.argsNodeId, i?.outputNodeId)
			},
			placeholderValues: n.getPlaceholderValues()
		};
	}
	function lc(e, t) {
		let n = new uc(t), r = [];
		for (let i = 0; i < e.batch.length; i++) {
			let a = e.batch[i], o = a.modelName ? `${a.modelName}.${a.action}` : a.action, s = t.root(o);
			r.push({
				...a,
				query: n.parameterizeFieldSelection(a.query, s?.argsNodeId, s?.outputNodeId)
			});
		}
		return {
			parameterizedBatch: {
				...e,
				batch: r
			},
			placeholderValues: n.getPlaceholderValues()
		};
	}
	var uc = class {
		#e;
		#t = /* @__PURE__ */ new Map();
		#n = /* @__PURE__ */ new Map();
		#r = 1;
		constructor(e) {
			this.#e = e;
		}
		getPlaceholderValues() {
			return Object.fromEntries(this.#t);
		}
		#i(e, t) {
			let n = mc(e, t), r = this.#n.get(n);
			if (r !== void 0) return dc(r, t);
			let i = `%${this.#r++}`;
			return this.#n.set(n, i), this.#t.set(i, e), dc(i, t);
		}
		parameterizeFieldSelection(e, t, n) {
			let r = this.#e.inputNode(t), i = this.#e.outputNode(n), a = { ...e };
			return e.arguments && e.arguments.$type !== "Raw" && (a.arguments = this.#a(e.arguments, r)), e.selection && (a.selection = this.#d(e.selection, i)), a;
		}
		#a(e, t) {
			if (!t) return e;
			let n = {};
			for (let [r, i] of Object.entries(e)) {
				let e = this.#e.inputEdge(t, r);
				e ? n[r] = this.#o(i, e) : n[r] = i;
			}
			return n;
		}
		#o(e, t) {
			let n = ac(e);
			switch (n.kind) {
				case "null": return e;
				case "structural": return e;
				case "primitive": return this.#s(n.value, t);
				case "taggedScalar": return this.#c(e, n.tag, t);
				case "array": return this.#l(n.items, e, t);
				case "object": return this.#u(n.entries, t);
				default: throw Error(`Unknown value kind ${n.kind}`);
			}
		}
		#s(e, t) {
			if (nc(t, ec.ParamEnum) && t.enumNameIndex !== void 0 && typeof e == "string") {
				let n = this.#e.enumValues(t);
				if (n && Object.hasOwn(n, e)) return this.#i(n[e], { type: "Enum" });
			}
			if (!nc(t, ec.ParamScalar)) return e;
			let n = rc(t);
			if (n === 0) return e;
			let r = _c(e);
			return vc(r, n) ? (n & tc.Json && (e = JSON.stringify(e)), this.#i(e, r)) : e;
		}
		#c(e, t, n) {
			if (!nc(n, ec.ParamScalar)) return e;
			let r = rc(n);
			if (r === 0 || !Sc(t, r)) return e;
			let i = yc(e.$type), a = Tc(e);
			return this.#i(a, i);
		}
		#l(e, t, n) {
			if (nc(n, ec.ParamScalar) && rc(n) & tc.Json) {
				let t = Ea(ka(e));
				return this.#i(t, { type: "Json" });
			}
			if (nc(n, ec.ParamEnum)) {
				let t = this.#e.enumValues(n);
				if (t && e.every((e) => typeof e == "string" && Object.hasOwn(t, e))) return this.#i(e, {
					type: "List",
					inner: { type: "Enum" }
				});
			}
			if (nc(n, ec.ParamListScalar) && e.every((e) => Cc(e, n)) && e.length > 0) {
				let t = e.map((e) => wc(e)), n = {
					type: "List",
					inner: bc(e)
				};
				return this.#i(t, n);
			}
			if (nc(n, ec.ListObject)) {
				let t = this.#e.inputNode(n.childNodeId);
				if (t) return e.map((e) => oc(e) ? this.#a(e, t) : e);
			}
			return t;
		}
		#u(e, t) {
			if (nc(t, ec.Object)) {
				let n = this.#e.inputNode(t.childNodeId);
				if (n) return this.#a(e, n);
			}
			if (rc(t) & tc.Json) {
				let t = Ea(ka(e));
				return this.#i(t, { type: "Json" });
			}
			return e;
		}
		#d(e, t) {
			if (!e || !t) return e;
			let n = {};
			for (let [r, i] of Object.entries(e)) {
				if (r === "$scalars" || r === "$composites" || typeof i == "boolean") {
					n[r] = i;
					continue;
				}
				let e = this.#e.outputEdge(t, r);
				if (e) {
					let t = i, a = this.#e.inputNode(e.argsNodeId), o = this.#e.outputNode(e.outputNodeId), s = { selection: t.selection ? this.#d(t.selection, o) : {} };
					t.arguments && (s.arguments = this.#a(t.arguments, a)), n[r] = s;
				} else n[r] = i;
			}
			return n;
		}
	};
	function dc(e, t) {
		return {
			$type: "Param",
			value: {
				name: e,
				...t
			}
		};
	}
	function fc(e) {
		return e.type === "List" ? `List<${fc(e.inner)}>` : e.type;
	}
	function pc(e) {
		return ArrayBuffer.isView(e) ? Buffer.from(e.buffer, e.byteOffset, e.byteLength).toString("base64") : JSON.stringify(e);
	}
	function mc(e, t) {
		return `${fc(t)}:${pc(e)}`;
	}
	var hc = 2 ** 31 - 1, gc = -(2 ** 31);
	function _c(e) {
		switch (typeof e) {
			case "boolean": return { type: "Boolean" };
			case "number": return Number.isInteger(e) ? gc <= e && e <= hc ? { type: "Int" } : { type: "BigInt" } : { type: "Float" };
			case "string": return { type: "String" };
			default: throw Error("unreachable");
		}
	}
	function vc({ type: e }, t) {
		switch (e) {
			case "Boolean": return (t & tc.Boolean) !== 0;
			case "Int": return (t & (tc.Int | tc.BigInt | tc.Float)) !== 0;
			case "BigInt": return (t & tc.BigInt) !== 0;
			case "Float": return (t & tc.Float) !== 0;
			case "String": return (t & tc.String) !== 0;
			default: return !1;
		}
	}
	function yc(e) {
		switch (e) {
			case "BigInt":
			case "Bytes":
			case "DateTime":
			case "Json": return { type: e };
			case "Decimal": return { type: "Float" };
			default: return;
		}
	}
	function bc(e) {
		let t = { type: "Any" };
		for (let n of e) {
			let e = ac(n), r;
			switch (e.kind) {
				case "primitive":
					r = _c(e.value);
					break;
				case "taggedScalar":
					r = yc(e.tag) ?? { type: "Any" };
					break;
				default: return { type: "Any" };
			}
			t = xc(t, r);
		}
		return t;
	}
	function xc(e, t) {
		if (e.type === "Any") return t;
		if (t.type === "Any" || e.type === t.type) return e;
		let n = {
			Int: 0,
			BigInt: 1,
			Float: 2
		}, r = n[e.type], i = n[t.type];
		return r !== void 0 && i !== void 0 ? r >= i ? e : t : { type: "Any" };
	}
	function Sc(e, t) {
		switch (e) {
			case "DateTime": return (t & tc.DateTime) !== 0;
			case "Decimal": return (t & tc.Decimal) !== 0;
			case "BigInt": return (t & tc.BigInt) !== 0;
			case "Bytes": return (t & tc.Bytes) !== 0;
			case "Json": return (t & tc.Json) !== 0;
			default: return !1;
		}
	}
	function Cc(e, t) {
		let n = ac(e);
		switch (n.kind) {
			case "structural": return !1;
			case "null": return !1;
			case "primitive": {
				let e = _c(n.value), r = rc(t);
				return r !== 0 && vc(e, r);
			}
			case "taggedScalar": {
				let e = rc(t);
				return e !== 0 && Sc(n.tag, e);
			}
			default: return !1;
		}
	}
	function wc(e) {
		return sc(e) ? Tc(e) : e;
	}
	function Tc(e) {
		return e.value;
	}
	async function Ec() {
		return globalThis.crypto ?? await import("node:crypto");
	}
	async function Dc() {
		return (await Ec()).randomUUID();
	}
	async function Oc(e, t) {
		return new Promise((n) => {
			e.addEventListener(t, n, { once: !0 });
		});
	}
	var kc = class extends Ma {
		name = "TransactionManagerError";
		constructor(e, t) {
			super("Transaction API error: " + e, "P2028", t);
		}
	}, Ac = class extends kc {
		constructor() {
			super("Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting.");
		}
	}, jc = class extends kc {
		constructor(e) {
			super(`Transaction already closed: A ${e} cannot be executed on a committed transaction.`);
		}
	}, Mc = class extends kc {
		constructor(e) {
			super(`Transaction already closed: A ${e} cannot be executed on a transaction that was rolled back.`);
		}
	}, Nc = class extends kc {
		constructor() {
			super("Unable to start a transaction in the given time.");
		}
	}, Pc = class extends kc {
		constructor(e, { timeout: t, timeTaken: n }) {
			super(`A ${e} cannot be executed on an expired transaction. The timeout for this transaction was ${t} ms, however ${n} ms passed since the start of the transaction. Consider increasing the interactive transaction timeout or doing less work in the transaction.`, {
				operation: e,
				timeout: t,
				timeTaken: n
			});
		}
	}, Fc = class extends kc {
		constructor(e) {
			super(`Internal Consistency Error: ${e}`);
		}
	}, Ic = class extends kc {
		constructor(e) {
			super(`Invalid isolation level: ${e}`, { isolationLevel: e });
		}
	}, Lc = 100, Rc = Ge("prisma:client:transactionManager"), zc = () => ({
		sql: "COMMIT",
		args: [],
		argTypes: []
	}), Bc = () => ({
		sql: "ROLLBACK",
		args: [],
		argTypes: []
	}), Vc = () => ({
		sql: "-- Implicit \"COMMIT\" query via underlying driver",
		args: [],
		argTypes: []
	}), Hc = () => ({
		sql: "-- Implicit \"ROLLBACK\" query via underlying driver",
		args: [],
		argTypes: []
	}), Uc = class {
		transactions = /* @__PURE__ */ new Map();
		closedTransactions = [];
		driverAdapter;
		transactionOptions;
		tracingHelper;
		#e;
		#t;
		constructor({ driverAdapter: e, transactionOptions: t, tracingHelper: n, onQuery: r, provider: i }) {
			this.driverAdapter = e, this.transactionOptions = t, this.tracingHelper = n, this.#e = r, this.#t = i;
		}
		async startInternalTransaction(e) {
			let t = e === void 0 ? {} : this.#p(e);
			return await this.tracingHelper.runInChildSpan("start_transaction", () => this.#n(t));
		}
		async startTransaction(e) {
			let t = e === void 0 ? this.transactionOptions : this.#p(e);
			return await this.tracingHelper.runInChildSpan("start_transaction", () => this.#n(t));
		}
		async #n(e) {
			if (e.newTxId) return await this.#u(e.newTxId, "start", async (e) => {
				if (e.status !== "running") throw new Fc(`Transaction in invalid state ${e.status} when starting a nested transaction.`);
				if (!e.transaction) throw new Fc("Transaction missing underlying driver transaction when starting a nested transaction.");
				e.depth += 1;
				let t = this.#i(e);
				e.savepoints.push(t);
				try {
					await this.#a(e.transaction)(t);
				} catch (t) {
					throw --e.depth, e.savepoints.pop(), t;
				}
				return { id: e.id };
			});
			let t = {
				id: await Dc(),
				status: "waiting",
				timer: void 0,
				timeout: e.timeout,
				startedAt: Date.now(),
				transaction: void 0,
				operationQueue: Promise.resolve(),
				depth: 1,
				savepoints: [],
				savepointCounter: 0
			}, n = new AbortController(), r = Wc(() => n.abort(), e.maxWait);
			r?.unref?.();
			let i = this.driverAdapter.startTransaction(e.isolationLevel).catch(Na);
			switch (t.transaction = await Promise.race([i.finally(() => clearTimeout(r)), Oc(n.signal, "abort").then(() => {})]), this.transactions.set(t.id, t), t.status) {
				case "waiting":
					if (n.signal.aborted) throw i.then((e) => e.rollback()).catch((e) => Rc("error in discarded transaction:", e)), await this.#f(t, "timed_out"), new Nc();
					return t.status = "running", t.timer = this.#l(t.id, e.timeout), { id: t.id };
				case "timed_out":
				case "running":
				case "committed":
				case "rolled_back": throw new Fc(`Transaction in invalid state ${t.status} although it just finished startup.`);
				default: J(t.status, "Unknown transaction status.");
			}
		}
		async commitTransaction(e) {
			return await this.tracingHelper.runInChildSpan("commit_transaction", async () => {
				await this.#u(e, "commit", async (e) => {
					if (e.depth > 1) {
						if (!e.transaction) throw new Ac();
						let t = e.savepoints.at(-1);
						if (!t) throw new Fc(`Missing savepoint for nested commit. Depth: ${e.depth}, transactionId: ${e.id}`);
						try {
							await this.#s(e.transaction, t);
						} finally {
							e.savepoints.pop(), --e.depth;
						}
						return;
					}
					await this.#f(e, "committed");
				});
			});
		}
		async rollbackTransaction(e) {
			return await this.tracingHelper.runInChildSpan("rollback_transaction", async () => {
				await this.#u(e, "rollback", async (e) => {
					if (e.depth > 1) {
						if (!e.transaction) throw new Ac();
						let t = e.savepoints.at(-1);
						if (!t) throw new Fc(`Missing savepoint for nested rollback. Depth: ${e.depth}, transactionId: ${e.id}`);
						try {
							await this.#o(e.transaction)(t), await this.#s(e.transaction, t);
						} finally {
							e.savepoints.pop(), --e.depth;
						}
						return;
					}
					await this.#f(e, "rolled_back");
				});
			});
		}
		async getTransaction(e, t) {
			let n = this.#r(e.id, t);
			if (n.status === "closing" && (await n.closing, n = this.#r(e.id, t)), !n.transaction) throw new Ac();
			return n.transaction;
		}
		#r(e, t) {
			let n = this.transactions.get(e);
			if (!n) {
				let n = this.closedTransactions.find((t) => t.id === e);
				if (n) switch (Rc("Transaction already closed.", {
					transactionId: e,
					status: n.status
				}), n.status) {
					case "closing":
					case "waiting":
					case "running": throw new Fc("Active transaction found in closed transactions list.");
					case "committed": throw new jc(t);
					case "rolled_back": throw new Mc(t);
					case "timed_out": throw new Pc(t, {
						timeout: n.timeout,
						timeTaken: Date.now() - n.startedAt
					});
				}
				else throw Rc("Transaction not found.", e), new Ac();
			}
			if ([
				"committed",
				"rolled_back",
				"timed_out"
			].includes(n.status)) throw new Fc("Closed transaction found in active transactions map.");
			return n;
		}
		async cancelAllTransactions() {
			await Promise.allSettled([...this.transactions.values()].map((e) => this.#d(e, async () => {
				let t = this.transactions.get(e.id);
				t && await this.#f(t, "rolled_back");
			})));
		}
		#i(e) {
			return `prisma_sp_${e.savepointCounter++}`;
		}
		#a(e) {
			if (e.createSavepoint) return e.createSavepoint.bind(e);
			throw new kc(`Nested transactions are not supported by adapter "${e.adapterName}" (${e.provider}): createSavepoint is not implemented.`);
		}
		#o(e) {
			if (e.rollbackToSavepoint) return e.rollbackToSavepoint.bind(e);
			throw new kc(`Nested transactions are not supported by adapter "${e.adapterName}" (${e.provider}): rollbackToSavepoint is not implemented.`);
		}
		async #s(e, t) {
			e.releaseSavepoint && await e.releaseSavepoint(t);
		}
		#c(e) {
			Rc("Transaction already committed or rolled back when timeout happened.", e);
		}
		#l(e, t) {
			let n = Date.now(), r = Wc(async () => {
				Rc("Transaction timed out.", {
					transactionId: e,
					timeoutStartedAt: n,
					timeout: t
				});
				let r = this.transactions.get(e);
				if (!r) {
					this.#c(e);
					return;
				}
				await this.#d(r, async () => {
					let t = this.transactions.get(e);
					t && ["running", "waiting"].includes(t.status) ? await this.#f(t, "timed_out") : this.#c(e);
				});
			}, t);
			return r?.unref?.(), r;
		}
		async #u(e, t, n) {
			let r = this.#r(e, t);
			return await this.#d(r, async () => await n(this.#r(e, t)));
		}
		async #d(e, t) {
			let n = e.operationQueue, r;
			e.operationQueue = new Promise((e) => {
				r = e;
			}), await n;
			try {
				return await t();
			} finally {
				r();
			}
		}
		async #f(e, t) {
			e.status === "closing" ? (await e.closing, this.#r(e.id, t === "committed" ? "commit" : "rollback")) : await Object.assign(e, {
				status: "closing",
				reason: t,
				closing: (async () => {
					Rc("Closing transaction.", {
						transactionId: e.id,
						status: t
					});
					try {
						if (e.transaction && t === "committed") if (e.transaction.options.usePhantomQuery) await this.#m(Vc(), e.transaction, () => e.transaction.commit());
						else {
							let t = zc();
							await this.#m(t, e.transaction, () => e.transaction.executeRaw(t)).then(() => e.transaction.commit(), (t) => {
								let n = () => Promise.reject(t);
								return e.transaction.rollback().then(n, n);
							});
						}
						else if (e.transaction) if (e.transaction.options.usePhantomQuery) await this.#m(Hc(), e.transaction, () => e.transaction.rollback());
						else {
							let t = Bc();
							try {
								await this.#m(t, e.transaction, () => e.transaction.executeRaw(t));
							} finally {
								await e.transaction.rollback();
							}
						}
					} finally {
						e.status = t, clearTimeout(e.timer), e.timer = void 0, this.transactions.delete(e.id), this.closedTransactions.push(e), this.closedTransactions.length > Lc && this.closedTransactions.shift();
					}
				})()
			}).closing;
		}
		#p(e) {
			if (!e.timeout) throw new kc("timeout is required");
			if (!e.maxWait) throw new kc("maxWait is required");
			if (e.isolationLevel === "SNAPSHOT") throw new Ic(e.isolationLevel);
			return {
				...e,
				timeout: e.timeout,
				maxWait: e.maxWait
			};
		}
		#m(e, t, n) {
			return ao({
				query: e,
				execute: n,
				provider: this.#t ?? t.provider,
				tracingHelper: this.tracingHelper,
				onQuery: this.#e
			});
		}
	};
	function Wc(e, t) {
		return t === void 0 ? void 0 : setTimeout(e, t);
	}
	var Gc = y(), Kc = "7.7.0", qc = {
		bigint: "bigint",
		date: "datetime",
		decimal: "decimal",
		bytes: "bytes"
	};
	function Jc(e) {
		let t;
		try {
			t = JSON.parse(e);
		} catch (e) {
			throw Error(`Received invalid serialized parameters: ${e.message}`);
		}
		if (!Array.isArray(t)) throw Error("Received invalid serialized parameters: expected an array");
		return {
			args: t.map((e) => Yc(e)),
			argTypes: t.map((e) => Xc(e))
		};
	}
	function Yc(e) {
		if (Array.isArray(e)) return e.map((e) => Yc(e));
		if (typeof e == "object" && e && "prisma__value" in e) {
			if (!("prisma__type" in e)) throw Error("Invalid serialized parameter, prisma__type should be present when prisma__value is present");
			return `${e.prisma__value}`;
		}
		return typeof e == "object" && e ? JSON.stringify(e) : e;
	}
	function Xc(e) {
		return Array.isArray(e) ? {
			scalarType: e.length > 0 ? Zc(e[0]) : "unknown",
			arity: "list"
		} : {
			scalarType: Zc(e),
			arity: "scalar"
		};
	}
	function Zc(e) {
		return typeof e == "object" && e && "prisma__type" in e && typeof e.prisma__type == "string" && e.prisma__type in qc ? qc[e.prisma__type] : typeof e == "number" ? "decimal" : typeof e == "string" ? "string" : "unknown";
	}
	function Qc(e, t) {
		return {
			batch: e,
			transaction: t?.kind === "batch" ? { isolationLevel: t.options.isolationLevel } : void 0
		};
	}
	function $c(e) {
		return e ? e.replace(/".*"/g, "\"X\"").replace(/[\s:\[]([+-]?([0-9]*[.])?[0-9]+)/g, (e) => `${e[0]}5`) : "";
	}
	function el(e) {
		return e.split("\n").map((e) => e.replace(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)\s*/, "").replace(/\+\d+\s*ms$/, "")).join("\n");
	}
	var tl = f(b());
	function nl({ title: e, user: t = "prisma", repo: n = "prisma", template: r = "bug_report.yml", body: i }) {
		return (0, tl.default)({
			user: t,
			repo: n,
			template: r,
			title: e,
			body: i
		});
	}
	function rl({ version: e, binaryTarget: t, title: n, description: r, engineVersion: i, database: a, query: o }) {
		let s = el(dt(qe(6e3 - (o?.length ?? 0)))), c = r ? `# Description
\`\`\`
${r}
\`\`\`` : "";
		return `${n}

This is a non-recoverable error which probably happens when the Prisma Query Engine has a panic.

${xe(nl({
			title: n,
			body: dt(`Hi Prisma Team! My Prisma Client just crashed. This is the report:
## Versions

| Name            | Version            |
|-----------------|--------------------|
| Node            | ${process.version?.padEnd(19)}| 
| OS              | ${t?.padEnd(19)}|
| Prisma Client   | ${e?.padEnd(19)}|
| Query Engine    | ${i?.padEnd(19)}|
| Database        | ${a?.padEnd(19)}|

${c}

## Logs
\`\`\`
${s}
\`\`\`

## Client Snippet
\`\`\`ts
// PLEASE FILL YOUR CODE SNIPPET HERE
\`\`\`

## Schema
\`\`\`prisma
// PLEASE ADD YOUR SCHEMA HERE IF POSSIBLE
\`\`\`

## Prisma Engine Query
\`\`\`
${o ? $c(o) : ""}
\`\`\`
`)
		}))}

If you want the Prisma team to look into it, please open the link above \u{1F64F}
To increase the chance of success, please post your schema and a snippet of
how you used Prisma Client in the issue. 
`;
	}
	var il = class e {
		#e;
		#t;
		#n;
		#r;
		#i;
		constructor(e, t, n) {
			this.#e = e, this.#t = t, this.#n = n, this.#r = t.getConnectionInfo?.(), this.#i = Ls.forSql({
				onQuery: this.#e.onQuery,
				tracingHelper: this.#e.tracingHelper,
				provider: this.#e.provider,
				connectionInfo: this.#r
			});
		}
		static async connect(t) {
			let n, r;
			try {
				n = await t.driverAdapterFactory.connect(), r = new Uc({
					driverAdapter: n,
					transactionOptions: t.transactionOptions,
					tracingHelper: t.tracingHelper,
					onQuery: t.onQuery,
					provider: t.provider
				});
			} catch (e) {
				throw await n?.dispose(), e;
			}
			return new e(t, n, r);
		}
		getConnectionInfo() {
			let e = this.#r ?? { supportsRelationJoins: !1 };
			return Promise.resolve({
				provider: this.#t.provider,
				connectionInfo: e
			});
		}
		async execute({ plan: e, placeholderValues: t, transaction: n, batchIndex: r, queryInfo: i }) {
			let a = n ? await this.#n.getTransaction(n, r === void 0 ? "query" : "batch query") : this.#t;
			return await this.#i.run(e, {
				queryable: a,
				transactionManager: n ? { enabled: !1 } : {
					enabled: !0,
					manager: this.#n
				},
				scope: t,
				sqlCommenter: this.#e.sqlCommenters && {
					plugins: this.#e.sqlCommenters,
					queryInfo: i
				}
			});
		}
		async startTransaction(e) {
			return {
				...await this.#n.startTransaction(e),
				payload: void 0
			};
		}
		async commitTransaction(e) {
			await this.#n.commitTransaction(e.id);
		}
		async rollbackTransaction(e) {
			await this.#n.rollbackTransaction(e.id);
		}
		async disconnect() {
			try {
				await this.#n.cancelAllTransactions();
			} finally {
				await this.#t.dispose();
			}
		}
		apiKey() {
			return null;
		}
	}, al = class {
		#e;
		#t;
		#n;
		constructor(e = 1e3) {
			this.#e = /* @__PURE__ */ new Map(), this.#t = /* @__PURE__ */ new Map(), this.#n = e;
		}
		getSingle(e) {
			let t = this.#e.get(e);
			return t && (this.#e.delete(e), this.#e.set(e, t)), t;
		}
		setSingle(e, t) {
			if (this.#e.has(e)) {
				this.#e.delete(e), this.#e.set(e, t);
				return;
			}
			if (this.#e.size >= this.#n) {
				let e = this.#e.keys().next().value;
				e !== void 0 && this.#e.delete(e);
			}
			this.#e.set(e, t);
		}
		getBatch(e) {
			let t = this.#t.get(e);
			return t && (this.#t.delete(e), this.#t.set(e, t)), t;
		}
		setBatch(e, t) {
			if (this.#t.has(e)) {
				this.#t.delete(e), this.#t.set(e, t);
				return;
			}
			if (this.#t.size >= this.#n) {
				let e = this.#t.keys().next().value;
				e !== void 0 && this.#t.delete(e);
			}
			this.#t.set(e, t);
		}
		clear() {
			this.#e.clear(), this.#t.clear();
		}
		get size() {
			return this.#e.size + this.#t.size;
		}
		get singleCacheSize() {
			return this.#e.size;
		}
		get batchCacheSize() {
			return this.#t.size;
		}
	}, ol = y(), sl = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
	function cl(e, t, n) {
		let r = n || {}, i = r.encode || encodeURIComponent;
		if (typeof i != "function") throw TypeError("option encode is invalid");
		if (!sl.test(e)) throw TypeError("argument name is invalid");
		let a = i(t);
		if (a && !sl.test(a)) throw TypeError("argument val is invalid");
		let o = e + "=" + a;
		if (r.maxAge !== void 0 && r.maxAge !== null) {
			let e = r.maxAge - 0;
			if (Number.isNaN(e) || !Number.isFinite(e)) throw TypeError("option maxAge is invalid");
			o += "; Max-Age=" + Math.floor(e);
		}
		if (r.domain) {
			if (!sl.test(r.domain)) throw TypeError("option domain is invalid");
			o += "; Domain=" + r.domain;
		}
		if (r.path) {
			if (!sl.test(r.path)) throw TypeError("option path is invalid");
			o += "; Path=" + r.path;
		}
		if (r.expires) {
			if (!ll(r.expires) || Number.isNaN(r.expires.valueOf())) throw TypeError("option expires is invalid");
			o += "; Expires=" + r.expires.toUTCString();
		}
		if (r.httpOnly && (o += "; HttpOnly"), r.secure && (o += "; Secure"), r.priority) switch (typeof r.priority == "string" ? r.priority.toLowerCase() : r.priority) {
			case "low":
				o += "; Priority=Low";
				break;
			case "medium":
				o += "; Priority=Medium";
				break;
			case "high":
				o += "; Priority=High";
				break;
			default: throw TypeError("option priority is invalid");
		}
		if (r.sameSite) switch (typeof r.sameSite == "string" ? r.sameSite.toLowerCase() : r.sameSite) {
			case !0:
				o += "; SameSite=Strict";
				break;
			case "lax":
				o += "; SameSite=Lax";
				break;
			case "strict":
				o += "; SameSite=Strict";
				break;
			case "none":
				o += "; SameSite=None";
				break;
			default: throw TypeError("option sameSite is invalid");
		}
		return r.partitioned && (o += "; Partitioned"), o;
	}
	function ll(e) {
		return Object.prototype.toString.call(e) === "[object Date]" || e instanceof Date;
	}
	function ul(e, t) {
		let n = (e || "").split(";").filter((e) => typeof e == "string" && !!e.trim()), r = dl(n.shift() || ""), i = r.name, a = r.value;
		try {
			a = t?.decode === !1 ? a : (t?.decode || decodeURIComponent)(a);
		} catch {}
		let o = {
			name: i,
			value: a
		};
		for (let e of n) {
			let t = e.split("="), n = (t.shift() || "").trimStart().toLowerCase(), r = t.join("=");
			switch (n) {
				case "expires":
					o.expires = new Date(r);
					break;
				case "max-age":
					o.maxAge = Number.parseInt(r, 10);
					break;
				case "secure":
					o.secure = !0;
					break;
				case "httponly":
					o.httpOnly = !0;
					break;
				case "samesite":
					o.sameSite = r;
					break;
				default: o[n] = r;
			}
		}
		return o;
	}
	function dl(e) {
		let t = "", n = "", r = e.split("=");
		return r.length > 1 ? (t = r.shift(), n = r.join("=")) : n = e, {
			name: t,
			value: n
		};
	}
	var fl = class extends Error {
		clientVersion;
		cause;
		constructor(e, t) {
			super(e), this.clientVersion = t.clientVersion, this.cause = t.cause;
		}
		get [Symbol.toStringTag]() {
			return this.name;
		}
	}, pl = class extends fl {
		isRetryable;
		constructor(e, t) {
			super(e, t), this.isRetryable = t.isRetryable ?? !0;
		}
	};
	function ml(e, t) {
		return {
			...e,
			isRetryable: t
		};
	}
	var hl = class extends pl {
		name = "InvalidDatasourceError";
		code = "P6001";
		constructor(e, t) {
			super(e, ml(t, !1));
		}
	};
	_t(hl, "InvalidDatasourceError");
	function gl(e) {
		let t = { clientVersion: e.clientVersion }, n;
		try {
			n = new URL(e.accelerateUrl);
		} catch (e) {
			let n = e.message;
			throw new hl(`Error validating \`accelerateUrl\`, the URL cannot be parsed, reason: ${n}`, t);
		}
		let { protocol: r, searchParams: i } = n;
		if (r !== "prisma:" && r !== Qe) throw new hl("Error validating `accelerateUrl`: the URL must start with the protocol `prisma://` or `prisma+postgres://`", t);
		let a = i.get("api_key");
		if (a === null || a.length < 1) throw new hl("Error validating `accelerateUrl`: the URL must contain a valid API key", t);
		let o = et(n) ? "http:" : "https:";
		return process.env.TEST_CLIENT_ENGINE_REMOTE_EXECUTOR && n.searchParams.has("use_http") && (o = "http:"), {
			apiKey: a,
			url: new URL(n.href.replace(r, o))
		};
	}
	var _l = f(h()), vl = class {
		apiKey;
		tracingHelper;
		logLevel;
		logQueries;
		engineHash;
		constructor({ apiKey: e, tracingHelper: t, logLevel: n, logQueries: r, engineHash: i }) {
			this.apiKey = e, this.tracingHelper = t, this.logLevel = n, this.logQueries = r, this.engineHash = i;
		}
		build({ traceparent: e, transactionId: t } = {}) {
			let n = {
				Accept: "application/json",
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				"Prisma-Engine-Hash": this.engineHash,
				"Prisma-Engine-Version": _l.enginesVersion
			};
			this.tracingHelper.isEnabled() && (n.traceparent = e ?? this.tracingHelper.getTraceParent()), t && (n["X-Transaction-Id"] = t);
			let r = this.#e();
			return r.length > 0 && (n["X-Capture-Telemetry"] = r.join(", ")), n;
		}
		#e() {
			let e = [];
			return this.tracingHelper.isEnabled() && e.push("tracing"), this.logLevel && e.push(this.logLevel), this.logQueries && e.push("query"), e;
		}
	};
	function yl(e) {
		return e[0] * 1e3 + e[1] / 1e6;
	}
	function bl(e) {
		return new Date(yl(e));
	}
	var xl = Ge("prisma:client:clientEngine:remoteExecutor"), Sl = class {
		#e;
		#t;
		#n;
		#r;
		#i;
		#a;
		constructor(e) {
			this.#e = e.clientVersion, this.#r = e.logEmitter, this.#i = e.tracingHelper, this.#a = e.sqlCommenters;
			let { url: t, apiKey: n } = gl({
				clientVersion: e.clientVersion,
				accelerateUrl: e.accelerateUrl
			});
			this.#n = new Cl(t), this.#t = new vl({
				apiKey: n,
				engineHash: e.clientVersion,
				logLevel: e.logLevel,
				logQueries: e.logQueries,
				tracingHelper: e.tracingHelper
			});
		}
		async getConnectionInfo() {
			return await this.#o({
				path: "/connection-info",
				method: "GET"
			});
		}
		async execute({ plan: e, placeholderValues: t, batchIndex: n, model: r, operation: i, transaction: a, customFetch: o, queryInfo: s }) {
			let c = s && this.#a?.length ? eo(this.#a, { query: s }) : void 0;
			return (await this.#o({
				path: a ? `/transaction/${a.id}/query` : "/query",
				method: "POST",
				body: {
					model: r,
					operation: i,
					plan: e,
					params: t,
					comments: c && Object.keys(c).length > 0 ? c : void 0
				},
				batchRequestIdx: n,
				fetch: o
			})).data;
		}
		async startTransaction(e) {
			return {
				...await this.#o({
					path: "/transaction/start",
					method: "POST",
					body: e
				}),
				payload: void 0
			};
		}
		async commitTransaction(e) {
			await this.#o({
				path: `/transaction/${e.id}/commit`,
				method: "POST"
			});
		}
		async rollbackTransaction(e) {
			await this.#o({
				path: `/transaction/${e.id}/rollback`,
				method: "POST"
			});
		}
		disconnect() {
			return Promise.resolve();
		}
		apiKey() {
			return this.#t.apiKey;
		}
		async #o({ path: e, method: t, body: n, fetch: r = globalThis.fetch, batchRequestIdx: i }) {
			let a = await this.#n.request({
				method: t,
				path: e,
				headers: this.#t.build(),
				body: n,
				fetch: r
			});
			a.ok || await this.#s(a, i);
			let o = await a.json();
			return typeof o.extensions == "object" && o.extensions !== null && this.#c(o.extensions), o;
		}
		async #s(e, t) {
			let n = e.headers.get("Prisma-Error-Code"), r = await e.text(), i, a = r;
			try {
				i = JSON.parse(r);
			} catch {
				i = {};
			}
			typeof i.code == "string" && (n = i.code), typeof i.error == "string" ? a = i.error : typeof i.message == "string" ? a = i.message : typeof i.InvalidRequestError == "object" && i.InvalidRequestError !== null && typeof i.InvalidRequestError.reason == "string" && (a = i.InvalidRequestError.reason), a ||= `HTTP ${e.status}: ${e.statusText}`;
			let o = typeof i.meta == "object" && i.meta !== null ? i.meta : i;
			throw new ol.PrismaClientKnownRequestError(a, {
				clientVersion: this.#e,
				code: n ?? "P6000",
				batchRequestIdx: t,
				meta: o
			});
		}
		#c(e) {
			if (e.logs) for (let t of e.logs) this.#l(t);
			e.spans && this.#i.dispatchEngineSpans(e.spans);
		}
		#l(e) {
			switch (e.level) {
				case "debug":
				case "trace":
					xl(e);
					break;
				case "error":
				case "warn":
				case "info":
					this.#r.emit(e.level, {
						timestamp: bl(e.timestamp),
						message: e.attributes.message ?? "",
						target: e.target ?? "RemoteExecutor"
					});
					break;
				case "query":
					this.#r.emit("query", {
						query: e.attributes.query ?? "",
						timestamp: bl(e.timestamp),
						duration: e.attributes.duration_ms ?? 0,
						params: e.attributes.params ?? "",
						target: e.target ?? "RemoteExecutor"
					});
					break;
				default: throw Error(`Unexpected log level: ${e.level}`);
			}
		}
	}, Cl = class {
		#e;
		#t;
		#n;
		constructor(e) {
			this.#e = e, this.#t = /* @__PURE__ */ new Map();
		}
		async request({ method: e, path: t, headers: n, body: r, fetch: i }) {
			let a = new URL(t, this.#e), o = this.#r(a);
			o && (n.Cookie = o), this.#n && (n["Accelerate-Query-Engine-Jwt"] = this.#n);
			let s = await i(a.href, {
				method: e,
				body: r === void 0 ? void 0 : JSON.stringify(r),
				headers: n
			});
			return xl(e, a, s.status, s.statusText), this.#n = s.headers.get("Accelerate-Query-Engine-Jwt") ?? void 0, this.#i(a, s), s;
		}
		#r(e) {
			let t = [], n = /* @__PURE__ */ new Date();
			for (let [r, i] of this.#t) {
				if (i.expires && i.expires < n) {
					this.#t.delete(r);
					continue;
				}
				let a = i.domain ?? e.hostname, o = i.path ?? "/";
				e.hostname.endsWith(a) && e.pathname.startsWith(o) && t.push(cl(i.name, i.value));
			}
			return t.length > 0 ? t.join("; ") : void 0;
		}
		#i(e, t) {
			let n = t.headers.getSetCookie?.() || [];
			if (n.length === 0) {
				let e = t.headers.get("Set-Cookie");
				e && n.push(e);
			}
			for (let t of n) {
				let n = ul(t), r = n.domain ?? e.hostname, i = n.path ?? "/", a = `${r}:${i}:${n.name}`;
				this.#t.set(a, {
					name: n.name,
					value: n.value,
					domain: r,
					path: i,
					expires: n.expires
				});
			}
		}
	}, wl = y(), Tl = {}, El = { async loadQueryCompiler(e) {
		let { clientVersion: t, compilerWasm: n } = e;
		if (n === void 0) throw new wl.PrismaClientInitializationError("WASM query compiler was unexpectedly `undefined`", t);
		let r;
		return e.activeProvider === void 0 || Tl[e.activeProvider] === void 0 ? (r = (async () => {
			let e = await n.getRuntime(), r = await n.getQueryCompilerWasmModule();
			if (r == null) throw new wl.PrismaClientInitializationError("The loaded wasm module was unexpectedly `undefined` or `null` once loaded", t);
			let i = { [n.importName]: e }, a = new WebAssembly.Instance(r, i), o = a.exports.__wbindgen_start;
			return e.__wbg_set_wasm(a.exports), o(), e.QueryCompiler;
		})(), e.activeProvider !== void 0 && (Tl[e.activeProvider] = r)) : r = Tl[e.activeProvider], await r;
	} }, Dl = "P2038", Ol = Ge("prisma:client:clientEngine"), kl = globalThis;
	kl.PRISMA_WASM_PANIC_REGISTRY = { set_message(e) {
		throw new Gc.PrismaClientRustPanicError(e, Kc);
	} };
	var Al = class {
		name = "ClientEngine";
		#e;
		#t = { type: "disconnected" };
		#n;
		#r;
		#i;
		#a;
		config;
		datamodel;
		logEmitter;
		logQueries;
		logLevel;
		tracingHelper;
		#o;
		constructor(e, t) {
			if (e.accelerateUrl !== void 0) this.#r = {
				remote: !0,
				accelerateUrl: e.accelerateUrl
			};
			else if (e.adapter) this.#r = {
				remote: !1,
				driverAdapterFactory: e.adapter
			}, Ol("Using driver adapter: %O", e.adapter);
			else throw new Gc.PrismaClientInitializationError("Missing configured driver adapter. Engine type `client` requires an active driver adapter. Please check your PrismaClient initialization code.", e.clientVersion, Dl);
			this.#n = t ?? El, this.config = e, this.logQueries = e.logQueries ?? !1, this.logLevel = e.logLevel ?? "error", this.logEmitter = e.logEmitter, this.datamodel = e.inlineSchema, this.tracingHelper = e.tracingHelper, this.#i = new al(), this.#a = $s.deserialize(e.parameterizationSchema, (t) => {
				if (!Object.hasOwn(e.runtimeDataModel.enums, t)) return;
				let n = {};
				for (let r of e.runtimeDataModel.enums[t].values) n[r.name] = r.dbName ?? r.name;
				return n;
			}), e.enableDebugLogs && (this.logLevel = "debug"), this.logQueries && (this.#o = (e) => {
				this.logEmitter.emit("query", {
					...e,
					params: Ea(e.params),
					target: "ClientEngine"
				});
			});
		}
		async #s() {
			switch (this.#t.type) {
				case "disconnected": {
					let e = this.tracingHelper.runInChildSpan("connect", async () => {
						let e, t;
						try {
							e = await this.#c(), t = await this.#l(e);
						} catch (n) {
							throw this.#t = { type: "disconnected" }, t?.free(), await e?.disconnect(), n;
						}
						let n = {
							executor: e,
							queryCompiler: t
						};
						return this.#t = {
							type: "connected",
							engine: n
						}, n;
					});
					return this.#t = {
						type: "connecting",
						promise: e
					}, await e;
				}
				case "connecting": return await this.#t.promise;
				case "connected": return this.#t.engine;
				case "disconnecting": return await this.#t.promise, await this.#s();
			}
		}
		async #c() {
			return this.#r.remote ? new Sl({
				clientVersion: this.config.clientVersion,
				accelerateUrl: this.#r.accelerateUrl,
				logEmitter: this.logEmitter,
				logLevel: this.logLevel,
				logQueries: this.logQueries,
				tracingHelper: this.tracingHelper,
				sqlCommenters: this.config.sqlCommenters
			}) : await il.connect({
				driverAdapterFactory: this.#r.driverAdapterFactory,
				tracingHelper: this.tracingHelper,
				transactionOptions: {
					...this.config.transactionOptions,
					isolationLevel: this.#g(this.config.transactionOptions.isolationLevel)
				},
				onQuery: this.#o,
				provider: this.config.activeProvider,
				sqlCommenters: this.config.sqlCommenters
			});
		}
		async #l(e) {
			let t = this.#e;
			t === void 0 && (t = await this.#n.loadQueryCompiler(this.config), this.#e = t);
			let { provider: n, connectionInfo: r } = await e.getConnectionInfo();
			try {
				return this.#p(() => new t({
					datamodel: this.datamodel,
					provider: n,
					connectionInfo: r
				}), void 0, !1);
			} catch (e) {
				throw this.#u(e);
			}
		}
		#u(e) {
			if (e instanceof Gc.PrismaClientRustPanicError) return e;
			try {
				let t = JSON.parse(e.message);
				return new Gc.PrismaClientInitializationError(t.message, this.config.clientVersion, t.error_code);
			} catch {
				return e;
			}
		}
		#d(e, t) {
			if (e instanceof Gc.PrismaClientInitializationError) return e;
			if (e.code === "GenericFailure" && e.message?.startsWith("PANIC:")) return new Gc.PrismaClientRustPanicError(jl(this, e.message, t), this.config.clientVersion);
			if (e instanceof Ma) return new Gc.PrismaClientKnownRequestError(e.message, {
				code: e.code,
				meta: e.meta,
				clientVersion: this.config.clientVersion
			});
			try {
				let t = JSON.parse(e);
				return new Gc.PrismaClientUnknownRequestError(`${t.message}
${t.backtrace}`, { clientVersion: this.config.clientVersion });
			} catch {
				return e;
			}
		}
		#f(e) {
			return e instanceof Gc.PrismaClientRustPanicError ? e : typeof e.message == "string" && typeof e.code == "string" ? new Gc.PrismaClientKnownRequestError(e.message, {
				code: e.code,
				meta: e.meta,
				clientVersion: this.config.clientVersion
			}) : typeof e.message == "string" ? new Gc.PrismaClientUnknownRequestError(e.message, { clientVersion: this.config.clientVersion }) : e;
		}
		#p(e, t, n = !0) {
			let r = kl.PRISMA_WASM_PANIC_REGISTRY.set_message, i;
			global.PRISMA_WASM_PANIC_REGISTRY.set_message = (e) => {
				i = e;
			};
			try {
				return e();
			} finally {
				if (global.PRISMA_WASM_PANIC_REGISTRY.set_message = r, i) throw this.#e = void 0, n && this.stop().catch((e) => Ol("failed to disconnect:", e)), new Gc.PrismaClientRustPanicError(jl(this, i, t), this.config.clientVersion);
			}
		}
		onBeforeExit() {
			throw Error("\"beforeExit\" hook is not applicable to the client engine, it is only relevant and implemented for the binary engine. Please add your event listener to the `process` object directly instead.");
		}
		async start() {
			await this.#s();
		}
		async stop() {
			switch (this.#t.type) {
				case "disconnected": return;
				case "connecting": return await this.#t.promise, await this.stop();
				case "connected": {
					let e = this.#t.engine, t = this.tracingHelper.runInChildSpan("disconnect", async () => {
						try {
							await e.executor.disconnect(), e.queryCompiler.free();
						} finally {
							this.#t = { type: "disconnected" };
						}
					});
					return this.#t = {
						type: "disconnecting",
						promise: t
					}, await t;
				}
				case "disconnecting": return await this.#t.promise;
			}
		}
		version() {
			return "unknown";
		}
		async transaction(e, t, n) {
			let r, { executor: i } = await this.#s();
			try {
				if (e === "start") {
					let e = n;
					r = await i.startTransaction({
						...e,
						isolationLevel: this.#g(e.isolationLevel)
					});
				} else if (e === "commit") {
					let e = n;
					await i.commitTransaction(e);
				} else if (e === "rollback") {
					let e = n;
					await i.rollbackTransaction(e);
				} else Ye(e, "Invalid transaction action.");
			} catch (e) {
				throw this.#d(e);
			}
			return r ? {
				id: r.id,
				payload: void 0
			} : void 0;
		}
		async request(e, { interactiveTransaction: t, customDataProxyFetch: n }) {
			Ol("sending request");
			let { executor: r, queryCompiler: i } = await this.#s().catch((t) => {
				throw this.#d(t, JSON.stringify(e));
			}), a, o = {};
			if (Ml(e)) a = Nl(e);
			else {
				let { parameterizedQuery: t, placeholderValues: n } = cc(e, this.#a), r = JSON.stringify(t);
				o = n;
				let s = e.action !== "createMany" && e.action !== "createManyAndReturn", c = s ? this.#i.getSingle(r) : void 0;
				c ? (Ol("query plan cache hit"), a = c) : (Ol("query plan cache miss"), a = this.#m(t, r, i), s && this.#i.setSingle(r, a));
			}
			try {
				Ol("query plan created", a);
				let i = await r.execute({
					plan: a,
					model: e.modelName,
					operation: e.action,
					placeholderValues: o,
					transaction: t,
					batchIndex: void 0,
					customFetch: n?.(globalThis.fetch),
					queryInfo: {
						type: "single",
						modelName: e.modelName,
						action: e.action,
						query: e.query
					}
				});
				return Ol("query plan executed"), { data: { [e.action]: i } };
			} catch (t) {
				throw this.#d(t, JSON.stringify(e));
			}
		}
		async requestBatch(e, { transaction: t, customDataProxyFetch: n }) {
			if (e.length === 0) return [];
			let r = e[0].action, i = e[0].modelName, a = Qc(e, t), o = JSON.stringify(a), { executor: s, queryCompiler: c } = await this.#s().catch((e) => {
				throw this.#d(e, o);
			}), l = i === void 0, u, d = {};
			if (l) u = this.#h(e, o, c);
			else {
				let { parameterizedBatch: e, placeholderValues: t } = lc(a, this.#a), n = JSON.stringify(e);
				d = t;
				let r = this.#i.getBatch(n);
				if (r) Ol("batch query plan cache hit"), u = r;
				else {
					Ol("batch query plan cache miss");
					try {
						u = this.#h(e.batch, n, c), this.#i.setBatch(n, u);
					} catch (e) {
						throw this.#f(e);
					}
				}
			}
			try {
				let a;
				switch (t?.kind === "itx" && (a = t.options), u.type) {
					case "multi": {
						if (t?.kind !== "itx") {
							let e = t?.options.isolationLevel ? {
								...this.config.transactionOptions,
								isolationLevel: t.options.isolationLevel
							} : this.config.transactionOptions;
							a = await this.transaction("start", {}, e);
						}
						let r = [], i = !1;
						for (let [t, o] of u.plans.entries()) try {
							let i = await s.execute({
								plan: o,
								placeholderValues: d,
								model: e[t].modelName,
								operation: e[t].action,
								batchIndex: t,
								transaction: a,
								customFetch: n?.(globalThis.fetch),
								queryInfo: {
									type: "single",
									...e[t]
								}
							});
							r.push({ data: { [e[t].action]: i } });
						} catch (e) {
							r.push(e), i = !0;
							break;
						}
						return a !== void 0 && t?.kind !== "itx" && (i ? await this.transaction("rollback", {}, a) : await this.transaction("commit", {}, a)), r;
					}
					case "compacted":
						if (!e.every((e) => e.action === r && e.modelName === i)) {
							let t = e.map((e) => e.action).join(", "), n = e.map((e) => e.modelName).join(", ");
							throw Error(`Internal error: All queries in a compacted batch must have the same action and model name, but received actions: [${t}] and model names: [${n}]. This indicates a bug in the client. Please report this issue to the Prisma team with your query details.`);
						}
						if (i === void 0) throw Error("Internal error: A compacted batch cannot contain raw queries. This indicates a bug in the client. Please report this issue to the Prisma team with your query details.");
						return Va(await s.execute({
							plan: u.plan,
							placeholderValues: d,
							model: i,
							operation: r,
							batchIndex: void 0,
							transaction: a,
							customFetch: n?.(globalThis.fetch),
							queryInfo: {
								type: "compacted",
								action: r,
								modelName: i,
								queries: e
							}
						}), u, d).map((e) => ({ data: { [r]: e } }));
				}
			} catch (e) {
				throw this.#d(e, o);
			}
		}
		async apiKey() {
			let { executor: e } = await this.#s();
			return e.apiKey();
		}
		#m(e, t, n) {
			try {
				return this.#p(() => this.#_({
					queries: [e],
					execute: () => n.compile(t)
				}));
			} catch (e) {
				throw this.#f(e);
			}
		}
		#h(e, t, n) {
			if (e.every(Ml)) return {
				type: "multi",
				plans: e.map((e) => Nl(e))
			};
			try {
				return this.#p(() => this.#_({
					queries: e,
					execute: () => n.compileBatch(t)
				}));
			} catch (e) {
				throw this.#f(e);
			}
		}
		#g(e) {
			switch (e) {
				case void 0: return;
				case "ReadUncommitted": return "READ UNCOMMITTED";
				case "ReadCommitted": return "READ COMMITTED";
				case "RepeatableRead": return "REPEATABLE READ";
				case "Serializable": return "SERIALIZABLE";
				case "Snapshot": return "SNAPSHOT";
				default: throw new Gc.PrismaClientKnownRequestError(`Inconsistent column data: Conversion failed: Invalid isolation level \`${e}\``, {
					code: "P2023",
					clientVersion: this.config.clientVersion,
					meta: { providedIsolationLevel: e }
				});
			}
		}
		#_({ queries: e, execute: t }) {
			return this.tracingHelper.runInChildSpan({
				name: "compile",
				attributes: {
					models: e.map((e) => e.modelName).filter((e) => e !== void 0),
					actions: e.map((e) => e.action)
				}
			}, t);
		}
	};
	function jl(e, t, n) {
		return rl({
			binaryTarget: void 0,
			title: t,
			version: e.config.clientVersion,
			engineVersion: "unknown",
			database: e.config.activeProvider,
			query: n
		});
	}
	function Ml(e) {
		return e.action === "queryRaw" || e.action === "executeRaw";
	}
	function Nl(e) {
		let t = e.query.arguments.query, { args: n, argTypes: r } = Jc(e.query.arguments.parameters);
		return {
			type: e.action === "queryRaw" ? "query" : "execute",
			args: {
				type: "rawSql",
				sql: t,
				args: n,
				argTypes: r
			}
		};
	}
	function Pl(e) {
		return new Al(e);
	}
	var Fl = (e) => ({ command: e }), Il = y(), Ll = (e) => e.strings.reduce((e, t, n) => `${e}@P${n}${t}`), Rl = y();
	function zl(e) {
		try {
			return Bl(e, "fast");
		} catch {
			return Bl(e, "slow");
		}
	}
	function Bl(e, t) {
		return JSON.stringify(e.map((e) => Vl(e, t)));
	}
	function Vl(e, t) {
		if (Array.isArray(e)) return e.map((e) => Vl(e, t));
		if (typeof e == "bigint") return {
			prisma__type: "bigint",
			prisma__value: e.toString()
		};
		if (bt(e)) return {
			prisma__type: "date",
			prisma__value: e.toJSON()
		};
		if (Rl.Decimal.isDecimal(e)) return {
			prisma__type: "decimal",
			prisma__value: e.toJSON()
		};
		if (Buffer.isBuffer(e)) return {
			prisma__type: "bytes",
			prisma__value: e.toString("base64")
		};
		if (Hl(e)) return {
			prisma__type: "bytes",
			prisma__value: Buffer.from(e).toString("base64")
		};
		if (ArrayBuffer.isView(e)) {
			let { buffer: t, byteOffset: n, byteLength: r } = e;
			return {
				prisma__type: "bytes",
				prisma__value: Buffer.from(t, n, r).toString("base64")
			};
		}
		return typeof e == "object" && t === "slow" ? Ul(e) : e;
	}
	function Hl(e) {
		return e instanceof ArrayBuffer || e instanceof SharedArrayBuffer ? !0 : typeof e == "object" && e ? e[Symbol.toStringTag] === "ArrayBuffer" || e[Symbol.toStringTag] === "SharedArrayBuffer" : !1;
	}
	function Ul(e) {
		if (typeof e != "object" || !e) return e;
		if (typeof e.toJSON == "function") return e.toJSON();
		if (Array.isArray(e)) return e.map(Wl);
		let t = {};
		for (let n of Object.keys(e)) t[n] = Wl(e[n]);
		return t;
	}
	function Wl(e) {
		return typeof e == "bigint" ? e.toString() : Ul(e);
	}
	var Gl = /^(\s*alter\s)/i, Kl = Ge("prisma:client");
	function ql(e, t, n, r) {
		if (!(e !== "postgresql" && e !== "cockroachdb") && n.length > 0 && Gl.exec(t)) throw Error(`Running ALTER using ${r} is not supported
Using the example below you can still execute your query with Prisma, but please note that it is vulnerable to SQL injection attacks and requires you to take care of input sanitization.

Example:
  await prisma.$executeRawUnsafe(\`ALTER USER prisma WITH PASSWORD '\${password}'\`)

More Information: https://pris.ly/d/execute-raw
`);
	}
	var Jl = ({ clientMethod: e, activeProvider: t }) => (n) => {
		let r = "", i;
		if (Vr(n)) r = n.sql, i = {
			values: zl(n.values),
			__prismaRawParameters__: !0
		};
		else if (Array.isArray(n)) {
			let [e, ...t] = n;
			r = e, i = {
				values: zl(t || []),
				__prismaRawParameters__: !0
			};
		} else switch (t) {
			case "sqlite":
			case "mysql":
				r = n.sql, i = {
					values: zl(n.values),
					__prismaRawParameters__: !0
				};
				break;
			case "cockroachdb":
			case "postgresql":
			case "postgres":
				r = n.text, i = {
					values: zl(n.values),
					__prismaRawParameters__: !0
				};
				break;
			case "sqlserver":
				r = Ll(n), i = {
					values: zl(n.values),
					__prismaRawParameters__: !0
				};
				break;
			default: throw Error(`The ${t} provider does not support ${e}`);
		}
		return i?.values ? Kl(`prisma.${e}(${r}, ${i.values})`) : Kl(`prisma.${e}(${r})`), {
			query: r,
			parameters: i
		};
	}, Yl = {
		requestArgsToMiddlewareArgs(e) {
			return [e.strings, ...e.values];
		},
		middlewareArgsToRequestArgs(e) {
			let [t, ...n] = e;
			return new Il.Sql(t, n);
		}
	}, Xl = {
		requestArgsToMiddlewareArgs(e) {
			return [e];
		},
		middlewareArgsToRequestArgs(e) {
			return e[0];
		}
	};
	function Zl(e) {
		return function(t, n) {
			let r, i = (n = e) => {
				try {
					return n === void 0 || n?.kind === "itx" ? r ??= Ql(t(n)) : Ql(t(n));
				} catch (e) {
					return Promise.reject(e);
				}
			};
			return {
				get spec() {
					return n;
				},
				then(e, t) {
					return i().then(e, t);
				},
				catch(e) {
					return i().catch(e);
				},
				finally(e) {
					return i().finally(e);
				},
				requestTransaction(e) {
					let t = i(e);
					return t.requestTransaction ? t.requestTransaction(e) : t;
				},
				[Symbol.toStringTag]: "PrismaPromise"
			};
		};
	}
	function Ql(e) {
		return typeof e.then == "function" ? e : Promise.resolve(e);
	}
	var $l = {
		name: "@prisma/instrumentation-contract",
		version: "7.7.0",
		description: "Shared types and utilities for Prisma instrumentation",
		main: "dist/index.js",
		module: "dist/index.mjs",
		types: "dist/index.d.ts",
		exports: { ".": {
			require: {
				types: "./dist/index.d.ts",
				default: "./dist/index.js"
			},
			import: {
				types: "./dist/index.d.mts",
				default: "./dist/index.mjs"
			}
		} },
		license: "Apache-2.0",
		homepage: "https://www.prisma.io",
		repository: {
			type: "git",
			url: "https://github.com/prisma/prisma.git",
			directory: "packages/instrumentation-contract"
		},
		bugs: "https://github.com/prisma/prisma/issues",
		scripts: {
			dev: "DEV=true tsx helpers/build.ts",
			build: "tsx helpers/build.ts",
			prepublishOnly: "pnpm run build",
			test: "vitest run"
		},
		files: ["dist"],
		sideEffects: !1,
		devDependencies: { "@opentelemetry/api": "1.9.0" },
		peerDependencies: { "@opentelemetry/api": "^1.8" }
	}.version.split(".")[0], eu = "PRISMA_INSTRUMENTATION", tu = `V${$l}_PRISMA_INSTRUMENTATION`, nu = globalThis;
	function ru() {
		let e = nu[tu];
		return e?.helper ? e.helper : nu[eu]?.helper;
	}
	var iu = {
		isEnabled() {
			return !1;
		},
		getTraceParent() {
			return "00-10-10-00";
		},
		dispatchEngineSpans() {},
		getActiveContext() {},
		runInChildSpan(e, t) {
			return t();
		}
	}, au = class {
		isEnabled() {
			return this.getTracingHelper().isEnabled();
		}
		getTraceParent(e) {
			return this.getTracingHelper().getTraceParent(e);
		}
		dispatchEngineSpans(e) {
			return this.getTracingHelper().dispatchEngineSpans(e);
		}
		getActiveContext() {
			return this.getTracingHelper().getActiveContext();
		}
		runInChildSpan(e, t) {
			return this.getTracingHelper().runInChildSpan(e, t);
		}
		getTracingHelper() {
			return ru() ?? iu;
		}
	};
	function ou() {
		return new au();
	}
	function su(e, t = () => {}) {
		let n, r = new Promise((e) => n = e);
		return { then(i) {
			return --e === 0 && n(t()), i?.(r);
		} };
	}
	function cu(e) {
		return typeof e == "string" ? e : e.reduce((e, t) => {
			let n = typeof t == "string" ? t : t.level;
			return n === "query" ? e : e && (t === "info" || e === "info") ? "info" : n;
		}, void 0);
	}
	var lu = y();
	function uu(e) {
		if (e.action !== "findUnique" && e.action !== "findUniqueOrThrow") return;
		let t = [];
		return e.modelName && t.push(e.modelName), e.query.arguments && t.push(du(e.query.arguments)), t.push(du(e.query.selection)), t.join("");
	}
	function du(e) {
		return `(${Object.keys(e).sort().map((t) => {
			let n = e[t];
			return typeof n == "object" && n ? `(${t} ${du(n)})` : t;
		}).join(" ")})`;
	}
	var fu = {
		aggregate: !1,
		aggregateRaw: !1,
		createMany: !0,
		createManyAndReturn: !0,
		createOne: !0,
		deleteMany: !0,
		deleteOne: !0,
		executeRaw: !0,
		findFirst: !1,
		findFirstOrThrow: !1,
		findMany: !1,
		findRaw: !1,
		findUnique: !1,
		findUniqueOrThrow: !1,
		groupBy: !1,
		queryRaw: !1,
		runCommandRaw: !0,
		updateMany: !0,
		updateManyAndReturn: !0,
		updateOne: !0,
		upsertOne: !0
	};
	function pu(e) {
		return fu[e];
	}
	var mu = class {
		constructor(e) {
			this.options = e, this.batches = {};
		}
		batches;
		tickActive = !1;
		request(e) {
			let t = this.options.batchBy(e);
			return t ? (this.batches[t] || (this.batches[t] = [], this.tickActive || (this.tickActive = !0, process.nextTick(() => {
				this.dispatchBatches(), this.tickActive = !1;
			}))), new Promise((n, r) => {
				this.batches[t].push({
					request: e,
					resolve: n,
					reject: r
				});
			})) : this.options.singleLoader(e);
		}
		dispatchBatches() {
			for (let e in this.batches) {
				let t = this.batches[e];
				delete this.batches[e], t.length === 1 ? this.options.singleLoader(t[0].request).then((e) => {
					e instanceof Error ? t[0].reject(e) : t[0].resolve(e);
				}).catch((e) => {
					t[0].reject(e);
				}) : (t.sort((e, t) => this.options.batchOrder(e.request, t.request)), this.options.batchLoader(t.map((e) => e.request)).then((e) => {
					if (e instanceof Error) for (let n = 0; n < t.length; n++) t[n].reject(e);
					else for (let n = 0; n < t.length; n++) {
						let r = e[n];
						r instanceof Error ? t[n].reject(r) : t[n].resolve(r);
					}
				}).catch((e) => {
					for (let n = 0; n < t.length; n++) t[n].reject(e);
				}));
			}
		}
		get [Symbol.toStringTag]() {
			return "DataLoader";
		}
	}, hu = y();
	function gu(e, t) {
		if (t === null) return t;
		switch (e) {
			case "bigint": return BigInt(t);
			case "bytes": {
				let { buffer: e, byteOffset: n, byteLength: r } = Buffer.from(t, "base64");
				return new Uint8Array(e, n, r);
			}
			case "decimal": return new hu.Decimal(t);
			case "datetime":
			case "date": return new Date(t);
			case "time": return /* @__PURE__ */ new Date(`1970-01-01T${t}Z`);
			case "bigint-array": return t.map((e) => gu("bigint", e));
			case "bytes-array": return t.map((e) => gu("bytes", e));
			case "decimal-array": return t.map((e) => gu("decimal", e));
			case "datetime-array": return t.map((e) => gu("datetime", e));
			case "date-array": return t.map((e) => gu("date", e));
			case "time-array": return t.map((e) => gu("time", e));
			default: return t;
		}
	}
	function _u(e) {
		let t = [], n = vu(e);
		for (let r = 0; r < e.rows.length; r++) {
			let i = e.rows[r], a = { ...n };
			for (let t = 0; t < i.length; t++) a[e.columns[t]] = gu(e.types[t], i[t]);
			t.push(a);
		}
		return t;
	}
	function vu(e) {
		let t = {};
		for (let n = 0; n < e.columns.length; n++) t[e.columns[n]] = null;
		return t;
	}
	var yu = Ge("prisma:client:request_handler"), bu = class {
		client;
		dataloader;
		logEmitter;
		constructor(e, t) {
			this.logEmitter = t, this.client = e, this.dataloader = new mu({
				batchLoader: la(async ({ requests: e, customDataProxyFetch: t }) => {
					let { transaction: n, otelParentCtx: r } = e[0], i = e.map((e) => e.protocolQuery), a = this.client._tracingHelper.getTraceParent(r), o = e.some((e) => pu(e.protocolQuery.action));
					return (await this.client._engine.requestBatch(i, {
						traceparent: a,
						transaction: xu(n),
						containsWrite: o,
						customDataProxyFetch: t
					})).map((t, n) => {
						if (t instanceof Error) return t;
						try {
							return this.mapQueryEngineResult(e[n], t);
						} catch (e) {
							return e;
						}
					});
				}),
				singleLoader: async (e) => {
					let t = e.transaction?.kind === "itx" ? Su(e.transaction) : void 0, n = await this.client._engine.request(e.protocolQuery, {
						traceparent: this.client._tracingHelper.getTraceParent(),
						interactiveTransaction: t,
						isWrite: pu(e.protocolQuery.action),
						customDataProxyFetch: e.customDataProxyFetch
					});
					return this.mapQueryEngineResult(e, n);
				},
				batchBy: (e) => {
					if (e.transaction?.kind === "itx") {
						let t = uu(e.protocolQuery);
						return `itx-${e.transaction.id}${t ? `-${t}` : ""}`;
					}
					return e.transaction?.id ? `transaction-${e.transaction.id}` : uu(e.protocolQuery);
				},
				batchOrder(e, t) {
					return e.transaction?.kind === "batch" && t.transaction?.kind === "batch" ? e.transaction.index - t.transaction.index : 0;
				}
			});
		}
		async request(e) {
			try {
				return await this.dataloader.request(e);
			} catch (t) {
				let { clientMethod: n, callsite: r, transaction: i, args: a, modelName: o } = e;
				this.handleAndLogRequestError({
					error: t,
					clientMethod: n,
					callsite: r,
					transaction: i,
					args: a,
					modelName: o,
					globalOmit: e.globalOmit
				});
			}
		}
		mapQueryEngineResult({ dataPath: e, unpacker: t }, n) {
			let r = n?.data, i = this.unpack(r, e, t);
			return process.env.PRISMA_CLIENT_GET_TIME ? { data: i } : i;
		}
		handleAndLogRequestError(e) {
			try {
				this.handleRequestError(e);
			} catch (t) {
				throw this.logEmitter && this.logEmitter.emit("error", {
					message: t.message,
					target: e.clientMethod,
					timestamp: /* @__PURE__ */ new Date()
				}), t;
			}
		}
		handleRequestError({ error: e, clientMethod: t, callsite: n, transaction: r, args: i, modelName: a, globalOmit: o }) {
			if (yu(e), Cu(e, r)) throw e;
			e instanceof $.PrismaClientKnownRequestError && wu(e) && tr({
				args: i,
				errors: [Tu(e.meta)],
				callsite: n,
				errorFormat: this.client._errorFormat,
				originalMethod: t,
				clientVersion: this.client._clientVersion,
				globalOmit: o
			});
			let s = e.message;
			if (n && (s = Gt({
				callsite: n,
				originalMethod: t,
				isPanic: e.isPanic,
				showColors: this.client._errorFormat === "pretty",
				message: s
			})), s = this.sanitizeMessage(s), e.code) {
				let t = a ? {
					modelName: a,
					...e.meta
				} : e.meta;
				throw new $.PrismaClientKnownRequestError(s, {
					code: e.code,
					clientVersion: this.client._clientVersion,
					meta: t,
					batchRequestIdx: e.batchRequestIdx
				});
			} else {
				if (e.isPanic) throw new $.PrismaClientRustPanicError(s, this.client._clientVersion);
				if (e instanceof $.PrismaClientUnknownRequestError) throw new $.PrismaClientUnknownRequestError(s, {
					clientVersion: this.client._clientVersion,
					batchRequestIdx: e.batchRequestIdx
				});
				if (e instanceof $.PrismaClientInitializationError) throw new $.PrismaClientInitializationError(s, this.client._clientVersion);
				if (e instanceof $.PrismaClientRustPanicError) throw new $.PrismaClientRustPanicError(s, this.client._clientVersion);
			}
			throw e.clientVersion = this.client._clientVersion, e;
		}
		sanitizeMessage(e) {
			return this.client._errorFormat && this.client._errorFormat !== "pretty" ? dt(e) : e;
		}
		unpack(e, t, n) {
			if (!e || (e.data && (e = e.data), !e)) return e;
			let r = Object.keys(e)[0], i = Object.values(e)[0], a = Mi(i, t.filter((e) => e !== "select" && e !== "include")), o = r === "queryRaw" ? _u(a) : ka(a);
			return n ? n(o) : o;
		}
		get [Symbol.toStringTag]() {
			return "RequestHandler";
		}
	};
	function xu(e) {
		if (e) {
			if (e.kind === "batch") return {
				kind: "batch",
				options: { isolationLevel: e.isolationLevel }
			};
			if (e.kind === "itx") return {
				kind: "itx",
				options: Su(e)
			};
			Ye(e, "Unknown transaction kind");
		}
	}
	function Su(e) {
		return {
			id: e.id,
			payload: e.payload
		};
	}
	function Cu(e, t) {
		return (0, lu.hasBatchIndex)(e) && t?.kind === "batch" && e.batchRequestIdx !== t.index;
	}
	function wu(e) {
		return e.code === "P2009" || e.code === "P2012";
	}
	function Tu(e) {
		if (e.kind === "Union") return {
			kind: "Union",
			errors: e.errors.map(Tu)
		};
		if (Array.isArray(e.selectionPath)) {
			let [, ...t] = e.selectionPath;
			return {
				...e,
				selectionPath: t
			};
		}
		return e;
	}
	var Eu = Kc, Du = f(x()), Q = class extends Error {
		constructor(e) {
			super(e + "\nRead more at https://pris.ly/d/client-constructor"), this.name = "PrismaClientConstructorValidationError";
		}
		get [Symbol.toStringTag]() {
			return "PrismaClientConstructorValidationError";
		}
	};
	_t(Q, "PrismaClientConstructorValidationError");
	var Ou = [
		"errorFormat",
		"adapter",
		"accelerateUrl",
		"log",
		"transactionOptions",
		"omit",
		"comments",
		"__internal"
	], ku = [
		"pretty",
		"colorless",
		"minimal"
	], Au = [
		"info",
		"query",
		"warn",
		"error"
	], ju = {
		adapter: () => {},
		accelerateUrl: (e) => {
			if (e !== void 0) {
				if (typeof e != "string") throw new Q(`Invalid value ${JSON.stringify(e)} for "accelerateUrl" provided to PrismaClient constructor.`);
				if (e.trim().length === 0) throw new Q("\"accelerateUrl\" provided to PrismaClient constructor must be a non-empty string.");
			}
		},
		errorFormat: (e) => {
			if (e) {
				if (typeof e != "string") throw new Q(`Invalid value ${JSON.stringify(e)} for "errorFormat" provided to PrismaClient constructor.`);
				if (!ku.includes(e)) throw new Q(`Invalid errorFormat ${e} provided to PrismaClient constructor.${Pu(e, ku)}`);
			}
		},
		log: (e) => {
			if (!e) return;
			if (!Array.isArray(e)) throw new Q(`Invalid value ${JSON.stringify(e)} for "log" provided to PrismaClient constructor.`);
			function t(e) {
				if (typeof e == "string" && !Au.includes(e)) throw new Q(`Invalid log level "${e}" provided to PrismaClient constructor.${Pu(e, Au)}`);
			}
			for (let n of e) {
				t(n);
				let e = {
					level: t,
					emit: (e) => {
						let t = ["stdout", "event"];
						if (!t.includes(e)) {
							let n = Pu(e, t);
							throw new Q(`Invalid value ${JSON.stringify(e)} for "emit" in logLevel provided to PrismaClient constructor.${n}`);
						}
					}
				};
				if (n && typeof n == "object") for (let [t, r] of Object.entries(n)) if (e[t]) e[t](r);
				else throw new Q(`Invalid property ${t} for "log" provided to PrismaClient constructor`);
			}
		},
		transactionOptions: (e) => {
			if (!e) return;
			let t = e.maxWait;
			if (t != null && t <= 0) throw new Q(`Invalid value ${t} for maxWait in "transactionOptions" provided to PrismaClient constructor. maxWait needs to be greater than 0`);
			let n = e.timeout;
			if (n != null && n <= 0) throw new Q(`Invalid value ${n} for timeout in "transactionOptions" provided to PrismaClient constructor. timeout needs to be greater than 0`);
		},
		omit: (e, t) => {
			if (typeof e != "object") throw new Q("\"omit\" option is expected to be an object.");
			if (e === null) throw new Q("\"omit\" option can not be `null`");
			let n = [];
			for (let [r, i] of Object.entries(e)) {
				let e = Iu(r, t.runtimeDataModel);
				if (!e) {
					n.push({
						kind: "UnknownModel",
						modelKey: r
					});
					continue;
				}
				for (let [t, a] of Object.entries(i)) {
					let i = e.fields.find((e) => e.name === t);
					if (!i) {
						n.push({
							kind: "UnknownField",
							modelKey: r,
							fieldName: t
						});
						continue;
					}
					if (i.relationName) {
						n.push({
							kind: "RelationInOmit",
							modelKey: r,
							fieldName: t
						});
						continue;
					}
					typeof a != "boolean" && n.push({
						kind: "InvalidFieldValue",
						modelKey: r,
						fieldName: t
					});
				}
			}
			if (n.length > 0) throw new Q(Ru(e, n));
		},
		comments: (e) => {
			if (e !== void 0) {
				if (!Array.isArray(e)) throw new Q(`Invalid value ${JSON.stringify(e)} for "comments" provided to PrismaClient constructor. Expected an array of SQL commenter plugins.`);
				for (let t = 0; t < e.length; t++) if (typeof e[t] != "function") throw new Q(`Invalid value at index ${t} for "comments" provided to PrismaClient constructor. Each plugin must be a function.`);
			}
		},
		__internal: (e) => {
			if (!e) return;
			let t = [
				"debug",
				"engine",
				"configOverride"
			];
			if (typeof e != "object") throw new Q(`Invalid value ${JSON.stringify(e)} for "__internal" to PrismaClient constructor`);
			for (let [n] of Object.entries(e)) if (!t.includes(n)) {
				let e = Pu(n, t);
				throw new Q(`Invalid property ${JSON.stringify(n)} for "__internal" provided to PrismaClient constructor.${e}`);
			}
		}
	};
	function Mu(e) {
		let t = e.adapter !== void 0, n = e.accelerateUrl !== void 0;
		if (t && n) throw new Q("The \"adapter\" and \"accelerateUrl\" options are mutually exclusive. Please provide only one of them.");
		if (!t && !n) throw new Q("Using engine type \"client\" requires either \"adapter\" or \"accelerateUrl\" to be provided to PrismaClient constructor.");
	}
	function Nu(e, t) {
		for (let [n, r] of Object.entries(e)) {
			if (!Ou.includes(n)) throw new Q(`Unknown property ${n} provided to PrismaClient constructor.${Pu(n, Ou)}`);
			ju[n](r, t);
		}
		Mu(e);
	}
	function Pu(e, t) {
		if (t.length === 0 || typeof e != "string") return "";
		let n = Fu(e, t);
		return n ? ` Did you mean "${n}"?` : "";
	}
	function Fu(e, t) {
		if (t.length === 0) return null;
		let n = t.map((t) => ({
			value: t,
			distance: (0, Du.default)(e, t)
		}));
		n.sort((e, t) => e.distance < t.distance ? -1 : 1);
		let r = n[0];
		return r.distance < 3 ? r.value : null;
	}
	function Iu(e, t) {
		return Lu(t.models, e) ?? Lu(t.types, e);
	}
	function Lu(e, t) {
		let n = Object.keys(e).find((e) => le(e) === t);
		if (n) return e[n];
	}
	function Ru(e, t) {
		let n = Xn(e);
		for (let e of t) switch (e.kind) {
			case "UnknownModel":
				n.arguments.getField(e.modelKey)?.markAsError(), n.addErrorMessage(() => `Unknown model name: ${e.modelKey}.`);
				break;
			case "UnknownField":
				n.arguments.getDeepField([e.modelKey, e.fieldName])?.markAsError(), n.addErrorMessage(() => `Model "${e.modelKey}" does not have a field named "${e.fieldName}".`);
				break;
			case "RelationInOmit":
				n.arguments.getDeepField([e.modelKey, e.fieldName])?.markAsError(), n.addErrorMessage(() => "Relations are already excluded by default and can not be specified in \"omit\".");
				break;
			case "InvalidFieldValue":
				n.arguments.getDeepFieldValue([e.modelKey, e.fieldName])?.markAsError(), n.addErrorMessage(() => "Omit field option value must be a boolean.");
				break;
		}
		let { message: r, args: i } = er(n, "colorless");
		return `Error validating "omit" option:

${i}

${r}`;
	}
	var zu = y();
	function Bu(e) {
		return e.length === 0 ? Promise.resolve([]) : new Promise((t, n) => {
			let r = Array(e.length), i = null, a = !1, o = 0, s = () => {
				a || (o++, o === e.length && (a = !0, i ? n(i) : t(r)));
			}, c = (e) => {
				a || (a = !0, n(e));
			};
			for (let t = 0; t < e.length; t++) e[t].then((e) => {
				r[t] = e, s();
			}, (e) => {
				if (!(0, zu.hasBatchIndex)(e)) {
					c(e);
					return;
				}
				e.batchRequestIdx === t ? c(e) : (i ||= e, s());
			});
		});
	}
	var Vu = Ge("prisma:client");
	typeof globalThis == "object" && (globalThis.NODE_CLIENT = !0);
	var Hu = {
		requestArgsToMiddlewareArgs: (e) => e,
		middlewareArgsToRequestArgs: (e) => e
	}, Uu = Symbol.for("prisma.client.transaction.scope_context");
	function Wu(e) {
		let t = e[Uu];
		if (t === void 0) return { kind: "top-level" };
		if (Gu(t)) return t;
		throw Error("Internal error: inconsistent transaction scope context.");
	}
	function Gu(e) {
		if (typeof e != "object" || !e) return !1;
		let t = e;
		return t.kind === "nested" && typeof t.txId == "string" && typeof t.scopeId == "string" && Ku(t.scopeState);
	}
	function Ku(e) {
		return typeof e != "object" || !e ? !1 : Array.isArray(e.stack);
	}
	function qu() {
		return typeof globalThis.crypto?.randomUUID == "function" ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
	var Ju = {
		id: 0,
		nextId() {
			return ++this.id;
		}
	};
	function Yu(e) {
		class t {
			_originalClient = this;
			_runtimeDataModel;
			_requestHandler;
			_connectionPromise;
			_disconnectionPromise;
			_engineConfig;
			_accelerateEngineConfig;
			_clientVersion;
			_errorFormat;
			_tracingHelper;
			_previewFeatures;
			_activeProvider;
			_globalOmit;
			_extensions;
			_engine;
			_appliedParent;
			_createPrismaPromise = Zl();
			constructor(t) {
				if (!t) throw new $.PrismaClientInitializationError("`PrismaClient` needs to be constructed with a non-empty, valid `PrismaClientOptions`:\n\n```\nnew PrismaClient({\n  ...\n})\n```\n\nor\n\n```\nconstructor() {\n  super({ ... });\n}\n```\n          ", Eu);
				e = t.__internal?.configOverride?.(e) ?? e, Nu(t, e);
				let n = new Wr.EventEmitter().on("error", () => {});
				this._extensions = ur.empty(), this._previewFeatures = e.previewFeatures, this._clientVersion = e.clientVersion ?? Eu, this._activeProvider = e.activeProvider, this._globalOmit = t?.omit, this._tracingHelper = ou();
				let r;
				if (t.adapter) {
					r = t.adapter;
					let n = e.activeProvider === "postgresql" || e.activeProvider === "cockroachdb" ? "postgres" : e.activeProvider;
					if (r.provider !== n) throw new $.PrismaClientInitializationError(`The Driver Adapter \`${r.adapterName}\`, based on \`${r.provider}\`, is not compatible with the provider \`${n}\` specified in the Prisma schema.`, this._clientVersion);
				}
				try {
					let i = t ?? {}, a = (i.__internal ?? {}).debug === !0;
					if (a && Ge.enable("prisma:client"), i.errorFormat ? this._errorFormat = i.errorFormat : process.env.NODE_ENV === "production" ? this._errorFormat = "minimal" : (process.env.NO_COLOR, this._errorFormat = "colorless"), this._runtimeDataModel = e.runtimeDataModel, this._engineConfig = {
						enableDebugLogs: a,
						logLevel: i.log && cu(i.log),
						logQueries: i.log && !!(typeof i.log == "string" ? i.log === "query" : i.log.find((e) => typeof e == "string" ? e === "query" : e.level === "query")),
						compilerWasm: e.compilerWasm,
						clientVersion: e.clientVersion,
						previewFeatures: this._previewFeatures,
						activeProvider: e.activeProvider,
						inlineSchema: e.inlineSchema,
						tracingHelper: this._tracingHelper,
						transactionOptions: {
							maxWait: i.transactionOptions?.maxWait ?? 2e3,
							timeout: i.transactionOptions?.timeout ?? 5e3,
							isolationLevel: i.transactionOptions?.isolationLevel
						},
						logEmitter: n,
						adapter: r,
						accelerateUrl: i.accelerateUrl,
						sqlCommenters: i.comments,
						parameterizationSchema: e.parameterizationSchema,
						runtimeDataModel: e.runtimeDataModel
					}, this._accelerateEngineConfig = Object.create(this._engineConfig), this._accelerateEngineConfig.accelerateUtils = { resolveDatasourceUrl: () => {
						if (i.accelerateUrl) return i.accelerateUrl;
						throw new $.PrismaClientInitializationError("`accelerateUrl` is required when using `@prisma/extension-accelerate`:\n\nnew PrismaClient({\n  accelerateUrl: \"prisma://...\",\n}).$extends(withAccelerate())\n", e.clientVersion);
					} }, Vu("clientVersion", e.clientVersion), this._engine = Pl(this._engineConfig), this._requestHandler = new bu(this, n), i.log) for (let e of i.log) {
						let t = typeof e == "string" ? e : e.emit === "stdout" ? e.level : null;
						t && this.$on(t, (e) => {
							tt.log(`${tt.tags[t] ?? ""}`, e.message || e.query);
						});
					}
				} catch (e) {
					throw e.clientVersion = this._clientVersion, e;
				}
				return this._appliedParent = Ki(this);
			}
			get [Symbol.toStringTag]() {
				return "PrismaClient";
			}
			$on(e, t) {
				return e === "beforeExit" ? this._engine.onBeforeExit(t) : e && this._engineConfig.logEmitter.on(e, t), this;
			}
			$connect() {
				try {
					return this._engine.start();
				} catch (e) {
					throw e.clientVersion = this._clientVersion, e;
				}
			}
			async $disconnect() {
				try {
					await this._engine.stop();
				} catch (e) {
					throw e.clientVersion = this._clientVersion, e;
				} finally {
					Je();
				}
			}
			$executeRawInternal(e, t, n, r) {
				let i = this._activeProvider;
				return this._request({
					action: "executeRaw",
					args: n,
					transaction: e,
					clientMethod: t,
					argsMapper: Jl({
						clientMethod: t,
						activeProvider: i
					}),
					callsite: _i(this._errorFormat),
					dataPath: [],
					middlewareArgsMapper: r
				});
			}
			$executeRaw(e, ...t) {
				return this._createPrismaPromise((n) => {
					if (e.raw !== void 0 || e.sql !== void 0) {
						let [r, i] = Xu(e, t);
						return ql(this._activeProvider, r.text, r.values, Array.isArray(e) ? "prisma.$executeRaw`<SQL>`" : "prisma.$executeRaw(sql`<SQL>`)"), this.$executeRawInternal(n, "$executeRaw", r, i);
					}
					throw new $.PrismaClientValidationError("`$executeRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#executeraw\n", { clientVersion: this._clientVersion });
				});
			}
			$executeRawUnsafe(e, ...t) {
				return this._createPrismaPromise((n) => (ql(this._activeProvider, e, t, "prisma.$executeRawUnsafe(<SQL>, [...values])"), this.$executeRawInternal(n, "$executeRawUnsafe", [e, ...t])));
			}
			$runCommandRaw(t) {
				if (e.activeProvider !== "mongodb") throw new $.PrismaClientValidationError(`The ${e.activeProvider} provider does not support $runCommandRaw. Use the mongodb provider.`, { clientVersion: this._clientVersion });
				return this._createPrismaPromise((e) => this._request({
					args: t,
					clientMethod: "$runCommandRaw",
					dataPath: [],
					action: "runCommandRaw",
					argsMapper: Fl,
					callsite: _i(this._errorFormat),
					transaction: e
				}));
			}
			async $queryRawInternal(e, t, n, r) {
				let i = this._activeProvider;
				return this._request({
					action: "queryRaw",
					args: n,
					transaction: e,
					clientMethod: t,
					argsMapper: Jl({
						clientMethod: t,
						activeProvider: i
					}),
					callsite: _i(this._errorFormat),
					dataPath: [],
					middlewareArgsMapper: r
				});
			}
			$queryRaw(e, ...t) {
				return this._createPrismaPromise((n) => {
					if (e.raw !== void 0 || e.sql !== void 0) return this.$queryRawInternal(n, "$queryRaw", ...Xu(e, t));
					throw new $.PrismaClientValidationError("`$queryRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw\n", { clientVersion: this._clientVersion });
				});
			}
			$queryRawTyped(e) {
				return this._createPrismaPromise((t) => {
					if (!this._hasPreviewFlag("typedSql")) throw new $.PrismaClientValidationError("`typedSql` preview feature must be enabled in order to access $queryRawTyped API", { clientVersion: this._clientVersion });
					return this.$queryRawInternal(t, "$queryRawTyped", e);
				});
			}
			$queryRawUnsafe(e, ...t) {
				return this._createPrismaPromise((n) => this.$queryRawInternal(n, "$queryRawUnsafe", [e, ...t]));
			}
			_transactionWithArray({ promises: e, options: t }) {
				let n = Ju.nextId(), r = su(e.length);
				return Bu(e.map((e, i) => {
					if (e?.[Symbol.toStringTag] !== "PrismaPromise") throw Error("All elements of the array need to be Prisma Client promises. Hint: Please make sure you are not awaiting the Prisma client calls you intended to pass in the $transaction function.");
					let a = {
						kind: "batch",
						id: n,
						index: i,
						isolationLevel: t?.isolationLevel ?? this._engineConfig.transactionOptions.isolationLevel,
						lock: r
					};
					return e.requestTransaction?.(a) ?? e;
				}));
			}
			async _transactionWithCallback({ callback: e, options: t = {} }) {
				let n = Wu(this), r = n.kind === "nested", i = r ? n.scopeState : { stack: [] }, a = i.stack, o = qu();
				if (r) {
					if (a.at(-1) !== n.scopeId) throw Error("Concurrent nested transactions are not supported");
					t.newTxId = n.txId;
				}
				a.push(o);
				let s = { traceparent: this._tracingHelper.getTraceParent() }, c = {
					maxWait: t?.maxWait ?? this._engineConfig.transactionOptions.maxWait,
					timeout: t?.timeout ?? this._engineConfig.transactionOptions.timeout,
					isolationLevel: t?.isolationLevel ?? this._engineConfig.transactionOptions.isolationLevel,
					newTxId: t.newTxId
				}, l;
				try {
					l = await this._engine.transaction("start", s, c);
				} catch (e) {
					throw a.at(-1) === o && a.pop(), e;
				}
				let u;
				try {
					let t = {
						kind: "itx",
						...l
					};
					if (u = await e(this._createItxClient(t, o, i)), r) {
						if (a.at(-1) !== o) throw Error("Nested transactions must be closed in reverse order of creation.");
					} else if (a.length !== 1) throw Error("Cannot close transaction while a nested transaction is still active.");
					await this._engine.transaction("commit", s, l);
				} catch (e) {
					let t = a.at(-1) === o ? 1 : Math.max(1, a.length);
					for (let e = 0; e < t; e++) await this._engine.transaction("rollback", s, l).catch((n) => {
						Vu("rollback attempt %d/%d failed: %O", e + 1, t, n);
					});
					throw e;
				} finally {
					a.at(-1) === o ? a.pop() : a.length = 0;
				}
				return u;
			}
			_createItxClient(e, t, n) {
				let r = {
					kind: "nested",
					txId: e.id,
					scopeId: t,
					scopeState: n
				};
				return Zr(Ki(Zr(Ji(this), [
					Kr("_appliedParent", () => this._appliedParent._createItxClient(e, t, n)),
					Kr("_createPrismaPromise", () => Zl(e)),
					Kr(Uu, () => r)
				])), [ei(na)]);
			}
			$transaction(t, n) {
				let r;
				return r = typeof t == "function" ? this._engineConfig.adapter?.adapterName === "@prisma/adapter-d1" ? () => {
					throw Error("Cloudflare D1 does not support interactive transactions. We recommend you to refactor your queries with that limitation in mind, and use batch transactions with `prisma.$transactions([])` where applicable.");
				} : e.activeProvider === "mongodb" && Wu(this).kind === "nested" ? () => {
					throw new $.PrismaClientValidationError(`The ${e.activeProvider} provider does not support nested transactions`, { clientVersion: this._clientVersion });
				} : () => this._transactionWithCallback({
					callback: t,
					options: n
				}) : () => this._transactionWithArray({
					promises: t,
					options: n
				}), this._tracingHelper.runInChildSpan({
					name: "transaction",
					attributes: { method: "$transaction" }
				}, r);
			}
			_request(e) {
				e.otelParentCtx = this._tracingHelper.getActiveContext();
				let t = e.middlewareArgsMapper ?? Hu, n = {
					args: t.requestArgsToMiddlewareArgs(e.args),
					dataPath: e.dataPath,
					runInTransaction: !!e.transaction,
					action: e.action,
					model: e.model
				}, r = { operation: {
					name: "operation",
					attributes: {
						method: n.action,
						model: n.model,
						name: n.model ? `${n.model}.${n.action}` : n.action
					}
				} }, i = async (n) => {
					let { runInTransaction: r, args: i, ...a } = n, o = {
						...e,
						...a
					};
					i && (o.args = t.middlewareArgsToRequestArgs(i)), e.transaction !== void 0 && r === !1 && delete o.transaction;
					let s = await ca(this, o);
					if (!o.model) return s;
					let c = pa({
						dataPath: o.dataPath,
						modelName: o.model,
						args: o.args,
						runtimeDataModel: this._runtimeDataModel
					});
					return ea({
						result: s,
						modelName: c.modelName,
						args: c.args,
						extensions: this._extensions,
						runtimeDataModel: this._runtimeDataModel,
						globalOmit: this._globalOmit
					});
				};
				return this._tracingHelper.runInChildSpan(r.operation, () => new Ur.AsyncResource("prisma-client-request").runInAsyncScope(() => i(n)));
			}
			async _executeRequest({ args: e, clientMethod: t, dataPath: n, callsite: r, action: i, model: a, argsMapper: o, transaction: s, unpacker: c, otelParentCtx: l, customDataProxyFetch: u }) {
				try {
					e = o ? o(e) : e;
					let d = this._tracingHelper.runInChildSpan({ name: "serialize" }, () => br({
						modelName: a,
						runtimeDataModel: this._runtimeDataModel,
						action: i,
						args: e,
						clientMethod: t,
						callsite: r,
						extensions: this._extensions,
						errorFormat: this._errorFormat,
						clientVersion: this._clientVersion,
						previewFeatures: this._previewFeatures,
						globalOmit: this._globalOmit
					}));
					return Ge.enabled("prisma:client") && (Vu("Prisma Client call:"), Vu(`prisma.${t}(${G(e)})`), Vu("Generated request:"), Vu(JSON.stringify(d, null, 2) + "\n")), s?.kind === "batch" && await s.lock, this._requestHandler.request({
						protocolQuery: d,
						modelName: a,
						action: i,
						clientMethod: t,
						dataPath: n,
						callsite: r,
						args: e,
						extensions: this._extensions,
						transaction: s,
						unpacker: c,
						otelParentCtx: l,
						otelChildCtx: this._tracingHelper.getActiveContext(),
						globalOmit: this._globalOmit,
						customDataProxyFetch: u
					});
				} catch (e) {
					throw e.clientVersion = this._clientVersion, e;
				}
			}
			_hasPreviewFlag(e) {
				return !!this._engineConfig.previewFeatures?.includes(e);
			}
			$extends = Yi;
		}
		return t;
	}
	function Xu(e, t) {
		return Zu(e) ? [new Hr.Sql(e, t), Yl] : [e, Xl];
	}
	function Zu(e) {
		return Array.isArray(e) && Array.isArray(e.raw);
	}
	var Qu = new Set([
		"toJSON",
		"$$typeof",
		"asymmetricMatch",
		Symbol.iterator,
		Symbol.toStringTag,
		Symbol.isConcatSpreadable,
		Symbol.toPrimitive
	]);
	function $u(e) {
		return new Proxy(e, { get(e, t) {
			if (t in e) return e[t];
			if (!Qu.has(t)) throw TypeError(`Invalid enum value: ${String(t)}`);
		} });
	}
	var ed = () => globalThis.process?.release?.name === "node", td = () => !!globalThis.Bun || !!globalThis.process?.versions?.bun, nd = () => !!globalThis.Deno, rd = () => typeof globalThis.Netlify == "object", id = () => typeof globalThis.EdgeRuntime == "object", ad = () => globalThis.navigator?.userAgent === "Cloudflare-Workers";
	function od() {
		return [
			[rd, "netlify"],
			[id, "edge-light"],
			[ad, "workerd"],
			[nd, "deno"],
			[td, "bun"],
			[ed, "node"]
		].flatMap((e) => e[0]() ? [e[1]] : []).at(0) ?? "";
	}
	var sd = {
		node: "Node.js",
		workerd: "Cloudflare Workers",
		deno: "Deno and Deno Deploy",
		netlify: "Netlify Edge Functions",
		"edge-light": "Edge Runtime (Vercel Edge Functions, Vercel Edge Middleware, Next.js (Pages Router) Edge API Routes, Next.js (App Router) Edge Route Handlers or Next.js Middleware)"
	};
	function cd() {
		let e = od();
		return {
			id: e,
			prettyName: sd[e] || e,
			isEdge: [
				"workerd",
				"deno",
				"netlify",
				"edge-light"
			].includes(e)
		};
	}
	var $ = y(), ld = y(), ud = y(), dd = y();
})))(), 1), x = {
	previewFeatures: [],
	clientVersion: "7.7.0",
	engineVersion: "75cbdc1eb7150937890ad5465d861175c6624711",
	activeProvider: "postgresql",
	inlineSchema: "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider     = \"postgresql\"\n  relationMode = \"prisma\"\n}\n\nmodel User {\n  id            Int      @id @default(autoincrement())\n  username      String   @unique @db.VarChar(255)\n  password_hash String   @db.VarChar(255)\n  role          String   @db.VarChar(50)\n  created_at    DateTime @default(now()) @map(\"created_at\")\n  updated_at    DateTime @updatedAt @map(\"updated_at\")\n\n  audit_logs AuditLog[]\n\n  @@map(\"users\")\n}\n\nmodel Client {\n  id         Int      @id @default(autoincrement())\n  dni        String   @unique @db.VarChar(20)\n  name       String   @db.VarChar(255)\n  phone      String?  @db.VarChar(50)\n  code       String   @unique @db.VarChar(50)\n  tax_id     String?  @unique @db.VarChar(50)\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  sales Sale[]\n\n  @@map(\"clients\")\n}\n\nmodel Category {\n  id         Int      @id @default(autoincrement())\n  name       String   @db.VarChar(255)\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  products Product[]\n\n  @@map(\"categories\")\n}\n\nmodel Product {\n  id             Int       @id @default(autoincrement())\n  sku            String    @unique @db.VarChar(100)\n  name           String    @db.VarChar(255)\n  description    String?   @db.Text\n  category_id    Int?\n  category       Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)\n  price_purchase Float     @map(\"price_purchase\")\n  price_sale     Float     @map(\"price_sale\")\n  stock          Int       @default(0)\n  min_stock      Int?      @default(5)\n  created_at     DateTime  @default(now()) @map(\"created_at\")\n  updated_at     DateTime  @updatedAt @map(\"updated_at\")\n\n  inventory_movements InventoryMovement[]\n  sale_items          SaleItem[]\n\n  @@index([category_id])\n  @@map(\"products\")\n}\n\nmodel CashRegister {\n  id             Int      @id @default(autoincrement())\n  opened_at      DateTime @default(now()) @map(\"opened_at\")\n  opening_amount Float    @map(\"opening_amount\")\n  total_sales    Float    @default(0) @map(\"total_sales\")\n  created_at     DateTime @default(now()) @map(\"created_at\")\n  updated_at     DateTime @updatedAt @map(\"updated_at\")\n\n  sales Sale[]\n\n  @@map(\"cash_registers\")\n}\n\nmodel Sale {\n  id               Int          @id @default(autoincrement())\n  cash_register_id Int\n  cash_register    CashRegister @relation(fields: [cash_register_id], references: [id])\n  client_id        Int\n  client           Client       @relation(fields: [client_id], references: [id])\n  total            Float\n  created_at       DateTime     @default(now()) @map(\"created_at\")\n  updated_at       DateTime     @updatedAt @map(\"updated_at\")\n\n  items SaleItem[]\n\n  @@index([cash_register_id])\n  @@index([client_id])\n  @@index([created_at])\n  @@map(\"sales\")\n}\n\nmodel SaleItem {\n  id             Int      @id @default(autoincrement())\n  sale_id        Int\n  sale           Sale     @relation(fields: [sale_id], references: [id], onDelete: Cascade)\n  product_id     Int\n  product        Product  @relation(fields: [product_id], references: [id])\n  quantity       Int\n  unit_price     Float\n  purchase_price Float\n  created_at     DateTime @default(now()) @map(\"created_at\")\n  updated_at     DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([sale_id])\n  @@index([product_id])\n  @@map(\"sale_items\")\n}\n\nmodel InventoryMovement {\n  id         Int      @id @default(autoincrement())\n  product_id Int\n  product    Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)\n  type       String   @db.VarChar(10) // ENTRADA | SALIDA\n  quantity   Int\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([product_id])\n  @@index([type])\n  @@map(\"inventory_movements\")\n}\n\nmodel AuditLog {\n  id         Int      @id @default(autoincrement())\n  user_id    Int\n  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)\n  action     String   @db.VarChar(100)\n  entity     String   @db.VarChar(100)\n  entity_id  Int\n  created_at DateTime @default(now()) @map(\"created_at\")\n  updated_at DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([user_id])\n  @@index([entity])\n  @@index([created_at])\n  @@map(\"audit_logs\")\n}\n",
	runtimeDataModel: {
		models: {},
		enums: {},
		types: {}
	},
	parameterizationSchema: {
		strings: [],
		graph: ""
	}
};
x.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"username\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password_hash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"audit_logs\",\"kind\":\"object\",\"type\":\"AuditLog\",\"relationName\":\"AuditLogToUser\"}],\"dbName\":\"users\"},\"Client\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"dni\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"code\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tax_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"sales\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"ClientToSale\"}],\"dbName\":\"clients\"},\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CategoryToProduct\"}],\"dbName\":\"categories\"},\"Product\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sku\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"category\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToProduct\"},{\"name\":\"price_purchase\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"price_purchase\"},{\"name\":\"price_sale\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"price_sale\"},{\"name\":\"stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"min_stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"inventory_movements\",\"kind\":\"object\",\"type\":\"InventoryMovement\",\"relationName\":\"InventoryMovementToProduct\"},{\"name\":\"sale_items\",\"kind\":\"object\",\"type\":\"SaleItem\",\"relationName\":\"ProductToSaleItem\"}],\"dbName\":\"products\"},\"CashRegister\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"opened_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"opened_at\"},{\"name\":\"opening_amount\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"opening_amount\"},{\"name\":\"total_sales\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"total_sales\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"sales\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"CashRegisterToSale\"}],\"dbName\":\"cash_registers\"},\"Sale\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"cash_register_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"cash_register\",\"kind\":\"object\",\"type\":\"CashRegister\",\"relationName\":\"CashRegisterToSale\"},{\"name\":\"client_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"client\",\"kind\":\"object\",\"type\":\"Client\",\"relationName\":\"ClientToSale\"},{\"name\":\"total\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"SaleItem\",\"relationName\":\"SaleToSaleItem\"}],\"dbName\":\"sales\"},\"SaleItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sale_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sale\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"SaleToSaleItem\"},{\"name\":\"product_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToSaleItem\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unit_price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"purchase_price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"sale_items\"},\"InventoryMovement\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"InventoryMovementToProduct\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"inventory_movements\"},\"AuditLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"user_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AuditLogToUser\"},{\"name\":\"action\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entity\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entity_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"audit_logs\"}},\"enums\":{},\"types\":{}}"), x.parameterizationSchema = {
	strings: JSON.parse("[\"where\",\"orderBy\",\"cursor\",\"user\",\"audit_logs\",\"_count\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"sales\",\"cash_register\",\"client\",\"sale\",\"products\",\"category\",\"product\",\"inventory_movements\",\"sale_items\",\"items\",\"Client.findUnique\",\"Client.findUniqueOrThrow\",\"Client.findFirst\",\"Client.findFirstOrThrow\",\"Client.findMany\",\"Client.createOne\",\"Client.createMany\",\"Client.createManyAndReturn\",\"Client.updateOne\",\"Client.updateMany\",\"Client.updateManyAndReturn\",\"Client.upsertOne\",\"Client.deleteOne\",\"Client.deleteMany\",\"Client.groupBy\",\"Client.aggregate\",\"Category.findUnique\",\"Category.findUniqueOrThrow\",\"Category.findFirst\",\"Category.findFirstOrThrow\",\"Category.findMany\",\"Category.createOne\",\"Category.createMany\",\"Category.createManyAndReturn\",\"Category.updateOne\",\"Category.updateMany\",\"Category.updateManyAndReturn\",\"Category.upsertOne\",\"Category.deleteOne\",\"Category.deleteMany\",\"Category.groupBy\",\"Category.aggregate\",\"Product.findUnique\",\"Product.findUniqueOrThrow\",\"Product.findFirst\",\"Product.findFirstOrThrow\",\"Product.findMany\",\"Product.createOne\",\"Product.createMany\",\"Product.createManyAndReturn\",\"Product.updateOne\",\"Product.updateMany\",\"Product.updateManyAndReturn\",\"Product.upsertOne\",\"Product.deleteOne\",\"Product.deleteMany\",\"Product.groupBy\",\"Product.aggregate\",\"CashRegister.findUnique\",\"CashRegister.findUniqueOrThrow\",\"CashRegister.findFirst\",\"CashRegister.findFirstOrThrow\",\"CashRegister.findMany\",\"CashRegister.createOne\",\"CashRegister.createMany\",\"CashRegister.createManyAndReturn\",\"CashRegister.updateOne\",\"CashRegister.updateMany\",\"CashRegister.updateManyAndReturn\",\"CashRegister.upsertOne\",\"CashRegister.deleteOne\",\"CashRegister.deleteMany\",\"CashRegister.groupBy\",\"CashRegister.aggregate\",\"Sale.findUnique\",\"Sale.findUniqueOrThrow\",\"Sale.findFirst\",\"Sale.findFirstOrThrow\",\"Sale.findMany\",\"Sale.createOne\",\"Sale.createMany\",\"Sale.createManyAndReturn\",\"Sale.updateOne\",\"Sale.updateMany\",\"Sale.updateManyAndReturn\",\"Sale.upsertOne\",\"Sale.deleteOne\",\"Sale.deleteMany\",\"Sale.groupBy\",\"Sale.aggregate\",\"SaleItem.findUnique\",\"SaleItem.findUniqueOrThrow\",\"SaleItem.findFirst\",\"SaleItem.findFirstOrThrow\",\"SaleItem.findMany\",\"SaleItem.createOne\",\"SaleItem.createMany\",\"SaleItem.createManyAndReturn\",\"SaleItem.updateOne\",\"SaleItem.updateMany\",\"SaleItem.updateManyAndReturn\",\"SaleItem.upsertOne\",\"SaleItem.deleteOne\",\"SaleItem.deleteMany\",\"SaleItem.groupBy\",\"SaleItem.aggregate\",\"InventoryMovement.findUnique\",\"InventoryMovement.findUniqueOrThrow\",\"InventoryMovement.findFirst\",\"InventoryMovement.findFirstOrThrow\",\"InventoryMovement.findMany\",\"InventoryMovement.createOne\",\"InventoryMovement.createMany\",\"InventoryMovement.createManyAndReturn\",\"InventoryMovement.updateOne\",\"InventoryMovement.updateMany\",\"InventoryMovement.updateManyAndReturn\",\"InventoryMovement.upsertOne\",\"InventoryMovement.deleteOne\",\"InventoryMovement.deleteMany\",\"InventoryMovement.groupBy\",\"InventoryMovement.aggregate\",\"AuditLog.findUnique\",\"AuditLog.findUniqueOrThrow\",\"AuditLog.findFirst\",\"AuditLog.findFirstOrThrow\",\"AuditLog.findMany\",\"AuditLog.createOne\",\"AuditLog.createMany\",\"AuditLog.createManyAndReturn\",\"AuditLog.updateOne\",\"AuditLog.updateMany\",\"AuditLog.updateManyAndReturn\",\"AuditLog.upsertOne\",\"AuditLog.deleteOne\",\"AuditLog.deleteMany\",\"AuditLog.groupBy\",\"AuditLog.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"user_id\",\"action\",\"entity\",\"entity_id\",\"created_at\",\"updated_at\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"product_id\",\"type\",\"quantity\",\"sale_id\",\"unit_price\",\"purchase_price\",\"cash_register_id\",\"client_id\",\"total\",\"opened_at\",\"opening_amount\",\"total_sales\",\"every\",\"some\",\"none\",\"sku\",\"name\",\"description\",\"category_id\",\"price_purchase\",\"price_sale\",\"stock\",\"min_stock\",\"dni\",\"phone\",\"code\",\"tax_id\",\"username\",\"password_hash\",\"role\",\"is\",\"isNot\",\"connectOrCreate\",\"upsert\",\"createMany\",\"set\",\"disconnect\",\"delete\",\"connect\",\"updateMany\",\"deleteMany\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
	graph: "-wNhkAEKBAAApgIAIKgBAAClAgAwqQEAAAkAEKoBAAClAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHYAQEAAAAB2QEBAJMCACHaAQEAkwIAIQEAAAABACALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAIUCACGsAQIAhQIAIa0BAQCTAgAhrgEBAJMCACGvAQIAhQIAIbABQACGAgAhsQFAAIYCACEBAwAA0QMAIAsDAACoAgAgqAEAAKcCADCpAQAAAwAQqgEAAKcCADCrAQIAAAABrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAADACABAAAAAQAgCgQAAKYCACCoAQAApQIAMKkBAAAJABCqAQAApQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIdgBAQCTAgAh2QEBAJMCACHaAQEAkwIAIQEEAADQAwAgAwAAAAkAIAEAAAoAMAIAAAEAIAMAAAAJACABAAAKADACAAABACADAAAACQAgAQAACgAwAgAAAQAgBwQAAM8DACCrAQIAAAABsAFAAAAAAbEBQAAAAAHYAQEAAAAB2QEBAAAAAdoBAQAAAAEBCwAADgAgBqsBAgAAAAGwAUAAAAABsQFAAAAAAdgBAQAAAAHZAQEAAAAB2gEBAAAAAQELAAAQADABCwAAEAAwBwQAAMIDACCrAQIArwIAIbABQACwAgAhsQFAALACACHYAQEArgIAIdkBAQCuAgAh2gEBAK4CACECAAAAAQAgCwAAEwAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIdgBAQCuAgAh2QEBAK4CACHaAQEArgIAIQIAAAAJACALAAAVACACAAAACQAgCwAAFQAgAwAAAAEAIBIAAA4AIBMAABMAIAEAAAABACABAAAACQAgBQUAAL0DACAYAAC-AwAgGQAAwQMAIBoAAMADACAbAAC_AwAgCagBAACkAgAwqQEAABwAEKoBAACkAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAh2AEBAPUBACHZAQEA9QEAIdoBAQD1AQAhAwAAAAkAIAEAABsAMBcAABwAIAMAAAAJACABAAAKADACAAABACAMHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHNAQEAkwIAIdQBAQAAAAHVAQEAlwIAIdYBAQAAAAHXAQEAAAABAQAAAB8AIAwfAACiAgAgIAAAowIAICcAAJ4CACCoAQAAoQIAMKkBAAAhABCqAQAAoQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcMBAgCFAgAhxAECAIUCACHFAQgAhwIAIQMfAAC7AwAgIAAAvAMAICcAALkDACAMHwAAogIAICAAAKMCACAnAACeAgAgqAEAAKECADCpAQAAIQAQqgEAAKECADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIcMBAgCFAgAhxAECAIUCACHFAQgAhwIAIQMAAAAhACABAAAiADACAAAjACADAAAAIQAgAQAAIgAwAgAAIwAgAQAAACEAIA0hAACgAgAgJAAAmQIAIKgBAACfAgAwqQEAACcAEKoBAACfAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhvQECAIUCACG_AQIAhQIAIcABAgCFAgAhwQEIAIcCACHCAQgAhwIAIQIhAAC6AwAgJAAAtgMAIA0hAACgAgAgJAAAmQIAIKgBAACfAgAwqQEAACcAEKoBAACfAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb8BAgCFAgAhwAECAIUCACHBAQgAhwIAIcIBCACHAgAhAwAAACcAIAEAACgAMAIAACkAIAgiAACUAgAgqAEAAJICADCpAQAAKwAQqgEAAJICADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHNAQEAkwIAIQEAAAArACARIwAAnAIAICUAAJ0CACAmAACeAgAgqAEAAJoCADCpAQAALQAQqgEAAJoCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHMAQEAkwIAIc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhBiMAALcDACAlAAC4AwAgJgAAuQMAIM4BAADvAgAgzwEAAO8CACDTAQAA7wIAIBEjAACcAgAgJQAAnQIAICYAAJ4CACCoAQAAmgIAMKkBAAAtABCqAQAAmgIAMKsBAgAAAAGwAUAAhgIAIbEBQACGAgAhzAEBAAAAAc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhAwAAAC0AIAEAAC4AMAIAAC8AIAEAAAAtACAKJAAAmQIAIKgBAACYAgAwqQEAADIAEKoBAACYAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhvQECAIUCACG-AQEAkwIAIb8BAgCFAgAhASQAALYDACAKJAAAmQIAIKgBAACYAgAwqQEAADIAEKoBAACYAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb4BAQCTAgAhvwECAIUCACEDAAAAMgAgAQAAMwAwAgAANAAgAwAAACcAIAEAACgAMAIAACkAIAEAAAAyACABAAAAJwAgAQAAACcAIAEAAAAhACABAAAAHwAgDB4AAIgCACCoAQAAlgIAMKkBAAA8ABCqAQAAlgIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIc0BAQCTAgAh1AEBAJMCACHVAQEAlwIAIdYBAQCTAgAh1wEBAJcCACEDHgAA7gIAINUBAADvAgAg1wEAAO8CACADAAAAPAAgAQAAPQAwAgAAHwAgAwAAADwAIAEAAD0AMAIAAB8AIAMAAAA8ACABAAA9ADACAAAfACAJHgAAtQMAIKsBAgAAAAGwAUAAAAABsQFAAAAAAc0BAQAAAAHUAQEAAAAB1QEBAAAAAdYBAQAAAAHXAQEAAAABAQsAAEEAIAirAQIAAAABsAFAAAAAAbEBQAAAAAHNAQEAAAAB1AEBAAAAAdUBAQAAAAHWAQEAAAAB1wEBAAAAAQELAABDADABCwAAQwAwCR4AAKsDACCrAQIArwIAIbABQACwAgAhsQFAALACACHNAQEArgIAIdQBAQCuAgAh1QEBAPUCACHWAQEArgIAIdcBAQD1AgAhAgAAAB8AIAsAAEYAIAirAQIArwIAIbABQACwAgAhsQFAALACACHNAQEArgIAIdQBAQCuAgAh1QEBAPUCACHWAQEArgIAIdcBAQD1AgAhAgAAADwAIAsAAEgAIAIAAAA8ACALAABIACADAAAAHwAgEgAAQQAgEwAARgAgAQAAAB8AIAEAAAA8ACAHBQAApgMAIBgAAKcDACAZAACqAwAgGgAAqQMAIBsAAKgDACDVAQAA7wIAINcBAADvAgAgC6gBAACVAgAwqQEAAE8AEKoBAACVAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzQEBAPUBACHUAQEA9QEAIdUBAQCKAgAh1gEBAPUBACHXAQEAigIAIQMAAAA8ACABAABOADAXAABPACADAAAAPAAgAQAAPQAwAgAAHwAgCCIAAJQCACCoAQAAkgIAMKkBAAArABCqAQAAkgIAMKsBAgAAAAGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACEBAAAAUgAgAQAAAFIAIAEiAAClAwAgAwAAACsAIAEAAFUAMAIAAFIAIAMAAAArACABAABVADACAABSACADAAAAKwAgAQAAVQAwAgAAUgAgBSIAAKQDACCrAQIAAAABsAFAAAAAAbEBQAAAAAHNAQEAAAABAQsAAFkAIASrAQIAAAABsAFAAAAAAbEBQAAAAAHNAQEAAAABAQsAAFsAMAELAABbADAFIgAAlwMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAhAgAAAFIAIAsAAF4AIASrAQIArwIAIbABQACwAgAhsQFAALACACHNAQEArgIAIQIAAAArACALAABgACACAAAAKwAgCwAAYAAgAwAAAFIAIBIAAFkAIBMAAF4AIAEAAABSACABAAAAKwAgBQUAAJIDACAYAACTAwAgGQAAlgMAIBoAAJUDACAbAACUAwAgB6gBAACRAgAwqQEAAGcAEKoBAACRAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzQEBAPUBACEDAAAAKwAgAQAAZgAwFwAAZwAgAwAAACsAIAEAAFUAMAIAAFIAIAEAAAAvACABAAAALwAgAwAAAC0AIAEAAC4AMAIAAC8AIAMAAAAtACABAAAuADACAAAvACADAAAALQAgAQAALgAwAgAALwAgDiMAAI8DACAlAACQAwAgJgAAkQMAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAc8BAgAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABAQsAAG8AIAurAQIAAAABsAFAAAAAAbEBQAAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHPAQIAAAAB0AEIAAAAAdEBCAAAAAHSAQIAAAAB0wECAAAAAQELAABxADABCwAAcQAwAQAAACsAIA4jAAD3AgAgJQAA-AIAICYAAPkCACCrAQIArwIAIbABQACwAgAhsQFAALACACHMAQEArgIAIc0BAQCuAgAhzgEBAPUCACHPAQIA9gIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAgAAAC8AIAsAAHUAIAurAQIArwIAIbABQACwAgAhsQFAALACACHMAQEArgIAIc0BAQCuAgAhzgEBAPUCACHPAQIA9gIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAgAAAC0AIAsAAHcAIAIAAAAtACALAAB3ACABAAAAKwAgAwAAAC8AIBIAAG8AIBMAAHUAIAEAAAAvACABAAAALQAgCAUAAPACACAYAADxAgAgGQAA9AIAIBoAAPMCACAbAADyAgAgzgEAAO8CACDPAQAA7wIAINMBAADvAgAgDqgBAACJAgAwqQEAAH8AEKoBAACJAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzAEBAPUBACHNAQEA9QEAIc4BAQCKAgAhzwECAIsCACHQAQgAgAIAIdEBCACAAgAh0gECAPQBACHTAQIAiwIAIQMAAAAtACABAAB-ADAXAAB_ACADAAAALQAgAQAALgAwAgAALwAgCh4AAIgCACCoAQAAhAIAMKkBAACFAQAQqgEAAIQCADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIQEAAACCAQAgAQAAAIIBACAKHgAAiAIAIKgBAACEAgAwqQEAAIUBABCqAQAAhAIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIQEeAADuAgAgAwAAAIUBACABAACGAQAwAgAAggEAIAMAAACFAQAgAQAAhgEAMAIAAIIBACADAAAAhQEAIAEAAIYBADACAACCAQAgBx4AAO0CACCrAQIAAAABsAFAAAAAAbEBQAAAAAHGAUAAAAABxwEIAAAAAcgBCAAAAAEBCwAAigEAIAarAQIAAAABsAFAAAAAAbEBQAAAAAHGAUAAAAABxwEIAAAAAcgBCAAAAAEBCwAAjAEAMAELAACMAQAwBx4AAOACACCrAQIArwIAIbABQACwAgAhsQFAALACACHGAUAAsAIAIccBCAC_AgAhyAEIAL8CACECAAAAggEAIAsAAI8BACAGqwECAK8CACGwAUAAsAIAIbEBQACwAgAhxgFAALACACHHAQgAvwIAIcgBCAC_AgAhAgAAAIUBACALAACRAQAgAgAAAIUBACALAACRAQAgAwAAAIIBACASAACKAQAgEwAAjwEAIAEAAACCAQAgAQAAAIUBACAFBQAA2wIAIBgAANwCACAZAADfAgAgGgAA3gIAIBsAAN0CACAJqAEAAIMCADCpAQAAmAEAEKoBAACDAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhxgFAAPYBACHHAQgAgAIAIcgBCACAAgAhAwAAAIUBACABAACXAQAwFwAAmAEAIAMAAACFAQAgAQAAhgEAMAIAAIIBACABAAAAIwAgAQAAACMAIAMAAAAhACABAAAiADACAAAjACADAAAAIQAgAQAAIgAwAgAAIwAgAwAAACEAIAEAACIAMAIAACMAIAkfAADYAgAgIAAA2QIAICcAANoCACCrAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxAECAAAAAcUBCAAAAAEBCwAAoAEAIAarAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxAECAAAAAcUBCAAAAAEBCwAAogEAMAELAACiAQAwCR8AAMkCACAgAADKAgAgJwAAywIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQIAAAAjACALAAClAQAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQIAAAAhACALAACnAQAgAgAAACEAIAsAAKcBACADAAAAIwAgEgAAoAEAIBMAAKUBACABAAAAIwAgAQAAACEAIAUFAADEAgAgGAAAxQIAIBkAAMgCACAaAADHAgAgGwAAxgIAIAmoAQAAggIAMKkBAACuAQAQqgEAAIICADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACHDAQIA9AEAIcQBAgD0AQAhxQEIAIACACEDAAAAIQAgAQAArQEAMBcAAK4BACADAAAAIQAgAQAAIgAwAgAAIwAgAQAAACkAIAEAAAApACADAAAAJwAgAQAAKAAwAgAAKQAgAwAAACcAIAEAACgAMAIAACkAIAMAAAAnACABAAAoADACAAApACAKIQAAwgIAICQAAMMCACCrAQIAAAABsAFAAAAAAbEBQAAAAAG9AQIAAAABvwECAAAAAcABAgAAAAHBAQgAAAABwgEIAAAAAQELAAC2AQAgCKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwAECAAAAAcEBCAAAAAHCAQgAAAABAQsAALgBADABCwAAuAEAMAohAADAAgAgJAAAwQIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvwECAK8CACHAAQIArwIAIcEBCAC_AgAhwgEIAL8CACECAAAAKQAgCwAAuwEAIAirAQIArwIAIbABQACwAgAhsQFAALACACG9AQIArwIAIb8BAgCvAgAhwAECAK8CACHBAQgAvwIAIcIBCAC_AgAhAgAAACcAIAsAAL0BACACAAAAJwAgCwAAvQEAIAMAAAApACASAAC2AQAgEwAAuwEAIAEAAAApACABAAAAJwAgBQUAALoCACAYAAC7AgAgGQAAvgIAIBoAAL0CACAbAAC8AgAgC6gBAAD_AQAwqQEAAMQBABCqAQAA_wEAMKsBAgD0AQAhsAFAAPYBACGxAUAA9gEAIb0BAgD0AQAhvwECAPQBACHAAQIA9AEAIcEBCACAAgAhwgEIAIACACEDAAAAJwAgAQAAwwEAMBcAAMQBACADAAAAJwAgAQAAKAAwAgAAKQAgAQAAADQAIAEAAAA0ACADAAAAMgAgAQAAMwAwAgAANAAgAwAAADIAIAEAADMAMAIAADQAIAMAAAAyACABAAAzADACAAA0ACAHJAAAuQIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG-AQEAAAABvwECAAAAAQELAADMAQAgBqsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG-AQEAAAABvwECAAAAAQELAADOAQAwAQsAAM4BADAHJAAAuAIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvgEBAK4CACG_AQIArwIAIQIAAAA0ACALAADRAQAgBqsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvgEBAK4CACG_AQIArwIAIQIAAAAyACALAADTAQAgAgAAADIAIAsAANMBACADAAAANAAgEgAAzAEAIBMAANEBACABAAAANAAgAQAAADIAIAUFAACzAgAgGAAAtAIAIBkAALcCACAaAAC2AgAgGwAAtQIAIAmoAQAA_gEAMKkBAADaAQAQqgEAAP4BADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACG9AQIA9AEAIb4BAQD1AQAhvwECAPQBACEDAAAAMgAgAQAA2QEAMBcAANoBACADAAAAMgAgAQAAMwAwAgAANAAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAIAwAAsgIAIKsBAgAAAAGsAQIAAAABrQEBAAAAAa4BAQAAAAGvAQIAAAABsAFAAAAAAbEBQAAAAAEBCwAA4gEAIAerAQIAAAABrAECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABAQsAAOQBADABCwAA5AEAMAgDAACxAgAgqwECAK8CACGsAQIArwIAIa0BAQCuAgAhrgEBAK4CACGvAQIArwIAIbABQACwAgAhsQFAALACACECAAAABQAgCwAA5wEAIAerAQIArwIAIawBAgCvAgAhrQEBAK4CACGuAQEArgIAIa8BAgCvAgAhsAFAALACACGxAUAAsAIAIQIAAAADACALAADpAQAgAgAAAAMAIAsAAOkBACADAAAABQAgEgAA4gEAIBMAAOcBACABAAAABQAgAQAAAAMAIAUFAACpAgAgGAAAqgIAIBkAAK0CACAaAACsAgAgGwAAqwIAIAqoAQAA8wEAMKkBAADwAQAQqgEAAPMBADCrAQIA9AEAIawBAgD0AQAhrQEBAPUBACGuAQEA9QEAIa8BAgD0AQAhsAFAAPYBACGxAUAA9gEAIQMAAAADACABAADvAQAwFwAA8AEAIAMAAAADACABAAAEADACAAAFACAKqAEAAPMBADCpAQAA8AEAEKoBAADzAQAwqwECAPQBACGsAQIA9AEAIa0BAQD1AQAhrgEBAPUBACGvAQIA9AEAIbABQAD2AQAhsQFAAPYBACENBQAA-AEAIBgAAP0BACAZAAD4AQAgGgAA-AEAIBsAAPgBACCyAQIAAAABswECAAAABLQBAgAAAAS1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAPwBACEOBQAA-AEAIBoAAPsBACAbAAD7AQAgsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD6AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABCwUAAPgBACAaAAD5AQAgGwAA-QEAILIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA9wEAIQsFAAD4AQAgGgAA-QEAIBsAAPkBACCyAUAAAAABswFAAAAABLQBQAAAAAS1AUAAAAABtgFAAAAAAbcBQAAAAAG4AUAAAAABuQFAAPcBACEIsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD4AQAhCLIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA-QEAIQ4FAAD4AQAgGgAA-wEAIBsAAPsBACCyAQEAAAABswEBAAAABLQBAQAAAAS1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAPoBACG6AQEAAAABuwEBAAAAAbwBAQAAAAELsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD7AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABDQUAAPgBACAYAAD9AQAgGQAA-AEAIBoAAPgBACAbAAD4AQAgsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD8AQAhCLIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgA_QEAIQmoAQAA_gEAMKkBAADaAQAQqgEAAP4BADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACG9AQIA9AEAIb4BAQD1AQAhvwECAPQBACELqAEAAP8BADCpAQAAxAEAEKoBAAD_AQAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhvQECAPQBACG_AQIA9AEAIcABAgD0AQAhwQEIAIACACHCAQgAgAIAIQ0FAAD4AQAgGAAA_QEAIBkAAP0BACAaAAD9AQAgGwAA_QEAILIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAgQIAIQ0FAAD4AQAgGAAA_QEAIBkAAP0BACAaAAD9AQAgGwAA_QEAILIBCAAAAAGzAQgAAAAEtAEIAAAABLUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAgQIAIQmoAQAAggIAMKkBAACuAQAQqgEAAIICADCrAQIA9AEAIbABQAD2AQAhsQFAAPYBACHDAQIA9AEAIcQBAgD0AQAhxQEIAIACACEJqAEAAIMCADCpAQAAmAEAEKoBAACDAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhxgFAAPYBACHHAQgAgAIAIcgBCACAAgAhCh4AAIgCACCoAQAAhAIAMKkBAACFAQAQqgEAAIQCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHGAUAAhgIAIccBCACHAgAhyAEIAIcCACEIsgECAAAAAbMBAgAAAAS0AQIAAAAEtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgD4AQAhCLIBQAAAAAGzAUAAAAAEtAFAAAAABLUBQAAAAAG2AUAAAAABtwFAAAAAAbgBQAAAAAG5AUAA-QEAIQiyAQgAAAABswEIAAAABLQBCAAAAAS1AQgAAAABtgEIAAAAAbcBCAAAAAG4AQgAAAABuQEIAP0BACEDyQEAACEAIMoBAAAhACDLAQAAIQAgDqgBAACJAgAwqQEAAH8AEKoBAACJAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzAEBAPUBACHNAQEA9QEAIc4BAQCKAgAhzwECAIsCACHQAQgAgAIAIdEBCACAAgAh0gECAPQBACHTAQIAiwIAIQ4FAACNAgAgGgAAkAIAIBsAAJACACCyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAI8CACG6AQEAAAABuwEBAAAAAbwBAQAAAAENBQAAjQIAIBgAAI4CACAZAACNAgAgGgAAjQIAIBsAAI0CACCyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAIwCACENBQAAjQIAIBgAAI4CACAZAACNAgAgGgAAjQIAIBsAAI0CACCyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAIwCACEIsgECAAAAAbMBAgAAAAW0AQIAAAAFtQECAAAAAbYBAgAAAAG3AQIAAAABuAECAAAAAbkBAgCNAgAhCLIBCAAAAAGzAQgAAAAFtAEIAAAABbUBCAAAAAG2AQgAAAABtwEIAAAAAbgBCAAAAAG5AQgAjgIAIQ4FAACNAgAgGgAAkAIAIBsAAJACACCyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAI8CACG6AQEAAAABuwEBAAAAAbwBAQAAAAELsgEBAAAAAbMBAQAAAAW0AQEAAAAFtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCQAgAhugEBAAAAAbsBAQAAAAG8AQEAAAABB6gBAACRAgAwqQEAAGcAEKoBAACRAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAhzQEBAPUBACEIIgAAlAIAIKgBAACSAgAwqQEAACsAEKoBAACSAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACELsgEBAAAAAbMBAQAAAAS0AQEAAAAEtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQD7AQAhugEBAAAAAbsBAQAAAAG8AQEAAAABA8kBAAAtACDKAQAALQAgywEAAC0AIAuoAQAAlQIAMKkBAABPABCqAQAAlQIAMKsBAgD0AQAhsAFAAPYBACGxAUAA9gEAIc0BAQD1AQAh1AEBAPUBACHVAQEAigIAIdYBAQD1AQAh1wEBAIoCACEMHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHUAQEAkwIAIdUBAQCXAgAh1gEBAJMCACHXAQEAlwIAIQuyAQEAAAABswEBAAAABbQBAQAAAAW1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAJACACG6AQEAAAABuwEBAAAAAbwBAQAAAAEKJAAAmQIAIKgBAACYAgAwqQEAADIAEKoBAACYAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhvQECAIUCACG-AQEAkwIAIb8BAgCFAgAhEyMAAJwCACAlAACdAgAgJgAAngIAIKgBAACaAgAwqQEAAC0AEKoBAACaAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIdsBAAAtACDcAQAALQAgESMAAJwCACAlAACdAgAgJgAAngIAIKgBAACaAgAwqQEAAC0AEKoBAACaAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIQiyAQIAAAABswECAAAABbQBAgAAAAW1AQIAAAABtgECAAAAAbcBAgAAAAG4AQIAAAABuQECAI0CACEKIgAAlAIAIKgBAACSAgAwqQEAACsAEKoBAACSAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHbAQAAKwAg3AEAACsAIAPJAQAAMgAgygEAADIAIMsBAAAyACADyQEAACcAIMoBAAAnACDLAQAAJwAgDSEAAKACACAkAACZAgAgqAEAAJ8CADCpAQAAJwAQqgEAAJ8CADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb8BAgCFAgAhwAECAIUCACHBAQgAhwIAIcIBCACHAgAhDh8AAKICACAgAACjAgAgJwAAngIAIKgBAAChAgAwqQEAACEAEKoBAAChAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhwwECAIUCACHEAQIAhQIAIcUBCACHAgAh2wEAACEAINwBAAAhACAMHwAAogIAICAAAKMCACAnAACeAgAgqAEAAKECADCpAQAAIQAQqgEAAKECADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACEMHgAAiAIAIKgBAACEAgAwqQEAAIUBABCqAQAAhAIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIcYBQACGAgAhxwEIAIcCACHIAQgAhwIAIdsBAACFAQAg3AEAAIUBACAOHgAAiAIAIKgBAACWAgAwqQEAADwAEKoBAACWAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzQEBAJMCACHUAQEAkwIAIdUBAQCXAgAh1gEBAJMCACHXAQEAlwIAIdsBAAA8ACDcAQAAPAAgCagBAACkAgAwqQEAABwAEKoBAACkAgAwqwECAPQBACGwAUAA9gEAIbEBQAD2AQAh2AEBAPUBACHZAQEA9QEAIdoBAQD1AQAhCgQAAKYCACCoAQAApQIAMKkBAAAJABCqAQAApQIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIdgBAQCTAgAh2QEBAJMCACHaAQEAkwIAIQPJAQAAAwAgygEAAAMAIMsBAAADACALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAIUCACGsAQIAhQIAIa0BAQCTAgAhrgEBAJMCACGvAQIAhQIAIbABQACGAgAhsQFAAIYCACEMBAAApgIAIKgBAAClAgAwqQEAAAkAEKoBAAClAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAh2AEBAJMCACHZAQEAkwIAIdoBAQCTAgAh2wEAAAkAINwBAAAJACAAAAAAAAHgAQEAAAABBeABAgAAAAHmAQIAAAAB5wECAAAAAegBAgAAAAHpAQIAAAABAeABQAAAAAEFEgAA9wMAIBMAAPoDACDdAQAA-AMAIN4BAAD5AwAg4wEAAAEAIAMSAAD3AwAg3QEAAPgDACDjAQAAAQAgAAAAAAAFEgAA8gMAIBMAAPUDACDdAQAA8wMAIN4BAAD0AwAg4wEAAC8AIAMSAADyAwAg3QEAAPMDACDjAQAALwAgAAAAAAAF4AEIAAAAAeYBCAAAAAHnAQgAAAAB6AEIAAAAAekBCAAAAAEFEgAA6gMAIBMAAPADACDdAQAA6wMAIN4BAADvAwAg4wEAACMAIAUSAADoAwAgEwAA7QMAIN0BAADpAwAg3gEAAOwDACDjAQAALwAgAxIAAOoDACDdAQAA6wMAIOMBAAAjACADEgAA6AMAIN0BAADpAwAg4wEAAC8AIAAAAAAABRIAAN8DACATAADmAwAg3QEAAOADACDeAQAA5QMAIOMBAACCAQAgBRIAAN0DACATAADjAwAg3QEAAN4DACDeAQAA4gMAIOMBAAAfACALEgAAzAIAMBMAANECADDdAQAAzQIAMN4BAADOAgAw3wEAAM8CACDgAQAA0AIAMOEBAADQAgAw4gEAANACADDjAQAA0AIAMOQBAADSAgAw5QEAANMCADAIJAAAwwIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwQEIAAAAAcIBCAAAAAECAAAAKQAgEgAA1wIAIAMAAAApACASAADXAgAgEwAA1gIAIAELAADhAwAwDSEAAKACACAkAACZAgAgqAEAAJ8CADCpAQAAJwAQqgEAAJ8CADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvwECAIUCACHAAQIAhQIAIcEBCACHAgAhwgEIAIcCACECAAAAKQAgCwAA1gIAIAIAAADUAgAgCwAA1QIAIAuoAQAA0wIAMKkBAADUAgAQqgEAANMCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb8BAgCFAgAhwAECAIUCACHBAQgAhwIAIcIBCACHAgAhC6gBAADTAgAwqQEAANQCABCqAQAA0wIAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvwECAIUCACHAAQIAhQIAIcEBCACHAgAhwgEIAIcCACEHqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvQECAK8CACG_AQIArwIAIcEBCAC_AgAhwgEIAL8CACEIJAAAwQIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb0BAgCvAgAhvwECAK8CACHBAQgAvwIAIcIBCAC_AgAhCCQAAMMCACCrAQIAAAABsAFAAAAAAbEBQAAAAAG9AQIAAAABvwECAAAAAcEBCAAAAAHCAQgAAAABAxIAAN8DACDdAQAA4AMAIOMBAACCAQAgAxIAAN0DACDdAQAA3gMAIOMBAAAfACAEEgAAzAIAMN0BAADNAgAw3wEAAM8CACDjAQAA0AIAMAAAAAAACxIAAOECADATAADmAgAw3QEAAOICADDeAQAA4wIAMN8BAADkAgAg4AEAAOUCADDhAQAA5QIAMOIBAADlAgAw4wEAAOUCADDkAQAA5wIAMOUBAADoAgAwByAAANkCACAnAADaAgAgqwECAAAAAbABQAAAAAGxAUAAAAABxAECAAAAAcUBCAAAAAECAAAAIwAgEgAA7AIAIAMAAAAjACASAADsAgAgEwAA6wIAIAELAADcAwAwDB8AAKICACAgAACjAgAgJwAAngIAIKgBAAChAgAwqQEAACEAEKoBAAChAgAwqwECAAAAAbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACECAAAAIwAgCwAA6wIAIAIAAADpAgAgCwAA6gIAIAmoAQAA6AIAMKkBAADpAgAQqgEAAOgCADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHDAQIAhQIAIcQBAgCFAgAhxQEIAIcCACEJqAEAAOgCADCpAQAA6QIAEKoBAADoAgAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhwwECAIUCACHEAQIAhQIAIcUBCACHAgAhBasBAgCvAgAhsAFAALACACGxAUAAsAIAIcQBAgCvAgAhxQEIAL8CACEHIAAAygIAICcAAMsCACCrAQIArwIAIbABQACwAgAhsQFAALACACHEAQIArwIAIcUBCAC_AgAhByAAANkCACAnAADaAgAgqwECAAAAAbABQAAAAAGxAUAAAAABxAECAAAAAcUBCAAAAAEEEgAA4QIAMN0BAADiAgAw3wEAAOQCACDjAQAA5QIAMAAAAAAAAAAB4AEBAAAAAQXgAQIAAAAB5gECAAAAAecBAgAAAAHoAQIAAAAB6QECAAAAAQcSAADVAwAgEwAA2gMAIN0BAADWAwAg3gEAANkDACDhAQAAKwAg4gEAACsAIOMBAABSACALEgAAgwMAMBMAAIgDADDdAQAAhAMAMN4BAACFAwAw3wEAAIYDACDgAQAAhwMAMOEBAACHAwAw4gEAAIcDADDjAQAAhwMAMOQBAACJAwAw5QEAAIoDADALEgAA-gIAMBMAAP4CADDdAQAA-wIAMN4BAAD8AgAw3wEAAP0CACDgAQAA0AIAMOEBAADQAgAw4gEAANACADDjAQAA0AIAMOQBAAD_AgAw5QEAANMCADAIIQAAwgIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAb8BAgAAAAHAAQIAAAABwQEIAAAAAcIBCAAAAAECAAAAKQAgEgAAggMAIAMAAAApACASAACCAwAgEwAAgQMAIAELAADYAwAwAgAAACkAIAsAAIEDACACAAAA1AIAIAsAAIADACAHqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvwECAK8CACHAAQIArwIAIcEBCAC_AgAhwgEIAL8CACEIIQAAwAIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIb8BAgCvAgAhwAECAK8CACHBAQgAvwIAIcIBCAC_AgAhCCEAAMICACCrAQIAAAABsAFAAAAAAbEBQAAAAAG_AQIAAAABwAECAAAAAcEBCAAAAAHCAQgAAAABBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABAgAAADQAIBIAAI4DACADAAAANAAgEgAAjgMAIBMAAI0DACABCwAA1wMAMAokAACZAgAgqAEAAJgCADCpAQAAMgAQqgEAAJgCADCrAQIAAAABsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvgEBAJMCACG_AQIAhQIAIQIAAAA0ACALAACNAwAgAgAAAIsDACALAACMAwAgCagBAACKAwAwqQEAAIsDABCqAQAAigMAMKsBAgCFAgAhsAFAAIYCACGxAUAAhgIAIb0BAgCFAgAhvgEBAJMCACG_AQIAhQIAIQmoAQAAigMAMKkBAACLAwAQqgEAAIoDADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACG9AQIAhQIAIb4BAQCTAgAhvwECAIUCACEFqwECAK8CACGwAUAAsAIAIbEBQACwAgAhvgEBAK4CACG_AQIArwIAIQWrAQIArwIAIbABQACwAgAhsQFAALACACG-AQEArgIAIb8BAgCvAgAhBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABAxIAANUDACDdAQAA1gMAIOMBAABSACAEEgAAgwMAMN0BAACEAwAw3wEAAIYDACDjAQAAhwMAMAQSAAD6AgAw3QEAAPsCADDfAQAA_QIAIOMBAADQAgAwAAAAAAALEgAAmAMAMBMAAJ0DADDdAQAAmQMAMN4BAACaAwAw3wEAAJsDACDgAQAAnAMAMOEBAACcAwAw4gEAAJwDADDjAQAAnAMAMOQBAACeAwAw5QEAAJ8DADAMJQAAkAMAICYAAJEDACCrAQIAAAABsAFAAAAAAbEBQAAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABAgAAAC8AIBIAAKMDACADAAAALwAgEgAAowMAIBMAAKIDACABCwAA1AMAMBEjAACcAgAgJQAAnQIAICYAAJ4CACCoAQAAmgIAMKkBAAAtABCqAQAAmgIAMKsBAgAAAAGwAUAAhgIAIbEBQACGAgAhzAEBAAAAAc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhAgAAAC8AIAsAAKIDACACAAAAoAMAIAsAAKEDACAOqAEAAJ8DADCpAQAAoAMAEKoBAACfAwAwqwECAIUCACGwAUAAhgIAIbEBQACGAgAhzAEBAJMCACHNAQEAkwIAIc4BAQCXAgAhzwECAJsCACHQAQgAhwIAIdEBCACHAgAh0gECAIUCACHTAQIAmwIAIQ6oAQAAnwMAMKkBAACgAwAQqgEAAJ8DADCrAQIAhQIAIbABQACGAgAhsQFAAIYCACHMAQEAkwIAIc0BAQCTAgAhzgEBAJcCACHPAQIAmwIAIdABCACHAgAh0QEIAIcCACHSAQIAhQIAIdMBAgCbAgAhCqsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhDCUAAPgCACAmAAD5AgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzAEBAK4CACHNAQEArgIAIc4BAQD1AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACEMJQAAkAMAICYAAJEDACCrAQIAAAABsAFAAAAAAbEBQAAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABBBIAAJgDADDdAQAAmQMAMN8BAACbAwAg4wEAAJwDADAAAAAAAAALEgAArAMAMBMAALADADDdAQAArQMAMN4BAACuAwAw3wEAAK8DACDgAQAA5QIAMOEBAADlAgAw4gEAAOUCADDjAQAA5QIAMOQBAACxAwAw5QEAAOgCADAHHwAA2AIAICcAANoCACCrAQIAAAABsAFAAAAAAbEBQAAAAAHDAQIAAAABxQEIAAAAAQIAAAAjACASAAC0AwAgAwAAACMAIBIAALQDACATAACzAwAgAQsAANMDADACAAAAIwAgCwAAswMAIAIAAADpAgAgCwAAsgMAIAWrAQIArwIAIbABQACwAgAhsQFAALACACHDAQIArwIAIcUBCAC_AgAhBx8AAMkCACAnAADLAgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhwwECAK8CACHFAQgAvwIAIQcfAADYAgAgJwAA2gIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHFAQgAAAABBBIAAKwDADDdAQAArQMAMN8BAACvAwAg4wEAAOUCADAGIwAAtwMAICUAALgDACAmAAC5AwAgzgEAAO8CACDPAQAA7wIAINMBAADvAgAgASIAAKUDACAAAAMfAAC7AwAgIAAAvAMAICcAALkDACABHgAA7gIAIAMeAADuAgAg1QEAAO8CACDXAQAA7wIAIAAAAAAACxIAAMMDADATAADIAwAw3QEAAMQDADDeAQAAxQMAMN8BAADGAwAg4AEAAMcDADDhAQAAxwMAMOIBAADHAwAw4wEAAMcDADDkAQAAyQMAMOUBAADKAwAwBqsBAgAAAAGtAQEAAAABrgEBAAAAAa8BAgAAAAGwAUAAAAABsQFAAAAAAQIAAAAFACASAADOAwAgAwAAAAUAIBIAAM4DACATAADNAwAgAQsAANIDADALAwAAqAIAIKgBAACnAgAwqQEAAAMAEKoBAACnAgAwqwECAAAAAawBAgCFAgAhrQEBAJMCACGuAQEAkwIAIa8BAgCFAgAhsAFAAIYCACGxAUAAhgIAIQIAAAAFACALAADNAwAgAgAAAMsDACALAADMAwAgCqgBAADKAwAwqQEAAMsDABCqAQAAygMAMKsBAgCFAgAhrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhCqgBAADKAwAwqQEAAMsDABCqAQAAygMAMKsBAgCFAgAhrAECAIUCACGtAQEAkwIAIa4BAQCTAgAhrwECAIUCACGwAUAAhgIAIbEBQACGAgAhBqsBAgCvAgAhrQEBAK4CACGuAQEArgIAIa8BAgCvAgAhsAFAALACACGxAUAAsAIAIQarAQIArwIAIa0BAQCuAgAhrgEBAK4CACGvAQIArwIAIbABQACwAgAhsQFAALACACEGqwECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABBBIAAMMDADDdAQAAxAMAMN8BAADGAwAg4wEAAMcDADAAAQQAANADACAGqwECAAAAAa0BAQAAAAGuAQEAAAABrwECAAAAAbABQAAAAAGxAUAAAAABBasBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHFAQgAAAABCqsBAgAAAAGwAUAAAAABsQFAAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAdABCAAAAAHRAQgAAAAB0gECAAAAAdMBAgAAAAEEqwECAAAAAbABQAAAAAGxAUAAAAABzQEBAAAAAQIAAABSACASAADVAwAgBasBAgAAAAGwAUAAAAABsQFAAAAAAb4BAQAAAAG_AQIAAAABB6sBAgAAAAGwAUAAAAABsQFAAAAAAb8BAgAAAAHAAQIAAAABwQEIAAAAAcIBCAAAAAEDAAAAKwAgEgAA1QMAIBMAANsDACAGAAAAKwAgCwAA2wMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAhBKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAhBasBAgAAAAGwAUAAAAABsQFAAAAAAcQBAgAAAAHFAQgAAAABCKsBAgAAAAGwAUAAAAABsQFAAAAAAc0BAQAAAAHUAQEAAAAB1QEBAAAAAdYBAQAAAAHXAQEAAAABAgAAAB8AIBIAAN0DACAGqwECAAAAAbABQAAAAAGxAUAAAAABxgFAAAAAAccBCAAAAAHIAQgAAAABAgAAAIIBACASAADfAwAgB6sBAgAAAAGwAUAAAAABsQFAAAAAAb0BAgAAAAG_AQIAAAABwQEIAAAAAcIBCAAAAAEDAAAAPAAgEgAA3QMAIBMAAOQDACAKAAAAPAAgCwAA5AMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIc0BAQCuAgAh1AEBAK4CACHVAQEA9QIAIdYBAQCuAgAh1wEBAPUCACEIqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzQEBAK4CACHUAQEArgIAIdUBAQD1AgAh1gEBAK4CACHXAQEA9QIAIQMAAACFAQAgEgAA3wMAIBMAAOcDACAIAAAAhQEAIAsAAOcDACCrAQIArwIAIbABQACwAgAhsQFAALACACHGAUAAsAIAIccBCAC_AgAhyAEIAL8CACEGqwECAK8CACGwAUAAsAIAIbEBQACwAgAhxgFAALACACHHAQgAvwIAIcgBCAC_AgAhDSMAAI8DACAlAACQAwAgqwECAAAAAbABQAAAAAGxAUAAAAABzAEBAAAAAc0BAQAAAAHOAQEAAAABzwECAAAAAdABCAAAAAHRAQgAAAAB0gECAAAAAdMBAgAAAAECAAAALwAgEgAA6AMAIAgfAADYAgAgIAAA2QIAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcMBAgAAAAHEAQIAAAABxQEIAAAAAQIAAAAjACASAADqAwAgAwAAAC0AIBIAAOgDACATAADuAwAgDwAAAC0AIAsAAO4DACAjAAD3AgAgJQAA-AIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIc8BAgD2AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACENIwAA9wIAICUAAPgCACCrAQIArwIAIbABQACwAgAhsQFAALACACHMAQEArgIAIc0BAQCuAgAhzgEBAPUCACHPAQIA9gIAIdABCAC_AgAh0QEIAL8CACHSAQIArwIAIdMBAgD2AgAhAwAAACEAIBIAAOoDACATAADxAwAgCgAAACEAIAsAAPEDACAfAADJAgAgIAAAygIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQgfAADJAgAgIAAAygIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcMBAgCvAgAhxAECAK8CACHFAQgAvwIAIQ0jAACPAwAgJgAAkQMAIKsBAgAAAAGwAUAAAAABsQFAAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAc8BAgAAAAHQAQgAAAAB0QEIAAAAAdIBAgAAAAHTAQIAAAABAgAAAC8AIBIAAPIDACADAAAALQAgEgAA8gMAIBMAAPYDACAPAAAALQAgCwAA9gMAICMAAPcCACAmAAD5AgAgqwECAK8CACGwAUAAsAIAIbEBQACwAgAhzAEBAK4CACHNAQEArgIAIc4BAQD1AgAhzwECAPYCACHQAQgAvwIAIdEBCAC_AgAh0gECAK8CACHTAQIA9gIAIQ0jAAD3AgAgJgAA-QIAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIcwBAQCuAgAhzQEBAK4CACHOAQEA9QIAIc8BAgD2AgAh0AEIAL8CACHRAQgAvwIAIdIBAgCvAgAh0wECAPYCACEGqwECAAAAAbABQAAAAAGxAUAAAAAB2AEBAAAAAdkBAQAAAAHaAQEAAAABAgAAAAEAIBIAAPcDACADAAAACQAgEgAA9wMAIBMAAPsDACAIAAAACQAgCwAA-wMAIKsBAgCvAgAhsAFAALACACGxAUAAsAIAIdgBAQCuAgAh2QEBAK4CACHaAQEArgIAIQarAQIArwIAIbABQACwAgAhsQFAALACACHYAQEArgIAIdkBAQCuAgAh2gEBAK4CACECBAYCBQADAQMAAQEEBwAAAAAFBQAIGAAJGQAKGgALGwAMAAAAAAAFBQAIGAAJGQAKGgALGwAMAgUAGR4kDwQFABgfABAgAA4nKhICBQARHiUPAR4mAAIhAA8kABMEBQAXIywUJTUWJjYSAgUAFSIwEwEiMQABJAATAiU3ACY4AAEnOQABHjoAAAAFBQAdGAAeGQAfGgAgGwAhAAAAAAAFBQAdGAAeGQAfGgAgGwAhAAAFBQAmGAAnGQAoGgApGwAqAAAAAAAFBQAmGAAnGQAoGgApGwAqASN0FAEjehQFBQAvGAAwGQAxGgAyGwAzAAAAAAAFBQAvGAAwGQAxGgAyGwAzAAAFBQA4GAA5GQA6GgA7GwA8AAAAAAAFBQA4GAA5GQA6GgA7GwA8Ah8AECAADgIfABAgAA4FBQBBGABCGQBDGgBEGwBFAAAAAAAFBQBBGABCGQBDGgBEGwBFAiEADyQAEwIhAA8kABMFBQBKGABLGQBMGgBNGwBOAAAAAAAFBQBKGABLGQBMGgBNGwBOASQAEwEkABMFBQBTGABUGQBVGgBWGwBXAAAAAAAFBQBTGABUGQBVGgBWGwBXAQMAAQEDAAEFBQBcGABdGQBeGgBfGwBgAAAAAAAFBQBcGABdGQBeGgBfGwBgBgIBBwgBCAsBCQwBCg0BDA8BDREEDhIFDxQBEBYEERcGFBgBFRkBFhoEHB0HHR4NKCAOKTsOKj4OKz8OLEAOLUIOLkQEL0UaMEcOMUkEMkobM0sONEwONU0ENlAcN1EiOFMUOVQUOlYUO1cUPFgUPVoUPlwEP10jQF8UQWEEQmIkQ2MURGQURWUERmglR2krSGoTSWsTSmwTS20TTG4TTXATTnIET3MsUHYTUXgEUnktU3sTVHwTVX0EVoABLleBATRYgwEQWYQBEFqHARBbiAEQXIkBEF2LARBejQEEX44BNWCQARBhkgEEYpMBNmOUARBklQEQZZYBBGaZATdnmgE9aJsBD2mcAQ9qnQEPa54BD2yfAQ9toQEPbqMBBG-kAT5wpgEPcagBBHKpAT9zqgEPdKsBD3WsAQR2rwFAd7ABRnixARJ5sgESerMBEnu0ARJ8tQESfbcBEn65AQR_ugFHgAG8ARKBAb4BBIIBvwFIgwHAARKEAcEBEoUBwgEEhgHFAUmHAcYBT4gBxwEWiQHIARaKAckBFosBygEWjAHLARaNAc0BFo4BzwEEjwHQAVCQAdIBFpEB1AEEkgHVAVGTAdYBFpQB1wEWlQHYAQSWAdsBUpcB3AFYmAHdAQKZAd4BApoB3wECmwHgAQKcAeEBAp0B4wECngHlAQSfAeYBWaAB6AECoQHqAQSiAesBWqMB7AECpAHtAQKlAe4BBKYB8QFbpwHyAWE"
};
async function S(e) {
	let { Buffer: t } = await import("node:buffer"), n = t.from(e, "base64");
	return new WebAssembly.Module(n);
}
x.compilerWasm = {
	getRuntime: async () => await import("./query_compiler_fast_bg.postgresql-CF0WeNa9.js"),
	getQueryCompilerWasmModule: async () => {
		let { wasm: e } = await import("./query_compiler_fast_bg.postgresql.wasm-base64-Bn66wotc.js");
		return await S(e);
	},
	importName: "./query_compiler_fast_bg.js"
};
function ee() {
	return b.getPrismaClient(x);
}
//#endregion
//#region src/generated/prisma/client.ts
b.PrismaClientKnownRequestError, b.PrismaClientUnknownRequestError, b.PrismaClientRustPanicError, b.PrismaClientInitializationError, b.PrismaClientValidationError, b.sqltag, b.empty, b.join, b.raw, b.Sql, b.Decimal, b.Extensions.getExtensionContext, b.NullTypes.DbNull, b.NullTypes.JsonNull, b.NullTypes.AnyNull, b.DbNull, b.JsonNull, b.AnyNull, b.makeStrictEnum({
	ReadUncommitted: "ReadUncommitted",
	ReadCommitted: "ReadCommitted",
	RepeatableRead: "RepeatableRead",
	Serializable: "Serializable"
}), b.Extensions.defineExtension, globalThis.__dirname = r.dirname(a(import.meta.url));
var te = ee(), { Pool: ne } = s, re = globalThis;
re.pool ||= new ne({ connectionString: process.env.DATABASE_URL });
var C = new o(re.pool), w = re.prisma ?? new te({ adapter: C });
process.env.NODE_ENV !== "production" && (re.prisma = w);
//#endregion
//#region src/main/services/ClientService.ts
var ie = class {
	static async getAllClients() {
		return w.client.findMany({ orderBy: { created_at: "desc" } });
	}
	static async createClient(e, t = 1) {
		if (await w.client.findFirst({ where: { dni: e.dni } })) throw Error(`El DNI ${e.dni} ya se encuentra registrado.`);
		let n = await w.client.create({ data: e });
		return await w.auditLog.create({ data: {
			user_id: t,
			action: "CREATE_CLIENT",
			entity: "clients",
			entity_id: n.id
		} }), n.id;
	}
};
Object.freeze({ status: "aborted" });
function T(e, t, n) {
	function r(n, r) {
		if (n._zod || Object.defineProperty(n, "_zod", {
			value: {
				def: r,
				constr: o,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: !1
		}), n._zod.traits.has(e)) return;
		n._zod.traits.add(e), t(n, r);
		let i = o.prototype, a = Object.keys(i);
		for (let e = 0; e < a.length; e++) {
			let t = a[e];
			t in n || (n[t] = i[t].bind(n));
		}
	}
	let i = n?.Parent ?? Object;
	class a extends i {}
	Object.defineProperty(a, "name", { value: e });
	function o(e) {
		var t;
		let i = n?.Parent ? new a() : this;
		r(i, e), (t = i._zod).deferred ?? (t.deferred = []);
		for (let e of i._zod.deferred) e();
		return i;
	}
	return Object.defineProperty(o, "init", { value: r }), Object.defineProperty(o, Symbol.hasInstance, { value: (t) => n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(o, "name", { value: e }), o;
}
var E = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, D = class extends Error {
	constructor(e) {
		super(`Encountered unidirectional transform during encode: ${e}`), this.name = "ZodEncodeError";
	}
}, ae = {};
function oe(e) {
	return e && Object.assign(ae, e), ae;
}
//#endregion
//#region node_modules/zod/v4/core/util.js
function se(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function ce(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
function O(e) {
	return { get value() {
		{
			let t = e();
			return Object.defineProperty(this, "value", { value: t }), t;
		}
		throw Error("cached value already set");
	} };
}
function le(e) {
	return e == null;
}
function ue(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function de(e, t) {
	let n = (e.toString().split(".")[1] || "").length, r = t.toString(), i = (r.split(".")[1] || "").length;
	if (i === 0 && /\d?e-\d?/.test(r)) {
		let e = r.match(/\d?e-(\d?)/);
		e?.[1] && (i = Number.parseInt(e[1]));
	}
	let a = n > i ? n : i;
	return Number.parseInt(e.toFixed(a).replace(".", "")) % Number.parseInt(t.toFixed(a).replace(".", "")) / 10 ** a;
}
var fe = Symbol("evaluating");
function k(e, t, n) {
	let r;
	Object.defineProperty(e, t, {
		get() {
			if (r !== fe) return r === void 0 && (r = fe, r = n()), r;
		},
		set(n) {
			Object.defineProperty(e, t, { value: n });
		},
		configurable: !0
	});
}
function A(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function j(...e) {
	let t = {};
	for (let n of e) Object.assign(t, Object.getOwnPropertyDescriptors(n));
	return Object.defineProperties({}, t);
}
function pe(e) {
	return JSON.stringify(e);
}
function me(e) {
	return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var he = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function ge(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var _e = O(() => {
	if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function M(e) {
	if (ge(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return !(ge(n) === !1 || Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") === !1);
}
function N(e) {
	return M(e) ? { ...e } : Array.isArray(e) ? [...e] : e;
}
var ve = new Set([
	"string",
	"number",
	"symbol"
]);
function ye(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function be(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function P(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function xe(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin === "optional" && e[t]._zod.optout === "optional");
}
var F = {
	safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function Se(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".pick() cannot be used on object schemas containing refinements");
	return be(e, j(e._zod.def, {
		get shape() {
			let e = {};
			for (let r in t) {
				if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
				t[r] && (e[r] = n.shape[r]);
			}
			return A(this, "shape", e), e;
		},
		checks: []
	}));
}
function Ce(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".omit() cannot be used on object schemas containing refinements");
	return be(e, j(e._zod.def, {
		get shape() {
			let r = { ...e._zod.def.shape };
			for (let e in t) {
				if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
				t[e] && delete r[e];
			}
			return A(this, "shape", r), r;
		},
		checks: []
	}));
}
function we(e, t) {
	if (!M(t)) throw Error("Invalid input to extend: expected a plain object");
	let n = e._zod.def.checks;
	if (n && n.length > 0) {
		let n = e._zod.def.shape;
		for (let e in t) if (Object.getOwnPropertyDescriptor(n, e) !== void 0) throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return be(e, j(e._zod.def, { get shape() {
		let n = {
			...e._zod.def.shape,
			...t
		};
		return A(this, "shape", n), n;
	} }));
}
function I(e, t) {
	if (!M(t)) throw Error("Invalid input to safeExtend: expected a plain object");
	return be(e, j(e._zod.def, { get shape() {
		let n = {
			...e._zod.def.shape,
			...t
		};
		return A(this, "shape", n), n;
	} }));
}
function L(e, t) {
	return be(e, j(e._zod.def, {
		get shape() {
			let n = {
				...e._zod.def.shape,
				...t._zod.def.shape
			};
			return A(this, "shape", n), n;
		},
		get catchall() {
			return t._zod.def.catchall;
		},
		checks: []
	}));
}
function R(e, t, n) {
	let r = t._zod.def.checks;
	if (r && r.length > 0) throw Error(".partial() cannot be used on object schemas containing refinements");
	return be(t, j(t._zod.def, {
		get shape() {
			let r = t._zod.def.shape, i = { ...r };
			if (n) for (let t in n) {
				if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
				n[t] && (i[t] = e ? new e({
					type: "optional",
					innerType: r[t]
				}) : r[t]);
			}
			else for (let t in r) i[t] = e ? new e({
				type: "optional",
				innerType: r[t]
			}) : r[t];
			return A(this, "shape", i), i;
		},
		checks: []
	}));
}
function Te(e, t, n) {
	return be(t, j(t._zod.def, { get shape() {
		let r = t._zod.def.shape, i = { ...r };
		if (n) for (let t in n) {
			if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
			n[t] && (i[t] = new e({
				type: "nonoptional",
				innerType: r[t]
			}));
		}
		else for (let t in r) i[t] = new e({
			type: "nonoptional",
			innerType: r[t]
		});
		return A(this, "shape", i), i;
	} }));
}
function Ee(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function De(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function z(e) {
	return typeof e == "string" ? e : e?.message;
}
function B(e, t, n) {
	let r = {
		...e,
		path: e.path ?? []
	};
	return e.message || (r.message = z(e.inst?._zod.def?.error?.(e)) ?? z(t?.error?.(e)) ?? z(n.customError?.(e)) ?? z(n.localeError?.(e)) ?? "Invalid input"), delete r.inst, delete r.continue, t?.reportInput || delete r.input, r;
}
function Oe(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function ke(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
//#endregion
//#region node_modules/zod/v4/core/errors.js
var Ae = (e, t) => {
	e.name = "$ZodError", Object.defineProperty(e, "_zod", {
		value: e._zod,
		enumerable: !1
	}), Object.defineProperty(e, "issues", {
		value: t,
		enumerable: !1
	}), e.message = JSON.stringify(t, ce, 2), Object.defineProperty(e, "toString", {
		value: () => e.message,
		enumerable: !1
	});
}, je = T("$ZodError", Ae), Me = T("$ZodError", Ae, { Parent: Error });
function Ne(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? (n[i.path[0]] = n[i.path[0]] || [], n[i.path[0]].push(t(i))) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function Pe(e, t = (e) => e.message) {
	let n = { _errors: [] }, r = (e) => {
		for (let i of e.issues) if (i.code === "invalid_union" && i.errors.length) i.errors.map((e) => r({ issues: e }));
		else if (i.code === "invalid_key") r({ issues: i.issues });
		else if (i.code === "invalid_element") r({ issues: i.issues });
		else if (i.path.length === 0) n._errors.push(t(i));
		else {
			let e = n, r = 0;
			for (; r < i.path.length;) {
				let n = i.path[r];
				r === i.path.length - 1 ? (e[n] = e[n] || { _errors: [] }, e[n]._errors.push(t(i))) : e[n] = e[n] || { _errors: [] }, e = e[n], r++;
			}
		}
	};
	return r(e), n;
}
//#endregion
//#region node_modules/zod/v4/core/parse.js
var Fe = (e) => (t, n, r, i) => {
	let a = r ? Object.assign(r, { async: !1 }) : { async: !1 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise) throw new E();
	if (o.issues.length) {
		let t = new (i?.Err ?? e)(o.issues.map((e) => B(e, a, oe())));
		throw he(t, i?.callee), t;
	}
	return o.value;
}, Ie = (e) => async (t, n, r, i) => {
	let a = r ? Object.assign(r, { async: !0 }) : { async: !0 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise && (o = await o), o.issues.length) {
		let t = new (i?.Err ?? e)(o.issues.map((e) => B(e, a, oe())));
		throw he(t, i?.callee), t;
	}
	return o.value;
}, Le = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new E();
	return a.issues.length ? {
		success: !1,
		error: new (e ?? je)(a.issues.map((e) => B(e, i, oe())))
	} : {
		success: !0,
		data: a.value
	};
}, Re = /* @__PURE__ */ Le(Me), ze = (e) => async (t, n, r) => {
	let i = r ? Object.assign(r, { async: !0 }) : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? {
		success: !1,
		error: new e(a.issues.map((e) => B(e, i, oe())))
	} : {
		success: !0,
		data: a.value
	};
}, Be = /* @__PURE__ */ ze(Me), Ve = (e) => (t, n, r) => {
	let i = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
	return Fe(e)(t, n, i);
}, He = (e) => (t, n, r) => Fe(e)(t, n, r), Ue = (e) => async (t, n, r) => {
	let i = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
	return Ie(e)(t, n, i);
}, We = (e) => async (t, n, r) => Ie(e)(t, n, r), Ge = (e) => (t, n, r) => {
	let i = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
	return Le(e)(t, n, i);
}, Ke = (e) => (t, n, r) => Le(e)(t, n, r), qe = (e) => async (t, n, r) => {
	let i = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
	return ze(e)(t, n, i);
}, Je = (e) => async (t, n, r) => ze(e)(t, n, r), Ye = /^[cC][^\s-]{8,}$/, Xe = /^[0-9a-z]+$/, Ze = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, Qe = /^[0-9a-vA-V]{20}$/, $e = /^[A-Za-z0-9]{27}$/, et = /^[a-zA-Z0-9_-]{21}$/, tt = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, nt = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, rt = (e) => e ? RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, it = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, at = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function ot() {
	return new RegExp(at, "u");
}
var st = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ct = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, lt = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, ut = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, dt = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, ft = /^[A-Za-z0-9_-]*$/, pt = /^\+[1-9]\d{6,14}$/, mt = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", ht = /* @__PURE__ */ RegExp(`^${mt}$`);
function gt(e) {
	let t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
	return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function _t(e) {
	return RegExp(`^${gt(e)}$`);
}
function vt(e) {
	let t = gt({ precision: e.precision }), n = ["Z"];
	e.local && n.push(""), e.offset && n.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
	let r = `${t}(?:${n.join("|")})`;
	return RegExp(`^${mt}T(?:${r})$`);
}
var yt = (e) => {
	let t = e ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ""}}` : "[\\s\\S]*";
	return RegExp(`^${t}$`);
}, bt = /^-?\d+$/, xt = /^-?\d+(?:\.\d+)?$/, St = /^[^A-Z]*$/, Ct = /^[^a-z]*$/, V = /* @__PURE__ */ T("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), wt = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, Tt = /* @__PURE__ */ T("$ZodCheckLessThan", (e, t) => {
	V.init(e, t);
	let n = wt[typeof t.value];
	e._zod.onattach.push((e) => {
		let n = e._zod.bag, r = (t.inclusive ? n.maximum : n.exclusiveMaximum) ?? Infinity;
		t.value < r && (t.inclusive ? n.maximum = t.value : n.exclusiveMaximum = t.value);
	}), e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), Et = /* @__PURE__ */ T("$ZodCheckGreaterThan", (e, t) => {
	V.init(e, t);
	let n = wt[typeof t.value];
	e._zod.onattach.push((e) => {
		let n = e._zod.bag, r = (t.inclusive ? n.minimum : n.exclusiveMinimum) ?? -Infinity;
		t.value > r && (t.inclusive ? n.minimum = t.value : n.exclusiveMinimum = t.value);
	}), e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), Dt = /* @__PURE__ */ T("$ZodCheckMultipleOf", (e, t) => {
	V.init(e, t), e._zod.onattach.push((e) => {
		var n;
		(n = e._zod.bag).multipleOf ?? (n.multipleOf = t.value);
	}), e._zod.check = (n) => {
		if (typeof n.value != typeof t.value) throw Error("Cannot mix number and bigint in multiple_of check.");
		(typeof n.value == "bigint" ? n.value % t.value === BigInt(0) : de(n.value, t.value) === 0) || n.issues.push({
			origin: typeof n.value,
			code: "not_multiple_of",
			divisor: t.value,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Ot = /* @__PURE__ */ T("$ZodCheckNumberFormat", (e, t) => {
	V.init(e, t), t.format = t.format || "float64";
	let n = t.format?.includes("int"), r = n ? "int" : "number", [i, a] = F[t.format];
	e._zod.onattach.push((e) => {
		let r = e._zod.bag;
		r.format = t.format, r.minimum = i, r.maximum = a, n && (r.pattern = bt);
	}), e._zod.check = (o) => {
		let s = o.value;
		if (n) {
			if (!Number.isInteger(s)) {
				o.issues.push({
					expected: r,
					format: t.format,
					code: "invalid_type",
					continue: !1,
					input: s,
					inst: e
				});
				return;
			}
			if (!Number.isSafeInteger(s)) {
				s > 0 ? o.issues.push({
					input: s,
					code: "too_big",
					maximum: 2 ** 53 - 1,
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				}) : o.issues.push({
					input: s,
					code: "too_small",
					minimum: -(2 ** 53 - 1),
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				});
				return;
			}
		}
		s < i && o.issues.push({
			origin: "number",
			input: s,
			code: "too_small",
			minimum: i,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		}), s > a && o.issues.push({
			origin: "number",
			input: s,
			code: "too_big",
			maximum: a,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		});
	};
}), kt = /* @__PURE__ */ T("$ZodCheckMaxLength", (e, t) => {
	var n;
	V.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !le(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.maximum ?? Infinity;
		t.maximum < n && (e._zod.bag.maximum = t.maximum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length <= t.maximum) return;
		let i = Oe(r);
		n.issues.push({
			origin: i,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), At = /* @__PURE__ */ T("$ZodCheckMinLength", (e, t) => {
	var n;
	V.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !le(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.minimum ?? -Infinity;
		t.minimum > n && (e._zod.bag.minimum = t.minimum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length >= t.minimum) return;
		let i = Oe(r);
		n.issues.push({
			origin: i,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), jt = /* @__PURE__ */ T("$ZodCheckLengthEquals", (e, t) => {
	var n;
	V.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !le(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag;
		n.minimum = t.length, n.maximum = t.length, n.length = t.length;
	}), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if (i === t.length) return;
		let a = Oe(r), o = i > t.length;
		n.issues.push({
			origin: a,
			...o ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Mt = /* @__PURE__ */ T("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	V.init(e, t), e._zod.onattach.push((e) => {
		let n = e._zod.bag;
		n.format = t.format, t.pattern && (n.patterns ??= /* @__PURE__ */ new Set(), n.patterns.add(t.pattern));
	}), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: t.format,
			input: n.value,
			...t.pattern ? { pattern: t.pattern.toString() } : {},
			inst: e,
			continue: !t.abort
		});
	}) : (r = e._zod).check ?? (r.check = () => {});
}), H = /* @__PURE__ */ T("$ZodCheckRegex", (e, t) => {
	Mt.init(e, t), e._zod.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: n.value,
			pattern: t.pattern.toString(),
			inst: e,
			continue: !t.abort
		});
	};
}), Nt = /* @__PURE__ */ T("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= St, Mt.init(e, t);
}), Pt = /* @__PURE__ */ T("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= Ct, Mt.init(e, t);
}), Ft = /* @__PURE__ */ T("$ZodCheckIncludes", (e, t) => {
	V.init(e, t);
	let n = ye(t.includes), r = new RegExp(typeof t.position == "number" ? `^.{${t.position}}${n}` : n);
	t.pattern = r, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(r);
	}), e._zod.check = (n) => {
		n.value.includes(t.includes, t.position) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: t.includes,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), It = /* @__PURE__ */ T("$ZodCheckStartsWith", (e, t) => {
	V.init(e, t);
	let n = RegExp(`^${ye(t.prefix)}.*`);
	t.pattern ??= n, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(n);
	}), e._zod.check = (n) => {
		n.value.startsWith(t.prefix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: t.prefix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Lt = /* @__PURE__ */ T("$ZodCheckEndsWith", (e, t) => {
	V.init(e, t);
	let n = RegExp(`.*${ye(t.suffix)}$`);
	t.pattern ??= n, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(n);
	}), e._zod.check = (n) => {
		n.value.endsWith(t.suffix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: t.suffix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Rt = /* @__PURE__ */ T("$ZodCheckOverwrite", (e, t) => {
	V.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), zt = class {
	constructor(e = []) {
		this.content = [], this.indent = 0, this && (this.args = e);
	}
	indented(e) {
		this.indent += 1, e(this), --this.indent;
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.args, n = [...(this?.content ?? [""]).map((e) => `  ${e}`)];
		return new e(...t, n.join("\n"));
	}
}, Bt = {
	major: 4,
	minor: 3,
	patch: 6
}, U = /* @__PURE__ */ T("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = Bt;
	let r = [...e._zod.def.checks ?? []];
	e._zod.traits.has("$ZodCheck") && r.unshift(e);
	for (let t of r) for (let n of t._zod.onattach) n(e);
	if (r.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (e, t, n) => {
			let r = Ee(e), i;
			for (let a of t) {
				if (a._zod.def.when) {
					if (!a._zod.def.when(e)) continue;
				} else if (r) continue;
				let t = e.issues.length, o = a._zod.check(e);
				if (o instanceof Promise && n?.async === !1) throw new E();
				if (i || o instanceof Promise) i = (i ?? Promise.resolve()).then(async () => {
					await o, e.issues.length !== t && (r ||= Ee(e, t));
				});
				else {
					if (e.issues.length === t) continue;
					r ||= Ee(e, t);
				}
			}
			return i ? i.then(() => e) : e;
		}, n = (n, i, a) => {
			if (Ee(n)) return n.aborted = !0, n;
			let o = t(i, r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new E();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (i, a) => {
			if (a.skipChecks) return e._zod.parse(i, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: i.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, i, a)) : n(t, i, a);
			}
			let o = e._zod.parse(i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new E();
				return o.then((e) => t(e, r, a));
			}
			return t(o, r, a);
		};
	}
	k(e, "~standard", () => ({
		validate: (t) => {
			try {
				let n = Re(e, t);
				return n.success ? { value: n.data } : { issues: n.error?.issues };
			} catch {
				return Be(e, t).then((e) => e.success ? { value: e.data } : { issues: e.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
}), Vt = /* @__PURE__ */ T("$ZodString", (e, t) => {
	U.init(e, t), e._zod.pattern = [...e?._zod.bag?.patterns ?? []].pop() ?? yt(e._zod.bag), e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), W = /* @__PURE__ */ T("$ZodStringFormat", (e, t) => {
	Mt.init(e, t), Vt.init(e, t);
}), Ht = /* @__PURE__ */ T("$ZodGUID", (e, t) => {
	t.pattern ??= nt, W.init(e, t);
}), Ut = /* @__PURE__ */ T("$ZodUUID", (e, t) => {
	if (t.version) {
		let e = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[t.version];
		if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
		t.pattern ??= rt(e);
	} else t.pattern ??= rt();
	W.init(e, t);
}), Wt = /* @__PURE__ */ T("$ZodEmail", (e, t) => {
	t.pattern ??= it, W.init(e, t);
}), Gt = /* @__PURE__ */ T("$ZodURL", (e, t) => {
	W.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim(), i = new URL(r);
			t.hostname && (t.hostname.lastIndex = 0, t.hostname.test(i.hostname) || n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			})), t.protocol && (t.protocol.lastIndex = 0, t.protocol.test(i.protocol.endsWith(":") ? i.protocol.slice(0, -1) : i.protocol) || n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			})), t.normalize ? n.value = i.href : n.value = r;
			return;
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "url",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), Kt = /* @__PURE__ */ T("$ZodEmoji", (e, t) => {
	t.pattern ??= ot(), W.init(e, t);
}), qt = /* @__PURE__ */ T("$ZodNanoID", (e, t) => {
	t.pattern ??= et, W.init(e, t);
}), Jt = /* @__PURE__ */ T("$ZodCUID", (e, t) => {
	t.pattern ??= Ye, W.init(e, t);
}), Yt = /* @__PURE__ */ T("$ZodCUID2", (e, t) => {
	t.pattern ??= Xe, W.init(e, t);
}), Xt = /* @__PURE__ */ T("$ZodULID", (e, t) => {
	t.pattern ??= Ze, W.init(e, t);
}), Zt = /* @__PURE__ */ T("$ZodXID", (e, t) => {
	t.pattern ??= Qe, W.init(e, t);
}), Qt = /* @__PURE__ */ T("$ZodKSUID", (e, t) => {
	t.pattern ??= $e, W.init(e, t);
}), $t = /* @__PURE__ */ T("$ZodISODateTime", (e, t) => {
	t.pattern ??= vt(t), W.init(e, t);
}), en = /* @__PURE__ */ T("$ZodISODate", (e, t) => {
	t.pattern ??= ht, W.init(e, t);
}), tn = /* @__PURE__ */ T("$ZodISOTime", (e, t) => {
	t.pattern ??= _t(t), W.init(e, t);
}), nn = /* @__PURE__ */ T("$ZodISODuration", (e, t) => {
	t.pattern ??= tt, W.init(e, t);
}), rn = /* @__PURE__ */ T("$ZodIPv4", (e, t) => {
	t.pattern ??= st, W.init(e, t), e._zod.bag.format = "ipv4";
}), an = /* @__PURE__ */ T("$ZodIPv6", (e, t) => {
	t.pattern ??= ct, W.init(e, t), e._zod.bag.format = "ipv6", e._zod.check = (n) => {
		try {
			new URL(`http://[${n.value}]`);
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), on = /* @__PURE__ */ T("$ZodCIDRv4", (e, t) => {
	t.pattern ??= lt, W.init(e, t);
}), sn = /* @__PURE__ */ T("$ZodCIDRv6", (e, t) => {
	t.pattern ??= ut, W.init(e, t), e._zod.check = (n) => {
		let r = n.value.split("/");
		try {
			if (r.length !== 2) throw Error();
			let [e, t] = r;
			if (!t) throw Error();
			let n = Number(t);
			if (`${n}` !== t || n < 0 || n > 128) throw Error();
			new URL(`http://[${e}]`);
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
});
function cn(e) {
	if (e === "") return !0;
	if (e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var ln = /* @__PURE__ */ T("$ZodBase64", (e, t) => {
	t.pattern ??= dt, W.init(e, t), e._zod.bag.contentEncoding = "base64", e._zod.check = (n) => {
		cn(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function un(e) {
	if (!ft.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return cn(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var dn = /* @__PURE__ */ T("$ZodBase64URL", (e, t) => {
	t.pattern ??= ft, W.init(e, t), e._zod.bag.contentEncoding = "base64url", e._zod.check = (n) => {
		un(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), fn = /* @__PURE__ */ T("$ZodE164", (e, t) => {
	t.pattern ??= pt, W.init(e, t);
});
function pn(e, t = null) {
	try {
		let n = e.split(".");
		if (n.length !== 3) return !1;
		let [r] = n;
		if (!r) return !1;
		let i = JSON.parse(atob(r));
		return !("typ" in i && i?.typ !== "JWT" || !i.alg || t && (!("alg" in i) || i.alg !== t));
	} catch {
		return !1;
	}
}
var mn = /* @__PURE__ */ T("$ZodJWT", (e, t) => {
	W.init(e, t), e._zod.check = (n) => {
		pn(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), hn = /* @__PURE__ */ T("$ZodNumber", (e, t) => {
	U.init(e, t), e._zod.pattern = e._zod.bag.pattern ?? xt, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = Number(n.value);
		} catch {}
		let i = n.value;
		if (typeof i == "number" && !Number.isNaN(i) && Number.isFinite(i)) return n;
		let a = typeof i == "number" ? Number.isNaN(i) ? "NaN" : Number.isFinite(i) ? void 0 : "Infinity" : void 0;
		return n.issues.push({
			expected: "number",
			code: "invalid_type",
			input: i,
			inst: e,
			...a ? { received: a } : {}
		}), n;
	};
}), gn = /* @__PURE__ */ T("$ZodNumberFormat", (e, t) => {
	Ot.init(e, t), hn.init(e, t);
}), _n = /* @__PURE__ */ T("$ZodUnknown", (e, t) => {
	U.init(e, t), e._zod.parse = (e) => e;
}), vn = /* @__PURE__ */ T("$ZodNever", (e, t) => {
	U.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function yn(e, t, n) {
	e.issues.length && t.issues.push(...De(n, e.issues)), t.value[n] = e.value;
}
var bn = /* @__PURE__ */ T("$ZodArray", (e, t) => {
	U.init(e, t), e._zod.parse = (n, r) => {
		let i = n.value;
		if (!Array.isArray(i)) return n.issues.push({
			expected: "array",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
		n.value = Array(i.length);
		let a = [];
		for (let e = 0; e < i.length; e++) {
			let o = i[e], s = t.element._zod.run({
				value: o,
				issues: []
			}, r);
			s instanceof Promise ? a.push(s.then((t) => yn(t, n, e))) : yn(s, n, e);
		}
		return a.length ? Promise.all(a).then(() => n) : n;
	};
});
function xn(e, t, n, r, i) {
	if (e.issues.length) {
		if (i && !(n in r)) return;
		t.issues.push(...De(n, e.issues));
	}
	e.value === void 0 ? n in r && (t.value[n] = void 0) : t.value[n] = e.value;
}
function Sn(e) {
	let t = Object.keys(e.shape);
	for (let n of t) if (!e.shape?.[n]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${n}": expected a Zod schema`);
	let n = xe(e.shape);
	return {
		...e,
		keys: t,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(n)
	};
}
function Cn(e, t, n, r, i, a) {
	let o = [], s = i.keySet, c = i.catchall._zod, l = c.def.type, u = c.optout === "optional";
	for (let i in t) {
		if (s.has(i)) continue;
		if (l === "never") {
			o.push(i);
			continue;
		}
		let a = c.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => xn(e, n, i, t, u))) : xn(a, n, i, t, u);
	}
	return o.length && n.issues.push({
		code: "unrecognized_keys",
		keys: o,
		input: t,
		inst: a
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var wn = /* @__PURE__ */ T("$ZodObject", (e, t) => {
	if (U.init(e, t), !Object.getOwnPropertyDescriptor(t, "shape")?.get) {
		let e = t.shape;
		Object.defineProperty(t, "shape", { get: () => {
			let n = { ...e };
			return Object.defineProperty(t, "shape", { value: n }), n;
		} });
	}
	let n = O(() => Sn(t));
	k(e._zod, "propValues", () => {
		let e = t.shape, n = {};
		for (let t in e) {
			let r = e[t]._zod;
			if (r.values) {
				n[t] ?? (n[t] = /* @__PURE__ */ new Set());
				for (let e of r.values) n[t].add(e);
			}
		}
		return n;
	});
	let r = ge, i = t.catchall, a;
	e._zod.parse = (t, o) => {
		a ??= n.value;
		let s = t.value;
		if (!r(s)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: s,
			inst: e
		}), t;
		t.value = {};
		let c = [], l = a.shape;
		for (let e of a.keys) {
			let n = l[e], r = n._zod.optout === "optional", i = n._zod.run({
				value: s[e],
				issues: []
			}, o);
			i instanceof Promise ? c.push(i.then((n) => xn(n, t, e, s, r))) : xn(i, t, e, s, r);
		}
		return i ? Cn(c, s, t, o, n.value, e) : c.length ? Promise.all(c).then(() => t) : t;
	};
}), Tn = /* @__PURE__ */ T("$ZodObjectJIT", (e, t) => {
	wn.init(e, t);
	let n = e._zod.parse, r = O(() => Sn(t)), i = (e) => {
		let t = new zt([
			"shape",
			"payload",
			"ctx"
		]), n = r.value, i = (e) => {
			let t = pe(e);
			return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
		};
		t.write("const input = payload.value;");
		let a = Object.create(null), o = 0;
		for (let e of n.keys) a[e] = `key_${o++}`;
		t.write("const newResult = {};");
		for (let r of n.keys) {
			let n = a[r], o = pe(r), s = e[r]?._zod?.optout === "optional";
			t.write(`const ${n} = ${i(r)};`), s ? t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `) : t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `);
		}
		t.write("payload.value = newResult;"), t.write("return payload;");
		let s = t.compile();
		return (t, n) => s(e, t, n);
	}, a, o = ge, s = !ae.jitless, c = s && _e.value, l = t.catchall, u;
	e._zod.parse = (d, f) => {
		u ??= r.value;
		let p = d.value;
		return o(p) ? s && c && f?.async === !1 && f.jitless !== !0 ? (a ||= i(t.shape), d = a(d, f), l ? Cn([], p, d, f, u, e) : d) : n(d, f) : (d.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), d);
	};
});
function En(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !Ee(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => B(e, r, oe())))
	}), t);
}
var Dn = /* @__PURE__ */ T("$ZodUnion", (e, t) => {
	U.init(e, t), k(e._zod, "optin", () => t.options.some((e) => e._zod.optin === "optional") ? "optional" : void 0), k(e._zod, "optout", () => t.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), k(e._zod, "values", () => {
		if (t.options.every((e) => e._zod.values)) return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
	}), k(e._zod, "pattern", () => {
		if (t.options.every((e) => e._zod.pattern)) {
			let e = t.options.map((e) => e._zod.pattern);
			return RegExp(`^(${e.map((e) => ue(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1, r = t.options[0]._zod.run;
	e._zod.parse = (i, a) => {
		if (n) return r(i, a);
		let o = !1, s = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: i.value,
				issues: []
			}, a);
			if (t instanceof Promise) s.push(t), o = !0;
			else {
				if (t.issues.length === 0) return t;
				s.push(t);
			}
		}
		return o ? Promise.all(s).then((t) => En(t, i, e, a)) : En(s, i, e, a);
	};
}), On = /* @__PURE__ */ T("$ZodIntersection", (e, t) => {
	U.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => An(e, t, n)) : An(e, i, a);
	};
});
function kn(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (M(e) && M(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		for (let n of r) {
			let r = kn(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = kn(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function An(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i;
	for (let n of t.issues) if (n.code === "unrecognized_keys") {
		i ??= n;
		for (let e of n.keys) r.has(e) || r.set(e, {}), r.get(e).l = !0;
	} else e.issues.push(n);
	for (let t of n.issues) if (t.code === "unrecognized_keys") for (let e of t.keys) r.has(e) || r.set(e, {}), r.get(e).r = !0;
	else e.issues.push(t);
	let a = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
	if (a.length && i && e.issues.push({
		...i,
		keys: a
	}), Ee(e)) return e;
	let o = kn(t.value, n.value);
	if (!o.valid) throw Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);
	return e.value = o.data, e;
}
var jn = /* @__PURE__ */ T("$ZodEnum", (e, t) => {
	U.init(e, t);
	let n = se(t.entries), r = new Set(n);
	e._zod.values = r, e._zod.pattern = RegExp(`^(${n.filter((e) => ve.has(typeof e)).map((e) => typeof e == "string" ? ye(e) : e.toString()).join("|")})$`), e._zod.parse = (t, i) => {
		let a = t.value;
		return r.has(a) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: a,
			inst: e
		}), t;
	};
}), Mn = /* @__PURE__ */ T("$ZodTransform", (e, t) => {
	U.init(e, t), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new D(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n));
		if (i instanceof Promise) throw new E();
		return n.value = i, n;
	};
});
function Nn(e, t) {
	return e.issues.length && t === void 0 ? {
		issues: [],
		value: void 0
	} : e;
}
var Pn = /* @__PURE__ */ T("$ZodOptional", (e, t) => {
	U.init(e, t), e._zod.optin = "optional", e._zod.optout = "optional", k(e._zod, "values", () => t.innerType._zod.values ? new Set([...t.innerType._zod.values, void 0]) : void 0), k(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${ue(e.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (t.innerType._zod.optin === "optional") {
			let r = t.innerType._zod.run(e, n);
			return r instanceof Promise ? r.then((t) => Nn(t, e.value)) : Nn(r, e.value);
		}
		return e.value === void 0 ? e : t.innerType._zod.run(e, n);
	};
}), Fn = /* @__PURE__ */ T("$ZodExactOptional", (e, t) => {
	Pn.init(e, t), k(e._zod, "values", () => t.innerType._zod.values), k(e._zod, "pattern", () => t.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), In = /* @__PURE__ */ T("$ZodNullable", (e, t) => {
	U.init(e, t), k(e._zod, "optin", () => t.innerType._zod.optin), k(e._zod, "optout", () => t.innerType._zod.optout), k(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${ue(e.source)}|null)$`) : void 0;
	}), k(e._zod, "values", () => t.innerType._zod.values ? new Set([...t.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), Ln = /* @__PURE__ */ T("$ZodDefault", (e, t) => {
	U.init(e, t), e._zod.optin = "optional", k(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Rn(e, t)) : Rn(r, t);
	};
});
function Rn(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var zn = /* @__PURE__ */ T("$ZodPrefault", (e, t) => {
	U.init(e, t), e._zod.optin = "optional", k(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), Bn = /* @__PURE__ */ T("$ZodNonOptional", (e, t) => {
	U.init(e, t), k(e._zod, "values", () => {
		let e = t.innerType._zod.values;
		return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => Vn(t, e)) : Vn(i, e);
	};
});
function Vn(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
var Hn = /* @__PURE__ */ T("$ZodCatch", (e, t) => {
	U.init(e, t), k(e._zod, "optin", () => t.innerType._zod.optin), k(e._zod, "optout", () => t.innerType._zod.optout), k(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((r) => (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => B(e, n, oe())) },
			input: e.value
		}), e.issues = []), e)) : (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => B(e, n, oe())) },
			input: e.value
		}), e.issues = []), e);
	};
}), Un = /* @__PURE__ */ T("$ZodPipe", (e, t) => {
	U.init(e, t), k(e._zod, "values", () => t.in._zod.values), k(e._zod, "optin", () => t.in._zod.optin), k(e._zod, "optout", () => t.out._zod.optout), k(e._zod, "propValues", () => t.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => Wn(e, t.in, n)) : Wn(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Wn(e, t.out, n)) : Wn(r, t.out, n);
	};
});
function Wn(e, t, n) {
	return e.issues.length ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var Gn = /* @__PURE__ */ T("$ZodReadonly", (e, t) => {
	U.init(e, t), k(e._zod, "propValues", () => t.innerType._zod.propValues), k(e._zod, "values", () => t.innerType._zod.values), k(e._zod, "optin", () => t.innerType?._zod?.optin), k(e._zod, "optout", () => t.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(Kn) : Kn(r);
	};
});
function Kn(e) {
	return e.value = Object.freeze(e.value), e;
}
var qn = /* @__PURE__ */ T("$ZodCustom", (e, t) => {
	V.init(e, t), U.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => Jn(t, n, r, e));
		Jn(i, n, r, e);
	};
});
function Jn(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(ke(e));
	}
}
//#endregion
//#region node_modules/zod/v4/core/registries.js
var Yn, Xn = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		return this._map.set(e, n), n && typeof n == "object" && "id" in n && this._idmap.set(n.id, e), this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			delete n.id;
			let r = {
				...n,
				...this._map.get(e)
			};
			return Object.keys(r).length ? r : void 0;
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function Zn() {
	return new Xn();
}
(Yn = globalThis).__zod_globalRegistry ?? (Yn.__zod_globalRegistry = Zn());
var Qn = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/zod/v4/core/api.js
/* @__NO_SIDE_EFFECTS__ */
function $n(e, t) {
	return new e({
		type: "string",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function er(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function tr(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function nr(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function rr(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function ir(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function ar(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function or(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function sr(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function cr(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function lr(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function ur(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function dr(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function fr(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function pr(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function mr(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function hr(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function gr(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _r(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function vr(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function yr(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function br(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function xr(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Sr(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Cr(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function wr(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Tr(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Er(e, t) {
	return new e({
		type: "number",
		checks: [],
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Dr(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Or(e) {
	return new e({ type: "unknown" });
}
/* @__NO_SIDE_EFFECTS__ */
function kr(e, t) {
	return new e({
		type: "never",
		...P(t)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Ar(e, t) {
	return new Tt({
		check: "less_than",
		...P(t),
		value: e,
		inclusive: !1
	});
}
/* @__NO_SIDE_EFFECTS__ */
function jr(e, t) {
	return new Tt({
		check: "less_than",
		...P(t),
		value: e,
		inclusive: !0
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Mr(e, t) {
	return new Et({
		check: "greater_than",
		...P(t),
		value: e,
		inclusive: !1
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Nr(e, t) {
	return new Et({
		check: "greater_than",
		...P(t),
		value: e,
		inclusive: !0
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Pr(e, t) {
	return new Dt({
		check: "multiple_of",
		...P(t),
		value: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Fr(e, t) {
	return new kt({
		check: "max_length",
		...P(t),
		maximum: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Ir(e, t) {
	return new At({
		check: "min_length",
		...P(t),
		minimum: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Lr(e, t) {
	return new jt({
		check: "length_equals",
		...P(t),
		length: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Rr(e, t) {
	return new H({
		check: "string_format",
		format: "regex",
		...P(t),
		pattern: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function zr(e) {
	return new Nt({
		check: "string_format",
		format: "lowercase",
		...P(e)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Br(e) {
	return new Pt({
		check: "string_format",
		format: "uppercase",
		...P(e)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Vr(e, t) {
	return new Ft({
		check: "string_format",
		format: "includes",
		...P(t),
		includes: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Hr(e, t) {
	return new It({
		check: "string_format",
		format: "starts_with",
		...P(t),
		prefix: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Ur(e, t) {
	return new Lt({
		check: "string_format",
		format: "ends_with",
		...P(t),
		suffix: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Wr(e) {
	return new Rt({
		check: "overwrite",
		tx: e
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Gr(e) {
	return /* @__PURE__ */ Wr((t) => t.normalize(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Kr() {
	return /* @__PURE__ */ Wr((e) => e.trim());
}
/* @__NO_SIDE_EFFECTS__ */
function qr() {
	return /* @__PURE__ */ Wr((e) => e.toLowerCase());
}
/* @__NO_SIDE_EFFECTS__ */
function Jr() {
	return /* @__PURE__ */ Wr((e) => e.toUpperCase());
}
/* @__NO_SIDE_EFFECTS__ */
function Yr() {
	return /* @__PURE__ */ Wr((e) => me(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Xr(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...P(n)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Zr(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...P(n)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Qr(e) {
	let t = /* @__PURE__ */ $r((n) => (n.addIssue = (e) => {
		if (typeof e == "string") n.issues.push(ke(e, n.value, t._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", r.input ??= n.value, r.inst ??= t, r.continue ??= !t._zod.def.abort, n.issues.push(ke(r));
		}
	}, e(n.value, n)));
	return t;
}
/* @__NO_SIDE_EFFECTS__ */
function $r(e, t) {
	let n = new V({
		check: "custom",
		...P(t)
	});
	return n._zod.check = e, n;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.js
function ei(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? Qn,
		target: t,
		unrepresentable: e?.unrepresentable ?? "throw",
		override: e?.override ?? (() => {}),
		io: e?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: e?.cycles ?? "ref",
		reused: e?.reused ?? "inline",
		external: e?.external ?? void 0
	};
}
function G(e, t, n = {
	path: [],
	schemaPath: []
}) {
	var r;
	let i = e._zod.def, a = t.seen.get(e);
	if (a) return a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema;
	let o = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: n.path
	};
	t.seen.set(e, o);
	let s = e._zod.toJSONSchema?.();
	if (s) o.schema = s;
	else {
		let r = {
			...n,
			schemaPath: [...n.schemaPath, e],
			path: n.path
		};
		if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
		else {
			let n = o.schema, a = t.processors[i.type];
			if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
			a(e, t, n, r);
		}
		let a = e._zod.parent;
		a && (o.ref ||= a, G(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && Object.assign(o.schema, c), t.io === "input" && ri(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && o.schema._prefault && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function ti(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = /* @__PURE__ */ new Map();
	for (let t of e.seen.entries()) {
		let n = e.metadataRegistry.get(t[0])?.id;
		if (n) {
			let e = r.get(n);
			if (e && e !== t[0]) throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			r.set(n, t[0]);
		}
	}
	let i = (t) => {
		let r = e.target === "draft-2020-12" ? "$defs" : "definitions";
		if (e.external) {
			let n = e.external.registry.get(t[0])?.id, i = e.external.uri ?? ((e) => e);
			if (n) return { ref: i(n) };
			let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
			return t[1].defId = a, {
				defId: a,
				ref: `${i("__shared")}#/${r}/${a}`
			};
		}
		if (t[1] === n) return { ref: "#" };
		let i = `#/${r}/`, a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + a
		};
	}, a = (e) => {
		if (e[1].schema.$ref) return;
		let t = e[1], { ref: n, defId: r } = i(e);
		t.def = { ...t.schema }, r && (t.defId = r);
		let a = t.schema;
		for (let e in a) delete a[e];
		a.$ref = n;
	};
	if (e.cycles === "throw") for (let t of e.seen.entries()) {
		let e = t[1];
		if (e.cycle) throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (let n of e.seen.entries()) {
		let r = n[1];
		if (t === n[0]) {
			a(n);
			continue;
		}
		if (e.external) {
			let r = e.external.registry.get(n[0])?.id;
			if (t !== n[0] && r) {
				a(n);
				continue;
			}
		}
		if (e.metadataRegistry.get(n[0])?.id) {
			a(n);
			continue;
		}
		if (r.cycle) {
			a(n);
			continue;
		}
		if (r.count > 1 && e.reused === "ref") {
			a(n);
			continue;
		}
	}
}
function ni(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : Object.assign(i, s), Object.assign(i, a), t._zod.parent === o) for (let e in i) e === "$ref" || e === "allOf" || e in a || delete i[e];
			if (s.$ref && n.def) for (let e in i) e === "$ref" || e === "allOf" || e in n.def && JSON.stringify(i[e]) === JSON.stringify(n.def[e]) && delete i[e];
		}
		let s = t._zod.parent;
		if (s && s !== o) {
			r(s);
			let t = e.seen.get(s);
			if (t?.schema.$ref && (i.$ref = t.schema.$ref, t.def)) for (let e in i) e === "$ref" || e === "allOf" || e in t.def && JSON.stringify(i[e]) === JSON.stringify(t.def[e]) && delete i[e];
		}
		e.override({
			zodSchema: t,
			jsonSchema: i,
			path: n.path ?? []
		});
	};
	for (let t of [...e.seen.entries()].reverse()) r(t[0]);
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	Object.assign(i, n.def ?? n.schema);
	let a = e.external?.defs ?? {};
	for (let t of e.seen.entries()) {
		let e = t[1];
		e.def && e.defId && (a[e.defId] = e.def);
	}
	e.external || Object.keys(a).length > 0 && (e.target === "draft-2020-12" ? i.$defs = a : i.definitions = a);
	try {
		let n = JSON.parse(JSON.stringify(i));
		return Object.defineProperty(n, "~standard", {
			value: {
				...t["~standard"],
				jsonSchema: {
					input: ai(t, "input", e.processors),
					output: ai(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function ri(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return ri(r.element, n);
	if (r.type === "set") return ri(r.valueType, n);
	if (r.type === "lazy") return ri(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault") return ri(r.innerType, n);
	if (r.type === "intersection") return ri(r.left, n) || ri(r.right, n);
	if (r.type === "record" || r.type === "map") return ri(r.keyType, n) || ri(r.valueType, n);
	if (r.type === "pipe") return ri(r.in, n) || ri(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (ri(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (ri(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (ri(e, n)) return !0;
		return !!(r.rest && ri(r.rest, n));
	}
	return !1;
}
var ii = (e, t = {}) => (n) => {
	let r = ei({
		...n,
		processors: t
	});
	return G(e, r), ti(r, e), ni(r, e);
}, ai = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = ei({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return G(e, o), ti(o, e), ni(o, e);
}, oi = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, si = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l } = e._zod.bag;
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = oi[s] ?? s, i.format === "" && delete i.format, s === "time" && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c];
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, ci = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, format: s, multipleOf: c, exclusiveMaximum: l, exclusiveMinimum: u } = e._zod.bag;
	typeof s == "string" && s.includes("int") ? i.type = "integer" : i.type = "number", typeof u == "number" && (t.target === "draft-04" || t.target === "openapi-3.0" ? (i.minimum = u, i.exclusiveMinimum = !0) : i.exclusiveMinimum = u), typeof a == "number" && (i.minimum = a, typeof u == "number" && t.target !== "draft-04" && (u >= a ? delete i.minimum : delete i.exclusiveMinimum)), typeof l == "number" && (t.target === "draft-04" || t.target === "openapi-3.0" ? (i.maximum = l, i.exclusiveMaximum = !0) : i.exclusiveMaximum = l), typeof o == "number" && (i.maximum = o, typeof l == "number" && t.target !== "draft-04" && (l <= o ? delete i.maximum : delete i.exclusiveMaximum)), typeof c == "number" && (i.multipleOf = c);
}, li = (e, t, n, r) => {
	n.not = {};
}, ui = (e, t, n, r) => {
	let i = e._zod.def, a = se(i.entries);
	a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a;
}, di = (e, t, n, r) => {
	if (t.unrepresentable === "throw") throw Error("Custom types cannot be represented in JSON Schema");
}, fi = (e, t, n, r) => {
	if (t.unrepresentable === "throw") throw Error("Transforms cannot be represented in JSON Schema");
}, pi = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = e._zod.bag;
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = G(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
}, mi = (e, t, n, r) => {
	let i = n, a = e._zod.def;
	i.type = "object", i.properties = {};
	let o = a.shape;
	for (let e in o) i.properties[e] = G(o[e], t, {
		...r,
		path: [
			...r.path,
			"properties",
			e
		]
	});
	let s = new Set(Object.keys(o)), c = new Set([...s].filter((e) => {
		let n = a.shape[e]._zod;
		return t.io === "input" ? n.optin === void 0 : n.optout === void 0;
	}));
	c.size > 0 && (i.required = Array.from(c)), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = G(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, hi = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => G(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, gi = (e, t, n, r) => {
	let i = e._zod.def, a = G(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = G(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1;
	n.allOf = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
}, _i = (e, t, n, r) => {
	let i = e._zod.def, a = G(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, vi = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, yi = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.default = JSON.parse(JSON.stringify(i.defaultValue));
}, bi = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, t.io === "input" && (n._prefault = JSON.parse(JSON.stringify(i.defaultValue)));
}, xi = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		throw Error("Dynamic catch values are not supported in JSON Schema");
	}
	n.default = o;
}, Si = (e, t, n, r) => {
	let i = e._zod.def, a = t.io === "input" ? i.in._zod.def.type === "transform" ? i.out : i.in : i.out;
	G(a, t, r);
	let o = t.seen.get(e);
	o.ref = a;
}, Ci = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, wi = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, Ti = /* @__PURE__ */ T("ZodISODateTime", (e, t) => {
	$t.init(e, t), q.init(e, t);
});
function Ei(e) {
	return /* @__PURE__ */ Sr(Ti, e);
}
var Di = /* @__PURE__ */ T("ZodISODate", (e, t) => {
	en.init(e, t), q.init(e, t);
});
function Oi(e) {
	return /* @__PURE__ */ Cr(Di, e);
}
var ki = /* @__PURE__ */ T("ZodISOTime", (e, t) => {
	tn.init(e, t), q.init(e, t);
});
function Ai(e) {
	return /* @__PURE__ */ wr(ki, e);
}
var ji = /* @__PURE__ */ T("ZodISODuration", (e, t) => {
	nn.init(e, t), q.init(e, t);
});
function Mi(e) {
	return /* @__PURE__ */ Tr(ji, e);
}
//#endregion
//#region node_modules/zod/v4/classic/errors.js
var Ni = (e, t) => {
	je.init(e, t), e.name = "ZodError", Object.defineProperties(e, {
		format: { value: (t) => Pe(e, t) },
		flatten: { value: (t) => Ne(e, t) },
		addIssue: { value: (t) => {
			e.issues.push(t), e.message = JSON.stringify(e.issues, ce, 2);
		} },
		addIssues: { value: (t) => {
			e.issues.push(...t), e.message = JSON.stringify(e.issues, ce, 2);
		} },
		isEmpty: { get() {
			return e.issues.length === 0;
		} }
	});
};
T("ZodError", Ni);
var Pi = T("ZodError", Ni, { Parent: Error }), Fi = /* @__PURE__ */ Fe(Pi), Ii = /* @__PURE__ */ Ie(Pi), Li = /* @__PURE__ */ Le(Pi), Ri = /* @__PURE__ */ ze(Pi), zi = /* @__PURE__ */ Ve(Pi), Bi = /* @__PURE__ */ He(Pi), Vi = /* @__PURE__ */ Ue(Pi), Hi = /* @__PURE__ */ We(Pi), Ui = /* @__PURE__ */ Ge(Pi), Wi = /* @__PURE__ */ Ke(Pi), Gi = /* @__PURE__ */ qe(Pi), Ki = /* @__PURE__ */ Je(Pi), K = /* @__PURE__ */ T("ZodType", (e, t) => (U.init(e, t), Object.assign(e["~standard"], { jsonSchema: {
	input: ai(e, "input"),
	output: ai(e, "output")
} }), e.toJSONSchema = ii(e, {}), e.def = t, e.type = t.type, Object.defineProperty(e, "_def", { value: t }), e.check = (...n) => e.clone(j(t, { checks: [...t.checks ?? [], ...n.map((e) => typeof e == "function" ? { _zod: {
	check: e,
	def: { check: "custom" },
	onattach: []
} } : e)] }), { parent: !0 }), e.with = e.check, e.clone = (t, n) => be(e, t, n), e.brand = () => e, e.register = ((t, n) => (t.add(e, n), e)), e.parse = (t, n) => Fi(e, t, n, { callee: e.parse }), e.safeParse = (t, n) => Li(e, t, n), e.parseAsync = async (t, n) => Ii(e, t, n, { callee: e.parseAsync }), e.safeParseAsync = async (t, n) => Ri(e, t, n), e.spa = e.safeParseAsync, e.encode = (t, n) => zi(e, t, n), e.decode = (t, n) => Bi(e, t, n), e.encodeAsync = async (t, n) => Vi(e, t, n), e.decodeAsync = async (t, n) => Hi(e, t, n), e.safeEncode = (t, n) => Ui(e, t, n), e.safeDecode = (t, n) => Wi(e, t, n), e.safeEncodeAsync = async (t, n) => Gi(e, t, n), e.safeDecodeAsync = async (t, n) => Ki(e, t, n), e.refine = (t, n) => e.check(Za(t, n)), e.superRefine = (t) => e.check(Qa(t)), e.overwrite = (t) => e.check(/* @__PURE__ */ Wr(t)), e.optional = () => Pa(e), e.exactOptional = () => Ia(e), e.nullable = () => Ra(e), e.nullish = () => Pa(Ra(e)), e.nonoptional = (t) => Ua(e, t), e.array = () => Ca(e), e.or = (t) => Da([e, t]), e.and = (t) => ka(e, t), e.transform = (t) => qa(e, Ma(t)), e.default = (t) => Ba(e, t), e.prefault = (t) => Ha(e, t), e.catch = (t) => Ga(e, t), e.pipe = (t) => qa(e, t), e.readonly = () => Ya(e), e.describe = (t) => {
	let n = e.clone();
	return Qn.add(n, { description: t }), n;
}, Object.defineProperty(e, "description", {
	get() {
		return Qn.get(e)?.description;
	},
	configurable: !0
}), e.meta = (...t) => {
	if (t.length === 0) return Qn.get(e);
	let n = e.clone();
	return Qn.add(n, t[0]), n;
}, e.isOptional = () => e.safeParse(void 0).success, e.isNullable = () => e.safeParse(null).success, e.apply = (t) => t(e), e)), qi = /* @__PURE__ */ T("_ZodString", (e, t) => {
	Vt.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => si(e, t, n, r);
	let n = e._zod.bag;
	e.format = n.format ?? null, e.minLength = n.minimum ?? null, e.maxLength = n.maximum ?? null, e.regex = (...t) => e.check(/* @__PURE__ */ Rr(...t)), e.includes = (...t) => e.check(/* @__PURE__ */ Vr(...t)), e.startsWith = (...t) => e.check(/* @__PURE__ */ Hr(...t)), e.endsWith = (...t) => e.check(/* @__PURE__ */ Ur(...t)), e.min = (...t) => e.check(/* @__PURE__ */ Ir(...t)), e.max = (...t) => e.check(/* @__PURE__ */ Fr(...t)), e.length = (...t) => e.check(/* @__PURE__ */ Lr(...t)), e.nonempty = (...t) => e.check(/* @__PURE__ */ Ir(1, ...t)), e.lowercase = (t) => e.check(/* @__PURE__ */ zr(t)), e.uppercase = (t) => e.check(/* @__PURE__ */ Br(t)), e.trim = () => e.check(/* @__PURE__ */ Kr()), e.normalize = (...t) => e.check(/* @__PURE__ */ Gr(...t)), e.toLowerCase = () => e.check(/* @__PURE__ */ qr()), e.toUpperCase = () => e.check(/* @__PURE__ */ Jr()), e.slugify = () => e.check(/* @__PURE__ */ Yr());
}), Ji = /* @__PURE__ */ T("ZodString", (e, t) => {
	Vt.init(e, t), qi.init(e, t), e.email = (t) => e.check(/* @__PURE__ */ er(Xi, t)), e.url = (t) => e.check(/* @__PURE__ */ or($i, t)), e.jwt = (t) => e.check(/* @__PURE__ */ xr(ma, t)), e.emoji = (t) => e.check(/* @__PURE__ */ sr(ea, t)), e.guid = (t) => e.check(/* @__PURE__ */ tr(Zi, t)), e.uuid = (t) => e.check(/* @__PURE__ */ nr(Qi, t)), e.uuidv4 = (t) => e.check(/* @__PURE__ */ rr(Qi, t)), e.uuidv6 = (t) => e.check(/* @__PURE__ */ ir(Qi, t)), e.uuidv7 = (t) => e.check(/* @__PURE__ */ ar(Qi, t)), e.nanoid = (t) => e.check(/* @__PURE__ */ cr(ta, t)), e.guid = (t) => e.check(/* @__PURE__ */ tr(Zi, t)), e.cuid = (t) => e.check(/* @__PURE__ */ lr(na, t)), e.cuid2 = (t) => e.check(/* @__PURE__ */ ur(ra, t)), e.ulid = (t) => e.check(/* @__PURE__ */ dr(ia, t)), e.base64 = (t) => e.check(/* @__PURE__ */ vr(da, t)), e.base64url = (t) => e.check(/* @__PURE__ */ yr(fa, t)), e.xid = (t) => e.check(/* @__PURE__ */ fr(aa, t)), e.ksuid = (t) => e.check(/* @__PURE__ */ pr(oa, t)), e.ipv4 = (t) => e.check(/* @__PURE__ */ mr(sa, t)), e.ipv6 = (t) => e.check(/* @__PURE__ */ hr(ca, t)), e.cidrv4 = (t) => e.check(/* @__PURE__ */ gr(la, t)), e.cidrv6 = (t) => e.check(/* @__PURE__ */ _r(ua, t)), e.e164 = (t) => e.check(/* @__PURE__ */ br(pa, t)), e.datetime = (t) => e.check(Ei(t)), e.date = (t) => e.check(Oi(t)), e.time = (t) => e.check(Ai(t)), e.duration = (t) => e.check(Mi(t));
});
function Yi(e) {
	return /* @__PURE__ */ $n(Ji, e);
}
var q = /* @__PURE__ */ T("ZodStringFormat", (e, t) => {
	W.init(e, t), qi.init(e, t);
}), Xi = /* @__PURE__ */ T("ZodEmail", (e, t) => {
	Wt.init(e, t), q.init(e, t);
}), Zi = /* @__PURE__ */ T("ZodGUID", (e, t) => {
	Ht.init(e, t), q.init(e, t);
}), Qi = /* @__PURE__ */ T("ZodUUID", (e, t) => {
	Ut.init(e, t), q.init(e, t);
}), $i = /* @__PURE__ */ T("ZodURL", (e, t) => {
	Gt.init(e, t), q.init(e, t);
}), ea = /* @__PURE__ */ T("ZodEmoji", (e, t) => {
	Kt.init(e, t), q.init(e, t);
}), ta = /* @__PURE__ */ T("ZodNanoID", (e, t) => {
	qt.init(e, t), q.init(e, t);
}), na = /* @__PURE__ */ T("ZodCUID", (e, t) => {
	Jt.init(e, t), q.init(e, t);
}), ra = /* @__PURE__ */ T("ZodCUID2", (e, t) => {
	Yt.init(e, t), q.init(e, t);
}), ia = /* @__PURE__ */ T("ZodULID", (e, t) => {
	Xt.init(e, t), q.init(e, t);
}), aa = /* @__PURE__ */ T("ZodXID", (e, t) => {
	Zt.init(e, t), q.init(e, t);
}), oa = /* @__PURE__ */ T("ZodKSUID", (e, t) => {
	Qt.init(e, t), q.init(e, t);
}), sa = /* @__PURE__ */ T("ZodIPv4", (e, t) => {
	rn.init(e, t), q.init(e, t);
}), ca = /* @__PURE__ */ T("ZodIPv6", (e, t) => {
	an.init(e, t), q.init(e, t);
}), la = /* @__PURE__ */ T("ZodCIDRv4", (e, t) => {
	on.init(e, t), q.init(e, t);
}), ua = /* @__PURE__ */ T("ZodCIDRv6", (e, t) => {
	sn.init(e, t), q.init(e, t);
}), da = /* @__PURE__ */ T("ZodBase64", (e, t) => {
	ln.init(e, t), q.init(e, t);
}), fa = /* @__PURE__ */ T("ZodBase64URL", (e, t) => {
	dn.init(e, t), q.init(e, t);
}), pa = /* @__PURE__ */ T("ZodE164", (e, t) => {
	fn.init(e, t), q.init(e, t);
}), ma = /* @__PURE__ */ T("ZodJWT", (e, t) => {
	mn.init(e, t), q.init(e, t);
}), ha = /* @__PURE__ */ T("ZodNumber", (e, t) => {
	hn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => ci(e, t, n, r), e.gt = (t, n) => e.check(/* @__PURE__ */ Mr(t, n)), e.gte = (t, n) => e.check(/* @__PURE__ */ Nr(t, n)), e.min = (t, n) => e.check(/* @__PURE__ */ Nr(t, n)), e.lt = (t, n) => e.check(/* @__PURE__ */ Ar(t, n)), e.lte = (t, n) => e.check(/* @__PURE__ */ jr(t, n)), e.max = (t, n) => e.check(/* @__PURE__ */ jr(t, n)), e.int = (t) => e.check(va(t)), e.safe = (t) => e.check(va(t)), e.positive = (t) => e.check(/* @__PURE__ */ Mr(0, t)), e.nonnegative = (t) => e.check(/* @__PURE__ */ Nr(0, t)), e.negative = (t) => e.check(/* @__PURE__ */ Ar(0, t)), e.nonpositive = (t) => e.check(/* @__PURE__ */ jr(0, t)), e.multipleOf = (t, n) => e.check(/* @__PURE__ */ Pr(t, n)), e.step = (t, n) => e.check(/* @__PURE__ */ Pr(t, n)), e.finite = () => e;
	let n = e._zod.bag;
	e.minValue = Math.max(n.minimum ?? -Infinity, n.exclusiveMinimum ?? -Infinity) ?? null, e.maxValue = Math.min(n.maximum ?? Infinity, n.exclusiveMaximum ?? Infinity) ?? null, e.isInt = (n.format ?? "").includes("int") || Number.isSafeInteger(n.multipleOf ?? .5), e.isFinite = !0, e.format = n.format ?? null;
});
function ga(e) {
	return /* @__PURE__ */ Er(ha, e);
}
var _a = /* @__PURE__ */ T("ZodNumberFormat", (e, t) => {
	gn.init(e, t), ha.init(e, t);
});
function va(e) {
	return /* @__PURE__ */ Dr(_a, e);
}
var J = /* @__PURE__ */ T("ZodUnknown", (e, t) => {
	_n.init(e, t), K.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function ya() {
	return /* @__PURE__ */ Or(J);
}
var ba = /* @__PURE__ */ T("ZodNever", (e, t) => {
	vn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => li(e, t, n, r);
});
function xa(e) {
	return /* @__PURE__ */ kr(ba, e);
}
var Sa = /* @__PURE__ */ T("ZodArray", (e, t) => {
	bn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => pi(e, t, n, r), e.element = t.element, e.min = (t, n) => e.check(/* @__PURE__ */ Ir(t, n)), e.nonempty = (t) => e.check(/* @__PURE__ */ Ir(1, t)), e.max = (t, n) => e.check(/* @__PURE__ */ Fr(t, n)), e.length = (t, n) => e.check(/* @__PURE__ */ Lr(t, n)), e.unwrap = () => e.element;
});
function Ca(e, t) {
	return /* @__PURE__ */ Xr(Sa, e, t);
}
var wa = /* @__PURE__ */ T("ZodObject", (e, t) => {
	Tn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => mi(e, t, n, r), k(e, "shape", () => t.shape), e.keyof = () => ja(Object.keys(e._zod.def.shape)), e.catchall = (t) => e.clone({
		...e._zod.def,
		catchall: t
	}), e.passthrough = () => e.clone({
		...e._zod.def,
		catchall: ya()
	}), e.loose = () => e.clone({
		...e._zod.def,
		catchall: ya()
	}), e.strict = () => e.clone({
		...e._zod.def,
		catchall: xa()
	}), e.strip = () => e.clone({
		...e._zod.def,
		catchall: void 0
	}), e.extend = (t) => we(e, t), e.safeExtend = (t) => I(e, t), e.merge = (t) => L(e, t), e.pick = (t) => Se(e, t), e.omit = (t) => Ce(e, t), e.partial = (...t) => R(Na, e, t[0]), e.required = (...t) => Te(X, e, t[0]);
});
function Ta(e, t) {
	return new wa({
		type: "object",
		shape: e ?? {},
		...P(t)
	});
}
var Ea = /* @__PURE__ */ T("ZodUnion", (e, t) => {
	Dn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => hi(e, t, n, r), e.options = t.options;
});
function Da(e, t) {
	return new Ea({
		type: "union",
		options: e,
		...P(t)
	});
}
var Oa = /* @__PURE__ */ T("ZodIntersection", (e, t) => {
	On.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => gi(e, t, n, r);
});
function ka(e, t) {
	return new Oa({
		type: "intersection",
		left: e,
		right: t
	});
}
var Aa = /* @__PURE__ */ T("ZodEnum", (e, t) => {
	jn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => ui(e, t, n, r), e.enum = t.entries, e.options = Object.values(t.entries);
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new Aa({
			...t,
			checks: [],
			...P(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new Aa({
			...t,
			checks: [],
			...P(r),
			entries: i
		});
	};
});
function ja(e, t) {
	return new Aa({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...P(t)
	});
}
var Y = /* @__PURE__ */ T("ZodTransform", (e, t) => {
	Mn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => fi(e, t, n, r), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new D(e.constructor.name);
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(ke(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", t.input ??= n.value, t.inst ??= e, n.issues.push(ke(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n)) : (n.value = i, n);
	};
});
function Ma(e) {
	return new Y({
		type: "transform",
		transform: e
	});
}
var Na = /* @__PURE__ */ T("ZodOptional", (e, t) => {
	Pn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => wi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Pa(e) {
	return new Na({
		type: "optional",
		innerType: e
	});
}
var Fa = /* @__PURE__ */ T("ZodExactOptional", (e, t) => {
	Fn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => wi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ia(e) {
	return new Fa({
		type: "optional",
		innerType: e
	});
}
var La = /* @__PURE__ */ T("ZodNullable", (e, t) => {
	In.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => _i(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ra(e) {
	return new La({
		type: "nullable",
		innerType: e
	});
}
var za = /* @__PURE__ */ T("ZodDefault", (e, t) => {
	Ln.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => yi(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function Ba(e, t) {
	return new za({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : N(t);
		}
	});
}
var Va = /* @__PURE__ */ T("ZodPrefault", (e, t) => {
	zn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => bi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ha(e, t) {
	return new Va({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : N(t);
		}
	});
}
var X = /* @__PURE__ */ T("ZodNonOptional", (e, t) => {
	Bn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => vi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ua(e, t) {
	return new X({
		type: "nonoptional",
		innerType: e,
		...P(t)
	});
}
var Wa = /* @__PURE__ */ T("ZodCatch", (e, t) => {
	Hn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => xi(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function Ga(e, t) {
	return new Wa({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : () => t
	});
}
var Ka = /* @__PURE__ */ T("ZodPipe", (e, t) => {
	Un.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => Si(e, t, n, r), e.in = t.in, e.out = t.out;
});
function qa(e, t) {
	return new Ka({
		type: "pipe",
		in: e,
		out: t
	});
}
var Ja = /* @__PURE__ */ T("ZodReadonly", (e, t) => {
	Gn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ci(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ya(e) {
	return new Ja({
		type: "readonly",
		innerType: e
	});
}
var Xa = /* @__PURE__ */ T("ZodCustom", (e, t) => {
	qn.init(e, t), K.init(e, t), e._zod.processJSONSchema = (t, n, r) => di(e, t, n, r);
});
function Za(e, t = {}) {
	return /* @__PURE__ */ Zr(Xa, e, t);
}
function Qa(e) {
	return /* @__PURE__ */ Qr(e);
}
//#endregion
//#region src/common/schemas.ts
var $a = Ta({
	sku: Yi().min(1, "El SKU es obligatorio."),
	name: Yi().min(1, "El nombre es obligatorio."),
	description: Yi().optional(),
	category_id: ga().int().positive().optional().nullable(),
	price_purchase: ga().min(0, "El precio de compra no puede ser negativo."),
	price_sale: ga().min(0, "El precio de venta no puede ser negativo."),
	stock: ga().int().optional(),
	min_stock: ga().int().min(0).optional().default(10)
}), eo = Ta({
	product_id: ga().int().positive(),
	quantity: ga().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: ga().min(0, "El precio unitario no puede ser negativo.")
}), to = Ta({
	cash_register_id: ga().int().positive(),
	client_id: ga().int().optional(),
	client_dni: Yi().optional(),
	client_name: Yi().optional(),
	payment_method: ja(["CASH", "CARD"]).default("CASH"),
	items: Ca(eo).min(1, "La venta debe tener al menos un producto.")
});
Ta({
	dni: Yi().min(1, "El DNI/Documento es obligatorio."),
	name: Yi().min(1, "El nombre es obligatorio."),
	phone: Yi().optional().nullable(),
	code: Yi().min(1, "El código de cliente es obligatorio."),
	tax_id: Yi().optional().nullable()
});
//#endregion
//#region src/main/services/ProductService.ts
var no = class {
	static async getAllProducts() {
		return w.product.findMany({
			include: { category: !0 },
			orderBy: { created_at: "desc" }
		});
	}
	static async createProduct(e, t = 1) {
		try {
			let n = $a.parse(e), r = await w.product.findUnique({ where: { sku: n.sku } }), i, a = !1;
			r ? (i = r.id, a = !0, await w.product.update({
				where: { id: i },
				data: {
					name: n.name,
					price_sale: n.price_sale,
					price_purchase: n.price_purchase,
					description: n.description,
					category_id: n.category_id,
					min_stock: n.min_stock
				}
			})) : i = (await w.product.create({ data: {
				sku: n.sku,
				name: n.name,
				price_sale: n.price_sale,
				price_purchase: n.price_purchase,
				description: n.description,
				category_id: n.category_id,
				min_stock: n.min_stock,
				stock: n.stock || 0
			} })).id;
			let o = n.stock || 0;
			return o > 0 && !a && await w.inventoryMovement.create({ data: {
				product_id: i,
				type: "ENTRADA",
				quantity: o
			} }), await w.auditLog.create({ data: {
				user_id: t,
				action: a ? "UPDATE_PRODUCT_UPSERT" : "CREATE_PRODUCT_UPSERT",
				entity: "products",
				entity_id: i
			} }), {
				success: !0,
				id: i,
				message: a ? "Producto actualizado correctamente" : "Producto creado correctamente"
			};
		} catch (e) {
			return console.error("Error en upsert de producto:", e), e.name === "ZodError" ? {
				success: !1,
				message: e.errors.map((e) => e.message).join(". ")
			} : {
				success: !1,
				message: e.message || "Error al procesar producto"
			};
		}
	}
	static async addInitialStock(e, t, n = 1) {
		try {
			if (t <= 0) throw Error("La cantidad a añadir debe ser mayor a cero.");
			if (!await w.product.findUnique({ where: { id: e } })) throw Error("El producto no existe.");
			return await w.inventoryMovement.create({ data: {
				product_id: e,
				type: "ENTRADA",
				quantity: t
			} }), await w.auditLog.create({ data: {
				user_id: n,
				action: "STOCK_ENTRADA",
				entity: "products",
				entity_id: e
			} }), { success: !0 };
		} catch (e) {
			return console.error("Error al añadir stock:", e), {
				success: !1,
				message: e.message || "Error al añadir stock"
			};
		}
	}
}, ro = class {
	static async getAllSales() {
		return w.sale.findMany({
			include: {
				client: !0,
				cash_register: !0
			},
			orderBy: { created_at: "desc" }
		});
	}
	static async getSaleDetails(e) {
		return w.sale.findUnique({
			where: { id: e },
			include: {
				items: { include: { product: !0 } },
				client: !0,
				cash_register: !0
			}
		});
	}
	static async registerSale(e, t) {
		try {
			let n = to.parse({
				...e,
				items: t
			}), r = n.client_id;
			if (n.client_dni && n.client_name) {
				let e = await w.client.findFirst({ where: { dni: n.client_dni } });
				r = e ? e.id : (await w.client.create({ data: {
					dni: n.client_dni,
					name: n.client_name,
					code: `CLI-${Date.now()}`
				} })).id;
			}
			return {
				success: !0,
				id: await w.$transaction(async (e) => {
					let t = n.items.map((e) => e.product_id), i = await e.product.findMany({ where: { id: { in: t } } }), a = new Map(i.map((e) => [e.id, e])), o = n.items.map((e) => {
						let t = a.get(e.product_id);
						return {
							...e,
							purchase_price: t?.price_purchase || 0
						};
					}), s = o.reduce((e, t) => e + t.unit_price * t.quantity, 0), c = await e.sale.create({ data: {
						cash_register_id: n.cash_register_id,
						client_id: r,
						total: s
					} }), l = await Promise.all(o.map((t) => e.saleItem.create({ data: {
						sale_id: c.id,
						product_id: t.product_id,
						quantity: t.quantity,
						unit_price: t.unit_price,
						purchase_price: t.purchase_price
					} })));
					return await e.inventoryMovement.createMany({ data: l.map((e) => ({
						product_id: e.product_id,
						type: "SALIDA",
						quantity: e.quantity
					})) }), c.id;
				})
			};
		} catch (e) {
			return console.error("Error al registrar venta:", e), e.name === "ZodError" ? {
				success: !1,
				message: e.errors.map((e) => e.message).join(". ")
			} : {
				success: !1,
				message: e.message || "Error al registrar venta"
			};
		}
	}
}, io = null;
function ao(e) {
	try {
		return crypto.getRandomValues(new Uint8Array(e));
	} catch {}
	try {
		return c.randomBytes(e);
	} catch {}
	if (!io) throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
	return io(e);
}
function oo(e) {
	io = e;
}
function so(e, t) {
	if (e ||= Eo, typeof e != "number") throw Error("Illegal arguments: " + typeof e + ", " + typeof t);
	e < 4 ? e = 4 : e > 31 && (e = 31);
	var n = [];
	return n.push("$2b$"), e < 10 && n.push("0"), n.push(e.toString()), n.push("$"), n.push(Co(ao(To), To)), n.join("");
}
function co(e, t, n) {
	if (typeof t == "function" && (n = t, t = void 0), typeof e == "function" && (n = e, e = void 0), e === void 0) e = Eo;
	else if (typeof e != "number") throw Error("illegal arguments: " + typeof e);
	function r(t) {
		vo(function() {
			try {
				t(null, so(e));
			} catch (e) {
				t(e);
			}
		});
	}
	if (n) {
		if (typeof n != "function") throw Error("Illegal callback: " + typeof n);
		r(n);
	} else return new Promise(function(e, t) {
		r(function(n, r) {
			if (n) {
				t(n);
				return;
			}
			e(r);
		});
	});
}
function lo(e, t) {
	if (t === void 0 && (t = Eo), typeof t == "number" && (t = so(t)), typeof e != "string" || typeof t != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof t);
	return Lo(e, t);
}
function uo(e, t, n, r) {
	function i(n) {
		typeof e == "string" && typeof t == "number" ? co(t, function(t, i) {
			Lo(e, i, n, r);
		}) : typeof e == "string" && typeof t == "string" ? Lo(e, t, n, r) : vo(n.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof t)));
	}
	if (n) {
		if (typeof n != "function") throw Error("Illegal callback: " + typeof n);
		i(n);
	} else return new Promise(function(e, t) {
		i(function(n, r) {
			if (n) {
				t(n);
				return;
			}
			e(r);
		});
	});
}
function fo(e, t) {
	for (var n = e.length ^ t.length, r = 0; r < e.length; ++r) n |= e.charCodeAt(r) ^ t.charCodeAt(r);
	return n === 0;
}
function po(e, t) {
	if (typeof e != "string" || typeof t != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof t);
	return t.length === 60 ? fo(lo(e, t.substring(0, t.length - 31)), t) : !1;
}
function mo(e, t, n, r) {
	function i(n) {
		if (typeof e != "string" || typeof t != "string") {
			vo(n.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof t)));
			return;
		}
		if (t.length !== 60) {
			vo(n.bind(this, null, !1));
			return;
		}
		uo(e, t.substring(0, 29), function(e, r) {
			e ? n(e) : n(null, fo(r, t));
		}, r);
	}
	if (n) {
		if (typeof n != "function") throw Error("Illegal callback: " + typeof n);
		i(n);
	} else return new Promise(function(e, t) {
		i(function(n, r) {
			if (n) {
				t(n);
				return;
			}
			e(r);
		});
	});
}
function ho(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	return parseInt(e.split("$")[2], 10);
}
function go(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	if (e.length !== 60) throw Error("Illegal hash length: " + e.length + " != 60");
	return e.substring(0, 29);
}
function _o(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	return yo(e) > 72;
}
var vo = typeof setImmediate == "function" ? setImmediate : typeof scheduler == "object" && typeof scheduler.postTask == "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function yo(e) {
	for (var t = 0, n = 0, r = 0; r < e.length; ++r) n = e.charCodeAt(r), n < 128 ? t += 1 : n < 2048 ? t += 2 : (n & 64512) == 55296 && (e.charCodeAt(r + 1) & 64512) == 56320 ? (++r, t += 4) : t += 3;
	return t;
}
function bo(e) {
	for (var t = 0, n, r, i = Array(yo(e)), a = 0, o = e.length; a < o; ++a) n = e.charCodeAt(a), n < 128 ? i[t++] = n : n < 2048 ? (i[t++] = n >> 6 | 192, i[t++] = n & 63 | 128) : (n & 64512) == 55296 && ((r = e.charCodeAt(a + 1)) & 64512) == 56320 ? (n = 65536 + ((n & 1023) << 10) + (r & 1023), ++a, i[t++] = n >> 18 | 240, i[t++] = n >> 12 & 63 | 128, i[t++] = n >> 6 & 63 | 128, i[t++] = n & 63 | 128) : (i[t++] = n >> 12 | 224, i[t++] = n >> 6 & 63 | 128, i[t++] = n & 63 | 128);
	return i;
}
var xo = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""), So = [
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	0,
	1,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	-1,
	-1,
	-1,
	-1,
	-1
];
function Co(e, t) {
	var n = 0, r = [], i, a;
	if (t <= 0 || t > e.length) throw Error("Illegal len: " + t);
	for (; n < t;) {
		if (i = e[n++] & 255, r.push(xo[i >> 2 & 63]), i = (i & 3) << 4, n >= t) {
			r.push(xo[i & 63]);
			break;
		}
		if (a = e[n++] & 255, i |= a >> 4 & 15, r.push(xo[i & 63]), i = (a & 15) << 2, n >= t) {
			r.push(xo[i & 63]);
			break;
		}
		a = e[n++] & 255, i |= a >> 6 & 3, r.push(xo[i & 63]), r.push(xo[a & 63]);
	}
	return r.join("");
}
function wo(e, t) {
	var n = 0, r = e.length, i = 0, a = [], o, s, c, l, u, d;
	if (t <= 0) throw Error("Illegal len: " + t);
	for (; n < r - 1 && i < t && (d = e.charCodeAt(n++), o = d < So.length ? So[d] : -1, d = e.charCodeAt(n++), s = d < So.length ? So[d] : -1, !(o == -1 || s == -1 || (u = o << 2 >>> 0, u |= (s & 48) >> 4, a.push(String.fromCharCode(u)), ++i >= t || n >= r) || (d = e.charCodeAt(n++), c = d < So.length ? So[d] : -1, c == -1) || (u = (s & 15) << 4 >>> 0, u |= (c & 60) >> 2, a.push(String.fromCharCode(u)), ++i >= t || n >= r)));) d = e.charCodeAt(n++), l = d < So.length ? So[d] : -1, u = (c & 3) << 6 >>> 0, u |= l, a.push(String.fromCharCode(u)), ++i;
	var f = [];
	for (n = 0; n < i; n++) f.push(a[n].charCodeAt(0));
	return f;
}
var To = 16, Eo = 10, Do = 16, Oo = 100, ko = [
	608135816,
	2242054355,
	320440878,
	57701188,
	2752067618,
	698298832,
	137296536,
	3964562569,
	1160258022,
	953160567,
	3193202383,
	887688300,
	3232508343,
	3380367581,
	1065670069,
	3041331479,
	2450970073,
	2306472731
], Ao = [
	3509652390,
	2564797868,
	805139163,
	3491422135,
	3101798381,
	1780907670,
	3128725573,
	4046225305,
	614570311,
	3012652279,
	134345442,
	2240740374,
	1667834072,
	1901547113,
	2757295779,
	4103290238,
	227898511,
	1921955416,
	1904987480,
	2182433518,
	2069144605,
	3260701109,
	2620446009,
	720527379,
	3318853667,
	677414384,
	3393288472,
	3101374703,
	2390351024,
	1614419982,
	1822297739,
	2954791486,
	3608508353,
	3174124327,
	2024746970,
	1432378464,
	3864339955,
	2857741204,
	1464375394,
	1676153920,
	1439316330,
	715854006,
	3033291828,
	289532110,
	2706671279,
	2087905683,
	3018724369,
	1668267050,
	732546397,
	1947742710,
	3462151702,
	2609353502,
	2950085171,
	1814351708,
	2050118529,
	680887927,
	999245976,
	1800124847,
	3300911131,
	1713906067,
	1641548236,
	4213287313,
	1216130144,
	1575780402,
	4018429277,
	3917837745,
	3693486850,
	3949271944,
	596196993,
	3549867205,
	258830323,
	2213823033,
	772490370,
	2760122372,
	1774776394,
	2652871518,
	566650946,
	4142492826,
	1728879713,
	2882767088,
	1783734482,
	3629395816,
	2517608232,
	2874225571,
	1861159788,
	326777828,
	3124490320,
	2130389656,
	2716951837,
	967770486,
	1724537150,
	2185432712,
	2364442137,
	1164943284,
	2105845187,
	998989502,
	3765401048,
	2244026483,
	1075463327,
	1455516326,
	1322494562,
	910128902,
	469688178,
	1117454909,
	936433444,
	3490320968,
	3675253459,
	1240580251,
	122909385,
	2157517691,
	634681816,
	4142456567,
	3825094682,
	3061402683,
	2540495037,
	79693498,
	3249098678,
	1084186820,
	1583128258,
	426386531,
	1761308591,
	1047286709,
	322548459,
	995290223,
	1845252383,
	2603652396,
	3431023940,
	2942221577,
	3202600964,
	3727903485,
	1712269319,
	422464435,
	3234572375,
	1170764815,
	3523960633,
	3117677531,
	1434042557,
	442511882,
	3600875718,
	1076654713,
	1738483198,
	4213154764,
	2393238008,
	3677496056,
	1014306527,
	4251020053,
	793779912,
	2902807211,
	842905082,
	4246964064,
	1395751752,
	1040244610,
	2656851899,
	3396308128,
	445077038,
	3742853595,
	3577915638,
	679411651,
	2892444358,
	2354009459,
	1767581616,
	3150600392,
	3791627101,
	3102740896,
	284835224,
	4246832056,
	1258075500,
	768725851,
	2589189241,
	3069724005,
	3532540348,
	1274779536,
	3789419226,
	2764799539,
	1660621633,
	3471099624,
	4011903706,
	913787905,
	3497959166,
	737222580,
	2514213453,
	2928710040,
	3937242737,
	1804850592,
	3499020752,
	2949064160,
	2386320175,
	2390070455,
	2415321851,
	4061277028,
	2290661394,
	2416832540,
	1336762016,
	1754252060,
	3520065937,
	3014181293,
	791618072,
	3188594551,
	3933548030,
	2332172193,
	3852520463,
	3043980520,
	413987798,
	3465142937,
	3030929376,
	4245938359,
	2093235073,
	3534596313,
	375366246,
	2157278981,
	2479649556,
	555357303,
	3870105701,
	2008414854,
	3344188149,
	4221384143,
	3956125452,
	2067696032,
	3594591187,
	2921233993,
	2428461,
	544322398,
	577241275,
	1471733935,
	610547355,
	4027169054,
	1432588573,
	1507829418,
	2025931657,
	3646575487,
	545086370,
	48609733,
	2200306550,
	1653985193,
	298326376,
	1316178497,
	3007786442,
	2064951626,
	458293330,
	2589141269,
	3591329599,
	3164325604,
	727753846,
	2179363840,
	146436021,
	1461446943,
	4069977195,
	705550613,
	3059967265,
	3887724982,
	4281599278,
	3313849956,
	1404054877,
	2845806497,
	146425753,
	1854211946,
	1266315497,
	3048417604,
	3681880366,
	3289982499,
	290971e4,
	1235738493,
	2632868024,
	2414719590,
	3970600049,
	1771706367,
	1449415276,
	3266420449,
	422970021,
	1963543593,
	2690192192,
	3826793022,
	1062508698,
	1531092325,
	1804592342,
	2583117782,
	2714934279,
	4024971509,
	1294809318,
	4028980673,
	1289560198,
	2221992742,
	1669523910,
	35572830,
	157838143,
	1052438473,
	1016535060,
	1802137761,
	1753167236,
	1386275462,
	3080475397,
	2857371447,
	1040679964,
	2145300060,
	2390574316,
	1461121720,
	2956646967,
	4031777805,
	4028374788,
	33600511,
	2920084762,
	1018524850,
	629373528,
	3691585981,
	3515945977,
	2091462646,
	2486323059,
	586499841,
	988145025,
	935516892,
	3367335476,
	2599673255,
	2839830854,
	265290510,
	3972581182,
	2759138881,
	3795373465,
	1005194799,
	847297441,
	406762289,
	1314163512,
	1332590856,
	1866599683,
	4127851711,
	750260880,
	613907577,
	1450815602,
	3165620655,
	3734664991,
	3650291728,
	3012275730,
	3704569646,
	1427272223,
	778793252,
	1343938022,
	2676280711,
	2052605720,
	1946737175,
	3164576444,
	3914038668,
	3967478842,
	3682934266,
	1661551462,
	3294938066,
	4011595847,
	840292616,
	3712170807,
	616741398,
	312560963,
	711312465,
	1351876610,
	322626781,
	1910503582,
	271666773,
	2175563734,
	1594956187,
	70604529,
	3617834859,
	1007753275,
	1495573769,
	4069517037,
	2549218298,
	2663038764,
	504708206,
	2263041392,
	3941167025,
	2249088522,
	1514023603,
	1998579484,
	1312622330,
	694541497,
	2582060303,
	2151582166,
	1382467621,
	776784248,
	2618340202,
	3323268794,
	2497899128,
	2784771155,
	503983604,
	4076293799,
	907881277,
	423175695,
	432175456,
	1378068232,
	4145222326,
	3954048622,
	3938656102,
	3820766613,
	2793130115,
	2977904593,
	26017576,
	3274890735,
	3194772133,
	1700274565,
	1756076034,
	4006520079,
	3677328699,
	720338349,
	1533947780,
	354530856,
	688349552,
	3973924725,
	1637815568,
	332179504,
	3949051286,
	53804574,
	2852348879,
	3044236432,
	1282449977,
	3583942155,
	3416972820,
	4006381244,
	1617046695,
	2628476075,
	3002303598,
	1686838959,
	431878346,
	2686675385,
	1700445008,
	1080580658,
	1009431731,
	832498133,
	3223435511,
	2605976345,
	2271191193,
	2516031870,
	1648197032,
	4164389018,
	2548247927,
	300782431,
	375919233,
	238389289,
	3353747414,
	2531188641,
	2019080857,
	1475708069,
	455242339,
	2609103871,
	448939670,
	3451063019,
	1395535956,
	2413381860,
	1841049896,
	1491858159,
	885456874,
	4264095073,
	4001119347,
	1565136089,
	3898914787,
	1108368660,
	540939232,
	1173283510,
	2745871338,
	3681308437,
	4207628240,
	3343053890,
	4016749493,
	1699691293,
	1103962373,
	3625875870,
	2256883143,
	3830138730,
	1031889488,
	3479347698,
	1535977030,
	4236805024,
	3251091107,
	2132092099,
	1774941330,
	1199868427,
	1452454533,
	157007616,
	2904115357,
	342012276,
	595725824,
	1480756522,
	206960106,
	497939518,
	591360097,
	863170706,
	2375253569,
	3596610801,
	1814182875,
	2094937945,
	3421402208,
	1082520231,
	3463918190,
	2785509508,
	435703966,
	3908032597,
	1641649973,
	2842273706,
	3305899714,
	1510255612,
	2148256476,
	2655287854,
	3276092548,
	4258621189,
	236887753,
	3681803219,
	274041037,
	1734335097,
	3815195456,
	3317970021,
	1899903192,
	1026095262,
	4050517792,
	356393447,
	2410691914,
	3873677099,
	3682840055,
	3913112168,
	2491498743,
	4132185628,
	2489919796,
	1091903735,
	1979897079,
	3170134830,
	3567386728,
	3557303409,
	857797738,
	1136121015,
	1342202287,
	507115054,
	2535736646,
	337727348,
	3213592640,
	1301675037,
	2528481711,
	1895095763,
	1721773893,
	3216771564,
	62756741,
	2142006736,
	835421444,
	2531993523,
	1442658625,
	3659876326,
	2882144922,
	676362277,
	1392781812,
	170690266,
	3921047035,
	1759253602,
	3611846912,
	1745797284,
	664899054,
	1329594018,
	3901205900,
	3045908486,
	2062866102,
	2865634940,
	3543621612,
	3464012697,
	1080764994,
	553557557,
	3656615353,
	3996768171,
	991055499,
	499776247,
	1265440854,
	648242737,
	3940784050,
	980351604,
	3713745714,
	1749149687,
	3396870395,
	4211799374,
	3640570775,
	1161844396,
	3125318951,
	1431517754,
	545492359,
	4268468663,
	3499529547,
	1437099964,
	2702547544,
	3433638243,
	2581715763,
	2787789398,
	1060185593,
	1593081372,
	2418618748,
	4260947970,
	69676912,
	2159744348,
	86519011,
	2512459080,
	3838209314,
	1220612927,
	3339683548,
	133810670,
	1090789135,
	1078426020,
	1569222167,
	845107691,
	3583754449,
	4072456591,
	1091646820,
	628848692,
	1613405280,
	3757631651,
	526609435,
	236106946,
	48312990,
	2942717905,
	3402727701,
	1797494240,
	859738849,
	992217954,
	4005476642,
	2243076622,
	3870952857,
	3732016268,
	765654824,
	3490871365,
	2511836413,
	1685915746,
	3888969200,
	1414112111,
	2273134842,
	3281911079,
	4080962846,
	172450625,
	2569994100,
	980381355,
	4109958455,
	2819808352,
	2716589560,
	2568741196,
	3681446669,
	3329971472,
	1835478071,
	660984891,
	3704678404,
	4045999559,
	3422617507,
	3040415634,
	1762651403,
	1719377915,
	3470491036,
	2693910283,
	3642056355,
	3138596744,
	1364962596,
	2073328063,
	1983633131,
	926494387,
	3423689081,
	2150032023,
	4096667949,
	1749200295,
	3328846651,
	309677260,
	2016342300,
	1779581495,
	3079819751,
	111262694,
	1274766160,
	443224088,
	298511866,
	1025883608,
	3806446537,
	1145181785,
	168956806,
	3641502830,
	3584813610,
	1689216846,
	3666258015,
	3200248200,
	1692713982,
	2646376535,
	4042768518,
	1618508792,
	1610833997,
	3523052358,
	4130873264,
	2001055236,
	3610705100,
	2202168115,
	4028541809,
	2961195399,
	1006657119,
	2006996926,
	3186142756,
	1430667929,
	3210227297,
	1314452623,
	4074634658,
	4101304120,
	2273951170,
	1399257539,
	3367210612,
	3027628629,
	1190975929,
	2062231137,
	2333990788,
	2221543033,
	2438960610,
	1181637006,
	548689776,
	2362791313,
	3372408396,
	3104550113,
	3145860560,
	296247880,
	1970579870,
	3078560182,
	3769228297,
	1714227617,
	3291629107,
	3898220290,
	166772364,
	1251581989,
	493813264,
	448347421,
	195405023,
	2709975567,
	677966185,
	3703036547,
	1463355134,
	2715995803,
	1338867538,
	1343315457,
	2802222074,
	2684532164,
	233230375,
	2599980071,
	2000651841,
	3277868038,
	1638401717,
	4028070440,
	3237316320,
	6314154,
	819756386,
	300326615,
	590932579,
	1405279636,
	3267499572,
	3150704214,
	2428286686,
	3959192993,
	3461946742,
	1862657033,
	1266418056,
	963775037,
	2089974820,
	2263052895,
	1917689273,
	448879540,
	3550394620,
	3981727096,
	150775221,
	3627908307,
	1303187396,
	508620638,
	2975983352,
	2726630617,
	1817252668,
	1876281319,
	1457606340,
	908771278,
	3720792119,
	3617206836,
	2455994898,
	1729034894,
	1080033504,
	976866871,
	3556439503,
	2881648439,
	1522871579,
	1555064734,
	1336096578,
	3548522304,
	2579274686,
	3574697629,
	3205460757,
	3593280638,
	3338716283,
	3079412587,
	564236357,
	2993598910,
	1781952180,
	1464380207,
	3163844217,
	3332601554,
	1699332808,
	1393555694,
	1183702653,
	3581086237,
	1288719814,
	691649499,
	2847557200,
	2895455976,
	3193889540,
	2717570544,
	1781354906,
	1676643554,
	2592534050,
	3230253752,
	1126444790,
	2770207658,
	2633158820,
	2210423226,
	2615765581,
	2414155088,
	3127139286,
	673620729,
	2805611233,
	1269405062,
	4015350505,
	3341807571,
	4149409754,
	1057255273,
	2012875353,
	2162469141,
	2276492801,
	2601117357,
	993977747,
	3918593370,
	2654263191,
	753973209,
	36408145,
	2530585658,
	25011837,
	3520020182,
	2088578344,
	530523599,
	2918365339,
	1524020338,
	1518925132,
	3760827505,
	3759777254,
	1202760957,
	3985898139,
	3906192525,
	674977740,
	4174734889,
	2031300136,
	2019492241,
	3983892565,
	4153806404,
	3822280332,
	352677332,
	2297720250,
	60907813,
	90501309,
	3286998549,
	1016092578,
	2535922412,
	2839152426,
	457141659,
	509813237,
	4120667899,
	652014361,
	1966332200,
	2975202805,
	55981186,
	2327461051,
	676427537,
	3255491064,
	2882294119,
	3433927263,
	1307055953,
	942726286,
	933058658,
	2468411793,
	3933900994,
	4215176142,
	1361170020,
	2001714738,
	2830558078,
	3274259782,
	1222529897,
	1679025792,
	2729314320,
	3714953764,
	1770335741,
	151462246,
	3013232138,
	1682292957,
	1483529935,
	471910574,
	1539241949,
	458788160,
	3436315007,
	1807016891,
	3718408830,
	978976581,
	1043663428,
	3165965781,
	1927990952,
	4200891579,
	2372276910,
	3208408903,
	3533431907,
	1412390302,
	2931980059,
	4132332400,
	1947078029,
	3881505623,
	4168226417,
	2941484381,
	1077988104,
	1320477388,
	886195818,
	18198404,
	3786409e3,
	2509781533,
	112762804,
	3463356488,
	1866414978,
	891333506,
	18488651,
	661792760,
	1628790961,
	3885187036,
	3141171499,
	876946877,
	2693282273,
	1372485963,
	791857591,
	2686433993,
	3759982718,
	3167212022,
	3472953795,
	2716379847,
	445679433,
	3561995674,
	3504004811,
	3574258232,
	54117162,
	3331405415,
	2381918588,
	3769707343,
	4154350007,
	1140177722,
	4074052095,
	668550556,
	3214352940,
	367459370,
	261225585,
	2610173221,
	4209349473,
	3468074219,
	3265815641,
	314222801,
	3066103646,
	3808782860,
	282218597,
	3406013506,
	3773591054,
	379116347,
	1285071038,
	846784868,
	2669647154,
	3771962079,
	3550491691,
	2305946142,
	453669953,
	1268987020,
	3317592352,
	3279303384,
	3744833421,
	2610507566,
	3859509063,
	266596637,
	3847019092,
	517658769,
	3462560207,
	3443424879,
	370717030,
	4247526661,
	2224018117,
	4143653529,
	4112773975,
	2788324899,
	2477274417,
	1456262402,
	2901442914,
	1517677493,
	1846949527,
	2295493580,
	3734397586,
	2176403920,
	1280348187,
	1908823572,
	3871786941,
	846861322,
	1172426758,
	3287448474,
	3383383037,
	1655181056,
	3139813346,
	901632758,
	1897031941,
	2986607138,
	3066810236,
	3447102507,
	1393639104,
	373351379,
	950779232,
	625454576,
	3124240540,
	4148612726,
	2007998917,
	544563296,
	2244738638,
	2330496472,
	2058025392,
	1291430526,
	424198748,
	50039436,
	29584100,
	3605783033,
	2429876329,
	2791104160,
	1057563949,
	3255363231,
	3075367218,
	3463963227,
	1469046755,
	985887462
], jo = [
	1332899944,
	1700884034,
	1701343084,
	1684370003,
	1668446532,
	1869963892
];
function Mo(e, t, n, r) {
	var i, a = e[t], o = e[t + 1];
	return a ^= n[0], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[1], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[2], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[3], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[4], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[5], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[6], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[7], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[8], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[9], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[10], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[11], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[12], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[13], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[14], i = r[a >>> 24], i += r[256 | a >> 16 & 255], i ^= r[512 | a >> 8 & 255], i += r[768 | a & 255], o ^= i ^ n[15], i = r[o >>> 24], i += r[256 | o >> 16 & 255], i ^= r[512 | o >> 8 & 255], i += r[768 | o & 255], a ^= i ^ n[16], e[t] = o ^ n[Do + 1], e[t + 1] = a, e;
}
function No(e, t) {
	for (var n = 0, r = 0; n < 4; ++n) r = r << 8 | e[t] & 255, t = (t + 1) % e.length;
	return {
		key: r,
		offp: t
	};
}
function Po(e, t, n) {
	for (var r = 0, i = [0, 0], a = t.length, o = n.length, s, c = 0; c < a; c++) s = No(e, r), r = s.offp, t[c] = t[c] ^ s.key;
	for (c = 0; c < a; c += 2) i = Mo(i, 0, t, n), t[c] = i[0], t[c + 1] = i[1];
	for (c = 0; c < o; c += 2) i = Mo(i, 0, t, n), n[c] = i[0], n[c + 1] = i[1];
}
function Fo(e, t, n, r) {
	for (var i = 0, a = [0, 0], o = n.length, s = r.length, c, l = 0; l < o; l++) c = No(t, i), i = c.offp, n[l] = n[l] ^ c.key;
	for (i = 0, l = 0; l < o; l += 2) c = No(e, i), i = c.offp, a[0] ^= c.key, c = No(e, i), i = c.offp, a[1] ^= c.key, a = Mo(a, 0, n, r), n[l] = a[0], n[l + 1] = a[1];
	for (l = 0; l < s; l += 2) c = No(e, i), i = c.offp, a[0] ^= c.key, c = No(e, i), i = c.offp, a[1] ^= c.key, a = Mo(a, 0, n, r), r[l] = a[0], r[l + 1] = a[1];
}
function Io(e, t, n, r, i) {
	var a = jo.slice(), o = a.length, s;
	if (n < 4 || n > 31) if (s = Error("Illegal number of rounds (4-31): " + n), r) {
		vo(r.bind(this, s));
		return;
	} else throw s;
	if (t.length !== To) if (s = Error("Illegal salt length: " + t.length + " != " + To), r) {
		vo(r.bind(this, s));
		return;
	} else throw s;
	n = 1 << n >>> 0;
	var c, l, u = 0, d;
	typeof Int32Array == "function" ? (c = new Int32Array(ko), l = new Int32Array(Ao)) : (c = ko.slice(), l = Ao.slice()), Fo(t, e, c, l);
	function f() {
		if (i && i(u / n), u < n) for (var s = Date.now(); u < n && (u += 1, Po(e, c, l), Po(t, c, l), !(Date.now() - s > Oo)););
		else {
			for (u = 0; u < 64; u++) for (d = 0; d < o >> 1; d++) Mo(a, d << 1, c, l);
			var p = [];
			for (u = 0; u < o; u++) p.push((a[u] >> 24 & 255) >>> 0), p.push((a[u] >> 16 & 255) >>> 0), p.push((a[u] >> 8 & 255) >>> 0), p.push((a[u] & 255) >>> 0);
			if (r) {
				r(null, p);
				return;
			} else return p;
		}
		r && vo(f);
	}
	if (r !== void 0) f();
	else for (var p;;) if ((p = f()) !== void 0) return p || [];
}
function Lo(e, t, n, r) {
	var i;
	if (typeof e != "string" || typeof t != "string") if (i = Error("Invalid string / salt: Not a string"), n) {
		vo(n.bind(this, i));
		return;
	} else throw i;
	var a, o;
	if (t.charAt(0) !== "$" || t.charAt(1) !== "2") if (i = Error("Invalid salt version: " + t.substring(0, 2)), n) {
		vo(n.bind(this, i));
		return;
	} else throw i;
	if (t.charAt(2) === "$") a = "\0", o = 3;
	else {
		if (a = t.charAt(2), a !== "a" && a !== "b" && a !== "y" || t.charAt(3) !== "$") if (i = Error("Invalid salt revision: " + t.substring(2, 4)), n) {
			vo(n.bind(this, i));
			return;
		} else throw i;
		o = 4;
	}
	if (t.charAt(o + 2) > "$") if (i = Error("Missing salt rounds"), n) {
		vo(n.bind(this, i));
		return;
	} else throw i;
	var s = parseInt(t.substring(o, o + 1), 10) * 10 + parseInt(t.substring(o + 1, o + 2), 10), c = t.substring(o + 3, o + 25);
	e += a >= "a" ? "\0" : "";
	var l = bo(e), u = wo(c, To);
	function d(e) {
		var t = [];
		return t.push("$2"), a >= "a" && t.push(a), t.push("$"), s < 10 && t.push("0"), t.push(s.toString()), t.push("$"), t.push(Co(u, u.length)), t.push(Co(e, jo.length * 4 - 1)), t.join("");
	}
	if (n === void 0) return d(Io(l, u, s));
	Io(l, u, s, function(e, t) {
		e ? n(e, null) : n(null, d(t));
	}, r);
}
function Ro(e, t) {
	return Co(e, t);
}
function zo(e, t) {
	return wo(e, t);
}
var Bo = {
	setRandomFallback: oo,
	genSaltSync: so,
	genSalt: co,
	hashSync: lo,
	hash: uo,
	compareSync: po,
	compare: mo,
	getRounds: ho,
	getSalt: go,
	truncates: _o,
	encodeBase64: Ro,
	decodeBase64: zo
}, Vo = class {
	static async findAll() {
		return w.user.findMany({
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			},
			orderBy: { created_at: "desc" }
		});
	}
	static async findById(e) {
		return w.user.findUnique({
			where: { id: e },
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	static async findByUsername(e) {
		return w.user.findUnique({ where: { username: e } });
	}
	static async create(e) {
		return w.user.create({
			data: e,
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	static async update(e, t) {
		return w.user.update({
			where: { id: e },
			data: t,
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	static async delete(e) {
		return w.user.delete({ where: { id: e } });
	}
	static async exists(e, t) {
		return !!await w.user.findFirst({
			where: {
				username: e,
				...t && { id: { not: t } }
			},
			select: { id: !0 }
		});
	}
	static async count() {
		return w.user.count();
	}
}, Z = class {
	static async login(e, t) {
		try {
			let n = await Vo.findByUsername(e);
			if (!n) return {
				success: !1,
				error: "Usuario no encontrado"
			};
			if (!await Bo.compare(t, n.password_hash)) return {
				success: !1,
				error: "Contraseña incorrecta"
			};
			let { password_hash: r, ...i } = n;
			return {
				success: !0,
				user: i
			};
		} catch (e) {
			return console.error("Login error:", e), e.code === "P2025" ? {
				success: !1,
				error: "Usuario no encontrado"
			} : {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	static async register(e) {
		try {
			if (await Vo.exists(e.username)) return {
				success: !1,
				error: `El usuario '${e.username}' ya existe`
			};
			if (e.password.length < 6) return {
				success: !1,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			let t = await Bo.genSalt(10), n = await Bo.hash(e.password, t), r = await Vo.create({
				username: e.username,
				password_hash: n,
				role: e.role
			});
			return {
				success: !0,
				user: {
					id: r.id,
					username: r.username,
					role: r.role,
					created_at: r.created_at,
					updated_at: r.updated_at
				}
			};
		} catch (e) {
			return console.error("Register error:", e), e.code === "P2002" ? {
				success: !1,
				error: "El nombre de usuario ya está en uso"
			} : {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	static async changePassword(e, t, n) {
		try {
			let r = await w.user.findUnique({ where: { id: e } });
			if (!r) return {
				success: !1,
				error: "Usuario no encontrado"
			};
			if (!await Bo.compare(t, r.password_hash)) return {
				success: !1,
				error: "Contraseña actual incorrecta"
			};
			if (n.length < 6) return {
				success: !1,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			let i = await Bo.genSalt(10), a = await Bo.hash(n, i);
			return await Vo.update(e, { password_hash: a }), { success: !0 };
		} catch (e) {
			return console.error("Change password error:", e), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
}, Ho = class {
	static async getAllUsers() {
		try {
			return await Vo.findAll();
		} catch (e) {
			throw console.error("Get all users error:", e), Error("Error al obtener usuarios");
		}
	}
	static async getUserById(e) {
		try {
			let t = await Vo.findById(e);
			if (!t) throw Error("Usuario no encontrado");
			return t;
		} catch (e) {
			throw console.error("Get user by ID error:", e), e.code === "P2025" ? Error("Usuario no encontrado") : Error("Error al obtener usuario");
		}
	}
	static async createUser(e, t) {
		try {
			if (await Vo.exists(e.username)) throw Error(`El usuario '${e.username}' ya existe`);
			if (e.password.length < 6) throw Error("La contraseña debe tener al menos 6 caracteres");
			let n = await Bo.genSalt(10), r = await Bo.hash(e.password, n), i = await Vo.create({
				username: e.username,
				password_hash: r,
				role: e.role
			});
			return await w.auditLog.create({ data: {
				user_id: t,
				action: "CREATE_USER",
				entity: "users",
				entity_id: i.id
			} }), i;
		} catch (e) {
			throw console.error("Create user error:", e), e.code === "P2002" ? Error("El nombre de usuario ya está en uso") : e;
		}
	}
	static async updateUser(e, t, n) {
		try {
			if (t.username && await Vo.exists(t.username, e)) throw Error(`El usuario '${t.username}' ya existe`);
			let r = await Vo.update(e, t);
			return await w.auditLog.create({ data: {
				user_id: n,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: e
			} }), r;
		} catch (e) {
			throw console.error("Update user error:", e), e.code === "P2025" ? Error("Usuario no encontrado") : e;
		}
	}
	static async deleteUser(e, t) {
		try {
			if (!await Vo.findById(e)) throw Error("Usuario no encontrado");
			if (e === t) throw Error("No puedes eliminar tu propio usuario");
			return await Vo.delete(e), await w.auditLog.create({ data: {
				user_id: t,
				action: "DELETE_USER",
				entity: "users",
				entity_id: e
			} }), { success: !0 };
		} catch (e) {
			throw console.error("Delete user error:", e), e.code === "P2025" ? Error("Usuario no encontrado") : e;
		}
	}
	static async changePassword(e, t, n) {
		try {
			if (t.length < 6) throw Error("La contraseña debe tener al menos 6 caracteres");
			let r = await Bo.genSalt(10), i = await Bo.hash(t, r);
			return await Vo.update(e, { password_hash: i }), await w.auditLog.create({ data: {
				user_id: n,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: e
			} }), { success: !0 };
		} catch (e) {
			throw console.error("Change password error:", e), e.code === "P2025" ? Error("Usuario no encontrado") : e;
		}
	}
}, Uo = class {
	static async getStats() {
		let e = /* @__PURE__ */ new Date();
		e.setHours(0, 0, 0, 0);
		let t = await w.sale.aggregate({
			where: { created_at: { gte: e } },
			_sum: { total: !0 }
		}), n = (await w.sale.findMany({
			where: { created_at: { gte: e } },
			include: { items: !0 }
		})).reduce((e, t) => e + t.items.reduce((e, t) => e + t.quantity * (t.unit_price - t.purchase_price), 0), 0), r = await w.sale.count({ where: { created_at: { gte: e } } }), i = await w.product.count({ where: { stock: { gt: 0 } } }), a = await w.client.count();
		return {
			todayRevenue: t._sum.total || 0,
			todayProfit: n,
			todaySalesCount: r,
			activeProducts: i,
			totalClients: a
		};
	}
	static async getWeeklySales() {
		let e = /* @__PURE__ */ new Date();
		e.setDate(e.getDate() - 7);
		let t = (await w.sale.findMany({
			where: { created_at: { gte: e } },
			select: {
				total: !0,
				created_at: !0
			},
			orderBy: { created_at: "asc" }
		})).reduce((e, t) => {
			let n = t.created_at.toISOString().split("T")[0];
			return e[n] || (e[n] = {
				date: n,
				total: 0
			}), e[n].total += t.total, e;
		}, {});
		return Object.values(t);
	}
	static async getLowStockProducts() {
		return w.product.findMany({
			where: { stock: { lt: w.product.fields.min_stock } },
			select: {
				sku: !0,
				name: !0,
				stock: !0,
				min_stock: !0
			},
			orderBy: { stock: "asc" },
			take: 5
		});
	}
}, Wo = class {
	static async getOpenRegister() {
		return w.cashRegister.findFirst({
			where: { opened_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) } },
			orderBy: { opened_at: "desc" }
		});
	}
	static async openRegister(e) {
		if (await this.getOpenRegister()) throw Error("Ya hay una caja abierta.");
		return (await w.cashRegister.create({ data: {
			opening_amount: e,
			total_sales: 0
		} })).id;
	}
	static async closeRegister(e, t) {
		let n = await w.cashRegister.findFirst({ where: {
			id: e,
			opened_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) }
		} });
		if (!n) throw Error("Caja no encontrada o ya cerrada.");
		let r = Number(n.opening_amount) + Number(n.total_sales), i = t - r;
		return await w.cashRegister.update({
			where: { id: e },
			data: { total_sales: n.total_sales }
		}), {
			expected: r,
			real: t,
			difference: i,
			status: i === 0 ? "PERFECT" : i > 0 ? "SURPLUS" : "MISSING"
		};
	}
}, Go = class {
	static async findAll() {
		return w.category.findMany({ orderBy: { name: "asc" } });
	}
	static async findById(e) {
		return w.category.findUnique({ where: { id: e } });
	}
	static async create(e) {
		return w.category.create({ data: e });
	}
	static async update(e, t) {
		return w.category.update({
			where: { id: e },
			data: t
		});
	}
	static async delete(e) {
		return w.category.delete({ where: { id: e } });
	}
};
//#endregion
//#region src/main/ipc.ts
function Ko() {
	n.handle("dashboard:getStats", async () => {
		try {
			return await Uo.getStats();
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("dashboard:getWeeklySales", async () => {
		try {
			return await Uo.getWeeklySales();
		} catch {
			return [];
		}
	}), n.handle("dashboard:getLowStock", async () => {
		try {
			return await Uo.getLowStockProducts();
		} catch {
			return [];
		}
	}), n.handle("cash:getOpen", async () => {
		try {
			return await Wo.getOpenRegister();
		} catch {
			return null;
		}
	}), n.handle("cash:open", async (e, t) => {
		try {
			return await Wo.openRegister(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("cash:close", async (e, t, n) => {
		try {
			return await Wo.closeRegister(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("auth:login", async (e, t, n) => {
		try {
			return await Z.login(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error de autenticación"
			};
		}
	}), n.handle("clients:getAll", async () => {
		try {
			return await ie.getAllClients();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener clientes"
			};
		}
	}), n.handle("clients:create", async (e, t, n) => {
		try {
			return await ie.createClient(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear cliente"
			};
		}
	}), n.handle("products:getAll", async () => {
		try {
			return await no.getAllProducts();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener productos"
			};
		}
	}), n.handle("products:create", async (e, t, n) => {
		try {
			return await no.createProduct(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear producto"
			};
		}
	}), n.handle("products:addStock", async (e, t, n, r) => {
		try {
			return await no.addInitialStock(t, n, r);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al añadir stock"
			};
		}
	}), n.handle("products:delete", async (e, t) => {
		try {
			return await w.product.delete({ where: { id: t } }), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("sales:getAll", async () => {
		try {
			return await ro.getAllSales();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener ventas"
			};
		}
	}), n.handle("sales:getDetails", async (e, t) => {
		try {
			return await ro.getSaleDetails(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener detalles de venta"
			};
		}
	}), n.handle("sales:register", async (e, t, n) => {
		try {
			return await ro.registerSale(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al registrar venta"
			};
		}
	}), n.handle("categories:getAll", async () => {
		try {
			return await Go.findAll();
		} catch {
			return [];
		}
	}), n.handle("categories:create", async (e, t) => {
		try {
			return await Go.create(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("categories:delete", async (e, t) => {
		try {
			return await Go.delete(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), n.handle("users:getAll", async () => {
		try {
			return await Ho.getAllUsers();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener usuarios"
			};
		}
	}), n.handle("users:getById", async (e, t) => {
		try {
			return await Ho.getUserById(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener usuario"
			};
		}
	}), n.handle("users:create", async (e, t, n) => {
		try {
			return {
				success: !0,
				user: await Ho.createUser(t, n)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear usuario"
			};
		}
	}), n.handle("users:update", async (e, t, n, r) => {
		try {
			return {
				success: !0,
				user: await Ho.updateUser(t, n, r)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al actualizar usuario"
			};
		}
	}), n.handle("users:delete", async (e, t, n) => {
		try {
			return await Ho.deleteUser(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al eliminar usuario"
			};
		}
	}), n.handle("users:changePassword", async (e, t, n, r) => {
		try {
			return await Ho.changePassword(t, n, r);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al cambiar contraseña"
			};
		}
	});
}
//#endregion
//#region src/main/index.ts
var qo = i.dirname(a(import.meta.url));
process.env.DIST = i.join(qo, "../dist"), process.env.VITE_PUBLIC = t.isPackaged ? process.env.DIST : i.join(process.env.DIST, "../public");
var Jo, Yo = process.env.VITE_DEV_SERVER_URL;
async function Xo() {
	Jo = new e({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: i.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: i.join(qo, "index.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		autoHideMenuBar: !0
	}), Yo ? (Jo.loadURL(Yo), Jo.webContents.openDevTools()) : Jo.loadFile(i.join(process.env.DIST, "index.html"));
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), Jo = null);
}), t.whenReady().then(async () => {
	try {
		await w.$connect(), console.log("✅ Prisma connected to PostgreSQL successfully.");
	} catch (e) {
		console.error("❌ Failed to connect to PostgreSQL:", e);
	}
	Ko(), Xo(), t.on("activate", () => {
		e.getAllWindows().length === 0 && Xo();
	});
});
//#endregion
