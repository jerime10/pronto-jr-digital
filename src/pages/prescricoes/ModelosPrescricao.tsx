
import React, { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PrescriptionModel } from '@/types/database';
import { usePrescriptionModels } from '@/hooks/useEnhancedQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';

const ModelosPrescricao = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<Partial<PrescriptionModel>>({ id: '', name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { permissions, isAdmin, hasPermission } = usePermissions();
  
  const { data: models = [], isLoading: isLoadingModels, error, refetch } = usePrescriptionModels();
  
  const filteredModels = models?.filter(
    model => 
      model.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleOpenNew = () => {
    setCurrentModel({ id: '', name: '', description: '' });
    setIsEditing(false);
    setIsDialogOpen(true);
  };
  
  const handleOpenEdit = (model: PrescriptionModel) => {
    setCurrentModel({ ...model });
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prescription_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Modelo excluído com sucesso!");
      refetch();
    } catch (error) {
      console.error('Error deleting prescription model:', error);
      toast.error("Erro ao excluir modelo.");
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentModel(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    if (!currentModel.name || !currentModel.description) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('prescription_models')
          .update({
            name: currentModel.name!,
            description: currentModel.description!
          })
          .eq('id', currentModel.id);
        
        if (error) throw error;
        toast.success("Modelo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('prescription_models')
          .insert([{
            name: currentModel.name!,
            description: currentModel.description!
          }]);
        
        if (error) throw error;
        toast.success("Modelo criado com sucesso!");
      }
      
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving prescription model:', error);
      toast.error("Erro ao salvar modelo.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingModels) {
    return <div className="flex justify-center p-10">Carregando modelos de prescrição...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-10">Erro ao carregar modelos: {(error as Error).message}</div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Modelos de Prescrição</h1>
          <p className="text-gray-500 mt-1">Gerencie templates para prescrições médicas</p>
        </div>
        
        <ActionButtonGuard permission="prescricoes_criar">
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Modelo
          </Button>
        </ActionButtonGuard>
      </div>
      
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        <Input
          placeholder="Buscar modelos..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="truncate max-w-[400px]">
                      {model.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ActionButtonGuard permission="prescricoes_editar">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(model)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </ActionButtonGuard>
                    <ActionButtonGuard permission="prescricoes_excluir">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(model.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </ActionButtonGuard>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhum modelo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Modelo' : 'Novo Modelo de Prescrição'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações do modelo de prescrição.'
                : 'Preencha os campos para criar um novo modelo de prescrição.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Amoxicilina 500mg"
                value={currentModel.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ex: Tomar 1 comprimido de 8 em 8 horas por 7 dias."
                value={currentModel.description}
                onChange={handleChange}
                rows={5}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelosPrescricao;
