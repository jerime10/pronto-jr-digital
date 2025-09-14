
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientFormHeader } from './components/PatientFormHeader';
import { PatientForm } from './components/PatientForm';
import { usePatient } from './hooks/usePatient';

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
      
      <PatientForm 
        patientId={id} 
        initialData={formattedPatient}
      />
    </div>
  );
};

export default FormularioPaciente;
