import * as React from "react"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export interface AdvancedSelectOption {
  label: string
  value: string
}

interface AdvancedSelectProps {
  options: AdvancedSelectOption[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  multiple?: boolean
  className?: string
  title?: string
  disabled?: boolean
}

/**
 * AdvancedSelect Component
 * 
 * A replacement for traditional dropdowns using a floating modal (Dialog)
 * with built-in search and selection indicators.
 */
export function AdvancedSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione um item...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
  multiple = false,
  className,
  title = "Selecionar Item",
  disabled = false,
}: AdvancedSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Memoize selected values for efficient lookups
  const selectedValues = React.useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const isSelected = selectedValues.includes(optionValue)
      const newValue = isSelected
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValue)
    } else {
      onChange(optionValue)
      setOpen(false)
    }
  }

  const handleRemove = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== optionValue))
    } else {
      onChange("")
    }
  }

  // Get selected options labels for the trigger
  const selectedOptions = options.filter((option) => 
    selectedValues.includes(option.value)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-11 py-2 px-3 border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 items-center text-left">
            {selectedOptions.length > 0 ? (
              multiple ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-200"
                  >
                    {option.label}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                      data-testid="remove-option"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))
              ) : (
                <span className="font-medium animate-in fade-in duration-200">
                  {selectedOptions[0]?.label}
                </span>
              )
            ) : (
              <span className="opacity-50 font-normal italic">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out bg-white"
        onOpenAutoFocus={(e) => {
          // Prevent focus on the close button initially for better UX with CommandInput
          // e.preventDefault();
        }}
      >
        <DialogHeader className="p-4 border-b bg-slate-50/50">
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <Command className="border-none bg-white">
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="border-none focus:ring-0 h-14 text-base text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          <CommandList className="max-h-[60vh] p-2 bg-white">
            <CommandEmpty className="py-12 text-center bg-white">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-slate-200" />
                <p className="text-slate-500 font-medium">{emptyMessage}</p>
              </div>
            </CommandEmpty>
            
            <CommandGroup className="bg-white">
              <div className="space-y-1 bg-white">
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        "flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all",
                        isSelected 
                          ? "bg-emerald-50 text-emerald-900 font-semibold" 
                          : "hover:bg-slate-100 text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                          isSelected 
                            ? "bg-emerald-500 border-emerald-500" 
                            : "border-slate-300 bg-white"
                        )}>
                          <Check className={cn(
                            "h-3.5 w-3.5 text-white transition-transform duration-200",
                            isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                          )} />
                        </div>
                        <span className="text-sm md:text-base">{option.label}</span>
                      </div>
                      
                      {isSelected && !multiple && (
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Selecionado
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
        
        <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          <div className="flex gap-4">
            <span>↑↓ Navegar</span>
            <span>↵ Selecionar</span>
            <span>ESC Fechar</span>
          </div>
          {multiple && selectedValues.length > 0 && (
            <span className="text-emerald-600 font-bold">
              {selectedValues.length} selecionado(s)
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
