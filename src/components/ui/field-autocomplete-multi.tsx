import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutocompleteSuggestion {
  id: string;
  field_content: string;
  created_at: string;
}

interface FieldAutocompleteMultiProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onSearch: (term: string) => Promise<AutocompleteSuggestion[]>;
  placeholder?: string;
  fieldName: string;
  disabled?: boolean;
  className?: string;
}

export const FieldAutocompleteMulti: React.FC<FieldAutocompleteMultiProps> = ({
  selectedValues,
  onChange,
  onSearch,
  placeholder = 'Digite para buscar...',
  fieldName,
  disabled = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // CRÍTICO: Limpar COMPLETAMENTE o estado quando o fieldName mudar (troca de campo)
  useEffect(() => {
    console.log('🔄 [AUTOCOMPLETE] Campo mudou para:', fieldName);
    console.log('🧹 [AUTOCOMPLETE] RESETANDO TUDO - searchTerm, suggestions, isOpen, highlightedIndex');
    
    // Limpar TUDO imediatamente
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Limpar também o input DOM
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    console.log('✅ [AUTOCOMPLETE] Estado COMPLETAMENTE resetado');
  }, [fieldName]);

  // Debounce search - buscar sempre que houver 1+ caractere
  // Debounce search - buscar sempre que o termo mudar (inclui vazio, que traz últimos itens)
  useEffect(() => {
    console.log('🔄 [AUTOCOMPLETE] useEffect de busca acionado:', { searchTerm, fieldName, hasTrim: searchTerm.trim().length > 0 });
    
    // IMPORTANTE: Só buscar se o campo estiver definido
    if (!fieldName) {
      console.log('🚫 [AUTOCOMPLETE] Busca cancelada - fieldName vazio');
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    console.log('⏳ [AUTOCOMPLETE] Agendando busca com debounce de 300ms...');
    const timer = setTimeout(async () => {
      console.log('🚀 [AUTOCOMPLETE] Executando busca agora!');
      setIsLoading(true);
      try {
        console.log('🔍 [AUTOCOMPLETE] Buscando sugestões para:', { fieldName, searchTerm });
        const results = await onSearch(searchTerm);
        console.log('✅ [AUTOCOMPLETE] Resultados recebidos:', results.length, results);
        
        setSuggestions(results);
        setIsOpen(results.length > 0);
        console.log('📊 [AUTOCOMPLETE] Estado atualizado:', { suggestionsCount: results.length, isOpenNow: results.length > 0 });
      } catch (error) {
        console.error('❌ [AUTOCOMPLETE-SEARCH] Erro ao buscar sugestões:', { fieldName, searchTerm, error });
        toast.error('Erro ao buscar sugestões');
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      console.log('🧹 [AUTOCOMPLETE] Timer de busca cancelado');
    };
  }, [searchTerm, onSearch, fieldName]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        console.log('👆 [AUTOCOMPLETE] Click fora detectado - fechando dropdown e limpando estado');
        setIsOpen(false);
        setSearchTerm('');
        setSuggestions([]);
        setHighlightedIndex(-1);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    console.log('✅ [AUTOCOMPLETE] Item selecionado:', suggestion.field_content);
    console.log('📊 [AUTOCOMPLETE] Estado ANTES da limpeza:', { searchTerm, suggestionsCount: suggestions.length, isOpen, highlightedIndex });
    
    if (!selectedValues.includes(suggestion.field_content)) {
      const newValues = [...selectedValues, suggestion.field_content];
      onChange(newValues);
    }

    // CRÍTICO: Usar setTimeout para garantir que o estado seja limpo DEPOIS do render
    setTimeout(() => {
      console.log('🧹 [AUTOCOMPLETE] Limpando estado após seleção...');
      setSearchTerm('');
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      
      // Limpar o input DOM
      if (inputRef.current) {
        inputRef.current.value = '';
        console.log('✅ [AUTOCOMPLETE] Input DOM limpo');
      }
      
      console.log('✅ [AUTOCOMPLETE] Estado completamente limpo e pronto para nova busca');
    }, 0);
  };

  const handleRemoveValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClearAll = () => {
    onChange([]);
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleDeleteSuggestion = async (suggestion: AutocompleteSuggestion, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Deseja realmente excluir permanentemente "${suggestion.field_content}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('individual_field_templates')
        .delete()
        .eq('id', suggestion.id);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      toast.success('Template excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleInputBlur = () => {
    console.log('🔵 [AUTOCOMPLETE] Input perdeu foco - preparando para limpar estado');
    // Aguardar um pouco para permitir clicks em sugestões
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        console.log('🧹 [AUTOCOMPLETE] Limpando estado após perder foco');
        setSearchTerm('');
        setSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setSuggestions([]);
        setHighlightedIndex(-1);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="space-y-2">
        {/* Selected values */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
            {selectedValues.map((value, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1.5 text-sm"
              >
                <span className="max-w-[200px] truncate">{value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveValue(value)}
                  className="ml-2 hover:text-destructive transition-colors"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedValues.length > 1 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
                disabled={disabled}
                title="Limpar todos"
              >
                Limpar todos
              </button>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 pr-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 border-b">
            {suggestions.length} sugestão(ões) encontrada(s)
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`
                px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between group
                ${highlightedIndex === index ? 'bg-accent' : ''}
              `}
              onClick={() => {
                handleSelectSuggestion(suggestion);
              }}
            >
              <span className="flex-1 text-sm truncate">
                {suggestion.field_content}
              </span>
              <button
                type="button"
                onClick={(e) => handleDeleteSuggestion(suggestion, e)}
                className="ml-2 p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir permanentemente"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
