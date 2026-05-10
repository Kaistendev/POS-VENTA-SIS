import { ValidationError } from '../../shared/errors.js';

const DNI_REGEX = /^\d{8}$/;

export class DNI {
  private constructor(private readonly _value: string) {}

  static create(value: string): DNI {
    const trimmed = value.trim();
    if (!DNI_REGEX.test(trimmed)) {
      throw new ValidationError('DNI must be exactly 8 digits');
    }
    return new DNI(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: DNI): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
