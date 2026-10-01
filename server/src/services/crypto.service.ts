import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * AES-256-GCM encryption for sold-account credentials at rest.
 * Ciphertext format: v1:<iv-hex>:<auth-tag-hex>:<ciphertext-hex>
 *
 * Legacy rows stored as plaintext are readable verbatim (decryptSecret returns
 * the input unchanged when it doesn't carry the v1: prefix) so the migration
 * script can re-encrypt them without a coordinated cutover.
 */

const PREFIX = 'v1';

const getKey = (): Buffer => {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured — cannot encrypt/decrypt credentials.');
  }
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
};

export const isEncryptionConfigured = (): boolean => Boolean(env.ENCRYPTION_KEY);

export const encryptSecret = (plain: string): string => {
  if (!env.ENCRYPTION_KEY) {
    // Dev without a key: store as-is rather than failing admin imports.
    console.warn('[Crypto] ENCRYPTION_KEY missing — storing credential UNENCRYPTED.');
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
};

export const decryptSecret = (payload: string | null | undefined): string => {
  if (!payload) return '';
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    // Legacy plaintext row (pre-migration) or plaintext stored without a key.
    return payload;
  }
  const [, ivHex, tagHex, ctHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8');
};
