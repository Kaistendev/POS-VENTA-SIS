import { t as logger } from "./logger-BsWMrnsx.js";
import { t as INDEX_TO_INTENT } from "./types-DKStI1XG.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as tf from "@tensorflow/tfjs";
//#region src/infrastructure/neural/pipeline/tokenizer.ts
var SPANISH_STOP_WORDS = /* @__PURE__ */ new Set([
	"un",
	"una",
	"unas",
	"unos",
	"uno",
	"el",
	"la",
	"los",
	"las",
	"de",
	"del",
	"en",
	"con",
	"por",
	"para",
	"y",
	"e",
	"o",
	"a",
	"su",
	"que",
	"es",
	"se",
	"no",
	"lo",
	"como",
	"más",
	"mas",
	"pero",
	"sus",
	"le",
	"ya",
	"este",
	"entre",
	"porque",
	"cuando",
	"muy",
	"sin",
	"sobre",
	"también",
	"tambien",
	"me",
	"mi",
	"tu",
	"te",
	"si",
	"nos",
	"les",
	"hay",
	"cual",
	"cuales",
	"dime",
	"busca",
	"encuentra",
	"saber",
	"puedes",
	"podrias",
	"quiero",
	"necesito",
	"está",
	"esta",
	"estas",
	"están",
	"estan",
	"todo",
	"toda",
	"todos",
	"todas",
	"algo",
	"nada",
	"siempre",
	"nunca"
]);
var ACCENT_MAP = {
	"á": "a",
	"é": "e",
	"í": "i",
	"ó": "o",
	"ú": "u",
	"ü": "u",
	"ñ": "ñ",
	"Á": "A",
	"É": "E",
	"Í": "I",
	"Ó": "O",
	"Ú": "U",
	"Ü": "U",
	"Ñ": "Ñ"
};
var PUNCTUATION_REGEX = /[¿?¡!.,;:()\-"'«»]/g;
var NON_ALPHA_REGEX = /[^a-záéíóúüña-z0-9\s]/g;
var Tokenizer = class {
	options;
	constructor(options = {}) {
		this.options = {
			lowercase: options.lowercase ?? true,
			stripAccents: options.stripAccents ?? true,
			removeStopWords: options.removeStopWords ?? true,
			removePunctuation: options.removePunctuation ?? true,
			minTokenLength: options.minTokenLength ?? 2
		};
	}
	clean(text) {
		let result = text;
		if (this.options.removePunctuation) result = result.replace(PUNCTUATION_REGEX, " ");
		if (this.options.lowercase) result = result.toLowerCase();
		if (this.options.stripAccents) result = result.replace(/[áéíóúüñ]/g, (ch) => ACCENT_MAP[ch] || ch);
		result = result.replace(NON_ALPHA_REGEX, " ");
		result = result.replace(/\s+/g, " ").trim();
		return result;
	}
	tokenize(text) {
		const tokens = this.clean(text).split(/\s+/).filter((t) => t.length >= this.options.minTokenLength);
		if (this.options.removeStopWords) return tokens.filter((t) => !SPANISH_STOP_WORDS.has(t));
		return tokens;
	}
	tokenizeWithPositions(text) {
		const cleaned = this.clean(text);
		const regex = /\S+/g;
		const result = [];
		let match;
		while ((match = regex.exec(cleaned)) !== null) {
			const token = match[0].toLowerCase();
			if (this.options.removeStopWords && SPANISH_STOP_WORDS.has(token)) continue;
			if (token.length < this.options.minTokenLength) continue;
			result.push({
				token,
				start: match.index,
				end: match.index + token.length
			});
		}
		return result;
	}
};
//#endregion
//#region src/infrastructure/neural/pipeline/preprocessor.ts
var Preprocessor = class {
	tokenizer;
	constructor() {
		this.tokenizer = new Tokenizer({
			lowercase: true,
			stripAccents: true,
			removeStopWords: true,
			removePunctuation: true,
			minTokenLength: 2
		});
	}
	tokenizeExample(example) {
		return {
			...example,
			tokens: this.tokenizer.tokenize(example.query)
		};
	}
	tokenizeBatch(examples) {
		return examples.map((ex) => this.tokenizeExample(ex));
	}
	buildVocabulary(examples, minFrequency = 1, maxSize = 5e3) {
		const frequency = {};
		for (const ex of examples) {
			const tokens = this.tokenizer.tokenize(ex.query);
			for (const token of tokens) frequency[token] = (frequency[token] || 0) + 1;
		}
		const sortedWords = Object.entries(frequency).filter(([_, count]) => count >= minFrequency).sort(([_, a], [__, b]) => b - a).slice(0, maxSize);
		const wordToIndex = {
			"<PAD>": 0,
			"<UNK>": 1,
			"<START>": 2,
			"<END>": 3
		};
		const indexToWord = [
			"<PAD>",
			"<UNK>",
			"<START>",
			"<END>"
		];
		sortedWords.forEach(([word], idx) => {
			wordToIndex[word] = idx + 4;
			indexToWord.push(word);
		});
		return {
			wordToIndex,
			indexToWord,
			size: indexToWord.length
		};
	}
	tokensToIndices(tokens, vocabulary, maxLength) {
		const indices = tokens.map((t) => vocabulary.wordToIndex[t] ?? 1);
		if (indices.length > maxLength) return indices.slice(0, maxLength);
		return [...indices, ...Array(maxLength - indices.length).fill(0)];
	}
	exampleToInputVector(example, vocabulary, maxLength) {
		const tokens = this.tokenizer.tokenize(example.query);
		return this.tokensToIndices(tokens, vocabulary, maxLength);
	}
	batchToInputVectors(examples, vocabulary, maxLength) {
		return examples.map((ex) => this.exampleToInputVector(ex, vocabulary, maxLength));
	}
	batchToOutputVectors(examples, intentIndexMap, numClasses) {
		return examples.map((ex) => {
			const vector = Array(numClasses).fill(0);
			const idx = intentIndexMap[ex.intent];
			if (idx !== void 0) vector[idx] = 1;
			return vector;
		});
	}
};
//#endregion
//#region src/infrastructure/neural/models/index.ts
var DEFAULT_MODEL_CONFIG = {
	inputSize: 5e3,
	embeddingSize: 64,
	hiddenSize: 128,
	numClasses: 8,
	learningRate: .001,
	dropoutRate: .3,
	maxSequenceLength: 50
};
//#endregion
//#region src/infrastructure/neural/models/tfjsIO.ts
async function loadModelFromFileSystem(dir) {
	const modelPath = join(dir, "model.json");
	if (!existsSync(modelPath)) throw new Error(`Model not found at ${dir}`);
	const parsed = JSON.parse(readFileSync(modelPath, "utf-8"));
	const weightSpecsPath = join(dir, "weights_manifest.json");
	const weightSpecs = existsSync(weightSpecsPath) ? JSON.parse(readFileSync(weightSpecsPath, "utf-8")) : parsed.weightsManifest ?? [];
	const chunks = [];
	for (const spec of weightSpecs) {
		const paths = spec.paths ?? [`${spec.name.replace(/\//g, "_")}.bin`];
		for (const weightPath of paths) {
			const fullPath = join(dir, weightPath);
			if (existsSync(fullPath)) {
				const buf = readFileSync(fullPath);
				chunks.push(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
			}
		}
	}
	const totalBytes = chunks.reduce((sum, b) => sum + b.byteLength, 0);
	const weightData = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		weightData.set(new Uint8Array(chunk), offset);
		offset += chunk.byteLength;
	}
	const modelArtifacts = {
		modelTopology: parsed.modelTopology,
		weightSpecs: weightSpecs.map((s) => ({
			name: s.name,
			shape: s.shape,
			dtype: s.dtype ?? "float32"
		})),
		weightData,
		format: "tfjs-layers",
		generatedBy: "pos-venta-sis-nn"
	};
	return tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
}
//#endregion
//#region src/infrastructure/neural/models/IntentClassifierService.ts
var IntentClassifierService = class {
	model = null;
	vocabulary = null;
	config = DEFAULT_MODEL_CONFIG;
	preprocessor;
	isLoaded = false;
	constructor() {
		this.preprocessor = new Preprocessor();
	}
	async loadModel(modelPath) {
		try {
			const { readFileSync, existsSync } = await import("fs");
			const { join } = await import("path");
			const metadataPath = join(modelPath, "metadata.json");
			if (existsSync(metadataPath)) {
				const metadataRaw = readFileSync(metadataPath, "utf-8");
				const metadata = JSON.parse(metadataRaw);
				this.vocabulary = metadata.vocabulary;
				this.config = {
					...DEFAULT_MODEL_CONFIG,
					...metadata.config
				};
			} else logger.warn({ modelPath }, "Metadata not found, using defaults");
			this.model = await loadModelFromFileSystem(modelPath);
			this.isLoaded = true;
			logger.info({
				modelPath,
				vocabSize: this.vocabulary?.size
			}, "Model loaded successfully");
		} catch (error) {
			logger.error({
				err: error,
				modelPath
			}, "Failed to load model");
			this.isLoaded = false;
			throw new Error(`No se pudo cargar el modelo de clasificación: ${error.message}`);
		}
	}
	async loadModelFromUrl(url) {
		this.model = await tf.loadLayersModel(url);
		this.isLoaded = true;
		logger.info({ url }, "Model loaded from URL");
	}
	async predict(input) {
		const startTime = performance.now();
		if (!this.model || !this.vocabulary) throw new Error("Modelo no cargado. Llama a loadModel() primero.");
		const inputVector = this.preprocessor.exampleToInputVector({
			id: "",
			query: input,
			intent: "general"
		}, this.vocabulary, this.config.maxSequenceLength);
		const tensor = tf.tensor2d([inputVector], [1, this.config.maxSequenceLength], "int32");
		const output = this.model.predict(tensor);
		const probs = (await output.array())[0];
		const maxIndex = probs.indexOf(Math.max(...probs));
		const confidence = probs[maxIndex];
		const allProbabilities = {};
		probs.forEach((p, i) => {
			const intentName = INDEX_TO_INTENT[i];
			if (intentName) allProbabilities[intentName] = parseFloat(p.toFixed(4));
		});
		const latencyMs = performance.now() - startTime;
		tf.dispose([tensor, output]);
		return {
			intent: INDEX_TO_INTENT[maxIndex] ?? "general",
			confidence: parseFloat(confidence.toFixed(4)),
			allProbabilities,
			latencyMs: parseFloat(latencyMs.toFixed(2))
		};
	}
	async predictBatch(inputs) {
		const startTime = performance.now();
		if (!this.model || !this.vocabulary) throw new Error("Modelo no cargado. Llama a loadModel() primero.");
		const inputVectors = inputs.map((input) => this.preprocessor.exampleToInputVector({
			id: "",
			query: input,
			intent: "general"
		}, this.vocabulary, this.config.maxSequenceLength));
		const tensor = tf.tensor2d(inputVectors, [inputs.length, this.config.maxSequenceLength], "int32");
		const output = this.model.predict(tensor);
		const probabilities = await output.array();
		const totalLatency = performance.now() - startTime;
		const results = probabilities.map((probs, i) => {
			const maxIndex = probs.indexOf(Math.max(...probs));
			const confidence = probs[maxIndex];
			const allProbabilities = {};
			probs.forEach((p, j) => {
				const intentName = INDEX_TO_INTENT[j];
				if (intentName) allProbabilities[intentName] = parseFloat(p.toFixed(4));
			});
			return {
				intent: INDEX_TO_INTENT[maxIndex] ?? "general",
				confidence: parseFloat(confidence.toFixed(4)),
				allProbabilities,
				latencyMs: parseFloat((totalLatency / inputs.length).toFixed(2))
			};
		});
		tf.dispose([tensor, output]);
		return results;
	}
	getModelInfo() {
		return {
			isLoaded: this.isLoaded,
			inputSize: this.config.inputSize,
			numClasses: this.config.numClasses,
			maxSequenceLength: this.config.maxSequenceLength,
			vocabSize: this.vocabulary?.size ?? 0
		};
	}
	dispose() {
		if (this.model) {
			this.model.dispose();
			this.isLoaded = false;
			this.model = null;
		}
	}
};
//#endregion
export { IntentClassifierService };
