import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { prisma } from '../prisma/client.js';

export interface LoginResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: string;
    created_at: Date;
    updated_at: Date;
  };
  error?: string;
}

export class AuthService {
  /**
   * Intenta iniciar sesión comparando el hash de la base de datos
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    try {
      const user = await UserRepository.findByUsername(username);

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // No devolvemos el hash al frontend por seguridad
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        return { success: false, error: 'Usuario no encontrado' };
      }
      
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Registra un nuevo usuario hasheando su contraseña
   */
  static async register(userData: { username: string; password: string; role: string }) {
    try {
      // Check if username already exists
      const exists = await UserRepository.exists(userData.username);
      if (exists) {
        return {
          success: false,
          error: `El usuario '${userData.username}' ya existe`,
        };
      }

      // Validate password strength
      if (userData.password.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        };
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create the user
      const user = await UserRepository.create({
        username: userData.username,
        password_hash: hashedPassword,
        role: userData.role,
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };
    } catch (error: any) {
      console.error('Register error:', error);

      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'El nombre de usuario ya está en uso',
        };
      }

      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  static async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return { success: false, error: 'Contraseña actual incorrecta' };
      }

      // Validate new password
      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        };
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user
      await UserRepository.update(userId, { password_hash: hashedPassword });

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
