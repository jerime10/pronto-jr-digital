## Objetivo
- Criar página pública em `public/consultaragenda` para consulta de horários.
- Fluxo: escolher profissional → visualizar calendário e horários → botão "Agendar" que encaminha ao agendamento público já com serviço, data e hora.

## Requisitos Confirmados
- Mostrar apenas serviços vinculados ao profissional selecionado.
- Pré-preencher serviço, data e hora ao navegar para `/public/agendamento`.
- Lista de profissionais: exibir todos os disponíveis, sem filtros/pesquisa.
- Calendário: não ocultar dias; indicar visualmente os dias com horários disponíveis.
- Exibir o novo link na seção "Links Públicos" do sistema.

## Rotas e Navegação
- Adicionar rota pública `GET /public/consultaragenda`.
- Passos da página:
  - Etapa 1: Seleção de profissional (cards simples, todos os profissionais disponíveis).
  - Etapa 2: Cabeçalho com profissional e serviços relacionados; calendário mensal visível sempre; ao selecionar data, carregar horários disponíveis.
  - Ao selecionar um horário, habilitar botão "Agendar" que redireciona para `/public/agendamento?professionalId=...&serviceId=...&date=YYYY-MM-DD&time=HH:mm:ss`.

## Dados e Integrações
- Profissionais: ler de `professionals` (Supabase) com campos `id`, `name`, `specialty`, `profile_image`.
- Serviços: ler apenas os vinculados ao profissional (via tabela de vínculo ou `schedule_assignments`).
- Disponibilidade: calcular slots considerando atribuições ativas e agendamentos existentes.
- Permitir acesso público (leitura), respeitando RLS.

## Reuso e Componentização
- Reutilizar `Calendar` e `AvailableTimesGrid` existentes.
- Criar hook `usePublicAvailability(professionalId, date, serviceId)`.
- Criar componente `PublicProfessionalsList` (cartões simples, clique para selecionar).

## UI/UX
- Visual de seleção de profissional conforme imagem 2.
- Visual de agenda conforme imagem 1: calendário completo (dias visíveis), destaque para dias com disponibilidade; grade de horários por data.
- Estados de carregamento, vazio e erro.

## Links Públicos
- Atualizar página/área "Links Públicos" adicionando item "Consultar Agenda" apontando para `/public/consultaragenda`.

## Segurança
- Sem credenciais no cliente; somente leitura.
- Sanitizar e validar os parâmetros ao redirecionar.

## Validação
- Testar acesso sem login à rota `public/consultaragenda`.
- Confirmar que lista todos profissionais disponíveis.
- Verificar exibição de serviços vinculados e horários por data.
- Validar redirecionamento com pré-preenchimento para `/public/agendamento`.

## Entregáveis
- Nova página `PublicConsultarAgendaPage` com etapas e integração Supabase.
- Atualização da seção "Links Públicos" com o novo link.
- Hooks e componentes públicos reutilizáveis para disponibilidade e seleção.