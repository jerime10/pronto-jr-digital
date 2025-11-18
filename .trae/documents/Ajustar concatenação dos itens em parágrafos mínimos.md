## Objetivo
- Remover o separador com traços entre itens selecionados nas seções Antecedentes e Alergias.
- Inserir cada item escolhido como parágrafos separados com espaçamento mínimo (apenas uma linha em branco entre eles).

## Arquivos e Pontos de Ajuste
- `src/pages/atendimento/components/InformacoesTab.tsx`
  - Funções: `handleQueixaModelChange`, `handleAntecedentesModelChange`, `handleAlergiasModelChange`.

## Implementação
- Substituir a lógica atual de concatenação que usa um separador visual (ex.: "-------" ou similares) por:
  - Normalizar conteúdos: `items.map(i => i.trim()).filter(i => i.length)`. 
  - Juntar com `"\n\n"` para criar parágrafos com espaçamento mínimo.
  - Evitar múltiplas linhas em branco, removendo espaços extras na junção.
- Aplicar a mesma regra para Queixa Principal, Antecedentes e Alergias para consistência.

## Validação
- Selecionar 2–3 itens em cada seção e verificar que o campo de personalização mostra cada item em parágrafos separados, sem traços ou separadores.
- Editar manualmente o campo para garantir que não reaparecem separadores e que o espaçamento se mantém.

## Observações
- Nenhuma alteração de banco necessária; a busca inteligente já foi ajustada para exigir 1+ caractere.
- Mantém compatibilidade com salvamento/exportação atuais, pois apenas o texto concatenado muda.

## Perguntas rápidas
- Confirmar que o espaçamento desejado é exatamente uma linha em branco (equivalente a `"\n\n"`).