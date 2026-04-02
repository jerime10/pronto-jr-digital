
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, FileText, Trash2, Clock, User, Calendar, Search, Loader2 } from 'lucide-react';
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
  variant?: 'default' | 'mobile-footer';
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  dynamicFields = {},
  onDynamicFieldsChange,
  variant = 'default'
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

    // Ordenar por data de atualização (prioridade) ou criação
    // Sempre do mais recente para o mais antigo
    const sorted = [...filtered].sort((a, b) => {
      // Usar updated_at como prioridade (que sempre existe e reflete a última atividade)
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [drafts, searchTerm, sortBy]);

  if (variant === 'mobile-footer') {
    return (
      <div className="flex flex-1 gap-2">
        {/* Botão para Salvar Rascunho (Mobile) */}
        <Button
          variant="secondary"
          disabled={!canSaveDraft || isSavingDraft}
          onClick={handleSaveDraft}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl h-14 font-bold text-sm transition-all active:scale-95 border border-slate-200 shadow-sm px-1 flex flex-col items-center justify-center gap-0.5"
        >
          {isSavingDraft ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className="text-[10px] uppercase">Salvar</span>
            </>
          )}
        </Button>

        {/* Dialog para Gerenciar Rascunhos (Mobile) */}
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button 
              variant="secondary" 
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl h-14 font-bold transition-all active:scale-95 border border-slate-200 shadow-sm relative flex flex-col items-center justify-center gap-0.5 px-1"
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] uppercase">Rascunhos</span>
              {drafts.length > 0 && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full px-1.5 h-4 min-w-[18px] flex items-center justify-center text-[9px] font-black border-2 border-white">
                  {drafts.length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                <FileText className="w-6 h-6 text-emerald-500" />
                Gerenciar Rascunhos
              </DialogTitle>
            </DialogHeader>

            {/* Filtros */}
            <div className="px-6 py-4 space-y-4 sticky top-0 bg-white z-10 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar rascunho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-slate-900"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                  className="rounded-full px-4 h-9 font-bold text-xs shrink-0"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Recentes
                </Button>
                <Button
                  variant={sortBy === 'oldest' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSortBy('oldest')}
                  className="rounded-full px-4 h-9 font-bold text-xs shrink-0"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Antigos
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {isLoadingDrafts ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                </div>
              ) : filteredAndSortedDrafts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="font-bold text-slate-900">{searchTerm ? 'Sem resultados' : 'Sem rascunhos'}</p>
                  <p className="text-sm mt-1 max-w-[200px] mx-auto">
                    {searchTerm ? 'Tente outros termos de busca.' : 'Seus rascunhos salvos aparecerão aqui.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-8">
                  {filteredAndSortedDrafts.map((draft) => {
                    const createdDate = new Date(draft.created_at);
                    const updatedDate = new Date(draft.updated_at);
                    const wasUpdated = updatedDate.getTime() !== createdDate.getTime();

                    return (
                      <Card key={draft.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate pr-4">
                                  {draft.patient_data.name}
                                </h4>
                                <Badge variant="outline" className="mt-1 bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-black uppercase tracking-wider">
                                  SUS: {draft.patient_data.sus}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl max-w-[90vw]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-black text-xl">Deletar Rascunho?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-500">
                                        Isso removerá permanentemente o rascunho de <span className="font-bold text-slate-900">{draft.patient_data.name}</span>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-2">
                                      <AlertDialogCancel className="flex-1 rounded-2xl h-12 font-bold border-slate-200">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteDraft(draft.id)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 font-bold"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <div className="text-[11px] text-slate-400 font-medium">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(updatedDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleLoadDraft(draft)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-4 h-9 shadow-sm"
                              >
                                Carregar
                              </Button>
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
  }

  return (
    <div className="flex items-center gap-1">
      {/* Botão para Salvar Rascunho */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canSaveDraft || isSavingDraft}
        onClick={handleSaveDraft}
        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3 h-8 flex items-center gap-1.5 transition-all active:scale-95 text-xs"
      >
        <Save className="w-3.5 h-3.5" />
        <span className="font-bold hidden xl:inline">{isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}</span>
      </Button>

      {/* Dialog para Gerenciar Rascunhos */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3 h-8 flex items-center gap-1.5 transition-all active:scale-95 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="font-bold hidden xl:inline">Rascunhos</span>
            {drafts.length > 0 && (
              <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200 rounded-full px-1 h-4 min-w-[16px] flex items-center justify-center text-[9px] font-black">
                {drafts.length}
              </Badge>
            )}
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