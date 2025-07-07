/**
 * Sistema de Autenticação 2FA (Two-Factor Authentication)
 * 
 * Implementa autenticação de dois fatores usando TOTP (Time-based One-Time Password)
 */

import { generateSecret, generateQRCodeURL, verifyToken } from './2fa-utils';

export interface TwoFactorAuth {
  id: number;
  userId: number;
  secret: string; // Criptografado
  isEnabled: boolean;
  backupCodes: string[]; // Códigos de backup criptografados
  lastUsed: Date | null;
  createdAt: Date;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

class TwoFactorService {
  /**
   * Inicia a configuração do 2FA para um usuário
   */
  static async setupTwoFactor(userId: number, userEmail: string): Promise<TwoFactorSetup> {
    // Gerar secret único
    const secret = generateSecret();
    
    // Gerar URL do QR Code
    const qrCodeUrl = generateQRCodeURL(userEmail, 'Planeja', secret);
    
    // Gerar códigos de backup
    const backupCodes = this.generateBackupCodes();
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Confirma e ativa o 2FA
   */
  static async confirmTwoFactor(
    userId: number, 
    secret: string, 
    token: string,
    backupCodes: string[]
  ): Promise<boolean> {
    // Verificar se o token está correto
    const isValid = verifyToken(secret, token);
    
    if (!isValid) {
      return false;
    }

    // Salvar configuração no banco (seria implementado com storage)
    // await storage.saveTwoFactorConfig(userId, secret, backupCodes);
    
    return true;
  }

  /**
   * Verifica token 2FA durante login
   */
  static async verifyTwoFactor(userId: number, token: string): Promise<boolean> {
    // Buscar configuração do usuário (seria implementado com storage)
    // const config = await storage.getTwoFactorConfig(userId);
    
    // Por enquanto, simular verificação
    const mockSecret = 'JBSWY3DPEHPK3PXP'; // Em produção, vem do banco
    
    // Verificar se é um código de backup
    if (token.length === 8 && /^[A-Z0-9]{8}$/.test(token)) {
      return this.verifyBackupCode(userId, token);
    }
    
    // Verificar TOTP normal
    return verifyToken(mockSecret, token);
  }

  /**
   * Verifica código de backup
   */
  static async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    // Buscar códigos de backup do usuário
    // const backupCodes = await storage.getBackupCodes(userId);
    
    // Verificar se o código existe e ainda não foi usado
    // if (backupCodes.includes(code)) {
    //   await storage.markBackupCodeAsUsed(userId, code);
    //   return true;
    // }
    
    return false;
  }

  /**
   * Desabilita 2FA para um usuário
   */
  static async disableTwoFactor(userId: number, password: string): Promise<boolean> {
    // Verificar senha atual do usuário
    // const user = await storage.getUser(userId);
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // if (!isPasswordValid) {
    //   return false;
    // }

    // Remover configuração 2FA
    // await storage.removeTwoFactorConfig(userId);
    
    return true;
  }

  /**
   * Gera novos códigos de backup
   */
  static async regenerateBackupCodes(userId: number): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    
    // Salvar novos códigos
    // await storage.updateBackupCodes(userId, newCodes);
    
    return newCodes;
  }

  /**
   * Gera códigos de backup aleatórios
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Verifica se o usuário tem 2FA ativado
   */
  static async hasTwoFactorEnabled(userId: number): Promise<boolean> {
    // Verificar no banco se o usuário tem 2FA ativo
    // const config = await storage.getTwoFactorConfig(userId);
    // return config?.isEnabled || false;
    
    return false; // Por enquanto, desabilitado
  }
}

export { TwoFactorService };
