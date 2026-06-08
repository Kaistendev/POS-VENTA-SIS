import type { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../domain/ports/IUserRepository.js';
import { User, UserWithPassword } from '../../domain/models.js';
import { CreateUserDTO, UpdateUserDTO } from '../../domain/dtos.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      select: { id: true, username: true, role: true, created_at: true, updated_at: true },
      orderBy: { created_at: 'desc' },
    }) as unknown as User[];
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, created_at: true, updated_at: true },
    }) as unknown as User | null;
  }

  async findByIdWithPassword(id: number): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { id } }) as unknown as UserWithPassword | null;
  }

  async findByUsername(username: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { username } }) as unknown as UserWithPassword | null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    return this.prisma.user.create({
      data,
      select: { id: true, username: true, role: true, created_at: true, updated_at: true },
    }) as unknown as User;
  }

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { id }, data,
      select: { id: true, username: true, role: true, created_at: true, updated_at: true },
    }) as unknown as User;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async exists(username: string, excludeId?: number): Promise<boolean> {
    const where: any = { username };
    if (excludeId) where.id = { not: excludeId };
    const user = await this.prisma.user.findFirst({ where, select: { id: true } });
    return !!user;
  }

  async updateByUsername(username: string, data: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { username },
      data,
      select: { id: true, username: true, role: true, security_question: true, created_at: true, updated_at: true },
    }) as unknown as User;
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
