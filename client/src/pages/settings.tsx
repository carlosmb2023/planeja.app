import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings, User, Bell, Shield, Palette, Database, Download, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";

export default function Settings() {
  const [settings, setSettings] = useState({
    // Notificações
    emailNotifications: true,
    pushNotifications: true,
    insuranceNotifications: true,
    goalNotifications: true,
    educationReminders: true,
    
    // Preferências
    currency: 'BRL',
    language: 'pt-BR',
    theme: 'light',
    
    // Privacidade
    shareAnalytics: false,
    dataEncryption: true,
    autoLogout: 30, // minutos
    
    // Metas
    defaultRetirementAge: 65,
    riskProfile: 'moderate',
    notificationDays: 30
  });

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    occupation: ''
  });

  const { toast } = useToast();

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileChange = (key: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Salvar configurações no localStorage por enquanto
    localStorage.setItem('userSettings', JSON.stringify(settings));
    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  const saveProfile = () => {
    // Aqui seria uma chamada à API para salvar o perfil
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações pessoais foram atualizadas.",
    });
  };

  const exportData = () => {
    // Simular exportação de dados
    const data = {
      profile: profileData,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meus-dados-financeiros.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dados exportados!",
      description: "Seus dados foram baixados com sucesso.",
    });
  };

  const deleteAccount = () => {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      // Aqui seria uma chamada à API para deletar a conta
      authManager.logout();
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída permanentemente.",
        variant: "destructive",
      });
    }
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
              Configurações
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacidade
            </TabsTrigger>
          </TabsList>

          {/* Aba Perfil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      placeholder="Seu primeiro nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      placeholder="Seu sobrenome"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => handleProfileChange('birthDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="occupation">Profissão</Label>
                  <Input
                    id="occupation"
                    value={profileData.occupation}
                    onChange={(e) => handleProfileChange('occupation', e.target.value)}
                    placeholder="Sua profissão"
                  />
                </div>

                <Button onClick={saveProfile}>
                  Salvar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Notificações */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-gray-600">Receber notificações por email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-gray-600">Notificações no navegador</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('pushNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Vencimento de Seguros</Label>
                    <p className="text-sm text-gray-600">Alertas de vencimento de seguros</p>
                  </div>
                  <Switch
                    checked={settings.insuranceNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('insuranceNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Progresso de Metas</Label>
                    <p className="text-sm text-gray-600">Atualizações sobre suas metas</p>
                  </div>
                  <Switch
                    checked={settings.goalNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('goalNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lembretes Educacionais</Label>
                    <p className="text-sm text-gray-600">Dicas e lembretes de educação financeira</p>
                  </div>
                  <Switch
                    checked={settings.educationReminders}
                    onCheckedChange={(checked) => handleSettingsChange('educationReminders', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Antecedência para Notificações (dias)</Label>
                  <Input
                    type="number"
                    value={settings.notificationDays}
                    onChange={(e) => handleSettingsChange('notificationDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="mt-2"
                  />
                </div>

                <Button onClick={saveSettings}>
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Preferências */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferências do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Moeda</Label>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(value) => handleSettingsChange('currency', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Idioma</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => handleSettingsChange('language', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tema</Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value) => handleSettingsChange('theme', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Idade de Aposentadoria Padrão</Label>
                  <Input
                    type="number"
                    value={settings.defaultRetirementAge}
                    onChange={(e) => handleSettingsChange('defaultRetirementAge', parseInt(e.target.value))}
                    min="50"
                    max="80"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Perfil de Risco</Label>
                  <Select 
                    value={settings.riskProfile} 
                    onValueChange={(value) => handleSettingsChange('riskProfile', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservador</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="aggressive">Arrojado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={saveSettings}>
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Privacidade */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacidade e Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compartilhar Analytics</Label>
                    <p className="text-sm text-gray-600">Ajudar a melhorar o app compartilhando dados anônimos</p>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) => handleSettingsChange('shareAnalytics', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Criptografia de Dados</Label>
                    <p className="text-sm text-gray-600">Criptografar dados sensíveis</p>
                  </div>
                  <Switch
                    checked={settings.dataEncryption}
                    onCheckedChange={(checked) => handleSettingsChange('dataEncryption', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Logout Automático (minutos)</Label>
                  <Input
                    type="number"
                    value={settings.autoLogout}
                    onChange={(e) => handleSettingsChange('autoLogout', parseInt(e.target.value))}
                    min="5"
                    max="120"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Fazer logout automaticamente após período de inatividade
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Gerenciar Dados</h3>
                  
                  <Button onClick={exportData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Meus Dados
                  </Button>

                  <Button 
                    onClick={deleteAccount} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conta Permanentemente
                  </Button>
                </div>

                <Button onClick={saveSettings}>
                  Salvar Configurações de Privacidade
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
