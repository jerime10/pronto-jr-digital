import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Search } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { Label } from '@/components/ui/label';

export const IndividualFieldsManager = () => {
  const {
    templates,
    isLoading,
    updateFieldTemplate,
    deleteFieldTemplate,
    isUpdating,
    isDeleting,
  } = useIndividualFieldTemplates();

  const { permissions, checkPermission } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  // Filtrar templates
  const filteredTemplates = templates.filter(
    (t) =>
      t.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.field_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por modelo
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.model_name]) {
      acc[template.model_name] = [];
    }
    acc[template.model_name].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setEditContent(template.field_content);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedTemplate && editContent.trim()) {
      updateFieldTemplate({
        id: selectedTemplate.id,
        fieldContent: editContent,
      });
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      setEditContent('');
    }
  };

  const handleDelete = (template: any) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      deleteFieldTemplate(selectedTemplate.id);
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Campos Individuais Salvos
          </CardTitle>
          <CardDescription>
            Gerencie os templates de campos que você salvou durante os atendimentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por modelo ou campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Estatísticas */}
          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline" className="px-3 py-1">
              Total: {templates.length} campos salvos
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Modelos: {Object.keys(groupedTemplates).length}
            </Badge>
          </div>

          {/* Templates agrupados por modelo */}
          {Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum campo salvo encontrado</p>
              <p className="text-sm mt-2">
                Comece salvando campos durante os atendimentos usando o botão 💾
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([modelName, modelTemplates]) => (
                <Card key={modelName} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>🩺</span>
                        {modelName}
                      </CardTitle>
                      <Badge>{modelTemplates.length} campos</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {modelTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{template.field_label}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.field_content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Atualizado em{' '}
                                {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <ActionButtonGuard permission="configuracoes">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(template)}
                                  disabled={isUpdating}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </ActionButtonGuard>
                              <ActionButtonGuard permission="configuracoes">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(template)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </ActionButtonGuard>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.field_label} - {selectedTemplate?.model_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                placeholder="Digite o conteúdo do template..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating || !editContent.trim()}>
              {isUpdating ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
              <br />
              <br />
              <strong>{selectedTemplate?.field_label}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
