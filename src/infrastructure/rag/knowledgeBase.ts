import { readFileSync, readdirSync, existsSync, statSync, appendFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { logger } from '../../shared/logger.js';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  tags: string[];
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
}

export class KnowledgeBase {
  private documents: KnowledgeDocument[] = [];
  private loaded = false;

  async loadFromDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      logger.warn({ dir: dirPath }, '[KnowledgeBase] Directory not found');
      return;
    }

    const files = readdirSync(dirPath).filter(f => extname(f) === '.md');
    this.documents = [];

    for (const file of files) {
      const fullPath = join(dirPath, file);
      const content = readFileSync(fullPath, 'utf-8');
      const parsed = this.parseMarkdown(file, content);
      this.documents.push(...parsed);
    }

    this.loaded = true;
    logger.info({ count: this.documents.length, dir: dirPath }, '[KnowledgeBase] Loaded');
  }

  async loadFromText(id: string, title: string, content: string, tags: string[] = []): Promise<void> {
    this.documents.push({ id, title, content, source: 'inline', tags });
    this.loaded = true;
  }

  private parseMarkdown(filename: string, content: string): KnowledgeDocument[] {
    const docs: KnowledgeDocument[] = [];
    const lines = content.split('\n');
    let currentTitle = filename.replace(/\.md$/, '').replace(/-/g, ' ');
    let currentContent: string[] = [];
    let tags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const h1Match = line.match(/^#\s+(.+)/);
      if (h1Match) {
        if (currentContent.length > 0) {
          docs.push({
            id: `${filename}-${docs.length}`,
            title: currentTitle,
            content: currentContent.join('\n').trim(),
            source: filename,
            tags,
          });
        }
        currentTitle = h1Match[1].trim();
        currentContent = [];
        tags = [];
        continue;
      }

      const tagMatch = line.match(/^tags:\s*(.+)/i);
      if (tagMatch) {
        tags = tagMatch[1].split(',').map(t => t.trim().toLowerCase());
        continue;
      }

      currentContent.push(line);
    }

    if (currentContent.length > 0 || docs.length === 0) {
      docs.push({
        id: `${filename}-${docs.length}`,
        title: currentTitle,
        content: currentContent.join('\n').trim(),
        source: filename,
        tags,
      });
    }

    return docs;
  }

  search(query: string, maxResults = 3): SearchResult[] {
    if (!this.documents.length) return [];

    const queryTerms = this.tokenize(query);
    if (!queryTerms.length) return [];

    const scored = this.documents.map(doc => {
      const docTerms = this.tokenize(`${doc.title} ${doc.content} ${doc.tags.join(' ')}`);
      const score = this.computeSimilarity(queryTerms, docTerms);
      return { document: doc, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).filter(r => r.score > 0);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-záéíóúüñ0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private computeSimilarity(queryTerms: string[], docTerms: string[]): number {
    if (!queryTerms.length || !docTerms.length) return 0;

    const querySet = new Set(queryTerms);
    const docFreq = new Map<string, number>();

    for (const term of docTerms) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }

    const totalDocs = this.documents.length;
    let score = 0;

    for (const term of querySet) {
      if (docFreq.has(term)) {
        const tf = docFreq.get(term)! / docTerms.length;
        const df = this.documents.filter(d =>
          this.tokenize(`${d.title} ${d.content}`).includes(term),
        ).length;
        const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
        score += tf * idf;
      }
    }

    return score;
  }

  getAll(): KnowledgeDocument[] {
    return [...this.documents];
  }

  addQA(query: string, answer: string, sourceFile?: string): void {
    const id = `qa-${Date.now()}-${this.documents.length}`;
    this.documents.push({
      id,
      title: query,
      content: answer,
      source: 'user_feedback',
      tags: ['feedback', 'qa'],
    });

    if (sourceFile) {
      try {
        const dir = dirname(sourceFile);
        if (!existsSync(dir)) {
          const { mkdirSync } = require('node:fs');
          mkdirSync(dir, { recursive: true });
        }
        const entry = `\n## ${query}\ntags: feedback, qa\n\n${answer}\n`;
        appendFileSync(sourceFile, entry, 'utf-8');
      } catch {
        // silent
      }
    }
  }

  getStats(): { count: number; loaded: boolean } {
    return { count: this.documents.length, loaded: this.loaded };
  }
}
