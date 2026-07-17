import type { IAiTrainingLogRepository } from '../../domain/ports/IAiTrainingLogRepository.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';

export interface AuditDecision {
  draftId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
  reviewedBy?: string;
  confidence: number;
  timestamp: Date;
}

export class AiAuditService {
  constructor(
    private readonly trainingLogRepo: IAiTrainingLogRepository,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async logDecision(decision: AuditDecision): Promise<void> {
    await this.trainingLogRepo.create({
      usuario_id: Number(decision.reviewedBy) || 1,
      mensaje_usuario: JSON.stringify({ draftId: decision.draftId, action: decision.action }),
      nlu_output: JSON.stringify(decision),
      respuesta_sistema: `Draft ${decision.action.toLowerCase()}d`,
    });

    await this.auditLogRepo.create({
      action: `AI_DRAFT_${decision.action}`,
      entity: 'AI_DRAFT',
      entityId: decision.draftId,
      details: `Draft ${decision.draftId} was ${decision.action.toLowerCase()}ed${decision.reason ? `: ${decision.reason}` : ''}`,
      userId: decision.reviewedBy || 'system',
      createdAt: new Date(),
    });
  }

  async recordDraftConfirmed(type: string, _payload: Record<string, unknown>, userId?: string | number): Promise<void> {
    await this.auditLogRepo.create({
      action: 'AI_DRAFT_CONFIRMED',
      entity: type,
      details: `Draft confirmed by user ${userId ?? 'unknown'}`,
      userId: String(userId ?? 'system'),
      createdAt: new Date(),
    });
  }

  async recordDraftRejected(type: string, userId?: string | number): Promise<void> {
    await this.auditLogRepo.create({
      action: 'AI_DRAFT_REJECTED',
      entity: type,
      details: `Draft rejected by user ${userId ?? 'unknown'}`,
      userId: String(userId ?? 'system'),
      createdAt: new Date(),
    });
  }
}
