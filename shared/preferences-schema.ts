/**
 * Configurações de Privacidade e Notificações
 * 
 * Gerencia preferências do usuário para privacidade e notificações
 */

import { pgTable, serial, integer, boolean, timestamp, text, jsonb } from "drizzle-orm/pg-core";

// Tabela para configurações de notificação
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Configurações de email
  emailInsuranceExpiry: boolean("email_insurance_expiry").default(true),
  emailGoalMilestone: boolean("email_goal_milestone").default(true),
  emailTransactionAlert: boolean("email_transaction_alert").default(false),
  emailWeeklyReport: boolean("email_weekly_report").default(true),
  emailMonthlyReport: boolean("email_monthly_report").default(true),
  emailSecurityAlert: boolean("email_security_alert").default(true),
  
  // Configurações de notificação in-app
  inAppInsuranceExpiry: boolean("in_app_insurance_expiry").default(true),
  inAppGoalMilestone: boolean("in_app_goal_milestone").default(true),
  inAppTransactionAlert: boolean("in_app_transaction_alert").default(false),
  inAppBankSync: boolean("in_app_bank_sync").default(true),
  inAppSecurityAlert: boolean("in_app_security_alert").default(true),
  
  // Configurações push (para futuro app mobile)
  pushEnabled: boolean("push_enabled").default(false),
  pushInsuranceExpiry: boolean("push_insurance_expiry").default(true),
  pushGoalMilestone: boolean("push_goal_milestone").default(true),
  pushSecurityAlert: boolean("push_security_alert").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para configurações de privacidade
export const privacySettings = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Configurações de dados
  allowDataAnalytics: boolean("allow_data_analytics").default(true),
  allowPerformanceTracking: boolean("allow_performance_tracking").default(true),
  allowMarketingEmails: boolean("allow_marketing_emails").default(false),
  
  // Configurações de sessão
  sessionTimeout: integer("session_timeout").default(30), // minutos
  requireReauthForSensitive: boolean("require_reauth_for_sensitive").default(true),
  
  // Configurações de backup
  allowCloudBackup: boolean("allow_cloud_backup").default(true),
  encryptBackups: boolean("encrypt_backups").default(true),
  
  // Configurações de compartilhamento
  allowDataExport: boolean("allow_data_export").default(true),
  allowThirdPartyIntegrations: boolean("allow_third_party_integrations").default(false),
  
  // Log de atividades
  logUserActivity: boolean("log_user_activity").default(true),
  retainLogsForDays: integer("retain_logs_for_days").default(90),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para logs de consentimento
export const consentLogs = pgTable("consent_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  consentType: text("consent_type").notNull(), // 'privacy_policy', 'terms_of_service', 'data_processing', etc.
  version: text("version").notNull(), // versão do documento
  accepted: boolean("accepted").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tabela para preferências de tema e interface
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Tema e aparência
  theme: text("theme").default('system'), // 'light', 'dark', 'system'
  language: text("language").default('pt-BR'),
  currency: text("currency").default('BRL'),
  timezone: text("timezone").default('America/Sao_Paulo'),
  
  // Dashboard personalização
  dashboardLayout: jsonb("dashboard_layout"), // Layout personalizado dos cards
  defaultView: text("default_view").default('dashboard'), // página padrão ao fazer login
  
  // Preferências de relatórios
  defaultReportPeriod: text("default_report_period").default('monthly'),
  includeProjections: boolean("include_projections").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos TypeScript
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export type PrivacySettings = typeof privacySettings.$inferSelect;
export type InsertPrivacySettings = typeof privacySettings.$inferInsert;

export type ConsentLog = typeof consentLogs.$inferSelect;
export type InsertConsentLog = typeof consentLogs.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
