import { t as logger } from "./logger-BsWMrnsx.js";
import { i as Preprocessor, r as DEFAULT_MODEL_CONFIG, t as loadModelFromFileSystem } from "./tfjsIO-BYN4OC05.js";
import { t as INDEX_TO_INTENT } from "./types-CW-fkx8v.js";
import * as tf from "@tensorflow/tfjs";
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
