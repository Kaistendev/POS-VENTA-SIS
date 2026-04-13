import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { prisma } from '../prisma/client.js';

export class UserService {
  /**
   * Get all users (without password hashes)
   */
  static async getAllUsers() {
    try {
      return await UserRepository.findAll();
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw new Error('Error al obtener usuarios');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      return user;
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      
      throw new Error('Error al obtener usuario');
    }
  }

  /**
   * Create a new user
   */
  static async createUser(data: { username: string; password: string; role: string }, createdBy: number) {
    try {
      // Check if username already exists
      const exists = await UserRepository.exists(data.username);
      if (exists) {
        throw new Error(`El usuario '${data.username}' ya existe`);
      }

      // Validate password
      if (data.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      // Create the user
      const user = await UserRepository.create({
        username: data.username,
        password_hash: hashedPassword,
        role: data.role,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: createdBy,
          action: 'CREATE_USER',
          entity: 'users',
          entity_id: user.id,
        },
      });

      return user;
    } catch (error: any) {
      console.error('Create user error:', error);
      
      if (error.code === 'P2002') {
        throw new Error('El nombre de usuario ya está en uso');
      }
      
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(
    id: number,
    data: { username?: string; role?: string },
    updatedBy: number,
  ) {
    try {
      // Check if username is being changed and if it's already taken
      if (data.username) {
        const exists = await UserRepository.exists(data.username, id);
        if (exists) {
          throw new Error(`El usuario '${data.username}' ya existe`);
        }
      }

      // Update the user
      const user = await UserRepository.update(id, data);

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: updatedBy,
          action: 'UPDATE_USER',
          entity: 'users',
          entity_id: id,
        },
      });

      return user;
    } catch (error: any) {
      console.error('Update user error:', error);
      
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number, deletedBy: number) {
    try {
      // Check if user exists
      const user = await UserRepository.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Prevent deleting yourself
      if (id === deletedBy) {
        throw new Error('No puedes eliminar tu propio usuario');
      }

      // Delete the user
      await UserRepository.delete(id);

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: deletedBy,
          action: 'DELETE_USER',
          entity: 'users',
          entity_id: id,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Delete user error:', error);
      
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: number,
    newPassword: string,
    changedBy: number,
  ) {
    try {
      // Validate password
      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the user
      await UserRepository.update(userId, { password_hash: hashedPassword });

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: changedBy,
          action: 'CHANGE_PASSWORD',
          entity: 'users',
          entity_id: userId,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      
      throw error;
    }
  }
}
