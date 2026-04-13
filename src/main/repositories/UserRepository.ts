import { prisma } from '../prisma/client.js';

export interface UserCreateData {
  username: string;
  password_hash: string;
  role: string;
}

export interface UserUpdateData {
  username?: string;
  password_hash?: string;
  role?: string;
}

export class UserRepository {
  /**
   * Find all users (without password hash)
   */
  static async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Find user by ID (without password hash)
   */
  static async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /**
   * Find user by username (with password hash for authentication)
   */
  static async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Create a new user
   */
  static async create(data: UserCreateData) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /**
   * Update an existing user
   */
  static async update(id: number, data: UserUpdateData) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /**
   * Delete a user by ID
   */
  static async delete(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Check if username exists
   */
  static async exists(username: string, excludeId?: number) {
    const user = await prisma.user.findFirst({
      where: {
        username,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Count total users
   */
  static async count() {
    return prisma.user.count();
  }
}
