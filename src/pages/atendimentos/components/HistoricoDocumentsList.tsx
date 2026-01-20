
import React, { useState, useMemo, useEffect } from 'react';
import { HistoricoDocumentCard } from './HistoricoDocumentCard';
import { HistoricoDocumentListView } from './HistoricoDocumentListView';
import { StorageSearchFilters, ViewFormat } from './StorageSearchFilters';
import { useHistoricoDocuments } from '../hooks/useHistoricoDocuments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const HistoricoDocumentsList: React.FC = () => {
  const { data: documents, isLoading, error, refetch } = useHistoricoDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewFormat, setViewFormat] = useState<ViewFormat>('list');

  // Load view format preference from localStorage on mount
  useEffect(() => {
    const savedViewFormat = localStorage.getItem('historico-view-format') as ViewFormat;
    if (savedViewFormat && ['grid', 'list', 'detailed', 'table'].includes(savedViewFormat)) {
      setViewFormat(savedViewFormat);
    }
  }, []);

  // Save view format preference to localStorage when changed
  const handleViewFormatChange = (format: ViewFormat) => {
    setViewFormat(format);
    localStorage.setItem('historico-view-format', format);
  };

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    return documents.filter(doc => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientName = doc.patient.name.toLowerCase();
        const patientSus = doc.patient.sus.toLowerCase();
        const patientPhone = doc.patient.phone.toLowerCase();
        const fileName = doc.filename.toLowerCase();

        const matchesSearch = 
          patientName.includes(searchLower) ||
          patientSus.includes(searchLower) ||
          patientPhone.includes(searchLower) ||
          fileName.includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtro de data (usando attendance_start_at se disponível, senão created_at)
      if (startDate || endDate) {
        const docDate = doc.attendance_start_at ? new Date(doc.attendance_start_at) : new Date(doc.created_at);
        
        if (startDate) {
          const start = new Date(startDate);
          if (docDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (docDate > end) return false;
        }
      }

      return true;
    });
  }, [documents, searchTerm, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Lista atualizada com sucesso!');
  };

  // Estatísticas dos documentos
  const stats = useMemo(() => {
    if (!documents) return { total: 0, processing: 0, ready: 0, error: 0 };
    
    return {
      total: documents.length,
      processing: documents.filter(doc => doc.status === 'processing').length,
      ready: documents.filter(doc => doc.status === 'ready').length,
      error: documents.filter(doc => doc.status === 'error').length
    };
  }, [documents]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error("Error loading historico documents:", error);
    return (
      <EmptyState 
        icon={<FileText size={32} />}
        title="Erro ao carregar histórico"
        description="Ocorreu um erro ao buscar o histórico de atendimentos. Tente novamente."
      />
    );
  }

  const renderDocuments = () => {
    if (!documents || documents.length === 0) {
      return (
        <EmptyState 
          icon={<FileText size={32} />}
          title="Nenhum documento encontrado"
          description="Os documentos do histórico de atendimentos aparecerão aqui quando estiverem disponíveis."
        />
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <EmptyState 
          icon={<FileText size={32} />}
          title="Nenhum documento encontrado"
          description="Nenhum documento corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
        />
      );
    }

    switch (viewFormat) {
      case 'list':
        return <HistoricoDocumentListView documents={filteredDocuments} onRefresh={refetch} />;
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <HistoricoDocumentCard
                key={doc.id}
                document={doc}
                onRefresh={refetch}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <StorageSearchFilters
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onDateFilter={handleDateFilter}
            onClearFilters={handleClearFilters}
            onViewFormatChange={handleViewFormatChange}
            viewFormat={viewFormat}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto sm:ml-4 flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Atualizar</span>
        </Button>
      </div>

      {/* Estatísticas */}
      {documents && documents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.ready}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Prontos</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.processing}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Processando</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.error}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Com Erro</div>
          </div>
        </div>
      )}

      {documents && documents.length > 0 && (
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
          Mostrando {filteredDocuments.length} de {documents.length} documento(s)
          {stats.processing > 0 && (
            <span className="ml-2 text-yellow-600">
              • {stats.processing} em processamento
            </span>
          )}
        </div>
      )}
      
      <div className="w-full overflow-x-auto">
        {renderDocuments()}
      </div>
    </div>
  );
};
