import { ValidationError } from '../../shared/errors.js';

export class Money {
  private readonly _cents: number;

  private constructor(cents: number) {
    this._cents = cents;
  }

  static create(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new ValidationError('Money amount must be a finite number');
    }
    if (amount < 0) {
      throw new ValidationError('Money amount cannot be negative');
    }
    return new Money(Math.round(amount * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new ValidationError('Cents must be an integer');
    }
    if (cents < 0) {
      throw new ValidationError('Cents cannot be negative');
    }
    return new Money(cents);
  }

  get value(): number {
    return this._cents / 100;
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    return new Money(this._cents + other._cents);
  }

  subtract(other: Money): Money {
    if (other._cents > this._cents) {
      throw new ValidationError('Cannot subtract a larger amount');
    }
    return new Money(this._cents - other._cents);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new ValidationError('Multiplication factor cannot be negative');
    }
    return new Money(Math.round(this._cents * factor));
  }

  equals(other: Money): boolean {
    return this._cents === other._cents;
  }

  isGreaterThan(other: Money): boolean {
    return this._cents > other._cents;
  }

  isLessThan(other: Money): boolean {
    return this._cents < other._cents;
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  toNumber(): number {
    return this.value;
  }
}
