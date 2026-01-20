
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Grid, List, LayoutList, Table } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type ViewFormat = 'grid' | 'list' | 'detailed' | 'table';

interface SearchFiltersProps {
  onSearch: (searchTerm: string) => void;
  onDateFilter: (startDate: string, endDate: string) => void;
  onClearFilters: () => void;
  onViewFormatChange: (format: ViewFormat) => void;
  searchTerm: string;
  viewFormat: ViewFormat;
}

export const StorageSearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onDateFilter,
  onClearFilters,
  onViewFormatChange,
  searchTerm,
  viewFormat
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleApplyDateFilter = () => {
    onDateFilter(startDate, endDate);
  };

  const handleClearAll = () => {
    setStartDate('');
    setEndDate('');
    onClearFilters();
  };

  const viewOptions = [
    { value: 'grid' as ViewFormat, icon: Grid, label: 'Grade' },
    { value: 'list' as ViewFormat, icon: List, label: 'Lista' },
    { value: 'detailed' as ViewFormat, icon: LayoutList, label: 'Detalhada' },
    { value: 'table' as ViewFormat, icon: Table, label: 'Tabela' },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 w-full text-sm"
          />
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 sm:gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filtros</span>
          </Button>

          {(searchTerm || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Format Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Visualização:</span>
        <div className="flex gap-1 flex-shrink-0">
          {viewOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={viewFormat === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewFormatChange(value)}
              className="flex items-center gap-1 px-2 sm:px-3"
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {showFilters && (
        <Card className="w-full">
          <CardContent className="pt-4 px-3 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 items-end">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                  Data final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <Button
                  onClick={handleApplyDateFilter}
                  className="w-full text-sm"
                  size="sm"
                  disabled={!startDate && !endDate}
                >
                  <span className="hidden sm:inline">Aplicar filtro</span>
                  <span className="sm:hidden">Aplicar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
