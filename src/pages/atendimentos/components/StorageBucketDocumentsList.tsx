
import React, { useState, useMemo, useEffect } from 'react';
import { StorageBucketDocumentCard } from './StorageBucketDocumentCard';
import { StorageBucketDocumentListView } from './StorageBucketDocumentListView';
import { StorageBucketDocumentDetailedView } from './StorageBucketDocumentDetailedView';
import { StorageBucketDocumentTableView } from './StorageBucketDocumentTableView';
import { StorageSearchFilters, ViewFormat } from './StorageSearchFilters';
import { useStorageBucketDocuments } from '../hooks/useStorageBucketDocuments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

export const StorageBucketDocumentsList: React.FC = () => {
  const { data: documents, isLoading, error, refetch } = useStorageBucketDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewFormat, setViewFormat] = useState<ViewFormat>('grid');

  // Load view format preference from localStorage on mount
  useEffect(() => {
    const savedViewFormat = localStorage.getItem('documents-view-format') as ViewFormat;
    if (savedViewFormat && ['grid', 'list', 'detailed', 'table'].includes(savedViewFormat)) {
      setViewFormat(savedViewFormat);
    }
  }, []);

  // Save view format preference to localStorage when changed
  const handleViewFormatChange = (format: ViewFormat) => {
    setViewFormat(format);
    localStorage.setItem('documents-view-format', format);
  };

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    return documents.filter(doc => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientName = (doc.patient?.name || doc.metadata.patientName || '').toLowerCase();
        const patientSus = (doc.patient?.sus || '').toLowerCase();
        const patientPhone = (doc.patient?.phone || doc.metadata.patientPhone || '').toLowerCase();
        const fileName = doc.name.toLowerCase();

        const matchesSearch = 
          patientName.includes(searchLower) ||
          patientSus.includes(searchLower) ||
          patientPhone.includes(searchLower) ||
          fileName.includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtro de data
      if (startDate || endDate) {
        const docDate = new Date(doc.created_at);
        
        if (startDate) {
          const start = new Date(startDate);
          if (docDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Incluir o dia inteiro
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error("Error loading documents:", error);
    return (
      <EmptyState 
        icon={<FileText size={32} />}
        title="Erro ao carregar documentos"
        description="Ocorreu um erro ao buscar os documentos do Storage. Tente novamente."
      />
    );
  }

  const renderDocuments = () => {
    if (!documents || documents.length === 0) {
      return (
        <EmptyState 
          icon={<FileText size={32} />}
          title="Nenhum documento encontrado"
          description="Os documentos PDF do Storage aparecerão aqui quando estiverem disponíveis."
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
        return <StorageBucketDocumentListView documents={filteredDocuments} onRefresh={refetch} />;
      case 'detailed':
        return <StorageBucketDocumentDetailedView documents={filteredDocuments} onRefresh={refetch} />;
      case 'table':
        return <StorageBucketDocumentTableView documents={filteredDocuments} onRefresh={refetch} />;
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <StorageBucketDocumentCard
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
    <div className="space-y-6">
      <StorageSearchFilters
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onDateFilter={handleDateFilter}
        onClearFilters={handleClearFilters}
        onViewFormatChange={handleViewFormatChange}
        viewFormat={viewFormat}
      />

      {documents && documents.length > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          Mostrando {filteredDocuments.length} de {documents.length} documento(s)
        </div>
      )}
      
      {renderDocuments()}
    </div>
  );
};
