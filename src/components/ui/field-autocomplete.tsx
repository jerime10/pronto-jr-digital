import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface AutocompleteSuggestion {
  id: string;
  field_content: string;
  created_at: string;
}

interface FieldAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (term: string) => Promise<AutocompleteSuggestion[]>;
  onDelete?: (id: string) => Promise<void>;
  placeholder?: string;
  type?: 'input' | 'textarea';
  disabled?: boolean;
  className?: string;
}

export const FieldAutocomplete = ({
  value,
  onChange,
  onSearch,
  onDelete,
  placeholder,
  type = 'input',
  disabled = false,
  className,
}: FieldAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    if (!newValue || newValue.trim().length === 0) {
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

  // Deletar sugestão
  const handleDeleteSuggestion = async (e: React.MouseEvent, suggestionId: string) => {
    e.stopPropagation();
    
    if (!onDelete) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este item permanentemente?')) {
      return;
    }

    setDeletingId(suggestionId);
    
    try {
      await onDelete(suggestionId);
      
      // Remover da lista de sugestões
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      
      toast.success('Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error('Erro ao excluir item do banco de dados');
    } finally {
      setDeletingId(null);
    }
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
                <div
                  key={suggestion.id}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    'border-b border-border last:border-b-0',
                    selectedIndex === index && 'bg-accent text-accent-foreground'
                  )}
                >
                  <button
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="flex-1 text-left flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">💾</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{suggestion.field_content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Salvo em {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => handleDeleteSuggestion(e, suggestion.id)}
                      disabled={deletingId === suggestion.id}
                      className="hover:bg-destructive/20 rounded-full p-1.5 text-destructive disabled:opacity-50"
                      title="Excluir permanentemente do banco de dados"
                    >
                      {deletingId === suggestion.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
