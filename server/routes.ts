import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { upload, deleteFile, fileExists, getFileUrl } from "./fileUpload";
import { 
  loginSchema, 
  registerSchema, 
  insertTransactionSchema,
  insertRetirementGoalSchema,
  insertAssetSchema,
  updateAssetSchema,
  insertDocumentSchema,
  insertInsuranceSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { smartRateLimit } from './rateLimit';
import { auditLogger, auditMiddleware, AuditActions } from './auditLog';
import { NotificationService } from './notifications';

// Simulações e mocks de banco/open banking
import { BRAZILIAN_BANKS, BANK_CONFIGS, BankIntegrationService, BankConnection, BankAccount } from './bankSim'; // Supondo que existam mocks

const JWT_SECRET = process.env.JWT_SECRET || "planeja-secret-key";

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Aplicar middlewares globais
  app.use(smartRateLimit);
  app.use(auditMiddleware());

  // ----- API ROUTES (conforme anterior) -----
  // ... [Aqui ficam todos os endpoints já existentes, omitidos para brevidade] ...

  // ==== BEGIN: Bank Integration & Notifications section ====

  // Variáveis simuladas para conexões e contas bancárias
  const bankConnections: BankConnection[] = [];
  const bankAccounts: BankAccount[] = [];

  // Get all bank connections
  app.get('/api/bank-connections', (req, res) => {
    try {
      const connectionsWithAccountCount = bankConnections.map(connection => ({
        ...connection,
        accountCount: bankAccounts.filter(account => account.bankCode === connection.bankCode).length
      }));
      res.json(connectionsWithAccountCount);
    } catch (error) {
      console.error('Erro ao buscar conexões bancárias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get all bank accounts
  app.get('/api/bank-accounts', (req, res) => {
    try {
      res.json(bankAccounts);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get available banks
  app.get('/api/banks/available', (req, res) => {
    try {
      res.json(BRAZILIAN_BANKS);
    } catch (error) {
      console.error('Erro ao buscar bancos disponíveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Initiate bank connection
  app.post('/api/bank-connections/initiate', async (req, res) => {
    try {
      const { bankCode, permissions } = req.body;

      if (!bankCode || !permissions) {
        return res.status(400).json({ error: 'Código do banco e permissões são obrigatórios' });
      }

      const bankConfig = BANK_CONFIGS[bankCode];
      if (!bankConfig) {
        return res.status(400).json({ error: 'Banco não suportado' });
      }

      const bankService = new BankIntegrationService(bankConfig);
      
      // Em um ambiente real, você iniciaria o fluxo de consentimento
      // Por agora, vamos simular um consentimento
      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // URL de autorização simulada (em produção seria a URL real do banco)
      const authUrl = `${bankConfig.authorizationServer}/auth?` +
        `response_type=code&` +
        `client_id=${bankConfig.clientId}&` +
        `redirect_uri=${encodeURIComponent(bankConfig.redirectUri)}&` +
        `scope=${bankConfig.scopes.join(' ')}&` +
        `consent_id=${consentId}&` +
        `state=${consentId}`;

      res.json({ 
        authUrl,
        consentId,
        message: 'Redirecionando para autorização do banco...'
      });

    } catch (error) {
      console.error('Erro ao iniciar conexão bancária:', error);
      res.status(500).json({ error: 'Erro ao iniciar conexão com o banco' });
    }
  });

  // Handle OAuth callback (simulated)
  app.get('/api/bank-connections/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({ error: 'Autorização negada pelo usuário' });
      }

      if (!code || !state) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      // Em um ambiente real, você trocaria o código por um token
      // Por agora, vamos simular uma conexão bem-sucedida
      const bankCode = '001'; // Simular Banco do Brasil
      const bankName = 'Banco do Brasil';

      const newConnection: BankConnection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bankCode,
        bankName,
        status: 'connected',
        consentId: state as string,
        accessToken: `token_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        permissions: ['ACCOUNTS_READ', 'ACCOUNTS_BALANCES_READ', 'RESOURCES_READ'],
        lastSync: new Date()
      };

      bankConnections.push(newConnection);

      // Simular contas bancárias
      const simulatedAccounts: BankAccount[] = [
        {
          id: `acc_${Date.now()}_1`,
          bankCode,
          bankName,
          accountType: 'checking',
          accountNumber: '12345-6',
          agency: '1234',
          balance: 5500.50,
          currency: 'BRL',
          lastSync: new Date(),
          isActive: true
        },
        {
          id: `acc_${Date.now()}_2`,
          bankCode,
          bankName,
          accountType: 'savings',
          accountNumber: '78910-1',
          agency: '1234',
          balance: 12000.75,
          currency: 'BRL',
          lastSync: new Date(),
          isActive: true
        }
      ];

      bankAccounts.push(...simulatedAccounts);

      res.redirect('http://localhost:5173/bank-integration?success=true');

    } catch (error) {
      console.error('Erro no callback da conexão bancária:', error);
      res.status(500).json({ error: 'Erro ao processar autorização' });
    }
  });

  // Sync bank connection
  app.post('/api/bank-connections/:id/sync', async (req, res) => {
    try {
      const { id } = req.params;
      const connection = bankConnections.find(c => c.id === id);

      if (!connection) {
        return res.status(404).json({ error: 'Conexão não encontrada' });
      }

      if (connection.status !== 'connected') {
        return res.status(400).json({ error: 'Conexão não está ativa' });
      }

      // Em um ambiente real, você buscaria dados reais do banco
      // Por agora, vamos simular uma atualização de saldo
      const connectionAccounts = bankAccounts.filter(acc => acc.bankCode === connection.bankCode);
      
      connectionAccounts.forEach(account => {
        // Simular variação no saldo (-5% a +5%)
        const variation = (Math.random() - 0.5) * 0.1;
        account.balance = Math.max(0, account.balance * (1 + variation));
        account.lastSync = new Date();
      });

      connection.lastSync = new Date();

      // Simular importação de novas transações
      const newTransactions = [
        {
          id: `trans_${Date.now()}_1`,
          amount: -50.00,
          type: 'expense' as const,
          description: 'Compra no supermercado',
          date: new Date().toISOString(),
          category: 'alimentacao',
          paymentMethod: 'cartao'
        },
        {
          id: `trans_${Date.now()}_2`,
          amount: -120.00,
          type: 'expense' as const,
          description: 'Combustível posto ABC',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          category: 'transporte',
          paymentMethod: 'cartao'
        }
      ];

      // Adicionar transações ao sistema (se você tiver o storage de transações)
      // storage.addTransaction(newTransactions[0]);
      // storage.addTransaction(newTransactions[1]);

      res.json({ 
        message: 'Sincronização concluída',
        accountsUpdated: connectionAccounts.length,
        transactionsImported: newTransactions.length
      });

    } catch (error) {
      console.error('Erro ao sincronizar conexão bancária:', error);
      res.status(500).json({ error: 'Erro na sincronização' });
    }
  });

  // Delete bank connection
  app.delete('/api/bank-connections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const connectionIndex = bankConnections.findIndex(c => c.id === id);

      if (connectionIndex === -1) {
        return res.status(404).json({ error: 'Conexão não encontrada' });
      }

      const connection = bankConnections[connectionIndex];

      // Em um ambiente real, você revogaria o consentimento no banco
      // Por agora, vamos apenas remover localmente
      bankConnections.splice(connectionIndex, 1);

      // Remover contas associadas
      const accountsToRemove = bankAccounts.filter(acc => acc.bankCode === connection.bankCode);
      accountsToRemove.forEach(account => {
        const accountIndex = bankAccounts.findIndex(acc => acc.id === account.id);
        if (accountIndex !== -1) {
          bankAccounts.splice(accountIndex, 1);
        }
      });

      res.json({ 
        message: 'Conexão removida com sucesso',
        accountsRemoved: accountsToRemove.length
      });

    } catch (error) {
      console.error('Erro ao remover conexão bancária:', error);
      res.status(500).json({ error: 'Erro ao remover conexão' });
    }
  });

  // Get bank account transactions
  app.get('/api/bank-accounts/:id/transactions', async (req, res) => {
    try {
      const { id } = req.params;
      const { from, to } = req.query;

      const account = bankAccounts.find(acc => acc.id === id);
      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Em um ambiente real, você buscaria transações reais do banco
      // Por agora, vamos simular algumas transações
      const simulatedTransactions = [
        {
          id: `bank_trans_1`,
          accountId: id,
          amount: -250.00,
          type: 'debit',
          description: 'Pagamento cartão de crédito',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          category: 'financeiro',
          merchantName: 'Banco XYZ',
          transactionCode: 'PAG001',
          balanceAfter: account.balance + 250
        },
        {
          id: `bank_trans_2`,
          accountId: id,
          amount: 3500.00,
          type: 'credit',
          description: 'Salário',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          category: 'salario',
          merchantName: 'Empresa ABC Ltda',
          transactionCode: 'SAL001',
          balanceAfter: account.balance
        },
        {
          id: `bank_trans_3`,
          accountId: id,
          amount: -80.50,
          type: 'debit',
          description: 'Compra farmácia',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          category: 'saude',
          merchantName: 'Farmácia Saúde',
          transactionCode: 'COM001',
          balanceAfter: account.balance + 80.50
        }
      ];

      res.json(simulatedTransactions);

    } catch (error) {
      console.error('Erro ao buscar transações da conta:', error);
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // ==== END: Bank Integration & Notifications section ====

  // Two-Factor Authentication, User Preferences & Notifications
  const { TwoFactorService } = await import('./twoFactor');

  // ... [Demais endpoints, já existentes, continuam normalmente] ...

  // Notifications preferences (deve ser declarado apenas uma vez)
  app.post('/api/notifications/test-email', authenticateToken, async (req: any, res: any) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const success = await NotificationService.sendEmail({
        to: user.email,
        subject: 'Teste de Notificação - Planeja',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00AE9D 0%, #008B7A 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Teste de Email</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Olá, ${user.firstName}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Este é um email de teste para confirmar que suas notificações estão funcionando corretamente.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Se você recebeu este email, suas configurações de notificação estão ativas e funcionando!
              </p>
            </div>
          </div>
        `
      });

      if (success) {
        res.json({ message: 'Email de teste enviado com sucesso' });
      } else {
        res.status(500).json({ message: 'Erro ao enviar email de teste' });
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      res.status(500).json({ message: 'Erro ao enviar email de teste' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}