import { randomBytes, createHash } from 'crypto';

// A random 32-byte token has far more entropy than bcrypt needs — SHA-256 (fast,
// deterministic) is the right hash here, not bcrypt (slow, salted, meant for low-entropy
// secrets like passwords). We only ever store the hash; the raw token goes out in an email
// link and is never persisted.
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
