import { t as logger } from "./logger-BsWMrnsx.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
//#region src/infrastructure/rag/knowledgeBase.ts
var KnowledgeBase = class {
	documents = [];
	loaded = false;
	async loadFromDirectory(dirPath) {
		if (!existsSync(dirPath)) {
			logger.warn({ dir: dirPath }, "[KnowledgeBase] Directory not found");
			return;
		}
		const files = readdirSync(dirPath).filter((f) => extname(f) === ".md");
		this.documents = [];
		for (const file of files) {
			const content = readFileSync(join(dirPath, file), "utf-8");
			const parsed = this.parseMarkdown(file, content);
			this.documents.push(...parsed);
		}
		this.loaded = true;
		logger.info({
			count: this.documents.length,
			dir: dirPath
		}, "[KnowledgeBase] Loaded");
	}
	async loadFromText(id, title, content, tags = []) {
		this.documents.push({
			id,
			title,
			content,
			source: "inline",
			tags
		});
		this.loaded = true;
	}
	parseMarkdown(filename, content) {
		const docs = [];
		const lines = content.split("\n");
		let currentTitle = filename.replace(/\.md$/, "").replace(/-/g, " ");
		let currentContent = [];
		let tags = [];
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const h1Match = line.match(/^#\s+(.+)/);
			if (h1Match) {
				if (currentContent.length > 0) docs.push({
					id: `${filename}-${docs.length}`,
					title: currentTitle,
					content: currentContent.join("\n").trim(),
					source: filename,
					tags
				});
				currentTitle = h1Match[1].trim();
				currentContent = [];
				tags = [];
				continue;
			}
			const tagMatch = line.match(/^tags:\s*(.+)/i);
			if (tagMatch) {
				tags = tagMatch[1].split(",").map((t) => t.trim().toLowerCase());
				continue;
			}
			currentContent.push(line);
		}
		if (currentContent.length > 0 || docs.length === 0) docs.push({
			id: `${filename}-${docs.length}`,
			title: currentTitle,
			content: currentContent.join("\n").trim(),
			source: filename,
			tags
		});
		return docs;
	}
	search(query, maxResults = 3) {
		if (!this.documents.length) return [];
		const queryTerms = this.tokenize(query);
		if (!queryTerms.length) return [];
		const scored = this.documents.map((doc) => {
			const docTerms = this.tokenize(`${doc.title} ${doc.content} ${doc.tags.join(" ")}`);
			return {
				document: doc,
				score: this.computeSimilarity(queryTerms, docTerms)
			};
		});
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, maxResults).filter((r) => r.score > 0);
	}
	tokenize(text) {
		return text.toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/g, "").split(/\s+/).filter((t) => t.length > 2);
	}
	computeSimilarity(queryTerms, docTerms) {
		if (!queryTerms.length || !docTerms.length) return 0;
		const querySet = new Set(queryTerms);
		const docFreq = /* @__PURE__ */ new Map();
		for (const term of docTerms) docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
		const totalDocs = this.documents.length;
		let score = 0;
		for (const term of querySet) if (docFreq.has(term)) {
			const tf = docFreq.get(term) / docTerms.length;
			const df = this.documents.filter((d) => this.tokenize(`${d.title} ${d.content}`).includes(term)).length;
			const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
			score += tf * idf;
		}
		return score;
	}
	getAll() {
		return [...this.documents];
	}
	getStats() {
		return {
			count: this.documents.length,
			loaded: this.loaded
		};
	}
};
//#endregion
//#region src/infrastructure/rag/ragService.ts
var DEFAULT_RAG_CONFIG = {
	maxResults: 3,
	minScore: .01
};
var RagService = class {
	kb;
	config;
	totalQueries = 0;
	queriesWithResults = 0;
	constructor(knowledgeBase, config) {
		this.kb = knowledgeBase;
		this.config = {
			...DEFAULT_RAG_CONFIG,
			...config
		};
	}
	async retrieve(query) {
		this.totalQueries++;
		const results = this.kb.search(query, this.config.maxResults).filter((r) => r.score >= this.config.minScore);
		if (results.length > 0) this.queriesWithResults++;
		const context = results.length > 0 ? results.map((r) => `[${r.document.title}]: ${r.document.content.slice(0, 500)}`).join("\n\n") : "";
		logger.debug({
			query,
			results: results.length,
			topScore: results[0]?.score ?? 0
		}, "[RAG] Retrieval");
		return {
			results,
			context
		};
	}
	getStats() {
		return {
			documents: this.kb.getStats().count,
			totalQueries: this.totalQueries,
			queriesWithResults: this.queriesWithResults,
			hitRate: this.totalQueries > 0 ? parseFloat((this.queriesWithResults / this.totalQueries * 100).toFixed(1)) : 0,
			config: this.config
		};
	}
};
//#endregion
export { KnowledgeBase, RagService };
