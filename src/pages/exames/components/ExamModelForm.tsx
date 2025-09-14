
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
import { ExamModel } from '@/types/database';

interface ExamModelFormProps {
  currentExam: Partial<ExamModel>;
  isEditing: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
}

export const ExamModelForm: React.FC<ExamModelFormProps> = ({
  currentExam,
  isEditing,
  isLoading,
  onCancel,
  onChange,
  onSave
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Exame' : 'Novo Modelo de Exame'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Atualize as informações do exame.'
            : 'Preencha os campos para criar um novo modelo de exame.'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Hemograma Completo"
            value={currentExam.name}
            onChange={onChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="instructions">Instruções de Preparo</Label>
          <Textarea
            id="instructions"
            name="instructions"
            placeholder="Ex: Jejum de 8 horas."
            value={currentExam.instructions || ''}
            onChange={onChange}
            rows={3}
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
