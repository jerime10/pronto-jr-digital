# Pronto Jr Digital 🏥

Sistema completo de gestão médica para clínicas e consultórios.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-38B2AC.svg)](https://tailwindcss.com/)

---

## 📋 Sobre o Projeto

O **Pronto Jr Digital** é um sistema de gestão médica completo desenvolvido para clínicas e consultórios médicos. Oferece funcionalidades para gestão de pacientes, agendamentos, atendimentos, prescrições, exames e controle financeiro.

### ✨ Principais Funcionalidades

- 👥 **Gestão de Pacientes**: Cadastro completo com histórico médico
- 📅 **Agendamentos**: Sistema inteligente com cálculo de disponibilidade
- 🩺 **Atendimentos**: Prontuário eletrônico completo
- 💊 **Prescrições**: Modelos customizáveis de prescrições
- 🔬 **Exames**: Solicitação e acompanhamento de exames
- 💰 **Financeiro**: Controle de transações e comissões
- 🤝 **Sistema de Parceiros**: Gestão de afiliados com comissões
- 📄 **Documentos**: Geração automática de PDFs
- 🔔 **Notificações**: WhatsApp e Google Calendar
- ⚙️ **Configurações**: Personalização completa do sistema

---

## 📚 Documentação

### 🎯 Documentos Principais

1. **[INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)** - Índice geral de toda documentação
2. **[RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)** - Visão geral e recomendações (10 min)
3. **[ANALISE_COMPLETA_SISTEMA.md](./ANALISE_COMPLETA_SISTEMA.md)** - Análise técnica completa (60 min)
4. **[PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md)** - Guia de implementação de melhorias (30 min)
5. **[DIAGRAMA_ARQUITETURA.md](./DIAGRAMA_ARQUITETURA.md)** - Diagramas e fluxos visuais (20 min)

### 📖 Guia Rápido de Leitura

**Para entender o sistema rapidamente** (25 min):
1. [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
2. [DIAGRAMA_ARQUITETURA.md](./DIAGRAMA_ARQUITETURA.md)

**Para trabalhar no sistema** (70 min):
1. [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
2. [ANALISE_COMPLETA_SISTEMA.md](./ANALISE_COMPLETA_SISTEMA.md)
3. [DIAGRAMA_ARQUITETURA.md](./DIAGRAMA_ARQUITETURA.md)

**Para implementar melhorias** (35 min):
1. [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md) → Próximos Passos
2. [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md)

---

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase (para backend)

### Instalação

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>

# 2. Entre na pasta do projeto
cd pronto-jr-digital

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# (As credenciais do Supabase já estão no código)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

### Credenciais de Teste

```
Usuário: admin
Senha: [consulte o banco de dados]
```

---

## 🛠 Stack Tecnológico

### Frontend
- **React 18.3.1** - Framework UI
- **TypeScript 5.5.3** - Tipagem estática
- **Vite 5.4.1** - Build tool e dev server
- **Tailwind CSS 3.4.11** - Estilização
- **shadcn/ui** - Componentes UI
- **React Query 5.56.2** - Gerenciamento de estado
- **React Router 6.26.2** - Roteamento
- **React Hook Form 7.53.0** - Formulários
- **Zod 3.23.8** - Validação

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Row Level Security** - Segurança de dados
- **Supabase Storage** - Armazenamento de arquivos

### Integrações
- **N8N** - Automação e webhooks
- **WhatsApp** - Notificações
- **Google Calendar** - Sincronização de agenda

---

## 📁 Estrutura do Projeto

```
pronto-jr-digital/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Serviços de API
│   ├── hooks/          # Custom hooks
│   ├── contexts/       # Contextos React
│   ├── types/          # Definições de tipos
│   ├── utils/          # Funções utilitárias
│   └── integrations/   # Integrações (Supabase)
├── supabase/
│   └── migrations/     # Migrações do banco
├── public/             # Arquivos estáticos
└── docs/              # Documentação adicional
```

---

## 🔐 Segurança

### ⚠️ ATENÇÃO - Melhorias Críticas Necessárias

O sistema está funcional, mas existem **melhorias críticas de segurança** que devem ser implementadas:

1. **Hash de Senhas** 🔴 CRÍTICO
   - Atualmente as senhas estão em texto plano
   - Implementar bcrypt imediatamente
   - Ver: [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md#1-segurança-de-senhas)

2. **Validação de Entrada** 🟡 IMPORTANTE
   - Implementar Zod em todos os formulários
   - Ver: [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md#2-validação-de-entrada)

Para mais detalhes, consulte [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md#-pontos-críticos-de-atenção)

---

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

**Nota**: Testes automatizados ainda não foram implementados. Ver [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md#7-testes-automatizados)

---

## 📦 Build e Deploy

### Build de Produção

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

### Deploy

O projeto pode ser deployado facilmente em:
- **Vercel** (recomendado)
- **Netlify**
- **Cloudflare Pages**

Ou através do Lovable:
1. Acesse [Lovable Project](https://lovable.dev/projects/bf9dc1c6-b519-49a6-862a-f1100ca5424e)
2. Clique em Share → Publish

---

## 🤝 Contribuindo

### Fluxo de Trabalho

1. Crie uma branch para sua feature
   ```bash
   git checkout -b feature/minha-feature
   ```

2. Faça suas alterações e commit
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```

3. Push para o repositório
   ```bash
   git push origin feature/minha-feature
   ```

4. Abra um Pull Request

### Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adição de testes
- `chore:` Tarefas de manutenção

---

## 📊 Status do Projeto

### ✅ Funcionalidades Implementadas

- [x] Gestão de pacientes
- [x] Sistema de agendamentos
- [x] Atendimentos médicos
- [x] Prescrições e exames
- [x] Sistema de parceiros
- [x] Controle financeiro
- [x] Geração de PDFs
- [x] Notificações WhatsApp
- [x] Integração Google Calendar
- [x] Configurações personalizáveis

### 🚧 Em Desenvolvimento

- [ ] Hash de senhas (CRÍTICO)
- [ ] Validação completa de formulários
- [ ] Testes automatizados
- [ ] Monitoramento (Sentry)
- [ ] PWA

### 🔮 Roadmap Futuro

- [ ] Migração para Supabase Auth
- [ ] Telemedicina (videochamadas)
- [ ] App mobile (React Native)
- [ ] IA para sugestões de diagnóstico
- [ ] Integração com laboratórios

Ver [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md) para detalhes completos.

---

## 📞 Suporte

### Documentação
- [Índice de Documentação](./INDICE_DOCUMENTACAO.md)
- [Resumo Executivo](./RESUMO_EXECUTIVO.md)
- [Análise Completa](./ANALISE_COMPLETA_SISTEMA.md)

### Links Úteis
- [Lovable Project](https://lovable.dev/projects/bf9dc1c6-b519-49a6-862a-f1100ca5424e)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação Supabase](https://supabase.com/docs)

### Recursos Externos
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👥 Equipe

Desenvolvido com ❤️ para gestão médica eficiente.

---

## 📝 Notas Importantes

### Para Novos Desenvolvedores

1. Leia primeiro o [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
2. Estude o [DIAGRAMA_ARQUITETURA.md](./DIAGRAMA_ARQUITETURA.md)
3. Aprofunde-se no [ANALISE_COMPLETA_SISTEMA.md](./ANALISE_COMPLETA_SISTEMA.md)
4. Consulte o [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md) quando necessário

### Para Implementar Melhorias

1. Consulte [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md)
2. Priorize as melhorias críticas (hash de senhas)
3. Siga os exemplos de código fornecidos
4. Teste localmente antes de fazer commit

### Melhorias Críticas Pendentes

⚠️ **ATENÇÃO**: Antes de colocar em produção, implemente:
1. Hash de senhas com bcrypt
2. Validação Zod em todos os formulários
3. Error boundaries
4. Loading states

Ver [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md#-crítico---implementar-imediatamente) para detalhes.

---

**Última atualização**: 21 de Janeiro de 2026  
**Versão**: 0.0.0  
**Status**: ✅ Operacional (melhorias de segurança necessárias)
