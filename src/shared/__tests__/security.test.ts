import { describe, it, expect } from 'vitest';
import { validatePassword } from '../../common/validation.js';
import { isPathWithin } from '../../main/utils/pathValidation.js';
import path from 'path';

describe('Password validation', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('Ab1!').valid).toBe(false);
    expect(validatePassword('Ab1!xyz').valid).toBe(false);
  });

  it('rejects passwords without uppercase', () => {
    expect(validatePassword('abcdef1!@').valid).toBe(false);
  });

  it('rejects passwords without lowercase', () => {
    expect(validatePassword('ABCDEF1!@').valid).toBe(false);
  });

  it('rejects passwords without numbers', () => {
    expect(validatePassword('Abcdefgh!@').valid).toBe(false);
  });

  it('rejects passwords without special characters', () => {
    expect(validatePassword('Abcdefgh1').valid).toBe(false);
  });

  it('accepts valid passwords', () => {
    expect(validatePassword('Secure1!@').valid).toBe(true);
    expect(validatePassword('MyStr0ng#Pass').valid).toBe(true);
    expect(validatePassword('P@ssw0rdX').valid).toBe(true);
  });
});

describe('Path validation', () => {
  const base = path.resolve('/app/backups');

  it('allows paths within the base directory', () => {
    expect(isPathWithin(base, path.join(base, 'backup-1.gz'))).toBe(true);
  });

  it('rejects paths outside the base directory', () => {
    expect(isPathWithin(base, '/etc/passwd')).toBe(false);
    expect(isPathWithin(base, path.join(base, '..', 'malicious'))).toBe(false);
  });

  it('rejects paths with traversal sequences outside base', () => {
    expect(isPathWithin(base, '/app/backups-safe/../etc/passwd')).toBe(false);
  });
});

describe('Rate limiter logic', () => {
  it('records failures and blocks after threshold', async () => {
    const { checkRateLimit, recordFailure, resetRateLimit } = await import('../../main/auth/rateLimiter.js');
    const key = `test-user-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      const before = checkRateLimit(key);
      expect(before.allowed).toBe(true);
      expect(before.locked).toBe(false);
      recordFailure(key);
    }

    const after = checkRateLimit(key);
    expect(after.allowed).toBe(false);
    expect(after.locked).toBe(true);
    expect(after.remainingAttempts).toBe(0);
    expect(after.lockoutRemainingMs).toBeGreaterThan(0);

    resetRateLimit(key);
    const reset = checkRateLimit(key);
    expect(reset.allowed).toBe(true);
  });
});
