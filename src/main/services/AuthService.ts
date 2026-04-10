import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { User } from '../../common/types.js';

export class AuthService {
  /**
   * Intenta iniciar sesión comparando el hash de la base de datos
   */
  static async login(username: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password_hash'>; error?: string }> {
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
        user: userWithoutPassword
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Registra un nuevo usuario hasheando su contraseña
   */
  static async register(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password_hash, salt);

    return UserRepository.create({
      ...userData,
      password_hash: hashedPassword
    });
  }
}
