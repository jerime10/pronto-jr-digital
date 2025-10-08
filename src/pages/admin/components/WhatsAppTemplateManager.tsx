
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Edit, Plus, MessageSquare } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { WhatsAppTemplate } from '@/types/whatsappTemplate';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';

// Gerenciador de Templates WhatsApp - Interface completa para criação e edição
const WhatsAppTemplateManager = () => {
  const { templates, activeTemplate, createTemplate, updateTemplate, deleteTemplate, setActiveTemplate, isLoading } = useWhatsAppTemplates();
  const { isAdmin } = usePermissions();
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    template_type: 'general',
    variables: [] as string[],
    is_active: false,
  });
  
  // Variáveis de exemplo para preview
  const [previewVariables, setPreviewVariables] = useState({
    nome: 'João Silva',
    data_consulta: '24 de maio de 2025 às 18h',
  });

  // Variáveis disponíveis para inserção no template
  const availableVariables = ['saudacao', 'nome', 'data', 'data_consulta', 'link'];

  // Submete o formulário (criar ou atualizar template)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData = {
      ...formData,
      variables: extractVariablesFromTemplate(formData.template),
    };

    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, updates: templateData });
    } else {
      createTemplate(templateData);
    }

    resetForm();
  };

  // Extrai variáveis do template (texto entre chaves {})
  const extractVariablesFromTemplate = (template: string): string[] => {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  // Reseta o formulário para estado inicial
  const resetForm = () => {
    setFormData({
      name: '',
      template: '',
      template_type: 'general',
      variables: [],
      is_active: false,
    });
    setEditingTemplate(null);
  };

  // Carrega dados do template para edição
  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template: template.template,
      template_type: template.template_type,
      variables: template.variables,
      is_active: template.is_active,
    });
  };

  // Confirma e exclui template
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate(id);
    }
  };

  // Insere variável na posição do cursor no textarea
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="template"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);
      
      setFormData(prev => ({ ...prev, template: newText }));
      
      // Reposiciona cursor após inserção
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  // Gera preview da mensagem com variáveis de exemplo
  const getPreviewMessage = () => {
    if (!formData.template) return '';
    
    return whatsappTemplateService.processTemplate(formData.template, {
      ...previewVariables,
      link: 'https://exemplo.com/documento.pdf'
    });
  };

  // Manipula mudança de template ativo
  const handleActiveTemplateChange = (templateId: string) => {
    setActiveTemplate(templateId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTemplate ? '✏️ Editar Template' : '➕ Criar Novo Template'}
          </CardTitle>
          <CardDescription>
            Crie e gerencie templates de mensagens para WhatsApp com variáveis dinâmicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Tipo do Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Envio de Prontuário"
                  required
                />
              </div>
              <div>
                <Label htmlFor="template_type">Tipo</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">🔄 Geral</SelectItem>
                    <SelectItem value="prontuario">📋 Prontuário</SelectItem>
                    <SelectItem value="exames">🔬 Exames</SelectItem>
                    <SelectItem value="lembrete">⏰ Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template da Mensagem */}
            <div>
              <Label htmlFor="template">Template da Mensagem</Label>
              <Textarea
                id="template"
                name="template"
                value={formData.template}
                onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                placeholder="Ex: {saudacao} {nome}, segue seu prontuário da consulta realizada em {data_consulta}..."
                rows={4}
                required
              />
              
              {/* Botões para inserir variáveis */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-gray-600 mr-2">Inserir variável:</span>
                {availableVariables.map((variable) => (
                  <Button
                    key={variable}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="text-xs"
                  >
                    {`{${variable}}`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview da Mensagem */}
            {formData.template && (
              <div>
                <Label>🔍 Preview da Mensagem</Label>
                <div className="p-3 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preview gerado com dados de exemplo
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button type="submit" className="flex items-center gap-2">
                {editingTemplate ? (
                  <>
                    <Edit className="h-4 w-4" />
                    Atualizar Template
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Template
                  </>
                )}
              </Button>
              {editingTemplate && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LISTA DE TEMPLATES EXISTENTES COM RADIO BUTTONS */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Templates Existentes</CardTitle>
          <CardDescription>
            Selecione qual template deve ficar ativo (apenas um pode estar ativo por vez)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length > 0 ? (
              <RadioGroup 
                value={activeTemplate?.id || ''} 
                onValueChange={handleActiveTemplateChange}
                className="space-y-4"
              >
                {templates.map((template) => (
                  <div key={template.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Label htmlFor={template.id} className="font-medium cursor-pointer">
                            {template.name}
                          </Label>
                          {template.is_active && (
                            <Badge variant="default" className="text-xs">
                              ✅ Ativo
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {template.template_type === 'prontuario' ? '📋 Prontuário' :
                             template.template_type === 'exames' ? '🔬 Exames' :
                             template.template_type === 'lembrete' ? '⏰ Lembrete' :
                             '🔄 Geral'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-2xl mb-2">
                          {template.template}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">Variáveis:</span>
                          {template.variables.map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {`{${variable}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <ActionButtonGuard permission="configuracoes">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                      </ActionButtonGuard>
                      <ActionButtonGuard permission="configuracoes">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </ActionButtonGuard>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Nenhum template encontrado</p>
                <p className="text-sm">Crie seu primeiro template acima</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTemplateManager;
