import { apiRequest } from "./queryClient";
import { encryptionService } from "./encryption";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export class AuthManager {
  private static instance: AuthManager;
  private token: string | null = null;
  private user: User | null = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      this.token = token;
      this.user = JSON.parse(userData);
    }
  }

  private saveToStorage() {
    if (this.token && this.user) {
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data: AuthResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    // Deriva a chave de criptografia baseada nas credenciais do usuário
    encryptionService.deriveUserKey(email, password);
    
    this.saveToStorage();
    
    return data;
  }

  async register(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', { email, password, firstName, lastName });
    const data: AuthResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    // Deriva a chave de criptografia baseada nas credenciais do usuário
    encryptionService.deriveUserKey(email, password);
    
    this.saveToStorage();
    
    return data;
  }

  logout() {
    this.token = null;
    this.user = null;
    this.saveToStorage();
    
    // Limpa a chave de criptografia da memória
    encryptionService.clearKey();
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getAuthHeader(): Record<string, string> {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }
}

export const authManager = AuthManager.getInstance();
