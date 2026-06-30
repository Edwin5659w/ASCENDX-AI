import crypto from 'crypto';

export function generateReferralCode(name: string): string {
  const prefix = name
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(2, 'X');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}
