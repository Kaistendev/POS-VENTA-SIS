import { CreateAiTrainingLogDTO, AiTrainingLogDTO, AiTrainingLogFilterDTO } from '../dtos.js';

export interface IAiTrainingLogRepository {
  create(data: CreateAiTrainingLogDTO): Promise<AiTrainingLogDTO>;
  findById(id: string): Promise<AiTrainingLogDTO | null>;
  findAll(filter?: AiTrainingLogFilterDTO): Promise<AiTrainingLogDTO[]>;
  countByIntentSince(intent: string, since: Date): Promise<number>;
  getLatestByUser(usuario_id: number, limit?: number): Promise<AiTrainingLogDTO[]>;
}
