import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    const newNotifications: Notification[] = [];

    // Verificar seguros próximos do vencimento
    if (insurances.length > 0) {
      const today = new Date();
      insurances.forEach((insurance: any) => {
        if (!insurance.isActive) return;
        
        const endDate = new Date(insurance.endDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= insurance.notificationDays && diffDays > 0) {
          newNotifications.push({
            id: `insurance-${insurance.id}`,
            type: 'warning',
            title: 'Seguro próximo do vencimento',
            message: `Seu seguro ${insurance.type} com a ${insurance.insurer} vence em ${diffDays} dias (${format(endDate, "dd/MM/yyyy", { locale: ptBR })}).`,
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/insurances'
          });
        } else if (diffDays <= 0) {
          newNotifications.push({
            id: `insurance-expired-${insurance.id}`,
            type: 'warning',
            title: 'Seguro vencido',
            message: `Seu seguro ${insurance.type} com a ${insurance.insurer} venceu em ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}. Renove urgentemente!`,
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/insurances'
          });
        }
      });
    }

    // Verificar meta de aposentadoria
    if (retirementGoal) {
      const progress = (parseFloat(retirementGoal.currentAmount) / parseFloat(retirementGoal.targetAmount)) * 100;
      
      if (progress >= 25 && progress < 30) {
        newNotifications.push({
          id: 'retirement-25',
          type: 'info',
          title: 'Meta de Aposentadoria - 25%',
          message: `Parabéns! Você já atingiu 25% da sua meta de aposentadoria. Continue poupando!`,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/goals'
        });
      } else if (progress >= 50 && progress < 55) {
        newNotifications.push({
          id: 'retirement-50',
          type: 'success',
          title: 'Meta de Aposentadoria - 50%',
          message: `Excelente! Você já atingiu metade da sua meta de aposentadoria!`,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/goals'
        });
      } else if (progress >= 75 && progress < 80) {
        newNotifications.push({
          id: 'retirement-75',
          type: 'success',
          title: 'Meta de Aposentadoria - 75%',
          message: `Fantástico! Você está muito próximo da sua meta de aposentadoria!`,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/goals'
        });
      }
    }

    // Adicionar notificações educacionais
    const lastEducationNotification = localStorage.getItem('lastEducationNotification');
    const today = new Date().toDateString();
    
    if (lastEducationNotification !== today) {
      newNotifications.push({
        id: 'education-tip',
        type: 'info',
        title: 'Dica Educacional',
        message: 'Que tal completar um módulo de educação financeira hoje? Conhecimento é a base para decisões financeiras inteligentes!',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/education'
      });
      localStorage.setItem('lastEducationNotification', today);
    }

    setNotifications(newNotifications);
  }, [insurances, retirementGoal]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5 text-gray-400" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-4 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} não lidas</Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600">
                  Quando houver atualizações importantes, elas aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`border ${notification.isRead ? 'opacity-60' : ''} ${colorClass}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs opacity-70">
                            {format(parseISO(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {notification.actionUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto mt-2"
                              onClick={() => {
                                window.location.href = notification.actionUrl!;
                                setIsOpen(false);
                              }}
                            >
                              Ver detalhes →
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            ✓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
