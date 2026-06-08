import { getCurrentUser } from './session.js';
import { DomainError } from '../../shared/errors.js';

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED' as const;
  constructor() {
    super('No autenticado');
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN' as const;
  constructor(roles: string[]) {
    super(`Acceso denegado. Se requiere rol: ${roles.join(' o ')}`);
  }
}

/**
 * Wraps an IPC handler to require specific roles.
 * Must be placed BETWEEN the handler function and wrapIpc:
 *
 *   ipcMain.handle("users:create", wrapIpc(requireRole('ADMIN')(data => userService.createUser(data))));
 */
export function requireRole(...roles: string[]) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    const wrapped = (async (...args: any[]) => {
      const user = getCurrentUser();
      if (!user) {
        throw new UnauthorizedError();
      }
      if (!roles.includes(user.role)) {
        throw new ForbiddenError(roles);
      }
      return handler(...args);
    }) as T;
    return wrapped;
  };
}
