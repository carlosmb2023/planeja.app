import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Lock, LogOut, Bell, Shield, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/bottom-navigation";

export default function Profile() {
  const user = authManager.getUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleLogout = () => {
    authManager.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-montserrat text-lg font-semibold text-dark-bg ml-4">
              Meu Perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-dark-bg">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-primary mt-1">Cooperado desde 2025</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Nome
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={user?.firstName || ''}
                  className="mt-2"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={user?.lastName || ''}
                  className="mt-2"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="mt-2"
                  readOnly
                />
              </div>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="font-medium text-dark-bg">Autenticação de Dois Fatores</p>
                    <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                  </div>
                </div>
                <Switch
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="font-medium text-dark-bg">Notificações</p>
                    <p className="text-sm text-gray-600">Receba alertas sobre suas finanças</p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Suporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Central de Ajuda
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Fale Conosco
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}