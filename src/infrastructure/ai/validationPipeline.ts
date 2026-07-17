import { ReviewQueue } from './ReviewQueue.js';
import { AiAuditService } from './AiAuditService.js';

export class ValidationPipeline {
  constructor(
    private readonly reviewQueue: ReviewQueue,
    private readonly auditService: AiAuditService,
  ) {}

  async enqueueDraft(draft: { id: string; type: string; payload: Record<string, unknown> }): Promise<void> {
    this.reviewQueue.enqueue({
      draftId: draft.id,
      status: 'pending',
      type: draft.type,
      payload: draft.payload,
      createdAt: new Date(),
    });
  }

  async approveDraft(draftId: string, by?: string): Promise<boolean> {
    const item = this.reviewQueue.approve(draftId, by);
    if (!item) return false;

    await this.auditService.logDecision({
      draftId,
      action: 'APPROVE',
      reviewedBy: by,
      confidence: 0.9,
      timestamp: new Date(),
    });

    return true;
  }

  async rejectDraft(draftId: string, reason?: string, by?: string): Promise<boolean> {
    const item = this.reviewQueue.reject(draftId, reason, by);
    if (!item) return false;

    await this.auditService.logDecision({
      draftId,
      action: 'REJECT',
      reason,
      reviewedBy: by,
      confidence: 0.9,
      timestamp: new Date(),
    });

    return true;
  }

  async getPendingDrafts(types?: string[]) {
    return this.reviewQueue.listPending(types);
  }

  getReviewQueue(): ReviewQueue {
    return this.reviewQueue;
  }

  getAuditService(): AiAuditService {
    return this.auditService;
  }
}
