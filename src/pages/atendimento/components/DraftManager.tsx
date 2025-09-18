
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, FileText, Trash2, Clock, User, Calendar } from 'lucide-react';
import { useDraftManager } from '../hooks/useDraftManager';
import { FormState } from '../hooks/useFormData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
}

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
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
    handleSelectPaciente
  });

  const handleLoadDraft = async (draft: any) => {
    await loadDraft(draft);
    setIsDialogOpen(false);
  };

  const canSaveDraft = pacienteSelecionado && form.queixaPrincipal.trim();

  return (
    <div className="flex gap-2">
      {/* Botão Salvar Rascunho */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => saveDraft(form)}
        disabled={!canSaveDraft || isSavingDraft}
        className="flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}
      </Button>

      {/* Dialog para Gerenciar Rascunhos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rascunhos ({drafts.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gerenciar Rascunhos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingDrafts ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum rascunho encontrado</p>
                <p className="text-sm">Salve um atendimento como rascunho para vê-lo aqui</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">{draft.patient_data.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          SUS: {draft.patient_data.sus}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            Atualizado: {format(new Date(draft.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Queixa Principal:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {draft.form_data.queixaPrincipal}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                          {draft.form_data.antecedentes && (
                            <Badge variant="outline" className="text-xs">Antecedentes</Badge>
                          )}
                          {draft.form_data.alergias && (
                            <Badge variant="outline" className="text-xs">Alergias</Badge>
                          )}
                          {draft.form_data.evolucao && (
                            <Badge variant="outline" className="text-xs">Evolução</Badge>
                          )}
                        </div>
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
                                Tem certeza que deseja deletar o rascunho de {draft.patient_data.name}? 
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
