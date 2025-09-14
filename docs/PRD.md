# PRD - Sistema de Prontuário Digital

## 1. Visão Geral do Produto

### 1.1 Descrição
O **Pronto Jr Digital** é um sistema completo de prontuário eletrônico desenvolvido para clínicas e consultórios médicos. O sistema oferece uma solução integrada para gestão de pacientes, atendimentos médicos, prescrições, exames e geração de documentos.

### 1.2 Objetivos
- Digitalizar e centralizar o processo de atendimento médico
- Facilitar o cadastro e busca de pacientes
- Automatizar a geração de prescrições e laudos médicos
- Integrar com sistemas externos via webhooks
- Proporcionar interface intuitiva para profissionais de saúde

### 1.3 Público-Alvo
- **Primário**: Profissionais de saúde
- **Secundário**: Administradores de clínicas
- **Terciário**: Recepcionistas e auxiliares

## 2. Funcionalidades Principais

### 2.1 Gestão de Pacientes

#### 2.1.1 Cadastro de Pacientes
- **Campos obrigatórios**: Nome, CPF/SUS, gênero, data de nascimento
- **Campos opcionais**: Telefone, endereço, bairro
- **Validações**: CPF (11 dígitos) ou SUS (15 dígitos)
- **Funcionalidades**:
  - Cálculo automático da idade
  - Formatação automática de telefone
  - Verificação de duplicatas por CPF/SUS
  - Atualização de dados existentes

#### 2.1.2 Busca e Seleção
- Busca em tempo real por nome ou documento
- Interface com dropdown de resultados
- Exibição de informações resumidas
- Seleção rápida para atendimento

#### 2.1.3 Cadastro Público
- Interface pública para auto-cadastro
- Validação de documentos existentes
- Fluxo de boas-vindas personalizado
- Atualização de dados por pacientes existentes

### 2.2 Sistema de Atendimento

#### 2.2.1 Estrutura do Atendimento
- **Abas organizadas**:
  - Informações Clínicas
  - Evolução
  - Prescrição
  - Exames
  - Imagens

#### 2.2.2 Informações Clínicas
- **Campos principais**:
  - Queixa principal
  - História da doença atual
  - Alergias
  - Observações gerais
- **Funcionalidades**:
  - Processamento de IA para sugestões
  - Salvamento automático em rascunho
  - Validação de campos obrigatórios

#### 2.2.3 Evolução do Paciente
- Registro detalhado da evolução clínica
- Histórico de atendimentos anteriores
- Acompanhamento de tratamentos

#### 2.2.4 Controle de Horários
- Data/hora de início do atendimento
- Data/hora de fim do atendimento
- Cálculo automático de duração

### 2.3 Sistema de Prescrições

#### 2.3.1 Modelos de Prescrição
- **Gestão de modelos**:
  - Criação de templates reutilizáveis
  - Edição e exclusão de modelos
  - Busca por nome
  - Descrição detalhada

#### 2.3.2 Prescrição Personalizada
- Seleção de modelo base
- Edição livre do conteúdo
- Validação de campos obrigatórios
- Integração com dados do paciente

### 2.4 Sistema de Exames

#### 2.4.1 Solicitação de Exames
- **Funcionalidades**:
  - Seleção múltipla de exames
  - Instruções específicas por exame
  - Modelos pré-definidos
  - Observações personalizadas

#### 2.4.2 Resultados de Exames
- **Gestão de laudos**:
  - Modelos de laudo pré-configurados
  - Seleção de template para resultado
  - Edição livre de resultados
  - Histórico de exames realizados

#### 2.4.3 Modelos de Exames
- Cadastro de tipos de exame
- Instruções padrão
- Gerenciamento via interface admin

### 2.5 Gestão de Imagens
- Upload de imagens médicas
- Visualização integrada
- Organização por atendimento
- Suporte a múltiplos formatos

## 3. Funcionalidades Administrativas

### 3.1 Dashboard Executivo
- **Métricas principais**:
  - Total de pacientes cadastrados
  - Atendimentos do mês
  - Prescrições emitidas
  - Exames solicitados

- **Gráficos e relatórios**:
  - Timeline de atendimentos
  - Distribuição de prescrições
  - Novos pacientes por semana
  - Métricas de performance

### 3.2 Configurações do Sistema

#### 3.2.1 Configurações da Clínica
- Nome da clínica
- Endereço e telefone
- Informações de contato
- Dados para documentos

#### 3.2.2 Configurações Visuais
- Cores primárias e secundárias
- Família de fontes
- Temas personalizáveis
- Logo da clínica

#### 3.2.3 Configurações de Integração
- **Webhooks n8n**:
  - URL de webhook principal
  - Webhook para prontuários médicos
  - Configuração de API keys
  - Teste de conectividade

### 3.3 Sistema de Diagnóstico
- Verificação de saúde do sistema
- Status de conexões
- Logs de operações
- Relatórios de erro

## 4. Integrações e APIs

### 4.1 Integração n8n
- **Endpoints configuráveis**:
  - Webhook principal
  - Webhook de prontuários médicos
  - Geração de PDFs
  - Sincronização de dados

### 4.2 Estrutura de Dados para Integração
```json
{
  "action": "generate_pdf",
  "documentType": "prontuario",
  "medicalRecordId": "uuid",
  "patientId": "uuid",
  "professionalId": "uuid",
  "data": {
    "patient": { /* dados do paciente */ },
    "professional": { /* dados do profissional */ },
    "record": { /* dados do prontuário */ },
    "examRequests": [ /* exames solicitados */ ],
    "selectedModelTitle": "título do modelo de laudo"
  }
}
```

### 4.3 Banco de Dados
- **Supabase PostgreSQL**
- **Tabelas principais**:
  - `patients` - Dados dos pacientes
  - `professionals` - Profissionais de saúde
  - `medical_records` - Prontuários médicos
  - `prescription_models` - Modelos de prescrição
  - `exam_models` - Modelos de exames
  - `completed_exams` - Exames realizados
  - `site_settings` - Configurações do sistema

## 5. Arquitetura Técnica

### 5.1 Frontend
- **Framework**: React 18 com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router
- **Estado**: React Hooks + Context API
- **Formulários**: React Hook Form
- **Notificações**: Sonner

### 5.2 Backend
- **BaaS**: Supabase
- **Autenticação**: Sistema customizado
- **Banco**: PostgreSQL
- **Storage**: Supabase Storage
- **RLS**: Row Level Security

### 5.3 Infraestrutura
- **Build**: Vite
- **Deploy**: Vercel/Netlify
- **CI/CD**: GitHub Actions
- **Monitoramento**: Logs integrados

## 6. Fluxos de Trabalho

### 6.1 Fluxo de Atendimento
1. **Busca/Cadastro do Paciente**
   - Buscar paciente existente
   - Ou cadastrar novo paciente
   - Validar dados obrigatórios

2. **Registro do Atendimento**
   - Definir horário de início
   - Preencher informações clínicas
   - Registrar evolução
   - Adicionar prescrições
   - Solicitar exames

3. **Finalização**
   - Definir horário de fim
   - Salvar prontuário
   - Gerar PDF (opcional)
   - Enviar para webhook

### 6.2 Fluxo de Prescrição
1. Selecionar modelo base
2. Personalizar conteúdo
3. Validar informações
4. Integrar ao prontuário
5. Gerar documento final

### 6.3 Fluxo de Exames
1. **Solicitação**:
   - Selecionar exames
   - Adicionar instruções
   - Registrar no prontuário

2. **Resultados**:
   - Selecionar modelo de laudo
   - Inserir resultados
   - Anexar ao prontuário
   - Enviar título do modelo

## 7. Segurança e Compliance

### 7.1 Autenticação
- Sistema de login customizado
- Validação de credenciais
- Controle de sessão
- Logout automático

### 7.2 Autorização
- Row Level Security (RLS)
- Políticas de acesso por usuário
- Controle de permissões
- Auditoria de ações

### 7.3 Proteção de Dados
- Criptografia em trânsito
- Backup automático
- Logs de auditoria
- Compliance com LGPD

## 8. Performance e Escalabilidade

### 8.1 Otimizações
- Lazy loading de componentes
- Cache de consultas
- Paginação de resultados
- Compressão de imagens

### 8.2 Monitoramento
- Health checks automáticos
- Logs estruturados
- Métricas de performance
- Alertas de erro

## 9. Roadmap e Evoluções

### 9.1 Versão Atual (v1.0)
- ✅ Gestão completa de pacientes
- ✅ Sistema de atendimento
- ✅ Prescrições e exames
- ✅ Dashboard administrativo
- ✅ Integrações webhook

### 9.2 Próximas Versões
- **v1.1**: Relatórios avançados
- **v1.2**: App mobile
- **v1.3**: Telemedicina
- **v2.0**: Multi-tenant

## 10. Considerações Finais

O **Pronto Jr Digital** representa uma solução completa e moderna para gestão de prontuários médicos, combinando facilidade de uso, robustez técnica e compliance com regulamentações de saúde. O sistema está preparado para crescer junto com as necessidades das clínicas, oferecendo uma base sólida para futuras expansões e integrações.

---

**Documento gerado em**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Ativo em produção