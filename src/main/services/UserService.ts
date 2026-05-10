import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/ports/IUserRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { CreateUserDTO, UpdateUserDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError, ValidationError } from '../../shared/errors.js';

export class UserService {
  constructor(
    private userRepo: IUserRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllUsers() {
    try {
      return await this.userRepo.findAll();
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw new Error('Error al obtener usuarios');
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.userRepo.findById(id);
      if (!user) throw new NotFoundError('Usuario');
      return user;
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Usuario');
      throw error;
    }
  }

  async createUser(data: CreateUserDTO & { password: string }, createdBy: number) {
    try {
      const exists = await this.userRepo.exists(data.username);
      if (exists) throw new ConflictError(`El usuario '${data.username}' ya existe`);

      if (data.password.length < 6) throw new ValidationError('La contraseña debe tener al menos 6 caracteres');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const user = await this.userRepo.create({
        username: data.username,
        password_hash: hashedPassword,
        role: data.role,
      });

      await this.auditLogRepo.create({
        userId: createdBy,
        action: 'CREATE_USER',
        entity: 'users',
        entity_id: user.id,
      });

      return user;
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.code === 'P2002') throw new ConflictError('El nombre de usuario ya está en uso');
      throw error;
    }
  }

  async updateUser(id: number, data: UpdateUserDTO, updatedBy: number) {
    try {
      if (data.username) {
        const exists = await this.userRepo.exists(data.username, id);
        if (exists) throw new ConflictError(`El usuario '${data.username}' ya existe`);
      }

      const user = await this.userRepo.update(id, data);

      await this.auditLogRepo.create({
        userId: updatedBy,
        action: 'UPDATE_USER',
        entity: 'users',
        entity_id: id,
      });

      return user;
    } catch (error: any) {
      console.error('Update user error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Usuario');
      throw error;
    }
  }

  async deleteUser(id: number, deletedBy: number) {
    try {
      const user = await this.userRepo.findById(id);
      if (!user) throw new NotFoundError('Usuario');

      if (id === deletedBy) throw new BusinessRuleError('No puedes eliminar tu propio usuario');

      await this.userRepo.delete(id);

      await this.auditLogRepo.create({
        userId: deletedBy,
        action: 'DELETE_USER',
        entity: 'users',
        entity_id: id,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Delete user error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Usuario');
      throw error;
    }
  }

  async changePassword(userId: number, newPassword: string, changedBy: number) {
    try {
      if (newPassword.length < 6) throw new ValidationError('La contraseña debe tener al menos 6 caracteres');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.userRepo.update(userId, { password_hash: hashedPassword });

      await this.auditLogRepo.create({
        userId: changedBy,
        action: 'CHANGE_PASSWORD',
        entity: 'users',
        entity_id: userId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Usuario');
      throw error;
    }
  }
}
