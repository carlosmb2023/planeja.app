# 🏦 Planeja - Planejador Financeiro Inteligente

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow" alt="Status">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</div>

## 📖 Sobre o Projeto

O **Planeja** é uma aplicação web moderna de planejamento financeiro pessoal que oferece uma abordagem completa para gestão de finanças pessoais. Com design bancário profissional e interface intuitiva, o sistema permite controle total sobre receitas, despesas, investimentos, seguros e muito mais.

## ✨ Funcionalidades Principais

### 🏠 **Dashboard Inteligente**
- Visão geral das finanças em tempo real
- Gráficos e métricas interativas
- Resumo de receitas, despesas e patrimônio

### 📊 **Análises Avançadas**
- Relatórios financeiros detalhados
- Análise de tendências e padrões
- Projeções e insights inteligentes

### 🎯 **Gestão de Metas**
- Definição e acompanhamento de objetivos financeiros
- Simulador de aposentadoria
- Planejamento de longo prazo

### 🏠 **Controle de Patrimônio**
- Cadastro e valoração de bens
- Acompanhamento de investimentos
- Gestão de ativos diversos

### 🛡️ **Seguros Inteligentes**
- Controle completo de apólices
- Alertas de vencimento automáticos
- Gestão de prêmios e coberturas

### 🏦 **Integração Bancária**
- Conexão segura com bancos (Open Banking)
- Sincronização automática de transações
- Múltiplas contas e cartões

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de CSS
- **Vite** - Build tool moderna
- **React Query** - Gerenciamento de estado servidor
- **Wouter** - Roteamento leve
- **Date-fns** - Manipulação de datas

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Drizzle ORM** - ORM moderno
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### **Infraestrutura**
- **Docker** - Containerização
- **Git** - Controle de versão
- **ESLint** - Linting
- **Prettier** - Formatação

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+ 
- PostgreSQL 14+
- Git

### **Instalação**

1. **Clone o repositório**
```bash
git clone https://github.com/[seu-usuario]/planeja.git
cd planeja
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados**
```bash
npm run db:generate
npm run db:push
```

5. **Execute em modo desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 📁 Estrutura do Projeto

```
planeja/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários e configurações
│   │   └── assets/         # Recursos estáticos
├── server/                 # Backend Node.js
│   ├── routes.ts           # Rotas da API
│   ├── index.ts            # Servidor principal
│   └── storage.ts          # Configuração do banco
├── shared/                 # Código compartilhado
│   └── schema.ts           # Schema do banco de dados
└── docs/                   # Documentação
```

## 🔐 Segurança

- ✅ Autenticação JWT
- ✅ Hash seguro de senhas (bcrypt)
- ✅ Sanitização de inputs
- ✅ Headers de segurança
- ✅ Validação de dados
- ✅ Rate limiting

## 📱 Design e UX

- 🎨 **Design Bancário Moderno** - Interface profissional e confiável
- 📱 **Responsivo** - Funciona perfeitamente em todos os dispositivos
- ♿ **Acessível** - Seguindo padrões de acessibilidade
- 🌙 **Tema Adaptativo** - Suporte a modo claro e escuro
- ⚡ **Performance** - Carregamento rápido e otimizado

## 📊 Status do Desenvolvimento

- [x] Autenticação e autorização
- [x] Dashboard principal
- [x] Gestão de seguros
- [x] Sistema de navegação
- [x] Design system completo
- [ ] Integração bancária (Open Banking)
- [ ] Módulo de investimentos
- [ ] Relatórios avançados
- [ ] Notificações push
- [ ] API mobile

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Principal** - [@carlosv3122_00](https://github.com/carlosv3122_00)

## 📞 Contato

- **Email**: carlos@planeja.com.br
- **LinkedIn**: [Carlos Vieira](https://linkedin.com/in/carlosv3122)
- **Website**: [https://planeja.com.br](https://planeja.com.br)

---

<div align="center">
  <p>Feito com ❤️ para revolucionar o planejamento financeiro pessoal</p>
  <p>© 2025 Planeja. Todos os direitos reservados.</p>
</div>
