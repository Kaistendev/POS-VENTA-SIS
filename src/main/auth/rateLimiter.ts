const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const store = new Map<string, AttemptRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  locked: boolean;
  lockoutRemainingMs: number;
}

function getRecord(key: string): AttemptRecord {
  let record = store.get(key);
  if (!record) {
    record = { count: 0, firstAttempt: Date.now() };
    store.set(key, record);
  }
  return record;
}

export function checkRateLimit(key: string): RateLimitResult {
  const record = getRecord(key);
  const elapsed = Date.now() - record.firstAttempt;

  if (record.count >= MAX_ATTEMPTS) {
    if (elapsed < LOCKOUT_MS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        locked: true,
        lockoutRemainingMs: LOCKOUT_MS - elapsed,
      };
    }
    record.count = 0;
    record.firstAttempt = Date.now();
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    locked: false,
    lockoutRemainingMs: 0,
  };
}

export function recordFailure(key: string): void {
  const record = getRecord(key);
  record.count += 1;
  if (record.count === 1) {
    record.firstAttempt = Date.now();
  }
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
