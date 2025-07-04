import { 
  users, 
  authorizedEmails, 
  categories, 
  transactions, 
  retirementGoals, 
  documents,
  assets,
  insurances,
  type User, 
  type InsertUser,
  type AuthorizedEmail,
  type InsertAuthorizedEmail,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type RetirementGoal,
  type InsertRetirementGoal,
  type Document,
  type InsertDocument,
  type Asset,
  type InsertAsset,
  type Insurance,
  type InsertInsurance
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email authorization
  isEmailAuthorized(email: string): Promise<boolean>;
  addAuthorizedEmail(email: InsertAuthorizedEmail): Promise<AuthorizedEmail>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Transactions
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getRecentTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]>;
  getMonthlyTransactions(userId: number, year: number, month: number): Promise<Transaction[]>;
  
  // Retirement
  getUserRetirementGoal(userId: number): Promise<RetirementGoal | undefined>;
  createRetirementGoal(goal: InsertRetirementGoal): Promise<RetirementGoal>;
  updateRetirementGoal(userId: number, updates: Partial<InsertRetirementGoal>): Promise<RetirementGoal | undefined>;
  
  // Documents
  getUserDocuments(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Assets
  getUserAssets(userId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  
  // Insurances
  getUserInsurances(userId: number): Promise<Insurance[]>;
  createInsurance(insurance: InsertInsurance): Promise<Insurance>;
  updateInsurance(id: number, updates: Partial<InsertInsurance>): Promise<Insurance | undefined>;
  deleteInsurance(id: number): Promise<void>;
  getExpiringInsurances(userId: number, days: number): Promise<Insurance[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private authorizedEmails: Map<number, AuthorizedEmail>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private retirementGoals: Map<number, RetirementGoal>;
  private documents: Map<number, Document>;
  private assets: Map<number, Asset>;
  private insurances: Map<number, Insurance>;
  
  private currentUserId: number;
  private currentEmailId: number;
  private currentCategoryId: number;
  private currentTransactionId: number;
  private currentRetirementId: number;
  private currentDocumentId: number;
  private currentAssetId: number;
  private currentInsuranceId: number;

  constructor() {
    this.users = new Map();
    this.authorizedEmails = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.retirementGoals = new Map();
    this.documents = new Map();
    this.assets = new Map();
    this.insurances = new Map();
    
    this.currentUserId = 1;
    this.currentEmailId = 1;
    this.currentCategoryId = 1;
    this.currentTransactionId = 1;
    this.currentRetirementId = 1;
    this.currentDocumentId = 1;
    this.currentAssetId = 1;
    this.currentInsuranceId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed authorized emails
    const authorizedEmailsList = [
      'joao.silva@cooperativa.com',
      'maria.santos@cooperativa.com',
      'pedro.oliveira@cooperativa.com',
      'admin@test.com',
      'user@demo.com'
    ];
    
    authorizedEmailsList.forEach(email => {
      const authorizedEmail: AuthorizedEmail = {
        id: this.currentEmailId++,
        email,
        isActive: true
      };
      this.authorizedEmails.set(authorizedEmail.id, authorizedEmail);
    });

    // Seed categories
    const defaultCategories = [
      { name: 'Alimentação', icon: 'shopping-cart', color: '#00AE9D', type: 'expense' },
      { name: 'Transporte', icon: 'car', color: '#7DB61C', type: 'expense' },
      { name: 'Saúde', icon: 'heart', color: '#49479D', type: 'expense' },
      { name: 'Educação', icon: 'book', color: '#C9D200', type: 'expense' },
      { name: 'Entretenimento', icon: 'music', color: '#FF6B6B', type: 'expense' },
      { name: 'Outros', icon: 'more-horizontal', color: '#6C757D', type: 'expense' },
      { name: 'Salário', icon: 'dollar-sign', color: '#28A745', type: 'income' },
      { name: 'Freelance', icon: 'briefcase', color: '#17A2B8', type: 'income' },
      { name: 'Investimentos', icon: 'trending-up', color: '#FFC107', type: 'income' }
    ];
    
    defaultCategories.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type
      };
      this.categories.set(category.id, category);
    });

    // Create demo user with some sample data
    this.createDemoUser();
  }

  private async createDemoUser() {
    
    // Create demo user (password: "demo123")
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const demoUser: User = {
      id: this.currentUserId++,
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'João',
      lastName: 'Silva',
      createdAt: new Date()
    };
    this.users.set(demoUser.id, demoUser);

    // Add sample transactions
    const sampleTransactions = [
      { description: 'Salário', amount: '5500.00', type: 'income', categoryId: 7 },
      { description: 'Mercado', amount: '350.00', type: 'expense', categoryId: 1 },
      { description: 'Combustível', amount: '120.00', type: 'expense', categoryId: 2 },
      { description: 'Consulta médica', amount: '180.00', type: 'expense', categoryId: 3 },
      { description: 'Cinema', amount: '45.00', type: 'expense', categoryId: 5 },
      { description: 'Freelance', amount: '800.00', type: 'income', categoryId: 8 },
    ];

    sampleTransactions.forEach(tx => {
      const transaction: Transaction = {
        id: this.currentTransactionId++,
        userId: demoUser.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type as 'income' | 'expense',
        categoryId: tx.categoryId,
        date: new Date(),
        createdAt: new Date()
      };
      this.transactions.set(transaction.id, transaction);
    });

    // Add retirement goal
    const retirementGoal: RetirementGoal = {
      id: this.currentRetirementId++,
      userId: demoUser.id,
      targetAmount: '500000.00',
      currentAmount: '45000.00',
      monthlyContribution: '1200.00',
      createdAt: new Date()
    };
    this.retirementGoals.set(retirementGoal.id, retirementGoal);

    // Add sample assets
    const sampleAssets = [
      { name: 'Apartamento Centro', type: 'property', value: '280000.00', description: 'Apartamento 2 quartos' },
      { name: 'Carro Honda Civic', type: 'vehicle', value: '45000.00', description: '2020, baixa quilometragem' },
    ];

    sampleAssets.forEach(asset => {
      const newAsset: Asset = {
        id: this.currentAssetId++,
        userId: demoUser.id,
        name: asset.name,
        type: asset.type,
        value: asset.value,
        description: asset.description,
        createdAt: new Date()
      };
      this.assets.set(newAsset.id, newAsset);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async isEmailAuthorized(email: string): Promise<boolean> {
    return Array.from(this.authorizedEmails.values()).some(
      ae => ae.email === email && ae.isActive
    );
  }

  async addAuthorizedEmail(insertEmail: InsertAuthorizedEmail): Promise<AuthorizedEmail> {
    const id = this.currentEmailId++;
    const authorizedEmail: AuthorizedEmail = { 
      ...insertEmail, 
      id,
      isActive: insertEmail.isActive ?? true
    };
    this.authorizedEmails.set(id, authorizedEmail);
    return authorizedEmail;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.type === type);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }

  async getRecentTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    const userTransactions = await this.getUserTransactions(userId);
    return userTransactions.slice(0, limit);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      date: new Date(),
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId && t.categoryId === categoryId);
  }

  async getMonthlyTransactions(userId: number, year: number, month: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => {
        if (t.userId !== userId || !t.date) return false;
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month - 1;
      });
  }

  async getUserRetirementGoal(userId: number): Promise<RetirementGoal | undefined> {
    return Array.from(this.retirementGoals.values()).find(rg => rg.userId === userId);
  }

  async createRetirementGoal(insertGoal: InsertRetirementGoal): Promise<RetirementGoal> {
    const id = this.currentRetirementId++;
    const goal: RetirementGoal = { 
      ...insertGoal, 
      id,
      currentAmount: insertGoal.currentAmount ?? '0',
      createdAt: new Date()
    };
    this.retirementGoals.set(id, goal);
    return goal;
  }

  async updateRetirementGoal(userId: number, updates: Partial<InsertRetirementGoal>): Promise<RetirementGoal | undefined> {
    const existing = await this.getUserRetirementGoal(userId);
    if (!existing) return undefined;
    
    const updated: RetirementGoal = { ...existing, ...updates };
    this.retirementGoals.set(existing.id, updated);
    return updated;
  }

  async getUserDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.userId === userId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadDate: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  async getUserAssets(userId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(a => a.userId === userId);
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.currentAssetId++;
    const asset: Asset = { 
      ...insertAsset, 
      id,
      description: insertAsset.description ?? null,
      createdAt: new Date()
    };
    this.assets.set(id, asset);
    return asset;
  }

  async getUserInsurances(userId: number): Promise<Insurance[]> {
    return Array.from(this.insurances.values()).filter(i => i.userId === userId);
  }

  async createInsurance(insertInsurance: InsertInsurance): Promise<Insurance> {
    const id = this.currentInsuranceId++;
    const insurance: Insurance = { 
      ...insertInsurance, 
      id,
      description: insertInsurance.description ?? null,
      notificationDays: insertInsurance.notificationDays ?? 30,
      isActive: insertInsurance.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.insurances.set(id, insurance);
    return insurance;
  }

  async updateInsurance(id: number, updates: Partial<InsertInsurance>): Promise<Insurance | undefined> {
    const existing = this.insurances.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Insurance = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.insurances.set(id, updated);
    return updated;
  }

  async deleteInsurance(id: number): Promise<void> {
    this.insurances.delete(id);
  }

  async getExpiringInsurances(userId: number, days: number): Promise<Insurance[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return Array.from(this.insurances.values()).filter(i => {
      if (i.userId !== userId || !i.isActive) return false;
      const endDate = new Date(i.endDate);
      return endDate >= now && endDate <= futureDate;
    });
  }
}

export const storage = new MemStorage();
