import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent } from './card';
import { X, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExamOption {
  id: string;
  name: string;
  instructions?: string | null;
}

interface MultiSelectSearchExamsProps {
  options: ExamOption[];
  selectedValues: string[];
  onSelectionChange: (selectedNames: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onDeleteOption?: (optionId: string, optionName: string) => Promise<void>;
}

export const MultiSelectSearchExams: React.FC<MultiSelectSearchExamsProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Buscar exames...",
  className,
  disabled = false,
  onDeleteOption
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.instructions && option.instructions.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Opções não selecionadas
  const availableOptions = filteredOptions.filter(option => 
    !selectedValues.includes(option.name)
  );

  // Resetar índice destacado quando as opções mudam
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < availableOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < availableOptions.length) {
          selectOption(availableOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectOption = (option: ExamOption) => {
    const newSelection = [...selectedValues, option.name];
    onSelectionChange(newSelection);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeOption = (optionName: string) => {
    const newSelection = selectedValues.filter(name => name !== optionName);
    onSelectionChange(newSelection);
  };

  const handleDeleteOption = async (examName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente "${examName}"?`)) {
      return;
    }

    // Encontrar o ID do exame pelo nome
    const exam = options.find(opt => opt.name === examName);
    if (!exam) {
      toast.error('Exame não encontrado');
      return;
    }

    setIsDeleting(exam.id);
    
    try {
      if (onDeleteOption) {
        await onDeleteOption(exam.id, examName);
      } else {
        const { error } = await supabase
          .from('exam_models')
          .delete()
          .eq('id', exam.id);
        
        if (error) throw error;
      }
      
      // Remover da seleção se estava selecionado
      const newSelection = selectedValues.filter(name => name !== examName);
      onSelectionChange(newSelection);
      
      toast.success('Exame excluído com sucesso!');
      
      // Recarregar a página para atualizar a lista
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir exame:', error);
      toast.error('Erro ao excluir exame do banco de dados');
    } finally {
      setIsDeleting(null);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Exames selecionados */}
      {selectedValues.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Exames selecionados:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
              className="h-6 px-2 text-xs"
            >
              Limpar todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedValues.map((examName) => {
              const exam = options.find(opt => opt.name === examName);
              return (
                <Badge
                  key={examName}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  {examName}
                  <button
                    type="button"
                    onClick={() => removeOption(examName)}
                    disabled={disabled}
                    className="ml-1 hover:bg-muted rounded-full p-0.5 disabled:opacity-50"
                    title="Remover da seleção"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {exam && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteOption(examName, e)}
                      disabled={disabled || isDeleting === exam.id}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 text-destructive disabled:opacity-50"
                      title="Excluir permanentemente do banco de dados"
                    >
                      {isDeleting === exam.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Dropdown com opções */}
        {isOpen && !disabled && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border shadow-lg">
            <CardContent className="p-0">
              {availableOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {searchTerm ? 'Nenhum exame encontrado' : 'Todos os exames foram selecionados'}
                </div>
              ) : (
                <div className="py-1">
                  {availableOptions.map((option, index) => (
                    <div
                      key={option.id}
                      onClick={() => selectOption(option)}
                      className={cn(
                        "px-3 py-2 cursor-pointer transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        index === highlightedIndex && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="font-medium text-sm">{option.name}</div>
                      {option.instructions && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contador de seleções */}
      {selectedValues.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {selectedValues.length} exame{selectedValues.length !== 1 ? 's' : ''} selecionado{selectedValues.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};