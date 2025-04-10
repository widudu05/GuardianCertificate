import crypto from 'crypto';

// Encryption key (in production, use a secure environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts text using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY), 
    iv
  );
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts text encrypted with the encrypt function
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}

/**
 * Calculates days until expiration for a certificate
 */
export function daysUntilExpiration(expirationDate: Date): number {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines status based on expiration date
 * @returns 'valid' | 'expiring' | 'expired'
 */
export function getCertificateStatus(expirationDate: Date): string {
  const daysLeft = daysUntilExpiration(expirationDate);
  
  if (daysLeft <= 0) {
    return 'expired';
  } else if (daysLeft <= 30) {
    return 'expiring';
  } else {
    return 'valid';
  }
}

/**
 * Formats a date as DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
