import { ValidationError } from '../../shared/errors.js';
import { Money } from './Money.js';

export class Percentage {
  private constructor(private readonly _value: number) {}

  static create(value: number): Percentage {
    if (!Number.isFinite(value)) {
      throw new ValidationError('Percentage must be a finite number');
    }
    if (value < 0 || value > 100) {
      throw new ValidationError('Percentage must be between 0 and 100');
    }
    return new Percentage(value);
  }

  get value(): number {
    return this._value;
  }

  get decimal(): number {
    return this._value / 100;
  }

  of(amount: number): number {
    return (amount * this._value) / 100;
  }

  apply(amount: Money): Money {
    const result = Math.round(amount.cents * this.decimal);
    return Money.fromCents(result);
  }

  addTo(amount: Money): Money {
    const part = this.apply(amount);
    return amount.add(part);
  }

  subtractFrom(amount: Money): Money {
    const part = this.apply(amount);
    return amount.subtract(part);
  }

  equals(other: Percentage): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return `${this._value}%`;
  }

  toNumber(): number {
    return this._value;
  }
}
