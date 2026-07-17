import type { PrismaClient } from '@prisma/client';
import { IAiTrainingLogRepository } from '../../domain/ports/IAiTrainingLogRepository.js';
import { CreateAiTrainingLogDTO, AiTrainingLogDTO, AiTrainingLogFilterDTO } from '../../domain/dtos.js';

export class PrismaAiTrainingLogRepository implements IAiTrainingLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAiTrainingLogDTO): Promise<AiTrainingLogDTO> {
    const record = await this.prisma.aiTrainingLog.create({
      data: {
        usuario_id: data.usuario_id,
        mensaje_usuario: data.mensaje_usuario,
        nlu_output: data.nlu_output ?? null,
        respuesta_sistema: data.respuesta_sistema ?? null,
      },
    });
    return this.mapToDTO(record);
  }

  async findById(id: string): Promise<AiTrainingLogDTO | null> {
    const record = await this.prisma.aiTrainingLog.findUnique({ where: { id } });
    return record ? this.mapToDTO(record) : null;
  }

  async findAll(filter?: AiTrainingLogFilterDTO): Promise<AiTrainingLogDTO[]> {
    const records = await this.prisma.aiTrainingLog.findMany({
      where: {
        usuario_id: filter?.usuario_id,
        created_at: {
          gte: filter?.startDate,
          lte: filter?.endDate,
        },
      },
      orderBy: { created_at: 'desc' },
      take: filter?.limit ?? 100,
    });
    return records.map(r => this.mapToDTO(r));
  }

  async countByIntentSince(intent: string, since: Date): Promise<number> {
    const logs = await this.prisma.aiTrainingLog.findMany({
      where: {
        nlu_output: { not: null },
        created_at: { gte: since },
      },
      select: { nlu_output: true },
    });
    const intentPattern = `"intent":"${intent}"`;
    return logs.filter(l => l.nlu_output?.includes(intentPattern)).length;
  }

  async getLatestByUser(usuario_id: number, limit = 20): Promise<AiTrainingLogDTO[]> {
    const records = await this.prisma.aiTrainingLog.findMany({
      where: { usuario_id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return records.map(r => this.mapToDTO(r));
  }

  private mapToDTO(record: {
    id: string;
    usuario_id: number;
    mensaje_usuario: string;
    nlu_output: string | null;
    respuesta_sistema: string | null;
    created_at: Date;
  }): AiTrainingLogDTO {
    return {
      id: record.id,
      usuario_id: record.usuario_id,
      mensaje_usuario: record.mensaje_usuario,
      nlu_output: record.nlu_output,
      respuesta_sistema: record.respuesta_sistema,
      created_at: record.created_at,
    };
  }
}
