/**
 * Sistema de Notificações - Email e Push
 * 
 * Gerencia o envio de notificações por email usando SendGrid
 * e prepara a base para notificações push futuras
 */

import sgMail from '@sendgrid/mail';
import { log } from './vite';

// Configuração do SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@planeja.com.br';
const FROM_NAME = process.env.FROM_NAME || 'Planeja';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface NotificationConfig {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  inApp?: boolean;
}

export interface EmailNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: number;
  insuranceExpiry: NotificationConfig;
  goalMilestone: NotificationConfig;
  transactionAlert: NotificationConfig;
  weeklyReport: NotificationConfig;
  monthlyReport: NotificationConfig;
  securityAlert: NotificationConfig;
  updatedAt: Date;
}

export class NotificationService {
  /**
   * Envia notificação por email
   */
  static async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      if (!SENDGRID_API_KEY) {
        log('SendGrid não configurado, simulando envio de email');
        return true;
      }

      const msg = {
        to: notification.to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        subject: notification.subject,
        html: notification.htmlContent,
        text: notification.textContent || notification.subject
      };

      await sgMail.send(msg);
      log(`Email enviado com sucesso para ${notification.to}`);
      return true;
    } catch (error: any) {
      log(`Erro ao enviar email: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia notificação de vencimento de seguro
   */
  static async sendInsuranceExpiryAlert(
    userEmail: string, 
    insuranceName: string, 
    expiryDate: string,
    daysUntilExpiry: number
  ): Promise<boolean> {
    const subject = `⚠️ Seguro ${insuranceName} vence em ${daysUntilExpiry} dias`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00AE9D 0%, #008B7A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Alerta de Vencimento</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Seu seguro <strong>${insuranceName}</strong> está próximo do vencimento.
          </p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #ff6b6b; margin: 0 0 10px 0;">📅 Data de Vencimento</h3>
            <p style="color: #333; margin: 0; font-size: 18px; font-weight: bold;">${expiryDate}</p>
            <p style="color: #666; margin: 5px 0 0 0;">Faltam apenas ${daysUntilExpiry} dias!</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">💡 O que fazer agora?</h3>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li>Entre em contato com sua seguradora</li>
              <li>Verifique as condições de renovação</li>
              <li>Compare preços no mercado</li>
              <li>Atualize seus dados no Planeja após a renovação</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://planeja.com.br/insurances" 
               style="background: #00AE9D; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Gerenciar Seguros
            </a>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Este é um email automático do Planeja. Não responda este email.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      htmlContent
    });
  }

  /**
   * Envia notificação de meta alcançada
   */
  static async sendGoalMilestoneAlert(
    userEmail: string,
    goalName: string,
    currentAmount: number,
    targetAmount: number,
    percentage: number
  ): Promise<boolean> {
    const subject = `🎉 Parabéns! Você alcançou ${percentage}% da sua meta!`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00AE9D 0%, #008B7A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Meta Alcançada!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Parabéns!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Você alcançou um marco importante na sua meta <strong>${goalName}</strong>!
          </p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
            <h3 style="color: #4caf50; margin: 0 0 10px 0;">📊 Progresso Atual</h3>
            <p style="color: #333; margin: 5px 0;">
              <strong>Valor Atual:</strong> R$ ${currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Meta:</strong> R$ ${targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Progresso:</strong> ${percentage}%
            </p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0;">🚀 Continue assim!</h3>
            <p style="color: #666; margin: 0;">
              Seu progresso está excelente! Continue mantendo o foco e 
              em breve você alcançará sua meta completa.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://planeja.com.br/goals" 
               style="background: #00AE9D; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ver Metas
            </a>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Este é um email automático do Planeja. Não responda este email.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      htmlContent
    });
  }

  /**
   * Envia alerta de segurança
   */
  static async sendSecurityAlert(
    userEmail: string,
    alertType: string,
    details: string,
    timestamp: Date
  ): Promise<boolean> {
    const subject = `🔐 Alerta de Segurança - ${alertType}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #d63031 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Alerta de Segurança</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Atenção!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Detectamos uma atividade de segurança em sua conta.
          </p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #ff6b6b; margin: 0 0 10px 0;">⚠️ Detalhes do Alerta</h3>
            <p style="color: #333; margin: 5px 0;"><strong>Tipo:</strong> ${alertType}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Data/Hora:</strong> ${timestamp.toLocaleString('pt-BR')}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Detalhes:</strong> ${details}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">🛡️ Recomendações</h3>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li>Verifique se foi você quem realizou esta ação</li>
              <li>Se não reconhece, altere sua senha imediatamente</li>
              <li>Revise as configurações de segurança da sua conta</li>
              <li>Entre em contato conosco se precisar de ajuda</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://planeja.com.br/settings" 
               style="background: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
              Alterar Senha
            </a>
            <a href="https://planeja.com.br/profile" 
               style="background: #6c757d; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ver Perfil
            </a>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Este é um email automático do Planeja. Não responda este email.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      htmlContent
    });
  }

  /**
   * Envia relatório semanal
   */
  static async sendWeeklyReport(
    userEmail: string,
    userName: string,
    weeklyData: {
      totalIncome: number;
      totalExpenses: number;
      balance: number;
      topCategories: Array<{ name: string; amount: number }>;
    }
  ): Promise<boolean> {
    const subject = `📊 Seu Relatório Semanal - Planeja`;
    
    const topCategoriesHtml = weeklyData.topCategories
      .map(cat => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
          <span style="color: #666;">${cat.name}</span>
          <span style="color: #333; font-weight: bold;">R$ ${cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00AE9D 0%, #008B7A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Relatório Semanal</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${userName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Aqui está o resumo da sua semana financeira:
          </p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #4caf50;">
              <h3 style="color: #4caf50; margin: 0; font-size: 14px;">Receitas</h3>
              <p style="color: #333; margin: 5px 0; font-size: 20px; font-weight: bold;">
                R$ ${weeklyData.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #ff6b6b; margin: 0; font-size: 14px;">Despesas</h3>
              <p style="color: #333; margin: 5px 0; font-size: 20px; font-weight: bold;">
                R$ ${weeklyData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #00AE9D;">
              <h3 style="color: #00AE9D; margin: 0; font-size: 14px;">Saldo</h3>
              <p style="color: #333; margin: 5px 0; font-size: 20px; font-weight: bold;">
                R$ ${weeklyData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0;">🏆 Principais Categorias de Gastos</h3>
            ${topCategoriesHtml}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://planeja.com.br/analytics" 
               style="background: #00AE9D; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ver Relatório Completo
            </a>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Este é um email automático do Planeja. Não responda este email.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      htmlContent
    });
  }
}
