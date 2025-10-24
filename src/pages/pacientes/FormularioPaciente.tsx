
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientFormHeader } from './components/PatientFormHeader';
import { PatientForm } from './components/PatientForm';
import { usePatient } from './hooks/usePatient';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, FileText, Calendar } from 'lucide-react';

const FormularioPaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formattedPatient, loading, deletePatient } = usePatient(id);
  const isEditMode = !!id;
  
  const handleDelete = async () => {
    if (!isEditMode) return;
    
    if (!confirm("Tem certeza que deseja excluir este paciente?")) {
      return;
    }
    
    const success = await deletePatient();
    if (success) {
      navigate('/pacientes');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <PatientFormHeader 
        isEditMode={isEditMode} 
        onDelete={handleDelete} 
        loading={loading}
      />
      
      {isEditMode && formattedPatient && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {formattedPatient.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {formattedPatient.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>SUS: {formattedPatient.sus}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formattedPatient.age ? `${formattedPatient.age} anos` : 'Idade não informada'}</span>
                  </div>
                  
                  {formattedPatient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{formattedPatient.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <PatientForm 
        patientId={id} 
        initialData={formattedPatient}
      />
    </div>
  );
};

export default FormularioPaciente;
