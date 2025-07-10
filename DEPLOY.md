# Planeja App - Deploy

Este arquivo contém as instruções para fazer o deploy da aplicação Planeja.

## Opções de Deploy

### 1. Deploy Local (Desenvolvimento)
```bash
npm run dev
```
- Acesse: http://localhost:5173
- Ideal para desenvolvimento e testes

### 2. Deploy em Servidor VPS/Cloud

#### Preparação:
1. Clone o repositório no servidor
2. Configure as variáveis de ambiente
3. Instale as dependências
4. Execute o servidor

#### Comandos:
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento (recomendado para agora)
npm run dev

# Ou usar PM2 para manter o processo ativo
npm install -g pm2
pm2 start "npm run dev" --name planeja-app
```

**Nota**: Devido a problemas com o build de produção no CSS/PostCSS, por enquanto é recomendado usar o modo desenvolvimento mesmo em produção. O servidor foi otimizado para isso.

### 3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/planeja"

# JWT Secret
JWT_SECRET="seu-jwt-secret-super-seguro"

# SendGrid (Email)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@planeja.com.br"
FROM_NAME="Planeja"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 2FA
TOTP_SECRET="your-totp-secret"
```

### 4. Deploy em Plataformas Cloud

#### Vercel/Netlify (Frontend estático):
- Configure o comando de build: `npm run build`
- Configure o diretório de output: `dist/public`

#### Railway/Render (Fullstack):
- Configure o comando de start: `npm run dev`
- Configure a porta: 5000 (ou variável PORT)

#### Docker:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

## Portas e URLs

- **Desenvolvimento**: http://localhost:5173
- **Produção**: Configurar conforme o servidor
- **API**: Mesma porta do frontend (servidor integrado)

## Funcionalidades Ativas

✅ Dashboard financeiro
✅ Sistema de notificações
✅ Gestão de seguros
✅ Metas financeiras
✅ Upload de documentos
✅ Análises e relatórios
✅ Sistema de educação financeira
✅ Rate limiting e segurança
✅ Logs de auditoria

## Suporte

Para problemas de deploy, verifique:
1. Node.js versão 18+
2. Dependências instaladas corretamente
3. Variáveis de ambiente configuradas
4. Porta disponível (5000 ou 5173)

### Problemas Comuns no Windows

#### Erro "operation not supported on socket 0.0.0.0"

Se você receber este erro no Windows:

```text
Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000
```

**Solução**: O código já foi corrigido para usar `localhost` em desenvolvimento no Windows. Execute:

```bash
npm run dev
```

#### Erro "Could not find the build directory"

Se você ver:

```text
Error setting up static files: Could not find the build directory
```

**Solução**: Em desenvolvimento, isso é normal. O servidor fará fallback automaticamente para o Vite dev server.

#### Primeira execução

Para a primeira execução, certifique-se de:

1. Instalar as dependências: `npm install`
2. Executar em modo desenvolvimento: `npm run dev`
3. Acessar: <http://localhost:5000>
