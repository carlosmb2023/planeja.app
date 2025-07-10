/**
 * Utilitários para 2FA (Two-Factor Authentication)
 * 
 * Funções para gerar e verificar tokens TOTP
 */

import crypto from 'crypto';

/**
 * Gera um secret aleatório para 2FA
 */
export function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return secret;
}

/**
 * Gera URL para QR Code do Google Authenticator
 */
export function generateQRCodeURL(userEmail: string, issuer: string, secret: string): string {
  const encodedEmail = encodeURIComponent(userEmail);
  const encodedIssuer = encodeURIComponent(issuer);
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;
}

/**
 * Verifica um token TOTP
 */
export function verifyToken(secret: string, token: string): boolean {
  const window = 1; // Permitir 1 janela de tempo para frente e para trás (30s cada)
  const currentTime = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -window; i <= window; i++) {
    const timeStep = currentTime + i;
    const expectedToken = generateTOTP(secret, timeStep);
    
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gera um token TOTP para um time step específico
 */
function generateTOTP(secret: string, timeStep: number): string {
  // Converter secret de base32 para buffer
  const key = base32ToBuffer(secret);
  
  // Converter time step para buffer de 8 bytes
  const time = Buffer.alloc(8);
  time.writeUInt32BE(Math.floor(timeStep / 4294967296), 0);
  time.writeUInt32BE(timeStep & 0xffffffff, 4);
  
  // Gerar HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(time);
  const hash = hmac.digest();
  
  // Truncamento dinâmico
  const offset = hash[19] & 0x0f;
  const truncated = hash.readUInt32BE(offset) & 0x7fffffff;
  
  // Gerar código de 6 dígitos
  const code = (truncated % 1000000).toString().padStart(6, '0');
  
  return code;
}

/**
 * Converte string base32 para buffer
 */
function base32ToBuffer(base32: string): Buffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  // Converter cada caractere para bits
  for (const char of base32) {
    const index = chars.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  // Converter bits para bytes
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return Buffer.from(bytes);
}

/**
 * Gera token TOTP atual
 */
export function generateCurrentToken(secret: string): string {
  const currentTime = Math.floor(Date.now() / 1000 / 30);
  return generateTOTP(secret, currentTime);
}
