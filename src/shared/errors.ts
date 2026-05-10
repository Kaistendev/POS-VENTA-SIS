export type DomainErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'BUSINESS_RULE';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}

export class NotFoundError extends DomainError {
  readonly code: DomainErrorCode = 'NOT_FOUND';

  constructor(entity: string, id?: number | string) {
    super(id ? `${entity} no encontrado (${id})` : `${entity} no encontrado`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  readonly code: DomainErrorCode = 'VALIDATION';
  readonly errors: string[];

  constructor(message: string, errors?: string[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors || [];
  }
}

export class ConflictError extends DomainError {
  readonly code: DomainErrorCode = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class BusinessRuleError extends DomainError {
  readonly code: DomainErrorCode = 'BUSINESS_RULE';

  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

