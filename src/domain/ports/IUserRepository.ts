import { User, UserWithPassword } from '../models.js';
import { CreateUserDTO, UpdateUserDTO } from '../dtos.js';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByIdWithPassword(id: number): Promise<UserWithPassword | null>;
  findByUsername(username: string): Promise<UserWithPassword | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: number, data: UpdateUserDTO): Promise<User>;
  updateByUsername(username: string, data: UpdateUserDTO): Promise<User>;
  delete(id: number): Promise<void>;
  exists(username: string, excludeId?: number): Promise<boolean>;
  count(): Promise<number>;
  updateLoginAttempts(username: string, failed_attempts: number, locked_until: Date | null): Promise<void>;
  resetLoginAttempts(username: string): Promise<void>;
}
