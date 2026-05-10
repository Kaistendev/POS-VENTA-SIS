import { AuditLogEntryDTO } from '../dtos.js';

export interface IAuditLogRepository {
  create(entry: AuditLogEntryDTO): Promise<void>;
}
