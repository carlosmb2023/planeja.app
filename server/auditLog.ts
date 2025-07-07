/**
 * Sistema de Logs de Auditoria
 * 
 * Registra atividades importantes do sistema para auditoria e segurança
 */

import { log } from './vite';
import { Request } from 'express';

export interface AuditLog {
  id?: string;
  userId?: number;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  type: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 
        'email_change' | 'account_locked' | 'suspicious_activity' | 
        'data_access' | 'data_modification' | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: number;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 10000; // Máximo de logs em memória

  /**
   * Registra uma ação de auditoria
   */
  log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logEntry: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      ...auditLog
    };

    this.logs.push(logEntry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log estruturado para console
    log(`AUDIT: ${auditLog.action} on ${auditLog.resource} by ${auditLog.userEmail || 'unknown'} - ${auditLog.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Em produção, salvar em banco de dados
    this.persistLog(logEntry);
  }

  /**
   * Registra evento de segurança
   */
  logSecurityEvent(event: SecurityEvent): void {
    const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
      userId: event.userId,
      action: `security_${event.type}`,
      resource: 'security',
      details: {
        type: event.type,
        severity: event.severity,
        ...event.details
      },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: true
    };

    this.log(auditLog);

    // Alertas para eventos críticos
    if (event.severity === 'critical') {
      this.handleCriticalSecurityEvent(event);
    }
  }

  /**
   * Registra ação do usuário
   */
  logUserAction(
    userId: number,
    userEmail: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    req?: Request
  ): void {
    this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      success: true
    });
  }

  /**
   * Registra falha de ação
   */
  logFailedAction(
    userId: number | undefined,
    userEmail: string | undefined,
    action: string,
    resource: string,
    error: string,
    req?: Request
  ): void {
    this.log({
      userId,
      userEmail,
      action,
      resource,
      errorMessage: error,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      success: false
    });
  }

  /**
   * Busca logs por critério
   */
  searchLogs(criteria: {
    userId?: number;
    action?: string;
    resource?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLog[] {
    let filteredLogs = this.logs;

    if (criteria.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === criteria.userId);
    }

    if (criteria.action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(criteria.action!.toLowerCase())
      );
    }

    if (criteria.resource) {
      filteredLogs = filteredLogs.filter(log => 
        log.resource.toLowerCase().includes(criteria.resource!.toLowerCase())
      );
    }

    if (criteria.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === criteria.success);
    }

    if (criteria.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.startDate!);
    }

    if (criteria.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= criteria.endDate!);
    }

    // Ordenar por data mais recente primeiro
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limitar resultados
    if (criteria.limit && criteria.limit > 0) {
      filteredLogs = filteredLogs.slice(0, criteria.limit);
    }

    return filteredLogs;
  }

  /**
   * Obtém estatísticas de auditoria
   */
  getAuditStats(): {
    totalLogs: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userEmail: string; count: number }>;
    recentFailures: AuditLog[];
  } {
    const totalLogs = this.logs.length;
    const successfulLogs = this.logs.filter(log => log.success).length;
    const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0;

    // Top ações
    const actionCounts = new Map<string, number>();
    this.logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top usuários
    const userCounts = new Map<string, number>();
    this.logs.forEach(log => {
      if (log.userEmail) {
        userCounts.set(log.userEmail, (userCounts.get(log.userEmail) || 0) + 1);
      }
    });
    const topUsers = Array.from(userCounts.entries())
      .map(([userEmail, count]) => ({ userEmail, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Falhas recentes
    const recentFailures = this.logs
      .filter(log => !log.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return {
      totalLogs,
      successRate,
      topActions,
      topUsers,
      recentFailures
    };
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistLog(logEntry: AuditLog): Promise<void> {
    // Em produção, salvar no banco de dados
    // Por enquanto, apenas log no console para logs críticos
    if (!logEntry.success || logEntry.action.includes('security_')) {
      console.log('AUDIT_LOG:', JSON.stringify(logEntry, null, 2));
    }
  }

  private handleCriticalSecurityEvent(event: SecurityEvent): void {
    // Em produção, enviar alerta imediato
    console.warn('CRITICAL_SECURITY_EVENT:', JSON.stringify(event, null, 2));
    
    // Aqui poderia integrar com sistemas de alerta como:
    // - Slack/Teams notifications
    // - Email para admins
    // - SMS para equipe de segurança
    // - Integração com SIEM
  }
}

// Instância singleton
export const auditLogger = new AuditLogger();

// Middleware para logging automático de requisições
export function auditMiddleware() {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Log da resposta
      if (req.user && req.path.startsWith('/api/')) {
        const success = res.statusCode < 400;
        const action = `${req.method}_${req.path.split('/').pop()}`;
        
        if (!success) {
          auditLogger.logFailedAction(
            req.user.id,
            req.user.email,
            action,
            req.path,
            body?.message || 'Unknown error',
            req
          );
        } else {
          auditLogger.logUserAction(
            req.user.id,
            req.user.email,
            action,
            req.path,
            body?.id || undefined,
            { method: req.method, statusCode: res.statusCode },
            req
          );
        }
      }
      
      return originalJson.call(this, body);
    };

    next();
  };
}

// Helpers para ações específicas
export const AuditActions = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  CREATE_TRANSACTION: 'create_transaction',
  UPDATE_TRANSACTION: 'update_transaction',
  DELETE_TRANSACTION: 'delete_transaction',
  UPLOAD_DOCUMENT: 'upload_document',
  DELETE_DOCUMENT: 'delete_document',
  BANK_CONNECT: 'bank_connect',
  BANK_SYNC: 'bank_sync',
  BANK_DISCONNECT: 'bank_disconnect',
  CREATE_INSURANCE: 'create_insurance',
  UPDATE_INSURANCE: 'update_insurance',
  DELETE_INSURANCE: 'delete_insurance',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data'
} as const;
