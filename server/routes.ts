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
      console.error('Error creating asset:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(400).json({ message: 'Dados do ativo inválidos' });
    }
  });

  app.put('/api/assets/:id', authenticateToken, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Validate update data
      const updates = updateAssetSchema.parse(req.body);
      
      // Verify asset belongs to user
      const existingAsset = await storage.getAsset(assetId);
      if (!existingAsset || existingAsset.userId !== req.user.id) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }
      
      const asset = await storage.updateAsset(assetId, updates);
      
      if (!asset) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Error updating asset:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(400).json({ message: 'Erro ao atualizar ativo' });
    }
  });

  app.delete('/api/assets/:id', authenticateToken, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Verify asset belongs to user
      const existingAsset = await storage.getAsset(assetId);
      if (!existingAsset || existingAsset.userId !== req.user.id) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }
      
      await storage.deleteAsset(assetId);
      
      res.json({ message: 'Ativo removido com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover ativo' });
    }
  });

  app.get('/api/assets/categories', authenticateToken, async (req: any, res) => {
    try {
      const assets = await storage.getUserAssets(req.user.id);
      
      const categories = assets.reduce((acc: any, asset: any) => {
        const type = asset.type || 'outro';
        if (!acc[type]) {
          acc[type] = {
            type,
            count: 0,
            totalValue: 0,
            assets: []
          };
        }
        acc[type].count++;
        acc[type].totalValue += parseFloat(asset.value || 0);
        acc[type].assets.push(asset);
        return acc;
      }, {});

      res.json(Object.values(categories));
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar categorias de ativos' });
    }
  });

  app.get('/api/assets/statistics', authenticateToken, async (req: any, res) => {
    try {
      const assets = await storage.getUserAssets(req.user.id);
      
      const totalValue = assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.value || 0), 0);
      const activeAssets = assets.filter((asset: any) => asset.isActive !== false);
      const totalAssets = assets.length;
      
      const categoryStats = assets.reduce((acc: any, asset: any) => {
        const type = asset.type || 'outro';
        if (!acc[type]) {
          acc[type] = { count: 0, value: 0 };
        }
        acc[type].count++;
        acc[type].value += parseFloat(asset.value || 0);
        return acc;
      }, {});

      const mostValuableAsset = assets.reduce((max: any, asset: any) => 
        parseFloat(asset.value || 0) > parseFloat(max?.value || 0) ? asset : max, null);

      res.json({
        totalValue,
        totalAssets,
        activeAssets: activeAssets.length,
        categoryStats,
        mostValuableAsset,
        averageValue: totalAssets > 0 ? totalValue / totalAssets : 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar estatísticas de ativos' });
    }
  });

  app.post('/api/assets/:id/calculate-depreciation', authenticateToken, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.getAsset(assetId);
      
      if (!asset || asset.userId !== req.user.id) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }

      const { depreciationRate, years } = req.body;
      
      if (!depreciationRate || !years) {
        return res.status(400).json({ message: 'Taxa de depreciação e anos são obrigatórios' });
      }

      const originalValue = parseFloat(asset.value);
      const rate = parseFloat(depreciationRate) / 100;
      
      // Calculate depreciation using straight-line method
      const annualDepreciation = originalValue * rate;
      const totalDepreciation = annualDepreciation * years;
      const currentValue = Math.max(0, originalValue - totalDepreciation);
      
      // Update asset with calculated current value
      await storage.updateAsset(assetId, {
        currentValue: currentValue.toString(),
        depreciationRate: depreciationRate.toString()
      });

      res.json({
        originalValue,
        currentValue,
        totalDepreciation,
        annualDepreciation,
        years,
        depreciationRate
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao calcular depreciação' });
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

  const httpServer = createServer(app);
  return httpServer;
}

  // Bank Integration Routes
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
          lastSync: new Date().toISOString(),
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
          lastSync: new Date().toISOString(),
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
        account.lastSync = new Date().toISOString();
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

  const httpServer = createServer(app);
  return httpServer;
}
