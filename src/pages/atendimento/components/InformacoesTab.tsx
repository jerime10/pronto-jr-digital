
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Eraser, Loader2 } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { FieldAutocompleteMulti } from '@/components/ui/field-autocomplete-multi';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface InformacoesTabProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onProcessAI: (field: 'mainComplaint' | 'evolution' | 'examResults') => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
}

const InformacoesTab: React.FC<InformacoesTabProps> = ({
  form,
  onFieldChange,
  onProcessAI,
  isProcessingAI
}) => {
  const { searchFieldTemplates, saveFieldTemplate, deleteFieldTemplate } = useIndividualFieldTemplates();
  
  const [isSavingQueixa, setIsSavingQueixa] = useState(false);
  const [isSavingAntecedentes, setIsSavingAntecedentes] = useState(false);
  const [isSavingAlergias, setIsSavingAlergias] = useState(false);
  
  // Estados para gerenciar seleções múltiplas
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAntecedentes, setSelectedAntecedentes] = useState<string[]>([]);
  const [selectedAlergias, setSelectedAlergias] = useState<string[]>([]);

  // Salvar Queixa Principal
  const handleSaveQueixa = async () => {
    if (!form.queixaPrincipal.trim()) return;
    setIsSavingQueixa(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'queixa_principal',
        fieldLabel: 'Queixa Principal',
        fieldContent: form.queixaPrincipal,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingQueixa(false);
    }
  };

  // Limpar Queixa Principal
  const handleClearQueixa = () => {
    onFieldChange('queixaPrincipal', '');
  };

  // Salvar Antecedentes
  const handleSaveAntecedentes = async () => {
    if (!form.antecedentes.trim()) return;
    setIsSavingAntecedentes(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'antecedentes',
        fieldLabel: 'Antecedentes',
        fieldContent: form.antecedentes,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAntecedentes(false);
    }
  };

  // Limpar Antecedentes
  const handleClearAntecedentes = () => {
    onFieldChange('antecedentes', '');
  };

  // Salvar Alergias
  const handleSaveAlergias = async () => {
    if (!form.alergias.trim()) return;
    setIsSavingAlergias(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'alergias',
        fieldLabel: 'Alergias',
        fieldContent: form.alergias,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAlergias(false);
    }
  };

  // Limpar Alergias
  const handleClearAlergias = () => {
    onFieldChange('alergias', '');
  };

  // Handlers para mudança de modelos (similar ao PrescricaoTab)
  const handleQueixaModelChange = async (selectedIds: string[]) => {
    setSelectedQueixas(selectedIds);
    
    // Buscar conteúdo dos templates selecionados
    const contents = await Promise.all(
      selectedIds.map(async (id) => {
        const results = await searchFieldTemplates('queixaPrincipal', '', 'ATENDIMENTO');
        const template = results.find((t: any) => t.id === id);
        return template?.field_content || '';
      })
    );
    
    const concatenated = contents.filter(c => c).join('\n\n... ... ...\n\n');
    onFieldChange('queixaPrincipal', concatenated);
  };

  const handleAntecedentesModelChange = async (selectedIds: string[]) => {
    setSelectedAntecedentes(selectedIds);
    
    const contents = await Promise.all(
      selectedIds.map(async (id) => {
        const results = await searchFieldTemplates('antecedentes', '', 'ATENDIMENTO');
        const template = results.find((t: any) => t.id === id);
        return template?.field_content || '';
      })
    );
    
    const concatenated = contents.filter(c => c).join('\n\n... ... ...\n\n');
    onFieldChange('antecedentes', concatenated);
  };

  const handleAlergiasModelChange = async (selectedIds: string[]) => {
    setSelectedAlergias(selectedIds);
    
    const contents = await Promise.all(
      selectedIds.map(async (id) => {
        const results = await searchFieldTemplates('alergias', '', 'ATENDIMENTO');
        const template = results.find((t: any) => t.id === id);
        return template?.field_content || '';
      })
    );
    
    const concatenated = contents.filter(c => c).join('\n\n... ... ...\n\n');
    onFieldChange('alergias', concatenated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Queixa Principal
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onProcessAI('mainComplaint')}
              disabled={isProcessingAI.mainComplaint || !form.queixaPrincipal.trim()}
              className="ml-auto"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isProcessingAI.mainComplaint ? 'Processando...' : 'Melhorar com IA'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Queixa Principal
                <span className="text-xs text-muted-foreground ml-2">
                  (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                </span>
              </Label>
            </div>
            <FieldAutocompleteMulti
              selectedValues={selectedQueixas}
              onChange={handleQueixaModelChange}
              onSearch={(searchTerm) => searchFieldTemplates('queixaPrincipal', searchTerm, 'ATENDIMENTO')}
              placeholder="Digite para buscar e selecionar múltiplas queixas..."
              fieldName="queixaPrincipal"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queixa Principal Personalizada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveQueixa}
                  disabled={!form.queixaPrincipal.trim() || isSavingQueixa}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingQueixa ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearQueixa}
                  disabled={!form.queixaPrincipal.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.queixaPrincipal}
              onChange={(e) => onFieldChange('queixaPrincipal', e.target.value)}
              placeholder="Digite a queixa principal personalizada..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Antecedentes
                <span className="text-xs text-muted-foreground ml-2">
                  (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                </span>
              </Label>
            </div>
            <FieldAutocompleteMulti
              selectedValues={selectedAntecedentes}
              onChange={handleAntecedentesModelChange}
              onSearch={(searchTerm) => searchFieldTemplates('antecedentes', searchTerm, 'ATENDIMENTO')}
              placeholder="Digite para buscar e selecionar múltiplos antecedentes..."
              fieldName="antecedentes"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAntecedentes}
                  disabled={!form.antecedentes.trim() || isSavingAntecedentes}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAntecedentes ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAntecedentes}
                  disabled={!form.antecedentes.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.antecedentes}
              onChange={(e) => onFieldChange('antecedentes', e.target.value)}
              placeholder="Digite os antecedentes personalizados..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Alergias
                <span className="text-xs text-muted-foreground ml-2">
                  (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                </span>
              </Label>
            </div>
            <FieldAutocompleteMulti
              selectedValues={selectedAlergias}
              onChange={handleAlergiasModelChange}
              onSearch={(searchTerm) => searchFieldTemplates('alergias', searchTerm, 'ATENDIMENTO')}
              placeholder="Digite para buscar e selecionar múltiplas alergias..."
              fieldName="alergias"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias Personalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAlergias}
                  disabled={!form.alergias.trim() || isSavingAlergias}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAlergias ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAlergias}
                  disabled={!form.alergias.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.alergias}
              onChange={(e) => onFieldChange('alergias', e.target.value)}
              placeholder="Digite as alergias personalizadas..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformacoesTab;
