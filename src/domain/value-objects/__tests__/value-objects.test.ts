import { describe, it, expect } from 'vitest';
import { Money } from '../Money.js';
import { SKU } from '../SKU.js';
import { DNI } from '../DNI.js';
import { RUC } from '../RUC.js';
import { TaxRate } from '../TaxRate.js';
import { Quantity } from '../Quantity.js';
import { Email } from '../Email.js';
import { Phone } from '../Phone.js';
import { Percentage } from '../Percentage.js';

// ─── Money ───
describe('Money', () => {
  it('creates from number', () => {
    const m = Money.create(10.5);
    expect(m.value).toBe(10.5);
    expect(m.cents).toBe(1050);
  });

  it('creates zero', () => {
    const m = Money.zero();
    expect(m.value).toBe(0);
  });

  it('creates from cents', () => {
    const m = Money.fromCents(1999);
    expect(m.value).toBe(19.99);
  });

  it('rounds to 2 decimal places', () => {
    const m = Money.create(10.999);
    expect(m.value).toBe(11);
    expect(m.cents).toBe(1100);
  });

  it('adds two Money values', () => {
    const a = Money.create(10);
    const b = Money.create(5);
    const result = a.add(b);
    expect(result.value).toBe(15);
  });

  it('subtracts', () => {
    const a = Money.create(10);
    const b = Money.create(3);
    expect(a.subtract(b).value).toBe(7);
  });

  it('throws on subtract larger', () => {
    const a = Money.create(3);
    const b = Money.create(10);
    expect(() => a.subtract(b)).toThrow('Cannot subtract a larger amount');
  });

  it('multiplies', () => {
    const m = Money.create(10);
    expect(m.multiply(3).value).toBe(30);
  });

  it('multiplies with fraction', () => {
    const m = Money.create(10);
    expect(m.multiply(0.1).value).toBe(1);
  });

  it('equals', () => {
    expect(Money.create(5).equals(Money.create(5))).toBe(true);
    expect(Money.create(5).equals(Money.create(3))).toBe(false);
  });

  it('isGreaterThan / isLessThan', () => {
    expect(Money.create(10).isGreaterThan(Money.create(5))).toBe(true);
    expect(Money.create(5).isLessThan(Money.create(10))).toBe(true);
  });

  it('toString formats correctly', () => {
    expect(Money.create(10.5).toString()).toBe('10.50');
    expect(Money.create(0).toString()).toBe('0.00');
  });

  it('rejects negative values', () => {
    expect(() => Money.create(-5)).toThrow('Money amount cannot be negative');
  });

  it('rejects NaN', () => {
    expect(() => Money.create(NaN)).toThrow('Money amount must be a finite number');
  });

  it('rejects Infinity', () => {
    expect(() => Money.create(Infinity)).toThrow('Money amount must be a finite number');
  });
});

// ─── SKU ───
describe('SKU', () => {
  it('creates valid SKU', () => {
    const sku = SKU.create('PROD-001');
    expect(sku.value).toBe('PROD-001');
  });

  it('trims whitespace', () => {
    const sku = SKU.create('  PROD-001  ');
    expect(sku.value).toBe('PROD-001');
  });

  it('rejects empty', () => {
    expect(() => SKU.create('')).toThrow('SKU cannot be empty');
    expect(() => SKU.create('   ')).toThrow('SKU cannot be empty');
  });

  it('rejects too long', () => {
    expect(() => SKU.create('A'.repeat(51))).toThrow('SKU cannot exceed 50 characters');
  });
});

// ─── DNI ───
describe('DNI', () => {
  it('creates valid DNI', () => {
    const dni = DNI.create('12345678');
    expect(dni.value).toBe('12345678');
  });

  it('rejects non-8-digit', () => {
    expect(() => DNI.create('1234567')).toThrow('DNI must be exactly 8 digits');
    expect(() => DNI.create('123456789')).toThrow('DNI must be exactly 8 digits');
    expect(() => DNI.create('abcdefgh')).toThrow('DNI must be exactly 8 digits');
    expect(() => DNI.create('')).toThrow('DNI must be exactly 8 digits');
  });
});

// ─── RUC ───
describe('RUC', () => {
  it('creates valid RUC', () => {
    const ruc = RUC.create('20123456789');
    expect(ruc.value).toBe('20123456789');
  });

  it('rejects non-11-digit', () => {
    expect(() => RUC.create('1234567890')).toThrow('RUC must be exactly 11 digits');
    expect(() => RUC.create('123456789012')).toThrow('RUC must be exactly 11 digits');
    expect(() => RUC.create('abcdefghijk')).toThrow('RUC must be exactly 11 digits');
    expect(() => RUC.create('')).toThrow('RUC must be exactly 11 digits');
  });
});

// ─── Quantity ───
describe('Quantity', () => {
  it('creates valid quantity', () => {
    const q = Quantity.create(5);
    expect(q.value).toBe(5);
  });

  it('creates zero', () => {
    expect(Quantity.create(0).isZero()).toBe(true);
  });

  it('adds', () => {
    expect(Quantity.create(3).add(Quantity.create(4)).value).toBe(7);
  });

  it('subtracts', () => {
    expect(Quantity.create(10).subtract(Quantity.create(3)).value).toBe(7);
  });

  it('throws on subtract larger', () => {
    expect(() => Quantity.create(3).subtract(Quantity.create(10))).toThrow(
      'Cannot subtract a larger quantity',
    );
  });

  it('isGreaterThan', () => {
    expect(Quantity.create(5).isGreaterThan(Quantity.create(3))).toBe(true);
    expect(Quantity.create(3).isGreaterThan(Quantity.create(5))).toBe(false);
  });

  it('rejects negative', () => {
    expect(() => Quantity.create(-1)).toThrow('Quantity cannot be negative');
  });

  it('rejects float', () => {
    expect(() => Quantity.create(1.5)).toThrow('Quantity must be an integer');
  });
});

// ─── TaxRate ───
describe('TaxRate', () => {
  it('creates valid rate', () => {
    const rate = TaxRate.create(18);
    expect(rate.rate).toBe(18);
    expect(rate.decimal).toBe(0.18);
  });

  it('creates 0%', () => {
    expect(TaxRate.create(0).decimal).toBe(0);
  });

  it('creates 100%', () => {
    expect(TaxRate.create(100).decimal).toBe(1);
  });

  it('applies tax to Money', () => {
    const rate = TaxRate.create(18);
    const amount = Money.create(100);
    const tax = rate.apply(amount);
    expect(tax.value).toBe(18);
  });

  it('calculates total with tax', () => {
    const rate = TaxRate.create(18);
    const amount = Money.create(100);
    expect(rate.totalWithTax(amount).value).toBe(118);
  });

  it('rejects negative', () => {
    expect(() => TaxRate.create(-1)).toThrow('Tax rate must be between 0 and 100');
  });

  it('rejects over 100', () => {
    expect(() => TaxRate.create(101)).toThrow('Tax rate must be between 0 and 100');
  });
});

// ─── Email ───
describe('Email', () => {
  it('creates valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('lowercases', () => {
    const email = Email.create('Test@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('trims whitespace', () => {
    const email = Email.create('  test@example.com  ');
    expect(email.value).toBe('test@example.com');
  });

  it('rejects empty', () => {
    expect(() => Email.create('')).toThrow('Email cannot be empty');
  });

  it('rejects invalid format', () => {
    expect(() => Email.create('not-an-email')).toThrow('Invalid email format');
    expect(() => Email.create('@domain.com')).toThrow('Invalid email format');
    expect(() => Email.create('user@')).toThrow('Invalid email format');
  });
});

// ─── Phone ───
describe('Phone', () => {
  it('creates valid phone', () => {
    const phone = Phone.create('987654321');
    expect(phone.value).toBe('987654321');
  });

  it('rejects non-9-digit', () => {
    expect(() => Phone.create('12345678')).toThrow('Phone must be exactly 9 digits');
    expect(() => Phone.create('1234567890')).toThrow('Phone must be exactly 9 digits');
    expect(() => Phone.create('abcdefghi')).toThrow('Phone must be exactly 9 digits');
  });
});

// ─── Percentage ───
describe('Percentage', () => {
  it('creates valid percentage', () => {
    const pct = Percentage.create(25);
    expect(pct.value).toBe(25);
    expect(pct.decimal).toBe(0.25);
  });

  it('calculates of number', () => {
    expect(Percentage.create(20).of(100)).toBe(20);
  });

  it('applies to Money', () => {
    const pct = Percentage.create(15);
    const amount = Money.create(200);
    const result = pct.apply(amount);
    expect(result.value).toBe(30);
  });

  it('adds to Money', () => {
    const pct = Percentage.create(15);
    const amount = Money.create(200);
    expect(pct.addTo(amount).value).toBe(230);
  });

  it('subtracts from Money', () => {
    const pct = Percentage.create(15);
    const amount = Money.create(200);
    expect(pct.subtractFrom(amount).value).toBe(170);
  });

  it('rejects negative', () => {
    expect(() => Percentage.create(-1)).toThrow('Percentage must be between 0 and 100');
  });

  it('rejects over 100', () => {
    expect(() => Percentage.create(101)).toThrow('Percentage must be between 0 and 100');
  });
});
