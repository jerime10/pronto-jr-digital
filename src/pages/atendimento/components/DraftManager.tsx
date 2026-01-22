
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, FileText, Trash2, Clock, User, Calendar, Search } from 'lucide-react';
import { useDraftManager, Patient, Draft } from '../hooks/useDraftManager';
import { FormState } from '../hooks/useFormData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface Professional {
  id: string;
  nome: string;
}

interface DraftManagerProps {
  pacienteSelecionado: Patient | null;
  profissionalAtual: Professional | null;
  form: FormState;
  setFormData: (formData: FormState) => void;
  handleSelectPaciente: (patient: Patient) => void;
  dynamicFields?: Record<string, string>;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  dynamicFields = {},
  onDynamicFieldsChange
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  const {
    drafts,
    isLoadingDrafts,
    isSavingDraft,
    saveDraft,
    loadDraft,
    deleteDraft,
    loadDrafts
  } = useDraftManager({
    pacienteSelecionado,
    profissionalAtual,
    form,
    setFormData,
    handleSelectPaciente,
    dynamicFields,
    onDynamicFieldsChange
  });

  // Recarregar rascunhos quando o diálogo de gerenciamento é aberto
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open && profissionalAtual?.id) {
      // Carregamento silencioso: evita toast "falso positivo" quando a lista acaba carregando.
      loadDrafts({ silent: true });
    }
  };

  const handleLoadDraft = async (draft: Draft) => {
    console.log('📂 [DraftManager] Carregando rascunho:', draft);
    await loadDraft(draft);
    setIsDialogOpen(false);
  };

  const handleSaveDraft = async () => {
    console.log('💾 [DraftManager] Salvando rascunho com campos dinâmicos:', dynamicFields);
    await saveDraft(form, dynamicFields);
  };

  const canSaveDraft = pacienteSelecionado && form.queixaPrincipal.trim();

  // Filtrar e ordenar rascunhos
  const filteredAndSortedDrafts = useMemo(() => {
    let filtered = drafts;

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(draft =>
        draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.patient_data.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [drafts, searchTerm, sortBy]);

  return (
    <div className="flex gap-2">
      {/* Botão para Salvar Rascunho (direto, sem modal) */}
      <Button
        variant="outline"
        size="sm"
        disabled={!canSaveDraft || isSavingDraft}
        onClick={handleSaveDraft}
        className="flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}
      </Button>

      {/* Dialog para Gerenciar Rascunhos */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rascunhos {drafts.length > 0 && `(${drafts.length})`}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gerenciar Rascunhos
            </DialogTitle>
          </DialogHeader>

          {/* Filtros */}
          <div className="space-y-3 pb-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mais Recentes
              </Button>
              <Button
                variant={sortBy === 'oldest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('oldest')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mais Antigos
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingDrafts ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAndSortedDrafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{searchTerm ? 'Nenhum rascunho encontrado' : 'Nenhum rascunho salvo'}</p>
                <p className="text-sm">
                  {searchTerm
                    ? 'Tente buscar com outros termos.'
                    : 'Salve um atendimento como rascunho para vê-lo aqui'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedDrafts.map((draft) => {
                  const createdDate = new Date(draft.created_at);
                  const updatedDate = new Date(draft.updated_at);
                  const wasUpdated = updatedDate.getTime() !== createdDate.getTime();

                  return (
                    <Card key={draft.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          {/* Informações do paciente */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-base truncate">
                                {draft.patient_data.name}
                              </span>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                SUS: {draft.patient_data.sus}
                              </Badge>
                            </div>

                            {/* Datas */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground ml-7">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  Criado: {format(createdDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>

                              {wasUpdated && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    Atualizado: {format(updatedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleLoadDraft(draft)}
                              className="px-4"
                            >
                              Carregar
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="px-3">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar Rascunho</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar o rascunho de "{draft.patient_data.name}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDraft(draft.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};