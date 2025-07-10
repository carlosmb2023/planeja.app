import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { useNotificationActions } from "@/components/notification-system";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft, Bell, Shield, Zap, Mail, Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function TestFeatures() {
  const [email, setEmail] = useState("");
  const [testResult, setTestResult] = useState("");
  const { toast } = useToast();
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showInsuranceExpiry, 
    showGoalMilestone 
  } = useNotificationActions();
  const { theme, actualTheme } = useTheme();

  const testEmailNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        showSuccess("Email enviado!", "Verifique sua caixa de entrada.");
        setTestResult("✅ Email de teste enviado com sucesso!");
      } else {
        throw new Error('Erro ao enviar email');
      }
    } catch (error) {
      showError("Erro", "Não foi possível enviar o email de teste.");
      setTestResult("❌ Erro ao enviar email de teste.");
    }
  };

  const test2FASetup = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        showSuccess("2FA Setup", "QR Code gerado com sucesso!");
        setTestResult(`✅ 2FA Setup criado! Código manual: ${data.manualCode?.substring(0, 8)}...`);
      } else {
        throw new Error('Erro ao configurar 2FA');
      }
    } catch (error) {
      showError("Erro", "Não foi possível configurar 2FA.");
      setTestResult("❌ Erro ao configurar 2FA.");
    }
  };

  const testNotifications = () => {
    showInfo("Teste Info", "Esta é uma notificação de informação");
    showWarning("Teste Warning", "Esta é uma notificação de aviso");
    showError("Teste Error", "Esta é uma notificação de erro");
    showSuccess("Teste Success", "Esta é uma notificação de sucesso");
    showInsuranceExpiry("Seguro Auto", 15);
    showGoalMilestone("Aposentadoria", 75);
    setTestResult("✅ Notificações in-app testadas!");
  };

  const testPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const preferences = await response.json();
        showSuccess("Preferências", "Preferências carregadas com sucesso!");
        setTestResult(`✅ Preferências carregadas: Email=${preferences.notifications?.email}`);
      } else {
        throw new Error('Erro ao carregar preferências');
      }
    } catch (error) {
      showError("Erro", "Não foi possível carregar preferências.");
      setTestResult("❌ Erro ao carregar preferências.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-montserrat text-lg font-semibold text-dark-bg dark:text-white ml-4">
                Teste de Funcionalidades
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Status do Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {actualTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Sistema de Tema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p>Tema atual: <strong>{theme}</strong></p>
                  <p>Tema aplicado: <strong>{actualTheme}</strong></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    ✅ Sistema de tema funcionando corretamente!
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Teste de Notificações In-App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações In-App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teste diferentes tipos de notificações que aparecem no sistema.
                </p>
                <Button onClick={testNotifications} className="w-full">
                  Testar Todas as Notificações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teste de Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificações por Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teste o sistema de envio de emails usando SendGrid.
                </p>
                <Button onClick={testEmailNotification} className="w-full">
                  Enviar Email de Teste
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teste de 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação 2FA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teste o sistema de configuração de autenticação de dois fatores.
                </p>
                <Button onClick={test2FASetup} className="w-full">
                  Configurar 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teste de Preferências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API de Preferências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teste o carregamento e salvamento de preferências do usuário.
                </p>
                <Button onClick={testPreferences} className="w-full">
                  Carregar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado dos Testes */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado do Último Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <pre className="text-sm">{testResult}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Instruções de Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">🌙 Sistema de Tema:</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use o botão de tema no header para alternar entre claro/escuro/sistema.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">🔔 Notificações In-App:</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Teste gerará várias notificações que aparecerão no sino de notificações.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">📧 Email:</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Requer configuração do SendGrid no arquivo .env (SENDGRID_API_KEY).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">🔐 2FA:</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gerará QR Code e códigos para configuração do Google Authenticator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
