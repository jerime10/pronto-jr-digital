
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash } from 'lucide-react';

interface PatientFormHeaderProps {
  isEditMode: boolean;
  onDelete: () => void;
  loading: boolean;
}

export const PatientFormHeader: React.FC<PatientFormHeaderProps> = ({ 
  isEditMode, 
  onDelete, 
  loading 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEditMode ? 'Atualize as informações do paciente' : 'Cadastre um novo paciente no sistema'}
        </p>
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        {isEditMode && (
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
};
