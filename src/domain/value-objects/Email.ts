import { ValidationError } from '../../shared/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) {
      throw new ValidationError('Email cannot be empty');
    }
    if (trimmed.length > 254) {
      throw new ValidationError('Email cannot exceed 254 characters');
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
