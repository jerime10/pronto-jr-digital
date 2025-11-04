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

  // Reset searchTerm when component unmounts or selectedValues changes dramatically
  useEffect(() => {
    // Se selectedValues estiver vazio e searchTerm não estiver, limpar searchTerm
    if (selectedValues.length === 0 && searchTerm) {
      console.log('🧹 [AUTOCOMPLETE-RESET] Limpando searchTerm pois selectedValues está vazio');
      setSearchTerm('');
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [selectedValues, searchTerm]);

  // Debounce search
  useEffect(() => {
    console.log('🔍 [AUTOCOMPLETE-EFFECT] useEffect disparado:', {
      fieldName,
      searchTerm,
      searchTermLength: searchTerm.length,
      searchTermTrimmed: searchTerm.trim(),
      timestamp: new Date().toISOString()
    });

    // Sempre fazer a busca, mesmo sem searchTerm (para mostrar todas as opções)
    console.log('⏳ [AUTOCOMPLETE-EFFECT] Iniciando timer de debounce (300ms)', { fieldName, searchTerm });
    const timer = setTimeout(async () => {
      console.log('⏰ [AUTOCOMPLETE-DEBOUNCE] Timer disparado após 300ms', { fieldName, searchTerm });
      setIsLoading(true);
      try {
        console.log('🔍 [AUTOCOMPLETE-SEARCH] Chamando onSearch:', {
          fieldName,
          searchTerm,
          onSearchType: typeof onSearch,
          timestamp: new Date().toISOString()
        });
        
        const results = await onSearch(searchTerm);
        
        console.log('✅ [AUTOCOMPLETE-SEARCH] Resultados recebidos:', {
          fieldName,
          searchTerm,
          count: results.length,
          firstResult: results[0]?.field_content?.substring(0, 50),
          hasResults: results.length > 0
        });
        
        setSuggestions(results);
        const shouldOpen = results.length > 0;
        console.log(`📋 [AUTOCOMPLETE-SEARCH] Atualizando estado:`, {
          fieldName,
          suggestionsCount: results.length,
          isOpen: shouldOpen,
          willShowDropdown: shouldOpen
        });
        setIsOpen(shouldOpen);
        
        if (results.length === 0) {
          console.log('⚠️ [AUTOCOMPLETE-SEARCH] Nenhum resultado encontrado:', { fieldName, searchTerm });
        } else {
          console.log('🎉 [AUTOCOMPLETE-SEARCH] Dropdown deve abrir agora com', results.length, 'itens');
        }
      } catch (error) {
        console.error('❌ [AUTOCOMPLETE-SEARCH] Erro ao buscar sugestões:', {
          fieldName,
          searchTerm,
          error
        });
        toast.error('Erro ao buscar sugestões');
      } finally {
        setIsLoading(false);
        console.log('🏁 [AUTOCOMPLETE-SEARCH] Busca finalizada:', { fieldName, isLoading: false });
      }
    }, 300);

    return () => {
      console.log('🧹 [AUTOCOMPLETE-EFFECT] Limpando timer de debounce');
      clearTimeout(timer);
    };
  }, [searchTerm, onSearch, fieldName]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    console.log('🎯 [AUTOCOMPLETE-SELECT] ===== INÍCIO Seleção =====');
    console.log('🎯 [AUTOCOMPLETE-SELECT] Sugestão selecionada:', {
      fieldName,
      suggestionId: suggestion.id,
      suggestionContent: suggestion.field_content?.substring(0, 50) + '...',
      isAlreadySelected: selectedValues.includes(suggestion.field_content),
      currentSelectedValuesCount: selectedValues.length
    });

    if (!selectedValues.includes(suggestion.field_content)) {
      const newValues = [...selectedValues, suggestion.field_content];
      console.log('✅ [AUTOCOMPLETE-SELECT] Adicionando novo valor:', {
        fieldName,
        newValuePreview: suggestion.field_content?.substring(0, 50) + '...',
        totalValues: newValues.length
      });
      console.log('📤 [AUTOCOMPLETE-SELECT] Chamando onChange com', newValues.length, 'valores');
      onChange(newValues);
    } else {
      console.log('⚠️ [AUTOCOMPLETE-SELECT] Valor já selecionado, ignorando');
    }
    
    console.log('🧹 [AUTOCOMPLETE-SELECT] Limpando estado: searchTerm, suggestions, isOpen');
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
    console.log('🎯 [AUTOCOMPLETE-SELECT] ===== FIM Seleção =====');
  };

  const handleRemoveValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
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
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={async () => {
              console.log('👆 [AUTOCOMPLETE-FOCUS] Campo focado, buscando sugestões:', fieldName);
              // Buscar sugestões ao focar no campo
              if (!isLoading && suggestions.length === 0) {
                setIsLoading(true);
                try {
                  const results = await onSearch(searchTerm);
                  console.log('👆 [AUTOCOMPLETE-FOCUS] Resultados ao focar:', results.length);
                  setSuggestions(results);
                  if (results.length > 0) {
                    setIsOpen(true);
                  }
                } catch (error) {
                  console.error('❌ [AUTOCOMPLETE-FOCUS] Erro ao buscar:', error);
                } finally {
                  setIsLoading(false);
                }
              } else if (suggestions.length > 0) {
                console.log('👆 [AUTOCOMPLETE-FOCUS] Já existem sugestões, apenas abrindo dropdown');
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
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
                console.log('🖱️ [AUTOCOMPLETE-CLICK] Sugestão clicada:', {
                  fieldName,
                  index,
                  suggestion
                });
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
      
      {/* Debug overlay quando isOpen é true mas não há sugestões */}
      {isOpen && suggestions.length === 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-yellow-100 border border-yellow-300 rounded-md shadow-lg p-2">
          <p className="text-xs text-yellow-800">Debug: isOpen={String(isOpen)}, suggestions={suggestions.length}</p>
        </div>
      )}
    </div>
  );
};
