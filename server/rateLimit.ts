/**
 * Rate Limiting Middleware
 * 
 * Implementa limitação de taxa para proteger APIs contra abuso
 * com diferentes estratégias por endpoint
 */

import { Request, Response, NextFunction } from 'express';
import { log } from './vite';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests na janela
  message?: string; // Mensagem de erro customizada
  keyGenerator?: (req: Request) => string; // Gerador de chave personalizado
  skipSuccessfulRequests?: boolean; // Pular requests bem-sucedidos
  skipFailedRequests?: boolean; // Pular requests falhados
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Muitas tentativas. Tente novamente mais tarde.',
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false
    };

    // Limpar entradas expiradas a cada minuto
    setInterval(() => this.cleanupExpiredEntries(), 60000);
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.config.keyGenerator(req);
      const now = Date.now();
      
      let entry = this.store.get(key);
      
      if (!entry || now > entry.resetTime) {
        // Nova janela de tempo
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
          firstRequestTime: now
        };
        this.store.set(key, entry);
      }

      // Incrementar contador
      entry.count++;

      // Headers informativos
      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
      });

      if (entry.count > this.config.maxRequests) {
        log(`Rate limit excedido para ${key}: ${entry.count}/${this.config.maxRequests}`);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.config.message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
      }

      next();
    };
  }
}

// Configurações pré-definidas
export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config);

// Rate limiters específicos
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requests por janela
  message: 'Muitas requisições. Tente novamente em 15 minutos.'
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas de login por janela
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 20, // 20 uploads por hora
  message: 'Limite de uploads excedido. Tente novamente em 1 hora.'
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 60, // 60 requests por minuto
  message: 'Limite de API excedido. Tente novamente em 1 minuto.'
});

// Rate limiter adaptativo (baseado no usuário autenticado)
export const createUserRateLimit = (windowMs: number, maxRequests: number) =>
  createRateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req: any) => {
      // Usar ID do usuário se autenticado, senão IP
      return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    }
  });

// Middleware para aplicar diferentes rate limits baseado na rota
export function smartRateLimit(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const method = req.method;

  // Rate limits específicos por rota
  if (path.startsWith('/api/auth/')) {
    return authRateLimit.middleware()(req, res, next);
  }
  
  if (path.startsWith('/api/files/upload')) {
    return uploadRateLimit.middleware()(req, res, next);
  }
  
  if (path.startsWith('/api/')) {
    return apiRateLimit.middleware()(req, res, next);
  }

  // Rate limit geral para outras rotas
  return generalRateLimit.middleware()(req, res, next);
}

// Middleware para bypass em desenvolvimento
export function createConditionalRateLimit(rateLimiter: RateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bypass em desenvolvimento se configurado
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }
    
    return rateLimiter.middleware()(req, res, next);
  };
}
