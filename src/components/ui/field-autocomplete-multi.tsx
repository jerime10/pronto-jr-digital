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

  // Debounce search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        console.log('🔍 [AUTOCOMPLETE] Buscando sugestões para:', fieldName, 'termo:', searchTerm);
        const results = await onSearch(searchTerm);
        console.log('✅ [AUTOCOMPLETE] Sugestões encontradas:', results.length, results);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('❌ [AUTOCOMPLETE] Erro ao buscar sugestões:', error);
        toast.error('Erro ao buscar sugestões');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

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
    if (!selectedValues.includes(suggestion.field_content)) {
      onChange([...selectedValues, suggestion.field_content]);
    }
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
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
        <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`
                px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between group
                ${highlightedIndex === index ? 'bg-accent' : ''}
              `}
              onClick={() => handleSelectSuggestion(suggestion)}
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
