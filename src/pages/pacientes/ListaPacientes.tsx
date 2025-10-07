
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/database';
import { toast } from 'sonner';
import { usePatients } from '@/hooks/useEnhancedQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';

const ListaPacientes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { permissions, checkPermission } = usePermissions();
  
  const { data: patients, isLoading, error, refetch } = usePatients();
  
  const handleDeletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Paciente excluído com sucesso!");
      refetch();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error("Erro ao excluir paciente.");
    }
  };
  
  const filteredPatients = patients?.filter(
    patient => 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.sus.includes(searchQuery)
  ) || [];
  
  if (isLoading) {
    return <div className="flex justify-center p-10">Carregando pacientes...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-10">Erro ao carregar pacientes: {(error as Error).message}</div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-gray-500 mt-1">Gestão de cadastros de pacientes</p>
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        <Input
          placeholder="Buscar por nome ou SUS..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
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
                        onClick={() => handleDeletePatient(patient.id)}
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
