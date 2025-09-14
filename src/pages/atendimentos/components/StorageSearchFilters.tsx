
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
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome do paciente, SUS ou telefone..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>

        {(searchTerm || startDate || endDate) && (
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* View Format Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Visualização:</span>
        <div className="flex gap-1">
          {viewOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={viewFormat === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewFormatChange(value)}
              className="flex items-center gap-1"
              title={label}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div>
                <Button
                  onClick={handleApplyDateFilter}
                  className="w-full"
                  disabled={!startDate && !endDate}
                >
                  Aplicar filtro de data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
