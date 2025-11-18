## Diagnóstico
- A linha do tempo mostra dois itens por atendimento: um vindo do `medical_records` (com início/fim/duração) e outro vindo do fallback do Storage (sem tempos).
- O fallback está em `src/pages/atendimentos/hooks/useHistoricoDocuments.ts:166-339`, onde lista arquivos do bucket `documents/prontuarios` e adiciona à coleção mesmo quando já existe item de banco.
- O link salvo em `medical_records.file_url_storage` é montado manualmente com `patientName + "_" + recordId` (hífen/underscore inconsistente), em `src/services/medicalRecordSubmissionService.ts:138-154`. O PDF real no Storage usa padrão com hífens e número (ex.: `NOME-TELEFONE-UUID.pdf`). Isso torna o link do item completo inválido e impede a deduplicação pelo nome.

## Objetivo
- Exibir apenas um item por atendimento no histórico, com tempos preenchidos.
- Garantir que o link salvo em `medical_records.file_url_storage` seja funcional (mesmo padrão do arquivo real).

## Ajustes Propostos
1. Persistir a URL real do PDF retornada pelo webhook (quando disponível) em `medical_records.file_url_storage`.
2. Caso o webhook não retorne URL, gerar o nome do arquivo compatível com o padrão do Storage: `encodeURIComponent(patient.name) + '-' + digits(patient.phone) + '-' + recordId + '.pdf'` e persistir a URL pública completa.
3. Remover ou tornar estrito o fallback de arquivos do Storage em `useHistoricoDocuments` para evitar duplicidade:
   - Opção A (recomendada): remover a listagem do Storage; usar apenas `medical_records`.
   - Opção B: manter fallback, mas pular arquivos cujo nome contenha um `recordId` presente nos registros carregados ou cujo `file_url` já contenha o `file.name`.
4. Ajustar a lógica de deduplicação em `useHistoricoDocuments` para garantir não inclusão quando já existe o registro do banco.

## Mudanças Técnicas
- Arquivo: `src/services/medicalRecordSubmissionService.ts`
  - Ponto: `submitMedicalRecordToWebhook` pós-envio, linhas `138-162`.
  - Ações:
    - Ler `webhookData` e usar qualquer campo conhecido (`fileUrl`, `file_url`, `publicUrl`, `url`) para persistir a URL real.
    - Se ausente, construir a URL com padrão `NOME-TELEFONE-UUID.pdf` (hífens) e salvar em `medical_records.file_url_storage`.
    - Manter atualização de `exam_observations` se presente.
- Arquivo: `src/pages/atendimentos/hooks/useHistoricoDocuments.ts`
  - Ponto: bloco de fallback do Storage `166-339`.
  - Ações:
    - Opção A: remover completamente o bloco de listagem do Storage.
    - Opção B: manter com deduplicação forte: coletar `recordIds` dos `readyRecords` e, ao iterar `storageFiles`, extrair `recordId` do nome do arquivo; pular inclusão se o `recordId` já existir ou se `file.name` já estiver contido em algum `file_url` dos prontos.

## Validação
- Finalizar um novo atendimento e verificar:
  - Apenas um item no histórico para o paciente.
  - Colunas “Início Atendimento, Término Atendimento, Duração” preenchidas.
  - Ícone/link de PDF abre corretamente.
- Testar com nomes com espaços/acentos e telefones com formatação; garantir sanitização do telefone (`digits-only`).
- Conferir itens antigos: com a deduplicação, itens do Storage não aparecerão duplicados.

## Perguntas
- O webhook atualmente retorna a URL do arquivo? Se sim, qual chave (`fileUrl`, `file_url`)?
- Confirmar o padrão exato do nome de arquivo no Storage: `NOME-TELEFONE-UUID.pdf` ou `NOME-CPF-UUID.pdf`?
- Preferimos remover totalmente o fallback do Storage (Opção A) ou mantê-lo com deduplicação (Opção B)?
- Há necessidade de migrar registros já existentes para atualizar `file_url_storage` com o padrão correto?

## Considerações de Segurança e Manutenção
- Nenhum segredo no código; o acesso é público ao bucket `documents`.
- Evitar montar URLs ad-hoc quando o webhook retornar a URL oficial.
- Simplicidade e clareza: priorizar a fonte única (`medical_records`) para exibição.

## Resultado Esperado
- Histórico sem duplicidade, com link funcional e dados temporais corretos, seguindo o padrão do Storage e/ou o retorno do webhook.