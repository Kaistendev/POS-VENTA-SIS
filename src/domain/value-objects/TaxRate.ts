import { ValidationError } from '../../shared/errors.js';
import { Money } from './Money.js';

export class TaxRate {
  private constructor(private readonly _rate: number) {}

  static create(rate: number): TaxRate {
    if (!Number.isFinite(rate)) {
      throw new ValidationError('Tax rate must be a finite number');
    }
    if (rate < 0 || rate > 100) {
      throw new ValidationError('Tax rate must be between 0 and 100');
    }
    return new TaxRate(rate);
  }

  get rate(): number {
    return this._rate;
  }

  get decimal(): number {
    return this._rate / 100;
  }

  apply(amount: Money): Money {
    const taxAmount = Math.round(amount.cents * this.decimal);
    return Money.fromCents(taxAmount);
  }

  totalWithTax(amount: Money): Money {
    const tax = this.apply(amount);
    return amount.add(tax);
  }

  equals(other: TaxRate): boolean {
    return this._rate === other._rate;
  }

  toString(): string {
    return `${this._rate}%`;
  }

  toNumber(): number {
    return this._rate;
  }
}
