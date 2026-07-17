import { t as logger } from "./logger-BsWMrnsx.js";
import { n as INTENT_LABELS } from "./types-CW-fkx8v.js";
import { t as ResponseCache } from "./responseCache-CFqxAldB.js";
//#region src/infrastructure/ai/prompts.ts
var SYSTEM_PROMPT = `Eres un asistente experto en sistemas POS (punto de venta) y gestión de inventario, ventas, clientes y reportes.

REGLAS:
- Respondes SOLO sobre temas del sistema POS: productos, ventas, clientes, proveedores, inventario, reportes.
- Si la pregunta no está relacionada con el sistema POS, responde educadamente que solo puedes ayudar con funciones del sistema.
- Usa los documentos de contexto (FAQ) que se te proporcionen para dar respuestas precisas.
- Tus respuestas son cortas, directas y en español.
- No inventes datos ni funcionalidades que no existan en el sistema.
- Si no sabes la respuesta, indícalo claramente.

FORMATO DE RESPUESTA:
- Usa **negritas** para resaltar números, nombres de productos y montos.
- Usa • para listas.
- Separa secciones con líneas en blanco.
- Siempre incluye la unidad monetaria S/ para montos.

EJEMPLOS DE RESPUESTA CORRECTA:
- "📊 **Resumen de ventas - Hoy**\n• Ingresos: S/ 1200.50\n• Transacciones: 15\n• Ganancia: S/ 350.25"
- "🥇 **María García** es el cliente que más compró: 8 compras, S/ 487.25 total"
- "📦 **32 productos** en inventario. El más caro: **Cerveza IPA** a S/ 22.00"`;
//#endregion
//#region src/infrastructure/neural/orchestrator/ambiguityDetector.ts
var DEFAULT_AMBIGUITY_CONFIG = {
	marginThreshold: .15,
	llmNullThreshold: 2
};
var AmbiguityDetector = class {
	config;
	constructor(config) {
		this.config = {
			...DEFAULT_AMBIGUITY_CONFIG,
			...config
		};
	}
	analyzeProbabilities(probabilities) {
		const indexed = probabilities.map((p, i) => ({
			confidence: p,
			index: i
		})).sort((a, b) => b.confidence - a.confidence);
		const top = indexed[0];
		const next = indexed[1];
		const topIntent = INTENT_LABELS[top.index] ?? "general";
		const nextIntent = next ? INTENT_LABELS[next.index] ?? null : null;
		const margin = top.confidence - (next?.confidence ?? 0);
		const isAmbiguous = margin < this.config.marginThreshold;
		logger.debug({
			topIntent,
			topConfidence: top.confidence.toFixed(4),
			nextIntent,
			margin: margin.toFixed(4),
			isAmbiguous
		}, "[Ambiguity] Analysis");
		return {
			isAmbiguous,
			ambiguityScore: parseFloat(Math.max(0, 1 - margin).toFixed(4)),
			topIntent,
			topConfidence: top.confidence,
			nextBestIntent: nextIntent,
			nextBestConfidence: next?.confidence ?? 0,
			margin: parseFloat(margin.toFixed(4))
		};
	}
};
//#endregion
//#region src/infrastructure/neural/orchestrator/decisionLogger.ts
var DecisionLogger = class {
	history = [];
	maxSize;
	constructor(maxSize = 1e3) {
		this.maxSize = maxSize;
	}
	log(record) {
		this.history.push(record);
		if (this.history.length > this.maxSize) this.history.shift();
		logger[record.source === "error" ? "warn" : "info"]({
			source: record.source,
			intent: record.intent,
			confidence: parseFloat(record.confidence.toFixed(4)),
			latencyMs: parseFloat(record.latencyMs.toFixed(2)),
			ambiguous: record.ambiguous,
			ragUsed: record.ragUsed,
			fallbackUsed: record.fallbackUsed,
			error: record.error
		}, `[Decision] ${record.source} → ${record.intent} (${(record.confidence * 100).toFixed(1)}%)`);
	}
	getStats() {
		const total = this.history.length;
		if (total === 0) return {
			totalQueries: 0,
			cacheHits: 0,
			neuralCount: 0,
			llmCount: 0,
			errorCount: 0,
			ambiguousCount: 0,
			ragUsedCount: 0,
			fallbackCount: 0,
			cacheHitRate: 0,
			neuralRatio: 0,
			llmRatio: 0,
			ambiguityRate: 0,
			avgLatencyMs: 0,
			sourceDistribution: {},
			intentDistribution: {},
			recentQueries: 0
		};
		const cacheHits = this.history.filter((r) => r.source === "cache").length;
		const neuralCount = this.history.filter((r) => r.source === "neural").length;
		const llmCount = this.history.filter((r) => r.source === "llm").length;
		const errorCount = this.history.filter((r) => r.source === "error").length;
		const ambiguousCount = this.history.filter((r) => r.ambiguous).length;
		const ragUsedCount = this.history.filter((r) => r.ragUsed).length;
		const fallbackCount = this.history.filter((r) => r.fallbackUsed).length;
		const totalLatency = this.history.reduce((sum, r) => sum + r.latencyMs, 0);
		const sourceDistribution = {};
		const intentDistribution = {};
		for (const r of this.history) {
			sourceDistribution[r.source] = (sourceDistribution[r.source] ?? 0) + 1;
			intentDistribution[r.intent] = (intentDistribution[r.intent] ?? 0) + 1;
		}
		return {
			totalQueries: total,
			cacheHits,
			neuralCount,
			llmCount,
			errorCount,
			ambiguousCount,
			ragUsedCount,
			fallbackCount,
			cacheHitRate: parseFloat((cacheHits / total * 100).toFixed(1)),
			neuralRatio: parseFloat((neuralCount / total * 100).toFixed(1)),
			llmRatio: parseFloat((llmCount / total * 100).toFixed(1)),
			ambiguityRate: parseFloat((ambiguousCount / total * 100).toFixed(1)),
			avgLatencyMs: parseFloat((totalLatency / total).toFixed(2)),
			sourceDistribution,
			intentDistribution,
			recentQueries: this.history.length
		};
	}
	getHistory(limit = 50) {
		return this.history.slice(-limit);
	}
	getRecentBySource(source, limit = 10) {
		return this.history.filter((r) => r.source === source).slice(-limit);
	}
	clear() {
		this.history = [];
		logger.info("[DecisionLogger] History cleared");
	}
};
//#endregion
//#region src/infrastructure/neural/orchestrator/unifiedQueryService.ts
var DEFAULT_UNIFIED_CONFIG = {
	confidenceThreshold: .7,
	useRag: true,
	llmFallback: true,
	cacheResponses: true,
	cacheTtlMs: 300 * 1e3,
	cacheMaxSize: 100,
	llmTimeoutMs: 3e4,
	ambiguityMargin: .15
};
var UnifiedQueryService = class {
	orchestrator;
	llm;
	rag;
	cache;
	config;
	ambiguityDetector;
	decisionLogger;
	constructor(orchestrator, llm, rag, cache, config, decisionLogger) {
		this.orchestrator = orchestrator;
		this.llm = llm;
		this.rag = rag;
		this.cache = cache ?? new ResponseCache();
		this.config = {
			...DEFAULT_UNIFIED_CONFIG,
			...config
		};
		this.ambiguityDetector = new AmbiguityDetector({ marginThreshold: this.config.ambiguityMargin });
		this.decisionLogger = decisionLogger ?? new DecisionLogger();
	}
	async query(input) {
		const startTime = performance.now();
		const cached = this.checkCache(input);
		if (cached) {
			const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
			const result = {
				...cached,
				latencyMs
			};
			this.logDecision(input, result);
			return result;
		}
		const classification = await this.classify(input);
		const ambiguity = this.ambiguityDetector.analyzeProbabilities(classification.allProbabilities);
		const response = await this.generateResponse(input, classification, ambiguity);
		const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
		const result = {
			intent: response.source === "llm" ? classification.intent : classification.intent,
			confidence: classification.confidence,
			response: response.text,
			source: response.source,
			latencyMs,
			ragUsed: response.ragUsed,
			fallbackUsed: response.fallbackUsed,
			ambiguous: ambiguity.isAmbiguous,
			ambiguityScore: ambiguity.ambiguityScore
		};
		if (this.config.cacheResponses && result.source !== "error") this.cache.set(input, JSON.stringify(result));
		this.logDecision(input, result);
		return result;
	}
	async classify(input) {
		const result = await this.orchestrator.classify(input);
		return {
			...result,
			allProbabilities: result.allProbabilities ?? []
		};
	}
	async generateResponse(input, classification, ambiguity) {
		if (classification.confidence >= this.config.confidenceThreshold && !ambiguity.isAmbiguous) return {
			text: this.buildNeuralResponse(input, classification.intent),
			source: "neural",
			ragUsed: false,
			fallbackUsed: false
		};
		if (!this.config.llmFallback) return {
			text: this.buildNeuralResponse(input, classification.intent),
			source: "neural",
			ragUsed: false,
			fallbackUsed: false
		};
		let ragContext = "";
		if (this.config.useRag) ragContext = (await this.rag.retrieve(input)).context;
		try {
			return {
				text: await this.llm.generateWithContext(input, SYSTEM_PROMPT, ragContext || void 0),
				source: "llm",
				ragUsed: ragContext.length > 0,
				fallbackUsed: false
			};
		} catch (error) {
			logger.error({
				err: error,
				input
			}, "[UnifiedQuery] LLM failed, using fallback");
			return {
				text: this.buildNeuralFallbackResponse(ambiguity),
				source: "error",
				ragUsed: ragContext.length > 0,
				fallbackUsed: true
			};
		}
	}
	buildNeuralResponse(input, intent) {
		switch (intent) {
			case "product_query": return "Consultando información de productos...";
			case "entity_count": return "Consultando cantidades en el sistema...";
			case "entity_creation": return "Preparando formulario de creación...";
			case "data_modification": return "Preparando modificación de datos...";
			case "data_deletion": return "Preparando eliminación de datos...";
			case "sale_draft": return "Preparando borrador de venta...";
			case "sales_summary": return "Consultando resumen de ventas...";
			case "general": return "Procesando tu consulta...";
			default: return "Procesando tu solicitud...";
		}
	}
	buildNeuralFallbackResponse(ambiguity) {
		if (ambiguity.isAmbiguous) return "No estoy seguro de lo que necesitas. ¿Podrías ser más específico? Por ejemplo: \"precio del arroz\", \"cuantos productos hay\", o \"crea un cliente nuevo\".";
		return "El asistente IA no está disponible en este momento. Intenta de nuevo más tarde.";
	}
	checkCache(input) {
		if (!this.config.cacheResponses) return null;
		const cached = this.cache.get(input);
		if (cached !== null) try {
			return {
				...JSON.parse(cached),
				source: "cache"
			};
		} catch {
			this.cache.invalidate(input);
		}
		return null;
	}
	logDecision(query, result) {
		this.decisionLogger.log({
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			query: query.slice(0, 200),
			source: result.source,
			intent: result.intent,
			confidence: result.confidence,
			latencyMs: result.latencyMs,
			ragUsed: result.ragUsed,
			fallbackUsed: result.fallbackUsed,
			ambiguous: result.ambiguous,
			ambiguityScore: result.ambiguityScore,
			error: result.source === "error" ? "LLM unavailable" : void 0
		});
	}
	getDecisionLogger() {
		return this.decisionLogger;
	}
	getStats() {
		return {
			decisionStats: this.decisionLogger.getStats(),
			orchestratorStats: this.orchestrator.getStats(),
			llmStats: this.llm.getStats(),
			ragStats: this.rag.getStats(),
			config: this.config
		};
	}
	dispose() {
		this.orchestrator.dispose();
		this.cache.clear();
	}
};
//#endregion
export { UnifiedQueryService };
