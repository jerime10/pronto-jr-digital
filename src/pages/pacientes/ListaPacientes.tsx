
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePatients } from '@/hooks/useEnhancedQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ListaPacientes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: patients, isLoading, error, refetch } = usePatients();
  usePermissions();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (patient: { id: string; name: string }) => {
    setDeleteTarget(patient);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      // Usar função SECURITY DEFINER para bypass RLS
      const { data, error } = await supabase.rpc('delete_patient_by_id', {
        patient_id: deleteTarget.id
      });
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Paciente não encontrado');
      }

      toast.success('Paciente excluído com sucesso!');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter(
      (patient) => patient.name.toLowerCase().includes(q) || patient.sus.includes(searchQuery.trim())
    );
  }, [patients, searchQuery]);

  if (isLoading) {
    return <div className="flex justify-center p-10 text-muted-foreground">Carregando pacientes...</div>;
  }

  if (error) {
    return <div className="text-destructive p-10">Erro ao carregar pacientes: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Gestão de cadastros de pacientes</p>
        </div>

        <ActionButtonGuard permission="pacientes_criar">
          <Button asChild>
            <Link to="/pacientes/novo" className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
        </ActionButtonGuard>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground peer-focus:text-foreground" />
        <Input
          placeholder="Buscar por nome ou SUS..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a excluir permanentemente o paciente:</p>
              <p className="font-bold text-foreground">{deleteTarget?.name}</p>
              <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SUS</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Endereço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.sus}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.address}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <ActionButtonGuard permission="pacientes_editar">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/pacientes/${patient.id}`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                    </ActionButtonGuard>
                    <ActionButtonGuard permission="pacientes_excluir">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog({ id: patient.id, name: patient.name })}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </ActionButtonGuard>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListaPacientes;

