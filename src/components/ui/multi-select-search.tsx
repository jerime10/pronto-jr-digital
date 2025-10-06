import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
  description?: string;
}

interface MultiSelectSearchProps {
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelectSearch: React.FC<MultiSelectSearchProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Selecione opções...",
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obter opções selecionadas
  const selectedOptions = options.filter(option => 
    selectedValues.includes(option.id)
  );

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleOptionToggle(filteredOptions[focusedIndex].id);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, filteredOptions]);

  const handleOptionToggle = (optionId: string) => {
    const newSelection = selectedValues.includes(optionId)
      ? selectedValues.filter(id => id !== optionId)
      : [...selectedValues, optionId];
    
    onSelectionChange(newSelection);
  };

  const handleRemoveOption = (optionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = selectedValues.filter(id => id !== optionId);
    onSelectionChange(newSelection);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Campo de entrada principal */}
      <div
        className={cn(
          "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          "cursor-pointer"
        )}
        onClick={handleInputClick}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {/* Tags dos itens selecionados */}
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs"
            >
              <span className="truncate max-w-[120px]">{option.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(option.id, e)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Campo de busca */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={selectedOptions.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
            disabled={disabled}
          />
        </div>
        
        {/* Ícone de dropdown */}
        <ChevronDown 
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </div>

      {/* Dropdown de opções */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                  selectedValues.includes(option.id) && "bg-accent",
                  index === focusedIndex && "bg-accent"
                )}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex-1">
                  <div className="font-medium">{option.name}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {option.description.substring(0, 60)}...
                    </div>
                  )}
                </div>
                {selectedValues.includes(option.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};