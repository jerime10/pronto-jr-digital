## Objetivo
- Evitar que a lista suspensa de busca inteligente abra ao digitar nos campos de texto de "Informações adicionais" nas seções Antecedentes e Alergias.
- Mostrar a lista suspensa de busca inteligente somente após o usuário digitar pelo menos 1 caractere no campo de busca.

## Ajustes Propostos
### Componente `FieldAutocompleteMulti`
- Bloquear buscas quando `searchTerm.trim().length === 0` e fechar dropdown:
  - No efeito de debounce, retornar cedo quando vazio e `setSuggestions([])` + `setIsOpen(false)`.
- Tornar abertura do dropdown dependente do foco no input:
  - Ao receber resultados, `setIsOpen(true)` apenas se `document.activeElement === inputRef.current`.
- Remover busca automática no `onFocus` quando `searchTerm` está vazio:
  - `onFocus`: só buscar se `searchTerm.length > 0`. Caso contrário, não abrir dropdown.
- Fechar dropdown ao perder foco:
  - Adicionar `onBlur` no input para `setIsOpen(false)`.

### Hook `useIndividualFieldTemplates`
- Alterar `searchFieldTemplates` para só consultar o Supabase quando `searchTerm.trim().length > 0`:
  - Se vazio, retornar `[]` diretamente, evitando mostrar qualquer sugestão inicial.

## Verificação
- Rodar o servidor e validar manualmente:
  - Em `Informações Clínicas` → digitar nas Textareas de "Antecedentes Personalizados" e "Alergias Personalizadas": dropdown não deve abrir.
  - No campo de busca inteligente: ao digitar o primeiro caractere, iniciar busca e abrir dropdown; apagando o texto, dropdown fecha.

## Impacto e Referências
- `src/components/ui/field-autocomplete-multi.tsx`: controle de abertura/fechamento e gatilhos de busca.
- `src/hooks/useIndividualFieldTemplates.ts`: consulta condicionada pelo termo de busca.
- `src/pages/atendimento/components/InformacoesTab.tsx`: sem alterações funcionais adicionais previstas.

## Perguntas (para confirmar comportamento)
- Deseja manter a busca com mínimo de 1 caractere ou preferir 2 para reduzir ruído?
- Em foco do input (sem digitar), devemos manter o dropdown fechado (sem sugestões) — confirmar esta UX.
- O limite atual de 10 resultados por busca está adequado?
- Queremos fechar o dropdown imediatamente ao `blur` mesmo que haja sugestões visíveis?
