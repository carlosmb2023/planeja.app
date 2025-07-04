import CryptoJS from 'crypto-js';

/**
 * Sistema de Criptografia Client-Side
 * Garante que dados sensíveis nunca sejam visíveis no servidor
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private userKey: string | null = null;

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Deriva uma chave única baseada no email e senha do usuário
   * Esta chave nunca é enviada ao servidor
   */
  deriveUserKey(email: string, password: string): string {
    // Combina email e senha para criar uma chave única
    const salt = `planeja-${email}-secure-salt`;
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();
    
    this.userKey = key;
    return key;
  }

  /**
   * Criptografa dados sensíveis antes de enviar ao servidor
   */
  encrypt(data: any): string {
    if (!this.userKey) {
      throw new Error('Chave de criptografia não configurada');
    }

    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.userKey).toString();
  }

  /**
   * Descriptografa dados recebidos do servidor
   */
  decrypt(encryptedData: string): any {
    if (!this.userKey) {
      throw new Error('Chave de criptografia não configurada');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.userKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia - verifique suas credenciais');
    }
  }

  /**
   * Criptografa campos específicos de um objeto
   * Útil para criptografar apenas dados sensíveis
   */
  encryptFields(obj: any, fieldsToEncrypt: string[]): any {
    const result = { ...obj };
    
    fieldsToEncrypt.forEach(field => {
      if (result[field] !== undefined) {
        result[field] = this.encrypt(result[field]);
      }
    });
    
    return result;
  }

  /**
   * Descriptografa campos específicos de um objeto
   */
  decryptFields(obj: any, fieldsToDecrypt: string[]): any {
    const result = { ...obj };
    
    fieldsToDecrypt.forEach(field => {
      if (result[field] !== undefined && result[field] !== null) {
        try {
          result[field] = this.decrypt(result[field]);
        } catch (error) {
          console.error(`Erro ao descriptografar campo ${field}:`, error);
        }
      }
    });
    
    return result;
  }

  /**
   * Limpa a chave da memória (importante para logout)
   */
  clearKey(): void {
    this.userKey = null;
  }

  /**
   * Verifica se a chave está configurada
   */
  hasKey(): boolean {
    return this.userKey !== null;
  }
}

export const encryptionService = EncryptionService.getInstance();

// Campos que devem ser criptografados em cada entidade
export const ENCRYPTED_FIELDS = {
  transactions: ['description', 'amount'],
  documents: ['name', 'url', 'notes'],
  assets: ['name', 'value', 'description'],
  retirementGoals: ['targetMonthlyIncome', 'currentMonthlyContribution'],
  insurances: ['insurer', 'policyNumber', 'coverage', 'premium', 'description']
};