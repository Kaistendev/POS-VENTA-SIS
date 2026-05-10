import { ValidationError } from '../../shared/errors.js';

const RUC_REGEX = /^\d{11}$/;

export class RUC {
  private constructor(private readonly _value: string) {}

  static create(value: string): RUC {
    const trimmed = value.trim();
    if (!RUC_REGEX.test(trimmed)) {
      throw new ValidationError('RUC must be exactly 11 digits');
    }
    return new RUC(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: RUC): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
