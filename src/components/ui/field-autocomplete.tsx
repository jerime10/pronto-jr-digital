import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface AutocompleteSuggestion {
  id: string;
  field_content: string;
  created_at: string;
}

interface FieldAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (term: string) => Promise<AutocompleteSuggestion[]>;
  placeholder?: string;
  type?: 'input' | 'textarea';
  disabled?: boolean;
  className?: string;
}

export const FieldAutocomplete = ({
  value,
  onChange,
  onSearch,
  placeholder,
  type = 'input',
  disabled = false,
  className,
}: FieldAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar sugestões com debounce
  const handleInputChange = async (newValue: string) => {
    onChange(newValue);

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Se o valor estiver vazio, não buscar
    if (newValue.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Debounce de 300ms
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await onSearch(newValue);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Selecionar sugestão
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.field_content);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {type === 'textarea' ? (
        <Textarea
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          rows={4}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      )}

      {/* Dropdown de sugestões */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    'border-b border-border last:border-b-0',
                    selectedIndex === index && 'bg-accent text-accent-foreground'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">💾</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{suggestion.field_content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Salvo em {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
