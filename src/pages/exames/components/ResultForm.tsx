
import React from 'react';
import { 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CompletedExam } from '@/types/database';

interface ResultFormProps {
  currentResult: Partial<CompletedExam>;
  isEditing: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
}

export const ResultForm: React.FC<ResultFormProps> = ({
  currentResult,
  isEditing,
  isLoading,
  onCancel,
  onChange,
  onSave
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Resultado' : 'Novo Modelo de Resultado'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Atualize as informações do modelo de resultado.'
            : 'Preencha os campos para criar um novo modelo de resultado.'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="result_name">Nome <span className="text-red-500">*</span></Label>
          <Input
            id="result_name"
            name="name"
            placeholder="Ex: Hemograma Completo"
            value={currentResult.name}
            onChange={onChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="result_template">Modelo de Resultado</Label>
          <Textarea
            id="result_template"
            name="result_template"
            placeholder="Template para resultado do exame."
            value={currentResult.result_template || ''}
            onChange={onChange}
            rows={6}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
