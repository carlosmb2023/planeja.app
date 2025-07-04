# Sistema de Open Banking - CooperativeFuture

## O que é Open Banking?

O Open Banking é um conjunto de regras e tecnologias que permite o compartilhamento de dados e serviços entre instituições financeiras, de forma segura e regulamentada. No Brasil, é regulamentado pelo Banco Central (BACEN) através da Resolução nº 4.658/2018 e operacionalizado pela estrutura do PIX e SPB.

## Como Funciona no CooperativeFuture

### 1. Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CooperativeFuture │    │      Banco       │    │   Banco Central │
│    (Aplicação)      │    │    (API OB)      │    │     (BACEN)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ 1. Solicita consentimento │                        │
         ├───────────────────────────┤                        │
         │                        │                        │
         │ 2. Redireciona p/ auth │                        │
         │────────────────────────▶│                        │
         │                        │                        │
         │    3. Usuário autentica │                        │
         │◀───────────────────────┤                        │
         │                        │                        │
         │ 4. Recebe código       │                        │
         │◀───────────────────────┤                        │
         │                        │                        │
         │ 5. Troca por token     │                        │
         ├───────────────────────▶│                        │
         │                        │                        │
         │ 6. Consulta dados      │                        │
         ├───────────────────────▶│                        │
         │                        │                        │
```

### 2. Fluxo de Integração

#### Etapa 1: Iniciação do Consentimento
```typescript
// No frontend (bank-integration.tsx)
const initiateConnection = async (bankCode: string) => {
  const response = await fetch('/api/bank-connections/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      bankCode, 
      permissions: ['ACCOUNTS_READ', 'ACCOUNTS_BALANCES_READ'] 
    })
  });
  
  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redireciona para o banco
};
```

#### Etapa 2: Processamento no Backend
```typescript
// No backend (routes.ts)
app.post('/api/bank-connections/initiate', async (req, res) => {
  const { bankCode, permissions } = req.body;
  
  // Cria consentimento via API do banco
  const bankService = new BankIntegrationService(BANK_CONFIGS[bankCode]);
  const consentId = await bankService.initiateConsent(bankCode, permissions);
  
  // Gera URL de autorização
  const authUrl = `${bankConfig.authorizationServer}/auth?` +
    `response_type=code&` +
    `client_id=${bankConfig.clientId}&` +
    `consent_id=${consentId}`;
    
  res.json({ authUrl });
});
```

#### Etapa 3: Integração com APIs Bancárias
```typescript
// bankIntegration.ts
export class BankIntegrationService {
  async initiateConsent(bankCode: string, permissions: string[]): Promise<string> {
    const consentData = {
      data: {
        permissions,
        expirationDateTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        transactionFromDateTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        transactionToDateTime: new Date().toISOString()
      }
    };

    const response = await fetch(`${this.baseUrl}/consents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getClientCredentialsToken()}`,
        'x-fapi-interaction-id': this.generateInteractionId()
      },
      body: JSON.stringify(consentData)
    });

    const result = await response.json();
    return result.data.consentId;
  }
}
```

### 3. Tipos de Dados Acessíveis

#### Dados de Conta
- **Informações básicas**: Número da conta, agência, tipo de conta
- **Saldos**: Saldo disponível, saldo bloqueado, limite
- **Identificação**: Dados do titular, CPF/CNPJ

#### Transações
- **Histórico**: Transações dos últimos 12 meses
- **Detalhes**: Valor, data, descrição, código da transação
- **Categorização**: Tipo de transação, merchant, localização

#### Produtos e Serviços
- **Cartões**: Informações de cartões associados
- **Empréstimos**: Contratos de crédito ativos
- **Investimentos**: Produtos de investimento

### 4. Segurança e Compliance

#### Certificação Digital
```typescript
// Configuração de certificados (em produção)
const httpsAgent = new https.Agent({
  cert: fs.readFileSync('certificado-icp-brasil.pem'),
  key: fs.readFileSync('chave-privada.pem'),
  ca: fs.readFileSync('cadeia-certificados.pem'),
  rejectUnauthorized: true
});
```

#### Headers Obrigatórios
```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'x-fapi-interaction-id': generateInteractionId(), // UUID único por requisição
  'x-customer-user-agent': 'CooperativeFuture/1.0', // Identificação da aplicação
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

#### Refresh de Tokens
```typescript
private async refreshAccessToken(connection: BankConnection): Promise<void> {
  const tokenData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: connection.refreshToken
  });

  const response = await fetch(`${this.baseUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
    },
    body: tokenData
  });

  const result = await response.json();
  connection.accessToken = result.access_token;
  connection.expiresAt = new Date(Date.now() + result.expires_in * 1000);
}
```

### 5. Principais Bancos Integrados

```typescript
export const BANK_CONFIGS: Record<string, OpenBankingConfig> = {
  '001': { // Banco do Brasil
    clientId: process.env.BB_CLIENT_ID,
    clientSecret: process.env.BB_CLIENT_SECRET,
    authorizationServer: 'https://auth.openbanking.bb.com.br',
    resourceServer: 'https://api.openbanking.bb.com.br'
  },
  '237': { // Bradesco
    clientId: process.env.BRADESCO_CLIENT_ID,
    clientSecret: process.env.BRADESCO_CLIENT_SECRET,
    authorizationServer: 'https://auth.openbanking.bradesco.com.br',
    resourceServer: 'https://api.openbanking.bradesco.com.br'
  },
  '341': { // Itaú
    clientId: process.env.ITAU_CLIENT_ID,
    clientSecret: process.env.ITAU_CLIENT_SECRET,
    authorizationServer: 'https://auth.openbanking.itau.com.br',
    resourceServer: 'https://api.openbanking.itau.com.br'
  }
  // ... outros bancos
};
```

### 6. Tratamento de Erros

#### Códigos de Status Comuns
- **200**: Sucesso
- **400**: Dados inválidos ou malformados
- **401**: Token expirado ou inválido
- **403**: Permissões insuficientes
- **404**: Recurso não encontrado
- **429**: Rate limit excedido
- **500**: Erro interno do banco

#### Implementação de Retry
```typescript
async function apiCallWithRetry(apiCall: () => Promise<Response>, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();
      
      if (response.status === 429) {
        // Rate limit - aguardar antes de tentar novamente
        const retryAfter = response.headers.get('Retry-After') || '60';
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        continue;
      }
      
      if (response.status === 401 && attempt === 1) {
        // Token expirado - tentar renovar
        await this.refreshAccessToken(connection);
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Backoff exponencial
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Máximo de tentativas excedido');
}
```

### 7. Monitoramento e Logs

#### Métricas Importantes
- **Latência das APIs**: Tempo de resposta dos bancos
- **Taxa de sucesso**: Porcentagem de chamadas bem-sucedidas
- **Uptime dos bancos**: Disponibilidade das APIs
- **Volume de transações**: Quantidade de dados sincronizados

#### Logs Estruturados
```typescript
const logger = {
  info: (message: string, metadata: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      bankCode: metadata.bankCode,
      connectionId: metadata.connectionId,
      endpoint: metadata.endpoint,
      responseTime: metadata.responseTime
    }));
  },
  
  error: (message: string, error: Error, metadata: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...metadata
    }));
  }
};
```

### 8. Ambiente de Desenvolvimento vs Produção

#### Sandbox (Desenvolvimento)
```typescript
const SANDBOX_CONFIGS = {
  '001': {
    authorizationServer: 'https://auth.sandbox.openbanking.bb.com.br',
    resourceServer: 'https://api.sandbox.openbanking.bb.com.br'
  }
};
```

#### Produção
```typescript
const PRODUCTION_CONFIGS = {
  '001': {
    authorizationServer: 'https://auth.openbanking.bb.com.br',
    resourceServer: 'https://api.openbanking.bb.com.br'
  }
};
```

### 9. Categorização Automática de Transações

```typescript
private categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  
  const rules = [
    { pattern: /pix|ted|doc/, category: 'transferencia' },
    { pattern: /deb aut|debito automatico/, category: 'conta-fixa' },
    { pattern: /saque/, category: 'saque' },
    { pattern: /cart|visa|master/, category: 'cartao' },
    { pattern: /farmacia|drogaria/, category: 'saude' },
    { pattern: /supermercado|mercado/, category: 'alimentacao' },
    { pattern: /posto|combustivel/, category: 'transporte' },
    { pattern: /salario|ordenado/, category: 'salario' }
  ];
  
  for (const rule of rules) {
    if (rule.pattern.test(desc)) {
      return rule.category;
    }
  }
  
  return 'outros';
}
```

### 10. Sincronização Automática

```typescript
// Agendamento de sincronização automática
const scheduleSync = () => {
  setInterval(async () => {
    const activeConnections = bankConnections.filter(c => c.status === 'connected');
    
    for (const connection of activeConnections) {
      try {
        await syncConnection(connection.id);
        console.log(`Sincronização automática concluída: ${connection.bankName}`);
      } catch (error) {
        console.error(`Erro na sincronização automática: ${connection.bankName}`, error);
      }
    }
  }, 4 * 60 * 60 * 1000); // A cada 4 horas
};
```

## Benefícios para o Usuário

1. **Visão Unificada**: Todas as contas em um só lugar
2. **Categorização Automática**: Transações categorizadas automaticamente
3. **Análises Avançadas**: Insights baseados em dados reais
4. **Planejamento Inteligente**: Metas baseadas no histórico real
5. **Segurança**: Dados criptografados e acesso controlado

## Próximos Passos

1. **Certificação**: Obter certificados ICP-Brasil para produção
2. **Homologação**: Registrar aplicação nos bancos parceiros
3. **Testes**: Validar em ambiente sandbox de cada banco
4. **Conformidade**: Auditoria de segurança e compliance
5. **Lançamento**: Deploy em produção com monitoramento

## Regulamentação

- **Resolução BACEN nº 4.658/2018**: Regulamenta o Open Banking
- **Lei Complementar nº 105/2001**: Lei do Sigilo Bancário
- **LGPD**: Lei Geral de Proteção de Dados
- **Circular BACEN nº 4.015/2020**: Aspectos técnicos e operacionais
