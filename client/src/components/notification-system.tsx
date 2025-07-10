/**
 * Sistema de Notificações - Interface e Hooks
 * 
 * Gerencia notificações in-app com diferentes tipos e prioridades
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category?: 'insurance' | 'goal' | 'transaction' | 'security' | 'general';
  priority?: 'low' | 'medium' | 'high';
  read?: boolean;
  createdAt: string;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remover notificações de baixa prioridade após 10 segundos
    if (notification.priority === 'low') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 10000);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== id)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Limitar número de notificações
  useEffect(() => {
    if (notifications.length > 50) {
      setNotifications(prev => prev.slice(0, 50));
    }
  }, [notifications]);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Limpar notificações expiradas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(notif => !notif.expiresAt || notif.expiresAt > now)
      );
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Componente para gerar notificações automáticas baseadas em dados
function AutoNotificationGenerator() {
  const { addNotification } = useNotifications();

  const { data: insurances = [] } = useQuery({
    queryKey: ["/api/insurances"],
    queryFn: async () => {
      const response = await fetch("/api/insurances", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: retirementGoal } = useQuery({
    queryKey: ["/api/retirement/goal"],
    queryFn: async () => {
      const response = await fetch("/api/retirement/goal", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Gerar notificações baseadas em dados
  useEffect(() => {
    // Verificar seguros próximos do vencimento
    insurances.forEach((insurance: any) => {
      if (insurance.isActive && insurance.endDate) {
        const endDate = parseISO(insurance.endDate);
        const daysUntilExpiry = differenceInDays(endDate, new Date());
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          addNotification({
            title: "Seguro próximo do vencimento",
            message: `Seu ${insurance.type} vence em ${daysUntilExpiry} dias`,
            type: daysUntilExpiry <= 7 ? 'error' : 'warning',
            category: 'insurance',
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            actionUrl: '/insurances',
            actionLabel: 'Ver Seguros'
          });
        }
      }
    });

    // Verificar progresso da aposentadoria
    if (retirementGoal) {
      const progress = (parseFloat(retirementGoal.currentAmount) / parseFloat(retirementGoal.targetAmount)) * 100;
      
      if (progress >= 25 && progress < 30) {
        addNotification({
          title: "Marco da Aposentadoria",
          message: "Parabéns! Você atingiu 25% da sua meta de aposentadoria",
          type: 'success',
          category: 'goal',
          priority: 'medium',
          actionUrl: '/goals',
          actionLabel: 'Ver Metas'
        });
      }
    }
  }, [insurances, retirementGoal, addNotification]);

  return null;
}

// Componente de Bell de Notificações
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, removeNotification, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <>
      <AutoNotificationGenerator />
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notificações</DialogTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border rounded-lg transition-colors cursor-pointer",
                    notification.read 
                      ? "bg-muted/50 border-muted" 
                      : "bg-background border-primary/20 hover:bg-muted/30"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getIcon(notification.type)}
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {notification.actionUrl && notification.actionLabel && (
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                      >
                        {notification.actionLabel}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook para criar notificações facilmente
export function useNotificationActions() {
  const { addNotification } = useNotifications();

  const showSuccess = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'success',
      category: 'general',
      priority: 'low',
      ...options
    });
  };

  const showError = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'error',
      category: 'general',
      priority: 'high',
      ...options
    });
  };

  const showWarning = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'warning',
      category: 'general',
      priority: 'medium',
      ...options
    });
  };

  const showInfo = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'info',
      category: 'general',
      priority: 'low',
      ...options
    });
  };

  const showInsuranceExpiry = (insuranceName: string, daysLeft: number) => {
    addNotification({
      title: 'Seguro próximo do vencimento',
      message: `Seu seguro ${insuranceName} vence em ${daysLeft} dias`,
      type: daysLeft <= 7 ? 'error' : 'warning',
      category: 'insurance',
      priority: daysLeft <= 7 ? 'high' : 'medium',
      actionUrl: '/insurances',
      actionLabel: 'Ver Seguros'
    });
  };

  const showGoalMilestone = (goalName: string, percentage: number) => {
    addNotification({
      title: 'Meta alcançada!',
      message: `Parabéns! Você atingiu ${percentage}% da meta "${goalName}"`,
      type: 'success',
      category: 'goal',
      priority: 'medium',
      actionUrl: '/goals',
      actionLabel: 'Ver Metas'
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showInsuranceExpiry,
    showGoalMilestone
  };
}
