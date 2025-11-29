
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
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  
  const {
    drafts,
    isLoadingDrafts,
    isSavingDraft,
    saveDraft,
    loadDraft,
    deleteDraft
  } = useDraftManager({
    pacienteSelecionado,
    profissionalAtual,
    form,
    setFormData,
    handleSelectPaciente,
    dynamicFields,
    onDynamicFieldsChange
  });

  const handleLoadDraft = async (draft: Draft) => {
    console.log('📂 [DraftManager] Carregando rascunho:', draft);
    await loadDraft(draft);
    setIsDialogOpen(false);
  };

  const handleSaveDraft = async () => {
    console.log('💾 [DraftManager] Salvando rascunho com campos dinâmicos:', dynamicFields);
    await saveDraft(draftTitle || undefined, form, dynamicFields);
    setDraftTitle('');
    setIsSaveDialogOpen(false);
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
      {/* Diálogo para Salvar Rascunho */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!canSaveDraft || isSavingDraft}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Novo Rascunho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-title">Título do Rascunho (opcional)</Label>
              <Input
                id="draft-title"
                placeholder="Ex: Consulta de rotina"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveDraft();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Se não informar, será gerado automaticamente com data e hora.
              </p>
            </div>
            {pacienteSelecionado && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Paciente:</p>
                <p className="text-sm">{pacienteSelecionado.name}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsSaveDialogOpen(false);
              setDraftTitle('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDraft} disabled={isSavingDraft}>
              {isSavingDraft ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Rascunhos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedDrafts.map((draft) => (
                  <Card key={draft.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between text-sm">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 font-semibold text-base">
                            <FileText className="w-4 h-4" />
                            {draft.title}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                            <User className="w-3 h-3" />
                            {draft.patient_data.name}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          SUS: {draft.patient_data.sus}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Criado: {format(new Date(draft.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {draft.form_data.dataInicioAtendimento && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Atendimento: {format(new Date(draft.form_data.dataInicioAtendimento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Queixa Principal:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {draft.form_data.queixaPrincipal}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {draft.form_data.antecedentes && (
                          <Badge variant="outline" className="text-xs">Antecedentes</Badge>
                        )}
                        {draft.form_data.alergias && (
                          <Badge variant="outline" className="text-xs">Alergias</Badge>
                        )}
                        {draft.form_data.evolucao && (
                          <Badge variant="outline" className="text-xs">Evolução</Badge>
                        )}
                        {draft.form_data.prescricaoPersonalizada && (
                          <Badge variant="outline" className="text-xs">Prescrição</Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoadDraft(draft)}
                          className="flex-1"
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
                                Tem certeza que deseja deletar o rascunho "{draft.title}"? 
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};