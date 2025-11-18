## Objetivo
- Fazer append dos itens selecionados nas listas suspensas, preservando o conteúdo já digitado nos campos personalizados.
- Corrigir o fluxo para garantir que os itens selecionados populam de fato os campos: Queixa Principal Personalizada, Antecedentes Personalizados, Alergias Personalizadas, Evolução Personalizada, Prescrição Personalizada.

## Ajustes Propostos
### Informações Clínicas
- `src/pages/atendimento/components/InformacoesTab.tsx`
  - Alterar `handleQueixaModelChange`, `handleAntecedentesModelChange`, `handleAlergiasModelChange` para:
    - Normalizar e deduplicar conteúdos.
    - Fazer append apenas dos novos itens que ainda não constam no textarea, usando separador `\n` (quebra de linha única).
    - Preservar o texto existente do usuário.

### Evolução
- `src/pages/atendimento/components/EvolucaoTab.tsx`
  - Alterar `handleEvolucaoModelChange` com a mesma lógica de append único ao `form.evolucao`.

### Prescrição
- `src/pages/atendimento/components/PrescricaoTab.tsx`
  - Em `handleModelosPrescricaoChange`, ajustar para:
    - Obter descrições dos modelos selecionados.
    - Append ao `form.prescricaoPersonalizada` apenas das descrições ainda não presentes, separadas por `\n`.
- `src/pages/atendimento/hooks/useFormData.ts`
  - Em `handleModelosPrescricaoChange`, aplicar a mesma lógica para manter consistência com outras entradas onde o hook é usado diretamente.

## Verificação
- Selecionar itens nas listas e verificar que cada campo personalizado é preenchido de forma incremental, sem sobrescrever o que já foi digitado, sem duplicações, e com espaçamento simples.
- Confirmar que a atualização reflete imediatamente no textarea (controle do estado via `updateFormField`).

## Observação
- Não serão adicionados separadores visuais nem múltiplas quebras. Apenas `\n` simples entre itens, em todas as seções.
