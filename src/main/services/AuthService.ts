import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/ports/IUserRepository.js';
import { User } from '../../domain/models.js';
import { CreateUserDTO } from '../../domain/dtos.js';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const user = await this.userRepo.findByUsername(username);

      if (!user) return { success: false, error: 'Usuario no encontrado' };

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) return { success: false, error: 'Contraseña incorrecta' };

      const { password_hash: _, ...userWithoutPassword } = user;

      return { success: true, user: userWithoutPassword };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'P2025') return { success: false, error: 'Usuario no encontrado' };
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async register(userData: CreateUserDTO & { password: string }) {
    try {
      const exists = await this.userRepo.exists(userData.username);
      if (exists) return { success: false, error: `El usuario '${userData.username}' ya existe` };

      if (userData.password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = await this.userRepo.create({
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
      if (error.code === 'P2002') return { success: false, error: 'El nombre de usuario ya está en uso' };
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    try {
      const user = await this.userRepo.findByIdWithPassword(userId);
      if (!user) return { success: false, error: 'Usuario no encontrado' };

      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) return { success: false, error: 'Contraseña actual incorrecta' };

      if (newPassword.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.userRepo.update(userId, { password_hash: hashedPassword });

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
