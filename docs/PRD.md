# PRD — Pronto Jr Digital

## Documento de Requisitos do Produto

**Produto:** Pronto Jr Digital — Sistema de Prontuário Eletrônico  
**Versão do Documento:** 2.0  
**Última Atualização:** Março 2026  
**Status:** Em produção  

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Público-Alvo e Personas](#2-público-alvo-e-personas)
3. [Arquitetura Técnica](#3-arquitetura-técnica)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Módulos do Sistema](#5-módulos-do-sistema)
6. [Sistema de Autenticação e Permissões](#6-sistema-de-autenticação-e-permissões)
7. [Rotas e Navegação](#7-rotas-e-navegação)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Integrações Externas](#9-integrações-externas)
10. [Fluxos de Trabalho](#10-fluxos-de-trabalho)
11. [Interface e Experiência do Usuário](#11-interface-e-experiência-do-usuário)
12. [Segurança e Compliance](#12-segurança-e-compliance)
13. [Performance e Escalabilidade](#13-performance-e-escalabilidade)
14. [Roadmap](#14-roadmap)

---

## 1. Visão Geral

### 1.1 Descrição do Produto

O **Pronto Jr Digital** é um sistema completo de prontuário eletrônico desenvolvido para clínicas e consultórios médicos. Oferece uma solução integrada que abrange desde o cadastro de pacientes até a geração automatizada de documentos médicos em PDF, passando por agendamento online, controle financeiro, sistema de parceiros com comissões e integrações com WhatsApp e automações via N8N.

### 1.2 Objetivos Estratégicos

- Digitalizar e centralizar todo o fluxo de atendimento médico
- Automatizar a geração de prescrições, laudos e prontuários em PDF
- Oferecer agendamento online público com controle de disponibilidade
- Gerenciar finanças com rastreamento de receitas, despesas e comissões
- Integrar com WhatsApp para lembretes automáticos de consultas
- Prover sistema de parceiros/afiliados com comissionamento
- Garantir controle granular de permissões por usuário

### 1.3 Proposta de Valor

| Benefício | Descrição |
|---|---|
| **Prontuário Digital Completo** | Registro de queixas, evolução, prescrições, exames e imagens em um único lugar |
| **Agendamento Público** | Pacientes agendam online sem necessidade de login |
| **Geração Automática de PDF** | Prontuários formatados profissionalmente via webhook N8N |
| **Controle Financeiro** | Receitas, despesas, comissões e relatórios integrados |
| **Lembretes WhatsApp** | Notificações automáticas para reduzir faltas |
| **Multi-usuário com Permissões** | Cada usuário vê apenas o que é autorizado |
| **Tema Claro/Escuro** | Interface adaptável à preferência do usuário |

---

## 2. Público-Alvo e Personas

### 2.1 Persona Primária — Profissional de Saúde

- **Perfil:** Médico, enfermeiro ou profissional de saúde que realiza atendimentos
- **Necessidades:** Registrar atendimentos de forma rápida, gerar documentos, consultar histórico
- **Permissões típicas:** Atendimento, pacientes, prescrições, exames, histórico

### 2.2 Persona Secundária — Administrador da Clínica

- **Perfil:** Gestor responsável pela operação da clínica
- **Necessidades:** Configurar sistema, gerenciar usuários, acompanhar financeiro, gerar relatórios
- **Permissões típicas:** Acesso total (admin)

### 2.3 Persona Terciária — Recepcionista/Atendente

- **Perfil:** Profissional da recepção que gerencia agendamentos
- **Necessidades:** Agendar consultas, cadastrar pacientes, gerenciar horários
- **Permissões típicas:** Agendamentos, pacientes, horários

### 2.4 Persona Quaternária — Parceiro/Afiliado

- **Perfil:** Profissional externo que indica pacientes
- **Necessidades:** Acompanhar agendamentos gerados, visualizar comissões
- **Permissões típicas:** Dashboard de parceiro com visão limitada

### 2.5 Persona Pública — Paciente

- **Perfil:** Paciente que acessa funcionalidades públicas
- **Necessidades:** Consultar horários disponíveis, agendar consultas, se cadastrar
- **Acesso:** Rotas públicas sem autenticação

---

## 3. Arquitetura Técnica

### 3.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                       │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Rotas Públicas │  │ Rotas Protegidas│  │  Rotas Admin   │    │
│  │  /cadastro      │  │ /dashboard      │  │ /configuracoes │    │
│  │  /agendamento   │  │ /pacientes      │  │ /admin/usuarios│    │
│  │  /consultaragenda│ │ /atendimento    │  │                │    │
│  │  /pix           │  │ /financeiro     │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA DE COMPONENTES                        │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ shadcn/ui│ │ Recharts │ │ Formulários│ │ Layout (Sidebar) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA DE LÓGICA                             │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Services │ │  Hooks   │ │ Contexts │ │     Utils        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA DE DADOS                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Supabase (PostgreSQL + Storage)             │   │
│  │  ┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │ Tables │ │ RLS     │ │ Storage  │ │ Edge Functions│  │   │
│  │  └────────┘ └─────────┘ └──────────┘ └───────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    INTEGRAÇÕES EXTERNAS                         │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐      │
│  │   N8N    │  │   WhatsApp   │  │   Google Calendar    │      │
│  │ Webhooks │  │  Lembretes   │  │    Sincronização     │      │
│  └──────────┘  └──────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Padrões Arquiteturais

| Padrão | Implementação |
|---|---|
| **SPA (Single Page Application)** | React + React Router DOM |
| **Gerenciamento de Estado Servidor** | TanStack React Query com cache de 5 min |
| **Gerenciamento de Estado Global** | Context API (autenticação) |
| **Gerenciamento de Estado Local** | React Hooks (useState, useReducer) |
| **Persistência de Rascunhos** | LocalStorage com auto-save |
| **Separação de Responsabilidades** | Pages → Components → Services → Hooks |
| **Lazy Loading** | React.lazy + Suspense para rotas |
| **Tema Dinâmico** | next-themes com suporte a claro/escuro/sistema |

---

## 4. Stack Tecnológico

### 4.1 Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| React | 18.3+ | Biblioteca de UI |
| TypeScript | 5.5+ | Tipagem estática |
| Vite | 5.4+ | Build tool e dev server |
| Tailwind CSS | 3.4+ | Framework de estilização utilitário |
| shadcn/ui | — | Biblioteca de componentes acessíveis |
| React Router DOM | 6.26+ | Roteamento SPA |
| TanStack React Query | 5.56+ | Gerenciamento de estado do servidor |
| Recharts | 2.12+ | Gráficos e visualizações de dados |
| React Hook Form | 7.53+ | Gerenciamento de formulários |
| Zod | 3.23+ | Validação de schemas |
| Sonner | 1.5+ | Notificações toast |
| date-fns | 3.6+ | Manipulação de datas |
| Lucide React | 0.462+ | Biblioteca de ícones |
| next-themes | 0.3+ | Gerenciamento de tema claro/escuro |
| Framer Motion (via Tailwind) | — | Animações CSS |

### 4.2 Backend (BaaS)

| Tecnologia | Função |
|---|---|
| Supabase | Backend as a Service |
| PostgreSQL | Banco de dados relacional |
| Supabase Storage | Armazenamento de arquivos (imagens, PDFs) |
| Supabase Edge Functions | Funções serverless (Deno) |
| Row Level Security (RLS) | Políticas de segurança em nível de linha |
| Supabase RPC | Funções SQL customizadas |

### 4.3 Edge Functions (Serverless)

| Função | Descrição |
|---|---|
| `ai-webhook` | Processamento de conteúdo via IA |
| `create-admin` | Criação de usuário administrador |
| `create-appointment` | Criação de agendamentos via API |
| `scheduled-reminders` | Lembretes agendados automáticos |
| `whatsapp-reminder` | Envio de lembretes via WhatsApp |

### 4.4 Ferramentas de Desenvolvimento

| Ferramenta | Função |
|---|---|
| ESLint | Linting de código |
| PostCSS + Autoprefixer | Processamento CSS |
| TypeScript Compiler | Verificação de tipos |

---

## 5. Módulos do Sistema

### 5.1 Dashboard Executivo

**Rota:** `/dashboard`  
**Permissão:** `dashboard`

#### Funcionalidades

- **Cards de Estatísticas:**
  - Total de pacientes cadastrados
  - Novos pacientes (período)
  - Agendamentos do dia
  - Prescrições da semana
  - Exames pendentes

- **Gráficos Interativos (Recharts):**
  - Timeline de atendimentos por período
  - Distribuição de prescrições (pizza)
  - Novos pacientes por semana (área)
  - Radar de performance

- **Seletor de Período:** Filtragem por 7, 15, 30, 60 ou 90 dias

- **Lista de Agendamentos:** Próximos agendamentos com status e ações rápidas

---

### 5.2 Gestão de Pacientes

**Rota:** `/pacientes`  
**Permissão:** `pacientes`, com granularidade: `pacientes_criar`, `pacientes_editar`, `pacientes_excluir`, `pacientes_visualizar`

#### 5.2.1 Listagem de Pacientes

- Busca em tempo real por nome ou documento (CPF/SUS)
- Tabela paginada com dados resumidos
- Ações: visualizar, editar, excluir
- Cálculo automático de idade a partir da data de nascimento

#### 5.2.2 Formulário de Paciente

**Campos:**

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| Nome | Texto | ✅ | — |
| CPF/SUS | Texto | ✅ | CPF (11 dígitos) ou SUS (15 dígitos) |
| Gênero | Select | ❌ | — |
| Data de Nascimento | Date | ❌ | Calcula idade automaticamente |
| Telefone | Texto | ❌ | Formatação automática |
| Endereço | Texto | ❌ | — |
| Bairro | Texto | ❌ | — |

- Verificação de duplicatas por CPF/SUS
- Atualização automática de dados existentes

#### 5.2.3 Cadastro Público de Pacientes

**Rota:** `/cadastro-paciente` (pública, sem autenticação)

- Interface de auto-cadastro para pacientes
- Validação de documentos existentes
- Fluxo de boas-vindas personalizado
- URL configurável no painel admin

---

### 5.3 Sistema de Atendimento

**Rota:** `/atendimento/novo`  
**Permissão:** `atendimento`, com granularidade: `atendimento_criar`, `atendimento_editar`

#### 5.3.1 Fluxo de Atendimento

1. **Busca/Seleção de Paciente** — Busca em tempo real com dropdown de resultados
2. **Registro em Abas Organizadas:**
   - **Informações Clínicas** — Queixa principal, história da doença, alergias, observações
   - **Evolução** — Registro detalhado da evolução do paciente
   - **Prescrição** — Seleção de modelo + edição livre
   - **Exames** — Solicitação de exames + resultados com modelos de laudo
   - **Imagens** — Upload de imagens médicas
3. **Controle de Horários** — Data/hora de início e fim do atendimento
4. **Salvamento** — Salvar prontuário e/ou gerar PDF via webhook

#### 5.3.2 Campos Personalizados (Individual Fields)

- Campos dinâmicos configuráveis pelo administrador
- Templates de campos individuais reutilizáveis
- Autocomplete inteligente para preenchimento rápido

#### 5.3.3 Campos Obstétricos

- Suporte especializado para atendimentos obstétricos
- Cálculos fetais automáticos (DUM, idade gestacional, DPP)
- Utilitários de gravidez integrados

#### 5.3.4 Sistema de Rascunhos

- **Salvamento automático** em LocalStorage
- **Botão "Salvar Rascunho":**
  - Salva na tabela `medical_records` com status de rascunho
  - Título automático: `{Nome Paciente} - SUS: {SUS} - {Data/Hora}`
  - Atualiza rascunho existente do mesmo paciente (nunca cria duplicatas)
  - Armazena todos os dados do formulário para restauração posterior

#### 5.3.5 Processamento com IA

- Envio de conteúdo do atendimento para processamento via webhook IA
- Sugestões automáticas baseadas nos dados clínicos

---

### 5.4 Histórico de Atendimentos

**Rota:** `/historico`  
**Permissão:** `historico_atendimentos`

#### Funcionalidades

- Listagem de todos os prontuários e documentos gerados
- **Visualização em múltiplos formatos:**
  - Cards compactos
  - Lista detalhada
  - Tabela com filtros
- **Busca e Filtros:**
  - Por paciente
  - Por data
  - Por tipo de documento
  - Por status
- **Visualizador de PDF integrado**
- **Documentos do Storage Bucket** — Acesso direto aos PDFs armazenados no Supabase Storage
- Ações: visualizar, compartilhar, excluir

---

### 5.5 Prescrições

**Rota:** `/prescricoes`  
**Permissão:** `prescricoes`, com granularidade: `prescricoes_criar`, `prescricoes_editar`, `prescricoes_excluir`, `prescricoes_visualizar`

#### Funcionalidades

- CRUD completo de modelos de prescrição
- Cada modelo possui: nome e descrição (conteúdo da prescrição)
- Busca por nome
- Seleção durante o atendimento para preenchimento automático
- Edição livre sobre o modelo selecionado

---

### 5.6 Exames

**Rota:** `/exames`  
**Permissão:** `exames`, com granularidade: `exames_criar`, `exames_editar`, `exames_excluir`, `exames_visualizar`

#### 5.6.1 Modelos de Exames

- CRUD de tipos de exame com instruções padrão
- Seleção múltipla durante o atendimento

#### 5.6.2 Solicitação de Exames

- Seleção de múltiplos exames via multi-select com busca
- Instruções específicas por exame
- Observações personalizadas

#### 5.6.3 Resultados de Exames

- Seleção de modelo/template de laudo
- Edição livre de resultados
- Registro de exames concluídos com histórico

---

### 5.7 Sistema de Agendamento

#### 5.7.1 Agendamentos (Interno)

**Rota:** `/agendamentos`  
**Permissão:** `agendamentos`

- Listagem de todos os agendamentos com filtros (status, data, busca)
- Status: Agendado, Confirmado, Concluído, Cancelado
- Ações: confirmar, concluir, cancelar, excluir
- Detalhes do paciente, serviço e atendente vinculados

#### 5.7.2 Atendentes

**Rota:** `/atendentes`  
**Permissão:** `atendentes`

- CRUD de atendentes/profissionais
- Campos: nome, email, telefone, cargo, foto, dias de trabalho
- Link de compartilhamento para agendamento público
- Status ativo/inativo

#### 5.7.3 Horários

**Rota:** `/horarios`  
**Permissão:** `horarios`

- Configuração de grades de horários por dia da semana
- Definição de hora início, hora fim e duração do intervalo
- Atribuição de horários a atendentes e serviços (Schedule Assignments)
- Ativação/desativação de horários

#### 5.7.4 Serviços

**Rota:** `/servicos`  
**Permissão:** `servicos`

- CRUD de serviços oferecidos pela clínica
- Campos: nome, descrição, duração, preço, categoria
- **Flag de disponibilidade** (`available: true/false`)
- Serviços indisponíveis são automaticamente ocultos das páginas públicas de agendamento
- Vinculação de serviços a atendentes via Service Assignments

#### 5.7.5 Agendamento Público

**Rota:** `/public/agendamento` ou `/agendamento` (pública, sem autenticação)

- Seleção de profissional
- Seleção de serviço (apenas serviços disponíveis)
- Calendário com datas disponíveis
- Grid de horários livres com verificação em tempo real
- Formulário de dados do paciente
- Confirmação de agendamento
- Suporte a link de parceiro para rastreamento de comissões

#### 5.7.6 Consulta Pública de Agenda

**Rota:** `/public/consultaragenda` (pública, sem autenticação)

- Visualização de horários disponíveis sem necessidade de agendar
- Seleção de profissional e serviço (apenas disponíveis)
- Navegação por mês no calendário
- Grid visual de horários do dia selecionado

---

### 5.8 Módulo Financeiro

**Rota:** `/financeiro`  
**Permissão:** `financeiro`

#### Funcionalidades

- **Métricas Financeiras:**
  - Receita total
  - Lucro líquido
  - Pagamentos pendentes
  - Taxa de crescimento

- **Gráfico de Receitas x Despesas** — Evolução mensal com Recharts

- **Gestão de Transações:**
  - CRUD completo de entradas e saídas
  - Campos: data, tipo, descrição, valor, status, método de pagamento
  - Filtros por período (mês atual, ano, personalizado)
  - Status: Pago, Pendente, Cancelado

- **Gestão de Comissões:**
  - Comissões automáticas para parceiros
  - Vinculação a agendamentos específicos
  - Cálculo de valores comissionados

- **Chave PIX:**
  - Configuração de chave PIX no painel admin
  - Página pública `/pix` para exibição da chave com opção de cópia

---

### 5.9 Sistema de Parceiros

**Rota:** `/partner/dashboard`  
**Permissão:** Usuário tipo `partner`

#### Funcionalidades

- Dashboard exclusivo para parceiros
- Visualização de agendamentos gerados pelo parceiro
- Acompanhamento de comissões
- Link personalizado de agendamento com rastreamento

---

### 5.10 Painel Administrativo

#### 5.10.1 Configurações Gerais

**Rota:** `/configuracoes`  
**Permissão:** `configuracoes` (admin)

**Abas de configuração:**

| Aba | Funcionalidades |
|---|---|
| **Informações da Clínica** | Nome, endereço, telefone |
| **Links Públicos** | URL de cadastro público, configuração de links |
| **Ativos de Documentos** | Upload de logo e assinatura para PDFs, dados do profissional |
| **Campos Salvos** | Gerenciamento de templates de campos individuais |
| **Templates WhatsApp** | Configuração de modelos de mensagem para lembretes |
| **Webhook Prontuário** | URL do webhook N8N para geração de PDF de prontuários |
| **Integrações** | Webhook geral N8N, chave PIX, URLs de reminder WhatsApp |

#### 5.10.2 Gerenciamento de Usuários

**Rota:** `/admin/usuarios`  
**Permissão:** `usuarios` (admin)

- CRUD de usuários do sistema
- Tipos de usuário: `admin` e `partner`
- **Permissões granulares por funcionalidade:**
  - Acesso a módulos (dashboard, pacientes, prescrições, exames, etc.)
  - Ações CRUD por módulo (criar, editar, excluir, visualizar)
- Controle de status ativo/inativo
- Registro de último login

#### 5.10.3 Processamento com IA

**Rota:** `/admin/pdf-template`  
**Permissão:** admin

- Interface para processamento de conteúdo médico com IA via webhook

---

## 6. Sistema de Autenticação e Permissões

### 6.1 Autenticação

| Aspecto | Implementação |
|---|---|
| **Método** | Login customizado via username/password |
| **Validação** | Função RPC `validate_simple_user` no Supabase |
| **Persistência** | LocalStorage (`simple_auth_user`) |
| **Proteção de Rotas** | Componente `SimpleAuthGuard` com props `requireAuth` e `requireAdmin` |
| **Tipos de Usuário** | `admin` (acesso total) e `partner` (acesso limitado) |

### 6.2 Fluxo de Autenticação

```
Usuário → Tela de Login → SimpleAuthContext.login()
  → supabase.rpc('validate_simple_user', {username, password})
    → Sucesso: Salva user em state + localStorage → Redireciona
    → Falha: Exibe mensagem de erro
```

### 6.3 Sistema de Permissões Granulares

O sistema implementa permissões em dois níveis:

**Nível 1 — Acesso a Módulos:**
- `dashboard`, `pacientes`, `prescricoes`, `exames`, `atendimento`
- `historico_atendimentos`, `agendamentos`, `atendentes`, `horarios`
- `servicos`, `financeiro`, `configuracoes`, `usuarios`

**Nível 2 — Ações por Módulo:**
- `{modulo}_criar`, `{modulo}_editar`, `{modulo}_excluir`, `{modulo}_visualizar`

**Componentes de Guarda:**
- `MenuItemGuard` — Oculta itens de menu sem permissão
- `ActionButtonGuard` — Oculta botões de ação sem permissão
- `PermissionGuard` — Wrapper genérico de permissão

---

## 7. Rotas e Navegação

### 7.1 Rotas Públicas (sem autenticação)

| Rota | Componente | Descrição |
|---|---|---|
| `/login` | `SimpleLogin` | Tela de login |
| `/` | `SimpleLogin` | Redirect para login |
| `/cadastro-paciente` | `PublicPatientRegistration` | Auto-cadastro de pacientes |
| `/public/agendamento` | `PublicAppointmentBooking` | Agendamento online |
| `/agendamento` | `PublicAppointmentBooking` | Alias para agendamento |
| `/public/consultaragenda` | `PublicConsultarAgendaPage` | Consulta de horários |
| `/pix` | `PixKeyPage` | Exibição de chave PIX |
| `/diagnostic` | `DiagnosticPage` | Diagnóstico do sistema |

### 7.2 Rotas Protegidas (requer autenticação)

| Rota | Componente | Permissão |
|---|---|---|
| `/dashboard` | `Dashboard` | `dashboard` |
| `/pacientes` | `ListaPacientes` | `pacientes` |
| `/pacientes/novo` | `FormularioPaciente` | `pacientes_criar` |
| `/pacientes/:id` | `FormularioPaciente` | `pacientes_editar` |
| `/prescricoes` | `ModelosPrescricao` | `prescricoes` |
| `/exames` | `ModelosExames` | `exames` |
| `/atendimento/novo` | `NovoAtendimento` | `atendimento` |
| `/historico` | `HistoricoAtendimentos` | `historico_atendimentos` |
| `/agendamentos` | `Agendamentos` | `agendamentos` |
| `/atendentes` | `Atendentes` | `atendentes` |
| `/horarios` | `Horarios` | `horarios` |
| `/horarios/novo` | `NovoHorario` | `horarios` |
| `/servicos` | `Servicos` | `servicos` |
| `/servicos/novo` | `NovoServico` | `servicos` |
| `/servicos/editar/:id` | `EditarServico` | `servicos` |
| `/financeiro` | `Financeiro` | `financeiro` |
| `/partner/dashboard` | `PartnerDashboard` | Tipo `partner` |

### 7.3 Rotas Administrativas (requer admin)

| Rota | Componente | Descrição |
|---|---|---|
| `/configuracoes` | `ConfiguracoesAdmin` | Configurações gerais |
| `/admin/usuarios` | `UserManagement` | Gerenciamento de usuários |
| `/admin/pdf-template` | `ProcessarComIA` | Processamento com IA |

### 7.4 Navegação (Sidebar)

A sidebar lateral é renderizada pelo componente `MainLayout` com:
- Logo personalizável no topo
- Links de navegação controlados por `MenuItemGuard`
- Botão de recolher/expandir (desktop)
- Menu hambúrguer responsivo (mobile)
- Toggle de tema claro/escuro no header
- Menu de usuário com perfil e logout

---

## 8. Modelo de Dados

### 8.1 Tabelas Principais

#### `patients` — Pacientes

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `sus` | TEXT | Número CPF ou SUS |
| `name` | TEXT | Nome completo |
| `age` | INTEGER | Idade (calculada) |
| `gender` | TEXT | Gênero |
| `phone` | TEXT | Telefone |
| `address` | TEXT | Endereço |
| `bairro` | TEXT | Bairro |
| `date_of_birth` | DATE | Data de nascimento |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

#### `professionals` — Profissionais

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `user_id` | TEXT | ID do usuário vinculado |
| `name` | TEXT | Nome do profissional |
| `specialty` | TEXT | Especialidade |
| `license_type` | TEXT | Tipo de registro (CRM, COREN, etc.) |
| `license_number` | TEXT | Número do registro |
| `contact` | TEXT | Contato |
| `signature` | TEXT | Assinatura digital (base64) |
| `profile_image` | TEXT | Foto do profissional |

#### `medical_records` — Prontuários Médicos

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `patient_id` | UUID (FK) | Paciente |
| `attendant_id` | UUID (FK) | Profissional atendente |
| `appointment_id` | UUID (FK) | Agendamento vinculado |
| `main_complaint` | TEXT | Queixa principal |
| `history` | TEXT | História da doença |
| `allergies` | TEXT | Alergias |
| `evolution` | TEXT | Evolução clínica |
| `prescription_model_id` | UUID (FK) | Modelo de prescrição |
| `custom_prescription` | TEXT | Prescrição personalizada |
| `exam_requests` | TEXT[] | Exames solicitados |
| `exam_observations` | TEXT | Observações dos exames |
| `exam_results` | TEXT | Resultados dos exames |
| `attendance_start_at` | TIMESTAMP | Início do atendimento |
| `attendance_end_at` | TIMESTAMP | Fim do atendimento |

#### `attendants` — Atendentes

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | TEXT | Nome |
| `email` | TEXT | Email |
| `phone` | TEXT | Telefone |
| `position` | TEXT | Cargo |
| `photo_url` | TEXT | URL da foto |
| `working_days` | INTEGER[] | Dias de trabalho (0-6) |
| `share_link` | TEXT | Link público de agendamento |
| `is_active` | BOOLEAN | Status ativo |

#### `schedules` — Grades de Horários

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `day_of_week` | INTEGER | Dia da semana (0-6) |
| `start_time` | TIME | Hora de início |
| `end_time` | TIME | Hora de fim |
| `slot_duration` | INTEGER | Duração do slot (minutos) |
| `is_active` | BOOLEAN | Status ativo |

#### `schedule_assignments` — Atribuições de Horários

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `schedule_id` | UUID (FK) | Grade de horário |
| `attendant_id` | UUID (FK) | Atendente |
| `service_id` | UUID (FK) | Serviço |

#### `services` — Serviços

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | TEXT | Nome do serviço |
| `description` | TEXT | Descrição |
| `duration` | INTEGER | Duração (minutos) |
| `price` | DECIMAL | Preço |
| `category` | TEXT | Categoria |
| `available` | BOOLEAN | Disponível para agendamento público |

#### `appointments` — Agendamentos

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `patient_id` | UUID (FK) | Paciente |
| `attendant_id` | UUID (FK) | Atendente |
| `service_id` | UUID (FK) | Serviço |
| `appointment_date` | DATE | Data |
| `appointment_time` | TIME | Hora |
| `status` | TEXT | Status (scheduled, confirmed, completed, cancelled) |
| `notes` | TEXT | Observações |
| `partner_id` | UUID (FK) | Parceiro que indicou |

#### `transactions` — Transações Financeiras

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `appointment_id` | UUID (FK) | Agendamento vinculado |
| `transaction_date` | DATE | Data da transação |
| `type` | TEXT | Tipo (Entrada/Saída) |
| `description` | TEXT | Descrição |
| `amount` | DECIMAL | Valor |
| `status` | TEXT | Status (Pago/Pendente/Cancelado) |
| `payment_method` | TEXT | Método de pagamento |

#### `prescription_models` — Modelos de Prescrição

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | TEXT | Nome do modelo |
| `description` | TEXT | Conteúdo da prescrição |

#### `exam_models` — Modelos de Exames

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | TEXT | Nome do exame |
| `instructions` | TEXT | Instruções/preparo |

#### `site_settings` — Configurações do Sistema

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `primary_color` | TEXT | Cor primária do tema |
| `accent_color` | TEXT | Cor de destaque |
| `font_family` | TEXT | Família de fontes |
| `logo_url` | TEXT | URL do logo |
| `logo_data` | TEXT | Logo em base64 (para PDFs) |
| `signature_data` | TEXT | Assinatura em base64 (para PDFs) |
| `signature_professional_name` | TEXT | Nome do profissional na assinatura |
| `signature_professional_title` | TEXT | Título profissional |
| `signature_professional_registry` | TEXT | Registro profissional |
| `clinic_name` | TEXT | Nome da clínica |
| `clinic_address` | TEXT | Endereço |
| `clinic_phone` | TEXT | Telefone |
| `n8n_webhook_url` | TEXT | URL do webhook N8N principal |
| `medical_record_webhook_url` | TEXT | URL do webhook de prontuários |
| `public_registration_url` | TEXT | URL de cadastro público |
| `whatsapp_reminder_webhook_url` | TEXT | URL webhook lembretes WhatsApp |
| `whatsapp_recurring_reminder_webhook_url` | TEXT | URL webhook lembretes recorrentes |
| `pix_key` | TEXT | Chave PIX |

### 8.2 Funções SQL (RPC)

| Função | Descrição |
|---|---|
| `validate_simple_user(username, password)` | Valida credenciais de login |
| `get_available_slots(attendant, service, date)` | Retorna horários disponíveis para agendamento |

---

## 9. Integrações Externas

### 9.1 N8N (Webhooks de Automação)

#### Webhook Principal

- **Configuração:** `site_settings.n8n_webhook_url`
- **Uso:** Geração de documentos PDF, notificações, automações gerais

#### Webhook de Prontuário Médico

- **Configuração:** `site_settings.medical_record_webhook_url`
- **Uso:** Submissão de prontuário completo para geração de PDF profissional
- **Payload (FormData):**

| Campo | Descrição |
|---|---|
| `action` | `generate_pdf` |
| `documentType` | `prontuario` |
| `medicalRecordId` | UUID do prontuário |
| `patientId` | UUID do paciente |
| `professionalId` | UUID do profissional |
| `patient_*` | Campos individuais do paciente |
| `record_*` | Campos do prontuário |
| `examRequests` | JSON com exames solicitados |
| `selectedModelTitle` | Título do modelo de laudo |
| `image_*` | Imagens médicas em base64 |
| `logo_base64` | Logo da clínica em base64 |
| `signature_base64` | Assinatura do profissional em base64 |
| `signature_*` | Dados do profissional para rodapé do PDF |
| `dynamic_fields` | Campos personalizados em JSON |

- **Resposta esperada:** URL do PDF gerado, armazenado no Supabase Storage

### 9.2 WhatsApp (Lembretes)

- **Webhook de Lembretes:** `site_settings.whatsapp_reminder_webhook_url`
- **Webhook Recorrente:** `site_settings.whatsapp_recurring_reminder_webhook_url`
- **Templates de Mensagem:** Configuráveis no painel admin
- **Edge Functions:** `whatsapp-reminder` e `scheduled-reminders`
- **Funcionalidades:**
  - Lembrete de agendamento próximo
  - Confirmação de consulta
  - Lembretes recorrentes automáticos

### 9.3 Google Calendar

- **Serviço:** `googleCalendarService.ts`
- **Funcionalidade:** Sincronização de agendamentos com Google Calendar

---

## 10. Fluxos de Trabalho

### 10.1 Fluxo de Agendamento Público

```
Paciente acessa link público
  → Seleciona profissional
    → Seleciona serviço (apenas disponíveis)
      → Escolhe data no calendário
        → Sistema verifica slots disponíveis (RPC: get_available_slots)
          → Paciente preenche dados pessoais
            → Confirmação do agendamento
              → Registro na tabela appointments
                → Notificação WhatsApp (se configurado)
                  → Registro de comissão (se via parceiro)
```

### 10.2 Fluxo de Atendimento Médico

```
Profissional acessa /atendimento/novo
  → Busca e seleciona paciente
    → Preenche dados clínicos (abas: informações, evolução, prescrição, exames, imagens)
      → [Opcional] Processa conteúdo com IA
        → [Opcional] Salva rascunho (atualiza existente ou cria novo)
          → Salva prontuário definitivo
            → [Opcional] Gerar PDF via webhook N8N
              → PDF armazenado no Supabase Storage
                → URL do PDF salva no prontuário
                  → Prontuário disponível no histórico
```

### 10.3 Fluxo de Geração de PDF

```
Clique em "Gerar PDF"
  → Busca configurações (logo, assinatura, dados da clínica)
    → Monta FormData com todos os dados do atendimento
      → Envia para webhook N8N (medical_record_webhook_url)
        → N8N processa e gera PDF formatado
          → PDF é armazenado no Supabase Storage
            → URL pública do PDF é retornada
              → URL salva no campo storage_url do medical_record
                → Toast de sucesso exibido ao usuário
```

### 10.4 Fluxo de Parceiro/Afiliado

```
Parceiro compartilha link personalizado de agendamento
  → Paciente agenda via link do parceiro
    → Sistema registra partner_id no agendamento
      → Quando agendamento é concluído
        → Sistema calcula comissão
          → Transação registrada na tabela transactions
            → Parceiro visualiza no Partner Dashboard
```

---

## 11. Interface e Experiência do Usuário

### 11.1 Design System

- **Framework CSS:** Tailwind CSS com tokens semânticos
- **Componentes:** shadcn/ui (baseados em Radix UI)
- **Ícones:** Lucide React
- **Temas:** Claro e escuro com suporte a preferência do sistema

### 11.2 Layout Principal

- **Sidebar lateral:** Navegação principal com ícones e labels
- **Sidebar recolhível:** Modo compacto no desktop (apenas ícones)
- **Header fixo:** Nome do sistema, toggle de tema, notificações, menu do usuário
- **Área de conteúdo:** Responsiva com padding adaptativo
- **Overlay mobile:** Sidebar abre como overlay com backdrop

### 11.3 Responsividade

- **Desktop (md+):** Sidebar fixa lateral + conteúdo principal
- **Mobile (<md):** Sidebar oculta com menu hambúrguer
- Todos os formulários e tabelas adaptados para telas pequenas
- Cards com layout flexível (flex-wrap)

### 11.4 Acessibilidade

- Componentes Radix UI com suporte nativo a ARIA
- Labels em todos os campos de formulário
- Contraste adequado nos dois temas
- Navegação por teclado nos menus

---

## 12. Segurança e Compliance

### 12.1 Autenticação

| Aspecto | Status |
|---|---|
| Login customizado | ✅ Implementado |
| Persistência de sessão | ✅ LocalStorage |
| Proteção de rotas | ✅ SimpleAuthGuard |
| Controle admin | ✅ requireAdmin flag |

### 12.2 Autorização

| Aspecto | Status |
|---|---|
| Row Level Security (RLS) | ✅ Supabase |
| Permissões granulares | ✅ Por módulo e ação |
| Guards de componente | ✅ MenuItemGuard, ActionButtonGuard |

### 12.3 Proteção de Dados

| Aspecto | Status |
|---|---|
| Criptografia em trânsito (HTTPS) | ✅ Supabase |
| Backup automático | ✅ Supabase |
| Chaves publicáveis no frontend | ✅ Apenas anon key |
| Chaves privadas | ✅ Apenas no servidor (Edge Functions) |

### 12.4 Compliance LGPD

- Dados de pacientes protegidos por RLS
- Consentimento no cadastro público
- Possibilidade de exclusão de dados

---

## 13. Performance e Escalabilidade

### 13.1 Otimizações Implementadas

| Técnica | Implementação |
|---|---|
| **Cache de consultas** | React Query com `staleTime: 5min` |
| **Lazy loading** | `React.lazy()` para rotas |
| **Suspense** | Fallback de loading durante carregamento |
| **Enhanced Supabase Client** | Cliente otimizado com retry e logging |
| **Paginação** | Listas com carregamento paginado |
| **Debounce em buscas** | Busca de pacientes com delay |

### 13.2 Monitoramento

| Ferramenta | Uso |
|---|---|
| `DataLoadingMonitor` | Componente de debug para monitorar carregamento |
| `debugLogger` | Logger estruturado com níveis |
| `systemHealthCheck` | Verificação de saúde do sistema |
| `DiagnosticPage` | Página dedicada de diagnóstico |

---

## 14. Roadmap

### Versão Atual (v2.0) — ✅ Em Produção

- ✅ Gestão completa de pacientes com cadastro público
- ✅ Sistema de atendimento com abas organizadas
- ✅ Prescrições e exames com modelos reutilizáveis
- ✅ Geração de PDF via webhook N8N
- ✅ Sistema completo de agendamento (interno + público)
- ✅ Controle de disponibilidade de serviços
- ✅ Dashboard executivo com gráficos
- ✅ Módulo financeiro com transações e comissões
- ✅ Sistema de parceiros/afiliados
- ✅ Permissões granulares por usuário
- ✅ Tema claro/escuro
- ✅ Integração WhatsApp para lembretes
- ✅ Campos obstétricos especializados
- ✅ Campos personalizados dinâmicos
- ✅ Sistema de rascunhos com auto-update
- ✅ Responsividade mobile completa

### Próximas Versões

| Versão | Funcionalidades Planejadas |
|---|---|
| **v2.1** | Relatórios avançados exportáveis, filtros avançados no histórico |
| **v2.2** | App mobile nativo (React Native) |
| **v2.3** | Telemedicina com videochamada integrada |
| **v3.0** | Multi-tenant (múltiplas clínicas) |

---

## Apêndice A — Estrutura de Pastas do Projeto

```
src/
├── App.tsx                          # Rotas e providers
├── main.tsx                         # Entry point
├── index.css                        # Estilos globais e tokens CSS
│
├── components/
│   ├── layout/MainLayout.tsx        # Layout principal (sidebar + header)
│   ├── Logo.tsx                     # Componente de logo
│   ├── SimpleAuthGuard.tsx          # Guard de autenticação
│   ├── PermissionGuard.tsx          # Guards de permissão
│   ├── admin/UserManagement.tsx     # Gerenciamento de usuários
│   ├── partner/PartnerDashboard.tsx # Dashboard de parceiro
│   ├── schedule/                    # Componentes de agendamento
│   ├── debug/                       # Componentes de debug
│   └── ui/                          # shadcn/ui components
│
├── pages/
│   ├── Dashboard.tsx                # Dashboard principal
│   ├── auth/SimpleLogin.tsx         # Tela de login
│   ├── pacientes/                   # CRUD de pacientes
│   ├── atendimento/                 # Sistema de atendimento
│   │   ├── NovoAtendimento.tsx
│   │   ├── components/              # Tabs, formulários, busca
│   │   └── hooks/                   # Lógica de estado e ações
│   ├── atendimentos/                # Histórico e documentos
│   ├── prescricoes/                 # Modelos de prescrição
│   ├── exames/                      # Modelos de exames
│   ├── agendamentos/                # Gestão de agendamentos
│   ├── atendentes/                  # Gestão de atendentes
│   ├── horarios/                    # Gestão de horários
│   ├── servicos/                    # Gestão de serviços
│   ├── financeiro/                  # Módulo financeiro
│   ├── admin/                       # Painel administrativo
│   └── public/                      # Páginas públicas
│
├── services/                        # Camada de serviços (Supabase)
│   ├── appointmentsService.ts
│   ├── patientService.ts
│   ├── scheduleService.ts
│   ├── serviceService.ts
│   ├── documentService.ts
│   ├── medicalRecordSubmissionService.ts
│   ├── transactionsService.ts
│   ├── formDataBuilder.ts
│   ├── webhookClient.ts
│   └── ...
│
├── hooks/                           # Custom hooks
│   ├── usePermissions.ts
│   ├── useAppointments.ts
│   ├── useAvailability.ts
│   ├── useSiteSettings.ts
│   ├── useTransactions.ts
│   └── ...
│
├── contexts/
│   └── SimpleAuthContext.tsx         # Provider de autenticação
│
├── types/
│   ├── database.ts                  # Tipos do banco de dados
│   └── siteSettingsTypes.ts         # Tipos de configurações
│
├── utils/                           # Funções utilitárias
│   ├── dateUtils.ts
│   ├── cpfSusUtils.ts
│   ├── phoneUtils.ts
│   ├── fetalCalculations.ts
│   ├── pregnancyUtils.ts
│   └── ...
│
├── lib/                             # Configurações de libs
│   ├── utils.ts                     # cn() e helpers Tailwind
│   ├── queryClient.ts               # React Query config
│   └── enhancedSupabaseClient.ts    # Cliente Supabase otimizado
│
└── integrations/
    └── supabase/
        ├── client.ts                # Instância do Supabase
        └── types.ts                 # Tipos gerados do banco
```

---

## Apêndice B — Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon pública do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

---

*Documento gerado em Março 2026 — Versão 2.0*
