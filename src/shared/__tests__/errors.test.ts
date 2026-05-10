import { describe, it, expect } from 'vitest';
import { NotFoundError, ValidationError, ConflictError, BusinessRuleError } from '../errors.js';

describe('NotFoundError', () => {
  it('should create error with entity name', () => {
    const error = new NotFoundError('Product');
    expect(error.message).toBe('Product no encontrado');
    expect(error.name).toBe('NotFoundError');
  });

  it('should create error with entity name and id', () => {
    const error = new NotFoundError('Product', 42);
    expect(error.message).toBe('Product no encontrado (42)');
  });
});

describe('ValidationError', () => {
  it('should create error with message and errors array', () => {
    const error = new ValidationError('Datos inválidos', ['El campo nombre es obligatorio']);
    expect(error.message).toBe('Datos inválidos');
    expect(error.errors).toHaveLength(1);
    expect(error.name).toBe('ValidationError');
  });
});

describe('ConflictError', () => {
  it('should create conflict error', () => {
    const error = new ConflictError('El SKU ya existe');
    expect(error.message).toBe('El SKU ya existe');
    expect(error.name).toBe('ConflictError');
  });
});

describe('BusinessRuleError', () => {
  it('should create business rule error', () => {
    const error = new BusinessRuleError('Stock insuficiente');
    expect(error.message).toBe('Stock insuficiente');
    expect(error.name).toBe('BusinessRuleError');
  });
});
