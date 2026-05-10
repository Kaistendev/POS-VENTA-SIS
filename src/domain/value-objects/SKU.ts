import { ValidationError } from '../../shared/errors.js';

export class SKU {
  private constructor(private readonly _value: string) {}

  static create(value: string): SKU {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('SKU cannot be empty');
    }
    if (trimmed.length > 50) {
      throw new ValidationError('SKU cannot exceed 50 characters');
    }
    return new SKU(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: SKU): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
