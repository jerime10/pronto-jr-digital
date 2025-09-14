
import React, { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MedicalRecordCard } from './MedicalRecordCard';
import { useMedicalRecords, MedicalRecord } from '../hooks/useMedicalRecords';
import { useActions } from '../hooks/useActions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ClipboardList } from 'lucide-react';

export const MedicalRecordsList: React.FC = () => {
  const { data: medicalRecords, isLoading } = useMedicalRecords();
  const { deleteMedicalRecordMutation, savePDF, viewRecord } = useActions();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Handle delete confirmation dialog
  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      deleteMedicalRecordMutation.mutate(recordToDelete);
    }
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  // Handle generate PDF
  const handleGeneratePdf = (record: MedicalRecord) => {
    setSelectedRecord(record);
    savePDF.mutate({ record });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!medicalRecords || medicalRecords.length === 0) {
    return (
      <EmptyState 
        icon={<ClipboardList size={32} />}
        title="Nenhum atendimento encontrado."
        description="Os atendimentos registrados aparecerão nesta página."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {medicalRecords.map((record: MedicalRecord) => (
          <MedicalRecordCard
            key={record.id}
            record={record}
            onGeneratePdf={handleGeneratePdf}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
