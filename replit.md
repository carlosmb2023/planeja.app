# CooperativeFuture - Plataforma Financeira Inteligente

## Visão Geral

CooperativeFuture é uma plataforma SaaS moderna e responsiva para colaboradores de cooperativas gerenciarem suas finanças, planejamento de aposentadoria e patrimônio. A aplicação possui controle de acesso restrito, dashboards visuais, design mobile-first e ferramentas abrangentes de gestão financeira.

## Arquitetura do Sistema

A aplicação é construída como uma aplicação web full-stack com separação clara entre componentes frontend e backend:

- **Frontend**: React com TypeScript, construído usando Vite
- **Backend**: Node.js com Express
- **Database**: PostgreSQL com Drizzle ORM
- **UI Framework**: Componentes shadcn/ui com Tailwind CSS
- **Gerenciamento de Estado**: TanStack Query para gerenciamento de estado do servidor
- **Autenticação**: Autenticação baseada em JWT com hash de senha bcrypt
- **Integração Bancária**: Open Banking APIs para sincronização automática

## Principais Componentes

### Arquitetura Frontend
- **Biblioteca de Componentes**: Componentes UI customizados baseados em Radix UI através do shadcn/ui
- **Estilização**: Tailwind CSS com tokens de design customizados para a marca da cooperativa
- **Roteamento**: Wouter para roteamento client-side leve
- **Formulários**: React Hook Form com validação Zod
- **Gráficos**: Recharts para visualização de dados
- **Mobile-First**: Design responsivo com navegação mobile dedicada

### Arquitetura Backend
- **Camada API**: Servidor Express.js RESTful com middleware para autenticação
- **Camada de Banco de Dados**: Drizzle ORM para operações type-safe no banco
- **Autenticação**: Tokens JWT com hash seguro de senha usando bcryptjs
- **Gerenciamento de Sessão**: Connect-pg-simple para armazenamento de sessão PostgreSQL
- **Integração Bancária**: APIs Open Banking para sincronização automática de dados
- **Desenvolvimento**: Hot reloading com integração Vite

### Schema do Banco de Dados
A aplicação usa um banco PostgreSQL com as seguintes entidades principais:
- **Users**: Contas de usuário com informações pessoais
- **Authorized Emails**: Lista de emails autorizados para controle de acesso
- **Categories**: Sistema de categorização de transações
- **Transactions**: Transações financeiras com categorização
- **Retirement Goals**: Planejamento de poupança de longo prazo
- **Documents**: Gerenciamento de arquivos para documentos fiscais
- **Assets**: Rastreamento e gerenciamento de patrimônio
- **Insurances**: Gestão de seguros e apólices
- **Bank Connections**: Conexões bancárias via Open Banking
- **Bank Accounts**: Contas bancárias sincronizadas

## Funcionalidades Principais

### 🏦 Integração Bancária (Open Banking)
- **Conexão Segura**: Conecte suas contas bancárias via Open Banking regulamentado pelo BACEN
- **Sincronização Automática**: Importação automática de transações e saldos
- **Múltiplos Bancos**: Suporte aos principais bancos brasileiros (BB, Bradesco, Itaú, Caixa, Santander, Nubank)
- **Categorização Inteligente**: Categorização automática de transações baseada em IA
- **Controle Total**: Gerencie permissões e conexões com total transparência

### 📊 Dashboard Inteligente
- **Visão Unificada**: Resumo completo de sua situação financeira
- **Análises em Tempo Real**: Gráficos e métricas atualizados automaticamente
- **Notificações Inteligentes**: Alertas sobre vencimentos, metas e oportunidades
- **IA Financeira**: Analista virtual com insights personalizados

### 💰 Gestão de Transações
- **Importação Automática**: Transações bancárias sincronizadas via Open Banking
- **Categorização Avançada**: Sistema inteligente de categorização
- **Análise de Gastos**: Relatórios detalhados por categoria e período
- **Controle Manual**: Adicione transações manuais quando necessário

### 🎯 Metas e Planejamento
- **Simulador de Aposentadoria**: Calcule seu futuro financeiro
- **Metas Personalizadas**: Defina e acompanhe objetivos financeiros
- **Progresso Visual**: Acompanhe o desenvolvimento de suas metas
- **Recomendações**: Sugestões baseadas em seu perfil financeiro

### 🛡️ Seguros e Proteção
- **Gestão de Apólices**: Controle todos seus seguros em um lugar
- **Alertas de Vencimento**: Nunca perca um prazo importante
- **Análise de Cobertura**: Avalie se sua proteção é adequada
- **Comparação de Preços**: Encontre as melhores ofertas

### 📄 Documentos e Relatórios
- **Upload Seguro**: Armazene documentos fiscais com segurança
- **Relatórios Avançados**: Gere relatórios financeiros detalhados
- **Exportação**: Exporte dados em PDF, Excel e outros formatos
- **Organização**: Sistema de categorização e busca eficiente

### ⚙️ Configurações e Privacidade
- **Perfil Personalizável**: Customize sua experiência
- **Preferências de Notificação**: Controle como e quando ser notificado
- **Configurações de Privacidade**: Gerencie seus dados e permissões
- **Backup e Sync**: Mantenha seus dados seguros e sincronizados

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **recharts**: Chart library for data visualization

### UI Dependencies
- **@radix-ui/***: Primitive components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **eslint**: Code linting
- **tsx**: TypeScript execution for development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Build Process**: 
   - Frontend: Vite builds static assets to `dist/public`
   - Backend: esbuild bundles server code to `dist/index.js`

2. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT token signing
   - `NODE_ENV`: Environment specification

3. **Database Management**:
   - Migrations stored in `./migrations`
   - Schema defined in `./shared/schema.ts`
   - Push migrations with `npm run db:push`

4. **Production Serving**:
   - Express serves static files in production
   - API routes prefixed with `/api`
   - SPA fallback for client-side routing

## Central Database with Client-Side Encryption

The application uses a centralized database with complete privacy through client-side encryption:

1. **Privacy-First Architecture**: 
   - All sensitive data is encrypted in the browser before transmission
   - User passwords are never sent to the server after initial authentication
   - Encryption keys are derived from user credentials (email + password)
   - Not even the application creator can access user data

2. **Encryption Implementation**:
   - PBKDF2 key derivation with 10,000 iterations
   - AES-256 encryption for all sensitive fields
   - Automatic encryption/decryption through custom React hooks
   - Fields encrypted: transaction details, document names, asset values, etc.

3. **Key Features**:
   - Single central database reduces infrastructure complexity
   - Complete user privacy - data is meaningless without user's password
   - No ability for admin access to personal data
   - Transparent encryption/decryption in the UI
   - Password loss means permanent data loss (by design)

4. **Security Model**:
   - Zero-knowledge architecture
   - Client-side encryption before any network transmission
   - Server stores only encrypted blobs
   - Similar security model to Signal/WhatsApp

## Changelog

```
Changelog:
- July 02, 2025. Initial setup completed
- July 02, 2025. Full application creation per user specifications:
  • Built complete financial management SaaS for cooperative employees
  • Implemented restricted access control with email validation
  • Created modern dashboard with financial cards and charts
  • Added transaction management with modal forms
  • Built retirement planning progress tracking
  • Implemented mobile-first responsive design
  • Added bottom navigation for mobile experience
  • Created demo user with sample data (admin@test.com / demo123)
  • Added registration system with full validation
  • Integrated turquoise cooperative branding (#00AE9D)
  • Setup Inter/Montserrat typography as specified
- July 02, 2025. Major enhancements and module additions:
  • Updated background to metallic ice white with subtle gray tones
  • Redesigned dashboard cards: Orçamento, Aposentadoria, Alertas Fiscais
  • Added quick access icons: Receitas, Categorias, Bens, Herdeiros, Investimentos, Educação
  • Created Education module with courses, progress tracking, and achievements
  • Built Assets/Succession/Investments module with three tabs
  • Implemented offline AI Financial Analyst with automatic insights
  • Enhanced visual design with gradients and modern shadows
  • Fixed navigation across all pages with bottom navigation
- July 02, 2025. App rebranding and private pension simulator:
  • Changed app name from "Meu Futuro Coop" to "Planeja"
  • Updated all branding references across the application
  • Implemented enhanced metallic ice white background with gradient effects
  • Created comprehensive private pension simulation module
  • Added SUSEP-compliant calculations with conservative CDI profile
  • Built detailed projection charts and tables for retirement planning
  • Added quick access button for private pension simulator
  • Integrated real-time calculations with multiple simulation scenarios
- July 02, 2025. Central database with client-side encryption:
  • Implemented zero-knowledge architecture for complete user privacy
  • Added client-side AES-256 encryption for all sensitive data
  • Created privacy explanation page with detailed security information
  • Replaced individual Supabase databases with central encrypted database
  • Encryption keys derived from user credentials (never stored)
  • Added automatic encryption/decryption hooks for transparent operation
  • Updated authentication to integrate encryption key management
  • Ensured even app creator cannot access user data
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```