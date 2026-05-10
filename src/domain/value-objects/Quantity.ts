import { ValidationError } from '../../shared/errors.js';

export class Quantity {
  private constructor(private readonly _value: number) {}

  static create(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new ValidationError('Quantity must be an integer');
    }
    if (value < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }
    return new Quantity(value);
  }

  get value(): number {
    return this._value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this._value + other._value);
  }

  subtract(other: Quantity): Quantity {
    if (other._value > this._value) {
      throw new ValidationError('Cannot subtract a larger quantity');
    }
    return new Quantity(this._value - other._value);
  }

  isZero(): boolean {
    return this._value === 0;
  }

  isGreaterThan(other: Quantity): boolean {
    return this._value > other._value;
  }

  equals(other: Quantity): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }

  toNumber(): number {
    return this._value;
  }
}
