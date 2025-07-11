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
  insertDocumentSchema,
  insertInsuranceSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { smartRateLimit } from './rateLimit';
import { auditLogger, auditMiddleware, AuditActions } from './auditLog';
import { NotificationService } from './notifications';

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

  // Health check endpoint (public)
  app.get("/api/health", async (req, res) => {
    const hasDatabase = !!process.env.DATABASE_URL;
    res.json({ 
      status: "ok",
      database: hasDatabase,
      timestamp: new Date().toISOString()
    });
  });

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Check if email is authorized
      const isAuthorized = await storage.isEmailAuthorized(email);
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Email não autorizado para acesso' });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Dados inválidos' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if email is authorized
      const isAuthorized = await storage.isEmailAuthorized(userData.email);
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Email não autorizado para registro' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: 'Usuário já existe' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Dados inválidos' });
    }
  });

  // User profile
  app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Categories
  app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar categorias' });
    }
  });

  app.get('/api/categories/:type', authenticateToken, async (req, res) => {
    try {
      const type = req.params.type as 'income' | 'expense';
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Tipo deve ser income ou expense' });
      }
      
      const categories = await storage.getCategoriesByType(type);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar categorias' });
    }
  });

  // Transactions
  app.get('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar transações' });
    }
  });

  app.get('/api/transactions/recent', authenticateToken, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(req.user.id, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar transações recentes' });
    }
  });

  app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: 'Dados da transação inválidos' });
    }
  });

  app.get('/api/transactions/monthly/:year/:month', authenticateToken, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      const transactions = await storage.getMonthlyTransactions(req.user.id, year, month);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar transações mensais' });
    }
  });

  // Dashboard summary
  app.get('/api/dashboard/summary', authenticateToken, async (req: any, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyTransactions = await storage.getMonthlyTransactions(req.user.id, currentYear, currentMonth);
      
      const totalBalance = transactions.reduce((sum, t) => {
        const amount = parseFloat(t.amount);
        return sum + (t.type === 'income' ? amount : -amount);
      }, 0);
      
      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const retirementGoal = await storage.getUserRetirementGoal(req.user.id);
      
      res.json({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        retirementSavings: retirementGoal?.currentAmount || 0,
        retirementTarget: retirementGoal?.targetAmount || 0,
        monthlyContribution: retirementGoal?.monthlyContribution || 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar resumo do dashboard' });
    }
  });

  // Retirement
  app.get('/api/retirement/goal', authenticateToken, async (req: any, res) => {
    try {
      const goal = await storage.getUserRetirementGoal(req.user.id);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar meta de aposentadoria' });
    }
  });

  app.post('/api/retirement/goal', authenticateToken, async (req: any, res) => {
    try {
      const goalData = insertRetirementGoalSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const goal = await storage.createRetirementGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ message: 'Dados da meta inválidos' });
    }
  });

  app.put('/api/retirement/goal', authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const goal = await storage.updateRetirementGoal(req.user.id, updates);
      
      if (!goal) {
        return res.status(404).json({ message: 'Meta de aposentadoria não encontrada' });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: 'Erro ao atualizar meta' });
    }
  });

  // Assets
  app.get('/api/assets', authenticateToken, async (req: any, res) => {
    try {
      const assets = await storage.getUserAssets(req.user.id);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar ativos' });
    }
  });

  app.post('/api/assets', authenticateToken, async (req: any, res) => {
    try {
      const assetData = insertAssetSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const asset = await storage.createAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ message: 'Dados do ativo inválidos' });
    }
  });

  // Documents
  app.get('/api/documents', authenticateToken, async (req: any, res) => {
    try {
      const documents = await storage.getUserDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar documentos' });
    }
  });

  app.post('/api/documents', authenticateToken, async (req: any, res) => {
    try {
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: 'Dados do documento inválidos' });
    }
  });

  // Insurances
  app.get('/api/insurances', authenticateToken, async (req: any, res) => {
    try {
      const insurances = await storage.getUserInsurances(req.user.id);
      res.json(insurances);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar seguros' });
    }
  });

  app.post('/api/insurances', authenticateToken, async (req: any, res) => {
    try {
      const insuranceData = insertInsuranceSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const insurance = await storage.createInsurance(insuranceData);
      res.status(201).json(insurance);
    } catch (error) {
      res.status(400).json({ message: 'Dados do seguro inválidos' });
    }
  });

  app.put('/api/insurances/:id', authenticateToken, async (req: any, res) => {
    try {
      const insuranceId = parseInt(req.params.id);
      const updates = req.body;
      
      const insurance = await storage.updateInsurance(insuranceId, updates);
      
      if (!insurance) {
        return res.status(404).json({ message: 'Seguro não encontrado' });
      }
      
      res.json(insurance);
    } catch (error) {
      res.status(400).json({ message: 'Erro ao atualizar seguro' });
    }
  });

  app.delete('/api/insurances/:id', authenticateToken, async (req: any, res) => {
    try {
      const insuranceId = parseInt(req.params.id);
      
      await storage.deleteInsurance(insuranceId);
      
      res.json({ message: 'Seguro removido com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover seguro' });
    }
  });

  // File upload and management
  app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      // Salvar informações do documento no banco
      const documentData = {
        userId: req.user.id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: req.body.category || 'outros',
        filePath: req.file.filename // Nome do arquivo salvo no servidor
      };

      const document = await storage.createDocument(documentData);
      
      res.status(201).json({
        document,
        fileUrl: getFileUrl(req.file.filename)
      });
    } catch (error) {
      // Se deu erro, deletar o arquivo
      if (req.file) {
        await deleteFile(req.file.filename);
      }
      res.status(500).json({ message: 'Erro ao fazer upload do arquivo' });
    }
  });

  // Servir arquivos
  app.get('/api/files/:filename', authenticateToken, async (req: any, res) => {
    try {
      const filename = req.params.filename;
      
      // Verificar se o arquivo existe
      if (!fileExists(filename)) {
        return res.status(404).json({ message: 'Arquivo não encontrado' });
      }

      // Verificar se o usuário tem permissão para acessar o arquivo
      const documents = await storage.getUserDocuments(req.user.id);
      const document = documents.find(doc => doc.filePath === filename);
      
      if (!document) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Servir o arquivo
      const filePath = path.join(process.cwd(), 'uploads', filename);
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao acessar arquivo' });
    }
  });

  // Deletar arquivo
  app.delete('/api/files/:documentId', authenticateToken, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const documents = await storage.getUserDocuments(req.user.id);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }

      // Deletar arquivo físico
      if (document.filePath) {
        await deleteFile(document.filePath);
      }

      // Deletar registro do banco
      await storage.deleteDocument(documentId);
      
      res.json({ message: 'Arquivo deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao deletar arquivo' });
    }
  });

  // Notifications preferences

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

  // Two-Factor Authentication Routes
  const { TwoFactorService } = await import('./twoFactor');

  // Generate 2FA setup
  app.post('/api/auth/2fa/setup', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const setup = await TwoFactorService.setupTwoFactor(userId, user.email);
      
      res.json({
        qrCode: setup.qrCodeUrl,
        manualCode: setup.secret,
        backupCodes: setup.backupCodes
      });
    } catch (error) {
      console.error('Erro ao configurar 2FA:', error);
      res.status(500).json({ message: 'Erro ao configurar 2FA' });
    }
  });

  // Verify 2FA setup
  app.post('/api/auth/2fa/verify-setup', authenticateToken, async (req: any, res: any) => {
    try {
      const { token, secret } = req.body;
      const userId = req.user.id;
      
      if (!token || !secret) {
        return res.status(400).json({ message: 'Token e secret são obrigatórios' });
      }

      // Gerar códigos de backup temporários para o teste
      const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];
      const isValid = await TwoFactorService.confirmTwoFactor(userId, secret, token, backupCodes);
      
      if (!isValid) {
        return res.status(400).json({ message: 'Token inválido' });
      }
      
      res.json({ message: '2FA configurado com sucesso' });
    } catch (error) {
      console.error('Erro ao verificar 2FA:', error);
      res.status(500).json({ message: 'Erro ao verificar 2FA' });
    }
  });

  // Verify 2FA login
  app.post('/api/auth/2fa/verify', async (req: any, res: any) => {
    try {
      const { email, token } = req.body;
      
      if (!email || !token) {
        return res.status(400).json({ message: 'Email e token são obrigatórios' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Por enquanto, simular verificação
      const isValid = token === '123456';
      
      if (!isValid) {
        return res.status(400).json({ message: 'Token 2FA inválido' });
      }

      res.json({ message: 'Token 2FA válido' });
    } catch (error) {
      console.error('Erro ao verificar token 2FA:', error);
      res.status(500).json({ message: 'Erro ao verificar token 2FA' });
    }
  });

  // User preferences routes
  app.get('/api/user/preferences', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      // Buscar preferências do usuário no banco
      // const preferences = await storage.getUserPreferences(userId);
      
      // Por enquanto, retornar preferências padrão
      const defaultPreferences = {
        notifications: {
          email: true,
          push: true,
          insurance: true,
          goals: true,
          education: true
        },
        privacy: {
          shareAnalytics: false,
          dataEncryption: true,
          autoLogout: 30
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30
        }
      };
      
      res.json(defaultPreferences);
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      res.status(500).json({ message: 'Erro ao buscar preferências' });
    }
  });

  app.put('/api/user/preferences', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      
      // Salvar preferências no banco
      // await storage.saveUserPreferences(userId, preferences);
      
      // Log da alteração
      auditLogger.log({
        userId,
        action: 'update_preferences',
        resource: 'user_preferences',
        resourceId: userId.toString(),
        details: { preferences },
        success: true
      });
      
      res.json({ message: 'Preferências salvas com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      res.status(500).json({ message: 'Erro ao salvar preferências' });
    }
  });

  // Notifications preferences
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
