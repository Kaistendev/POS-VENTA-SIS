import { ValidationError } from '../../shared/errors.js';

const PHONE_REGEX = /^\d{9}$/;

export class Phone {
  private constructor(private readonly _value: string) {}

  static create(value: string): Phone {
    const trimmed = value.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      throw new ValidationError('Phone must be exactly 9 digits');
    }
    return new Phone(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
