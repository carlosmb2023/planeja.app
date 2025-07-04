import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { 
  Building2, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Plus,
  RefreshCw,
  Eye,
  Download,
  Unlink
} from 'lucide-react';

interface BankConnection {
  id: string;
  bankCode: string;
  bankName: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  consentId: string;
  expiresAt: string;
  permissions: string[];
  lastSync: string;
  accountCount: number;
}

interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'investment';
  accountNumber: string;
  agency: string;
  balance: number;
  currency: string;
  lastSync: string;
  isActive: boolean;
}

const AVAILABLE_BANKS = [
  { code: '001', name: 'Banco do Brasil', logo: '🏦' },
  { code: '104', name: 'Caixa Econômica Federal', logo: '🏛️' },
  { code: '237', name: 'Bradesco', logo: '🏪' },
  { code: '341', name: 'Itaú Unibanco', logo: '🏢' },
  { code: '033', name: 'Santander', logo: '🏬' },
  { code: '260', name: 'Nubank', logo: '💜' },
  { code: '077', name: 'Banco Inter', logo: '🧡' },
  { code: '336', name: 'Banco C6', logo: '💛' }
];

export default function BankIntegration() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
    loadAccounts();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/bank-connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const initiateConnection = async (bankCode: string) => {
    setLoading(true);
    
    try {
      // Solicitar permissões para o usuário
      const permissions = [
        'ACCOUNTS_READ',
        'ACCOUNTS_BALANCES_READ', 
        'RESOURCES_READ'
      ];

      const response = await fetch('/api/bank-connections/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bankCode, permissions })
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        
        // Redirecionar para o banco para autorização
        window.location.href = authUrl;
      } else {
        throw new Error('Erro ao iniciar conexão');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao conectar com o banco. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const syncConnection = async (connectionId: string) => {
    setSyncing(connectionId);
    
    try {
      const response = await fetch(`/api/bank-connections/${connectionId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadConnections();
        await loadAccounts();
        alert('Sincronização concluída com sucesso!');
      } else {
        throw new Error('Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro na sincronização. Tente novamente.');
    } finally {
      setSyncing(null);
    }
  };

  const disconnectBank = async (connectionId: string) => {
    if (!confirm('Tem certeza que deseja desconectar este banco? Suas transações serão mantidas, mas não serão mais sincronizadas automaticamente.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bank-connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadConnections();
        await loadAccounts();
      } else {
        throw new Error('Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao desconectar. Tente novamente.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      connected: 'Conectado',
      error: 'Erro',
      expired: 'Expirado',
      disconnected: 'Desconectado'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatAccountType = (type: string) => {
    const types = {
      checking: 'Conta Corrente',
      savings: 'Poupança',
      investment: 'Investimento'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const connectedBanks = connections.filter(c => c.status === 'connected');
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integração Bancária</h1>
          <p className="text-muted-foreground mt-2">
            Conecte suas contas bancárias para sincronização automática via Open Banking
          </p>
        </div>
      </div>

      {/* Open Banking Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Open Banking</strong> é um sistema seguro regulamentado pelo Banco Central do Brasil 
          que permite compartilhar seus dados financeiros entre instituições autorizadas. 
          Você mantém total controle sobre quais dados compartilhar e por quanto tempo.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bancos Conectados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedBanks.length}</div>
            <p className="text-xs text-muted-foreground">
              {connections.length} total de conexões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Sincronizadas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Atualizadas automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Todas as contas conectadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Banks */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bancos Conectados</CardTitle>
            <CardDescription>
              Gerencie suas conexões bancárias e sincronize dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {AVAILABLE_BANKS.find(b => b.code === connection.bankCode)?.logo || '🏦'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{connection.bankName}</h3>
                      {getStatusIcon(connection.status)}
                      {getStatusBadge(connection.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {connection.accountCount} contas • 
                      Último sync: {new Date(connection.lastSync).toLocaleDateString('pt-BR')} •
                      Expira: {new Date(connection.expiresAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Permissões: {connection.permissions.join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {connection.status === 'connected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncConnection(connection.id)}
                      disabled={syncing === connection.id}
                    >
                      {syncing === connection.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sincronizar
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConnection(
                      selectedConnection === connection.id ? null : connection.id
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    Contas
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectBank(connection.id)}
                  >
                    <Unlink className="h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      {selectedConnection && (
        <Card>
          <CardHeader>
            <CardTitle>Contas do Banco</CardTitle>
            <CardDescription>
              Detalhes das contas conectadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts
                .filter(account => connections.find(c => c.id === selectedConnection)?.bankCode === account.bankCode)
                .map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{formatAccountType(account.accountType)}</h4>
                        <Badge variant="outline">
                          Ag. {account.agency} • Conta {account.accountNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Último sync: {new Date(account.lastSync).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(account.balance)}</div>
                      <div className="text-sm text-muted-foreground">{account.currency}</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Bank */}
      <Card>
        <CardHeader>
          <CardTitle>Conectar Novo Banco</CardTitle>
          <CardDescription>
            Escolha um banco para conectar via Open Banking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_BANKS
              .filter(bank => !connections.some(c => c.bankCode === bank.code && c.status === 'connected'))
              .map((bank) => (
                <Button
                  key={bank.code}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => initiateConnection(bank.code)}
                  disabled={loading}
                >
                  <div className="text-2xl">{bank.logo}</div>
                  <div className="text-sm font-medium text-center">{bank.name}</div>
                  <Plus className="h-4 w-4" />
                </Button>
              ))}
          </div>
          
          {AVAILABLE_BANKS.every(bank => 
            connections.some(c => c.bankCode === bank.code && c.status === 'connected')
          ) && (
            <div className="text-center py-8 text-muted-foreground">
              Todos os bancos disponíveis já estão conectados!
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Open Banking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                1. Autorização Segura
              </h4>
              <p className="text-sm text-muted-foreground">
                Você autoriza o compartilhamento diretamente no site/app do seu banco, 
                usando suas credenciais habituais.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                2. Dados Criptografados
              </h4>
              <p className="text-sm text-muted-foreground">
                Todas as informações são transmitidas com criptografia de nível bancário 
                e armazenadas com segurança.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                3. Sincronização Automática
              </h4>
              <p className="text-sm text-muted-foreground">
                Suas transações são importadas automaticamente, mantendo seus dados 
                financeiros sempre atualizados.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                4. Controle Total
              </h4>
              <p className="text-sm text-muted-foreground">
                Você pode revogar o acesso a qualquer momento e escolher exatamente 
                quais dados compartilhar.
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Regulamentação:</strong> O Open Banking é regulamentado pelo Banco Central do Brasil 
              através da Resolução nº 4.658/2018 e Lei Complementar nº 105/2001.
            </p>
            <p className="mt-2">
              <strong>Segurança:</strong> Utilizamos certificados digitais ICP-Brasil e APIs padronizadas 
              para garantir a máxima segurança das suas informações.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
