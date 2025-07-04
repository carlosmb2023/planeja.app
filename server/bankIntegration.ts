/**
 * Sistema de Integração Bancária - Open Banking
 * 
 * Este módulo gerencia as integrações com APIs bancárias seguindo
 * os padrões do Open Banking Brasil
 */

export interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'investment';
  accountNumber: string;
  agency: string;
  balance: number;
  currency: string;
  lastSync: Date;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  date: Date;
  category?: string;
  merchantName?: string;
  transactionCode: string;
  balanceAfter: number;
}

export interface BankConnection {
  id: string;
  bankCode: string;
  bankName: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  consentId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: Date;
  permissions: string[];
  lastSync: Date;
}

export interface OpenBankingConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationServer: string;
  resourceServer: string;
}

export class BankIntegrationService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: OpenBankingConfig) {
    this.baseUrl = config.resourceServer;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  /**
   * Inicia o processo de consentimento com um banco
   */
  async initiateConsent(bankCode: string, permissions: string[]): Promise<string> {
    const consentData = {
      data: {
        permissions,
        expirationDateTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        transactionFromDateTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano atrás
        transactionToDateTime: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/consents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getClientCredentialsToken()}`,
          'x-fapi-interaction-id': this.generateInteractionId()
        },
        body: JSON.stringify(consentData)
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar consentimento: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.consentId;
    } catch (error) {
      console.error('Erro ao iniciar consentimento:', error);
      throw error;
    }
  }

  /**
   * Obtém token de acesso usando Client Credentials
   */
  private async getClientCredentialsToken(): Promise<string> {
    const tokenData = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'accounts consents'
    });

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: tokenData
    });

    if (!response.ok) {
      throw new Error('Erro ao obter token de acesso');
    }

    const result = await response.json();
    return result.access_token;
  }

  /**
   * Troca código de autorização por token de acesso
   */
  async exchangeCodeForToken(code: string, consentId: string): Promise<BankConnection> {
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://seu-app.com/callback',
      client_id: this.clientId
    });

    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: tokenData
      });

      if (!response.ok) {
        throw new Error('Erro ao trocar código por token');
      }

      const tokenResult = await response.json();

      return {
        id: this.generateId(),
        bankCode: '001', // Código do banco
        bankName: 'Banco do Brasil', // Nome do banco
        status: 'connected',
        consentId,
        accessToken: tokenResult.access_token,
        refreshToken: tokenResult.refresh_token,
        expiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
        permissions: ['ACCOUNTS_READ', 'ACCOUNTS_BALANCES_READ', 'RESOURCES_READ'],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Erro ao trocar código por token:', error);
      throw error;
    }
  }

  /**
   * Busca contas do usuário
   */
  async getAccounts(connection: BankConnection): Promise<BankAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'x-fapi-interaction-id': this.generateInteractionId(),
          'x-customer-user-agent': 'CooperativeFuture/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar renovar
          await this.refreshAccessToken(connection);
          return this.getAccounts(connection);
        }
        throw new Error(`Erro ao buscar contas: ${response.statusText}`);
      }

      const result = await response.json();
      
      return result.data.map((account: any) => ({
        id: account.accountId,
        bankCode: connection.bankCode,
        bankName: connection.bankName,
        accountType: this.mapAccountType(account.accountType),
        accountNumber: account.number,
        agency: account.branch,
        balance: 0, // Será buscado separadamente
        currency: account.currency,
        lastSync: new Date(),
        isActive: true
      }));
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw error;
    }
  }

  /**
   * Busca saldo de uma conta
   */
  async getAccountBalance(connection: BankConnection, accountId: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/balances`, {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'x-fapi-interaction-id': this.generateInteractionId()
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar saldo: ${response.statusText}`);
      }

      const result = await response.json();
      const currentBalance = result.data.find((balance: any) => balance.type === 'AVAILABLE');
      
      return parseFloat(currentBalance?.amount || '0');
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      return 0;
    }
  }

  /**
   * Busca transações de uma conta
   */
  async getAccountTransactions(
    connection: BankConnection, 
    accountId: string, 
    fromDate: Date, 
    toDate: Date
  ): Promise<BankTransaction[]> {
    try {
      const params = new URLSearchParams({
        fromTransactionDateTime: fromDate.toISOString(),
        toTransactionDateTime: toDate.toISOString(),
        page: '1',
        'page-size': '1000'
      });

      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'x-fapi-interaction-id': this.generateInteractionId()
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar transações: ${response.statusText}`);
      }

      const result = await response.json();
      
      return result.data.map((transaction: any) => ({
        id: transaction.transactionId,
        accountId,
        amount: Math.abs(parseFloat(transaction.amount)),
        type: parseFloat(transaction.amount) > 0 ? 'credit' : 'debit',
        description: transaction.description || transaction.payerName || 'Transação bancária',
        date: new Date(transaction.transactionDateTime),
        category: this.categorizeTransaction(transaction.description),
        merchantName: transaction.payerName || transaction.payeeName,
        transactionCode: transaction.transactionId,
        balanceAfter: parseFloat(transaction.balanceAfterTransaction || '0')
      }));
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
  }

  /**
   * Renova token de acesso
   */
  private async refreshAccessToken(connection: BankConnection): Promise<void> {
    if (!connection.refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    const tokenData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refreshToken
    });

    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: tokenData
      });

      if (!response.ok) {
        connection.status = 'expired';
        throw new Error('Erro ao renovar token');
      }

      const result = await response.json();
      connection.accessToken = result.access_token;
      connection.refreshToken = result.refresh_token || connection.refreshToken;
      connection.expiresAt = new Date(Date.now() + result.expires_in * 1000);
      connection.status = 'connected';
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      connection.status = 'error';
      throw error;
    }
  }

  /**
   * Categoriza automaticamente uma transação
   */
  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    // Categorização básica baseada na descrição
    if (desc.includes('pix')) return 'transferencia';
    if (desc.includes('ted') || desc.includes('doc')) return 'transferencia';
    if (desc.includes('deb aut') || desc.includes('debito automatico')) return 'conta-fixa';
    if (desc.includes('saque')) return 'saque';
    if (desc.includes('deposito')) return 'deposito';
    if (desc.includes('cart') || desc.includes('visa') || desc.includes('master')) return 'cartao';
    if (desc.includes('farmacia') || desc.includes('drogaria')) return 'saude';
    if (desc.includes('supermercado') || desc.includes('mercado')) return 'alimentacao';
    if (desc.includes('posto') || desc.includes('combustivel')) return 'transporte';
    if (desc.includes('salario') || desc.includes('ordenado')) return 'salario';
    
    return 'outros';
  }

  /**
   * Mapeia tipo de conta do Open Banking para nosso sistema
   */
  private mapAccountType(type: string): 'checking' | 'savings' | 'investment' {
    switch (type.toUpperCase()) {
      case 'CONTA_CORRENTE':
      case 'CHECKING':
        return 'checking';
      case 'CONTA_POUPANCA':
      case 'SAVINGS':
        return 'savings';
      case 'CONTA_INVESTIMENTO':
      case 'INVESTMENT':
        return 'investment';
      default:
        return 'checking';
    }
  }

  /**
   * Gera ID único para interações
   */
  private generateInteractionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Configurações dos principais bancos brasileiros
 */
export const BANK_CONFIGS: Record<string, OpenBankingConfig> = {
  '001': { // Banco do Brasil
    clientId: process.env.BB_CLIENT_ID || '',
    clientSecret: process.env.BB_CLIENT_SECRET || '',
    redirectUri: process.env.BB_REDIRECT_URI || '',
    scopes: ['accounts', 'consents'],
    authorizationServer: 'https://auth.openbanking.bb.com.br',
    resourceServer: 'https://api.openbanking.bb.com.br'
  },
  '104': { // Caixa Econômica Federal
    clientId: process.env.CEF_CLIENT_ID || '',
    clientSecret: process.env.CEF_CLIENT_SECRET || '',
    redirectUri: process.env.CEF_REDIRECT_URI || '',
    scopes: ['accounts', 'consents'],
    authorizationServer: 'https://auth.openbanking.caixa.gov.br',
    resourceServer: 'https://api.openbanking.caixa.gov.br'
  },
  '237': { // Bradesco
    clientId: process.env.BRADESCO_CLIENT_ID || '',
    clientSecret: process.env.BRADESCO_CLIENT_SECRET || '',
    redirectUri: process.env.BRADESCO_REDIRECT_URI || '',
    scopes: ['accounts', 'consents'],
    authorizationServer: 'https://auth.openbanking.bradesco.com.br',
    resourceServer: 'https://api.openbanking.bradesco.com.br'
  },
  '341': { // Itaú
    clientId: process.env.ITAU_CLIENT_ID || '',
    clientSecret: process.env.ITAU_CLIENT_SECRET || '',
    redirectUri: process.env.ITAU_REDIRECT_URI || '',
    scopes: ['accounts', 'consents'],
    authorizationServer: 'https://auth.openbanking.itau.com.br',
    resourceServer: 'https://api.openbanking.itau.com.br'
  },
  '033': { // Santander
    clientId: process.env.SANTANDER_CLIENT_ID || '',
    clientSecret: process.env.SANTANDER_CLIENT_SECRET || '',
    redirectUri: process.env.SANTANDER_REDIRECT_URI || '',
    scopes: ['accounts', 'consents'],
    authorizationServer: 'https://auth.openbanking.santander.com.br',
    resourceServer: 'https://api.openbanking.santander.com.br'
  }
};

/**
 * Lista dos principais bancos brasileiros
 */
export const BRAZILIAN_BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '033', name: 'Santander' },
  { code: '260', name: 'Nu Pagamentos (Nubank)' },
  { code: '212', name: 'Banco Original' },
  { code: '655', name: 'Banco Votorantim' },
  { code: '077', name: 'Banco Inter' },
  { code: '323', name: 'Mercado Pago' },
  { code: '290', name: 'PagSeguro' },
  { code: '336', name: 'Banco C6' },
  { code: '364', name: 'Gerencianet' },
  { code: '380', name: 'PicPay' }
];
