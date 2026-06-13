import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { IUserRepository } from '../../domain/ports/IUserRepository.js';
import { User } from '../../domain/models.js';
import { CreateUserDTO } from '../../domain/dtos.js';
import { checkRateLimit, recordFailure, resetRateLimit } from '../auth/rateLimiter.js';
import { validatePassword } from '../../shared/validation.js';
import { logger } from '../../shared/logger.js';

const recoveryTokens = new Map<string, { username: string; expiresAt: number }>();

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  remainingAttempts?: number;
  locked?: boolean;
  lockoutRemainingMs?: number;
}

export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  async getSecurityQuestion(username: string): Promise<{ success: boolean; question?: string; error?: string }> {
    try {
      const user = await this.userRepo.findByUsername(username);
      if (!user || !user.security_question) {
        return { success: false, error: 'Usuario no encontrado o no tiene pregunta de seguridad configurada' };
      }
      return { success: true, question: user.security_question };
    } catch (error: any) {
      logger.error({ err: error }, 'Get security question error');
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async verifySecurityAnswer(username: string, answer: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const user = await this.userRepo.findByUsername(username);
      if (!user || !user.security_answer_hash) {
        return { success: false, error: 'Usuario no encontrado o no tiene pregunta de seguridad configurada' };
      }

      const isMatch = await bcrypt.compare(answer.toLowerCase().trim(), user.security_answer_hash);
      if (!isMatch) {
        return { success: false, error: 'Respuesta incorrecta' };
      }

      const token = crypto.randomUUID();
      recoveryTokens.set(token, { username, expiresAt: Date.now() + 10 * 60 * 1000 });

      return { success: true, token };
    } catch (error: any) {
      logger.error({ err: error }, 'Verify security answer error');
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const session = recoveryTokens.get(token);
    if (!session || session.expiresAt < Date.now()) {
      recoveryTokens.delete(token);
      return { success: false, error: 'Token inválido o expirado' };
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return { success: false, error: pwCheck.error };
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await this.userRepo.updateByUsername(session.username, { password_hash: hashedPassword });
      recoveryTokens.delete(token);
      return { success: true };
    } catch (error: any) {
      logger.error({ err: error }, 'Reset password error');
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async setSecurityQuestion(userId: number, question: string, answer: string): Promise<{ success: boolean; error?: string }> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedAnswer = await bcrypt.hash(answer.toLowerCase().trim(), salt);
      await this.userRepo.update(userId, {
        security_question: question,
        security_answer_hash: hashedAnswer,
      });
      return { success: true };
    } catch (error: any) {
      logger.error({ err: error }, 'Set security question error');
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const rateCheck = checkRateLimit(username);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.lockoutRemainingMs / 60000);
      return {
        success: false,
        error: `Demasiados intentos. Bloqueado por ${minutes} minuto${minutes > 1 ? 's' : ''}`,
        remainingAttempts: 0,
        locked: true,
        lockoutRemainingMs: rateCheck.lockoutRemainingMs,
      };
    }

    try {
      const user = await this.userRepo.findByUsername(username);

      if (!user) {
        recordFailure(username);
        return { success: false, error: 'Usuario no encontrado', remainingAttempts: rateCheck.remainingAttempts - 1 };
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        recordFailure(username);
        const remaining = rateCheck.remainingAttempts - 1;
        return {
          success: false,
          error: remaining > 0 ? `Contraseña incorrecta. Intentos restantes: ${remaining}` : 'Contraseña incorrecta',
          remainingAttempts: remaining,
        };
      }

      resetRateLimit(username);

      const { password_hash: _, ...userWithoutPassword } = user;

      return { success: true, user: userWithoutPassword };
    } catch (error: any) {
      logger.error({ err: error }, 'Login error');
      if (error.code === 'P2025') {
        recordFailure(username);
        return { success: false, error: 'Usuario no encontrado', remainingAttempts: 0 };
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async register(userData: CreateUserDTO & { password: string; security_question?: string; security_answer?: string }) {
    try {
      const exists = await this.userRepo.exists(userData.username);
      if (exists) return { success: false, error: `El usuario '${userData.username}' ya existe` };

      const pwCheck = validatePassword(userData.password);
      if (!pwCheck.valid) {
        return { success: false, error: pwCheck.error };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      let security_answer_hash: string | undefined;
      if (userData.security_question && userData.security_answer) {
        const answerSalt = await bcrypt.genSalt(10);
        security_answer_hash = await bcrypt.hash(userData.security_answer.toLowerCase().trim(), answerSalt);
      }

      const user = await this.userRepo.create({
        username: userData.username,
        password_hash: hashedPassword,
        role: userData.role,
        security_question: userData.security_question || null,
        security_answer_hash: security_answer_hash || null,
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
      logger.error({ err: error }, 'Register error');
      if (error.code === 'P2002') return { success: false, error: 'El nombre de usuario ya está en uso' };
      return { success: false, error: 'Error interno del servidor: ' + (error.message || String(error)) };
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    try {
      const user = await this.userRepo.findByIdWithPassword(userId);
      if (!user) return { success: false, error: 'Usuario no encontrado' };

      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) return { success: false, error: 'Contraseña actual incorrecta' };

      const pwCheck = validatePassword(newPassword);
      if (!pwCheck.valid) {
        return { success: false, error: pwCheck.error };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.userRepo.update(userId, { password_hash: hashedPassword });

      return { success: true };
    } catch (error: any) {
      logger.error({ err: error }, 'Change password error');
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
