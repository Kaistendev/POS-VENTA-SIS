export interface ReviewQueueItem {
  draftId: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

export class ReviewQueue {
  private items: ReviewQueueItem[] = [];

  enqueue(draft: ReviewQueueItem): void {
    this.items.push(draft);
  }

  dequeue(draftId: string): ReviewQueueItem | undefined {
    const idx = this.items.findIndex(i => i.draftId === draftId);
    if (idx === -1) return undefined;
    return this.items.splice(idx, 1)[0];
  }

  peek(draftId: string): ReviewQueueItem | undefined {
    return this.items.find(i => i.draftId === draftId);
  }

  listPending(types?: string[]): ReviewQueueItem[] {
    return this.items.filter(i => i.status === 'pending' && (!types || types.includes(i.type)));
  }

  approve(draftId: string, by?: string): ReviewQueueItem | undefined {
    const item = this.items.find(i => i.draftId === draftId);
    if (!item) return undefined;
    item.status = 'approved';
    item.reviewedAt = new Date();
    item.reviewedBy = by;
    return item;
  }

  reject(draftId: string, reason?: string, by?: string): ReviewQueueItem | undefined {
    const item = this.items.find(i => i.draftId === draftId);
    if (!item) return undefined;
    item.status = 'rejected';
    item.reviewedAt = new Date();
    item.reviewedBy = by;
    item.reason = reason;
    return item;
  }

  getPending(): ReviewQueueItem[] {
    return this.items.filter(i => i.status === 'pending');
  }

  getHistory(limit?: number): ReviewQueueItem[] {
    const processed = this.items.filter(i => i.status !== 'pending');
    return limit ? processed.slice(0, limit) : processed;
  }

  size(): number {
    return this.items.length;
  }
}
