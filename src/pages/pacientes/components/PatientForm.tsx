
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calculateAgeInYears, formatDateForDB } from '@/utils/dateUtils';
import { PatientFormFields } from './PatientFormFields';

interface PatientFormProps {
  patientId?: string;
  initialData?: any;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patientId, initialData }) => {
  const navigate = useNavigate();
  const isEditMode = !!patientId;
  
  const [formData, setFormData] = useState({
    name: '',
    sus: '',
    gender: '',
    date_of_birth: null as Date | null,
    age: 0,
    phone: '',
    address: '',
    bairro: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sus: initialData.sus || '',
        gender: initialData.gender || '',
        date_of_birth: initialData.date_of_birth || null,
        age: initialData.age || 0,
        phone: initialData.phone || '',
        address: initialData.address || '',
        bairro: initialData.bairro || ''
      });
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Campos que devem ser convertidos para maiúsculo
    const upperCaseFields = ['name', 'phone', 'address', 'bairro'];
    const processedValue = upperCaseFields.includes(name) ? value.toUpperCase() : value;
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      date_of_birth: date,
      // Update age whenever date of birth changes
      age: date ? calculateAgeInYears(date) : 0
    }));
  };
  
  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 [PatientForm] Iniciando salvamento:', formData);
    
    if (!formData.name || !formData.sus) {
      toast.error("Nome e número SUS são obrigatórios.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the date for database storage
      const formattedData = {
        ...formData,
        date_of_birth: formatDateForDB(formData.date_of_birth)
      };
      
      console.log('📝 [PatientForm] Dados formatados:', formattedData);
      
      if (isEditMode) {
        console.log('✏️ [PatientForm] Modo edição - ID:', patientId);
        const { data, error } = await supabase
        .from('patients')
          .update({
            name: formattedData.name,
            phone: formattedData.phone,
            sus: formattedData.sus,
            date_of_birth: formattedData.date_of_birth,
            age: formattedData.age,
            address: formattedData.address,
            bairro: formattedData.bairro,
            gender: formattedData.gender
          })
          .eq('id', patientId)
          .select();
        
        if (error) {
          console.error('❌ [PatientForm] Erro ao atualizar:', error);
          throw error;
        }
        
        console.log('✅ [PatientForm] Paciente atualizado:', data);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        console.log('➕ [PatientForm] Modo cadastro');
        const { data, error } = await supabase
          .from('patients')
          .insert([{
            name: formattedData.name,
            phone: formattedData.phone,
            sus: formattedData.sus,
            date_of_birth: formattedData.date_of_birth,
            age: formattedData.age,
            address: formattedData.address,
            bairro: formattedData.bairro,
            gender: formattedData.gender
          }])
          .select();
        
        if (error) {
          console.error('❌ [PatientForm] Erro ao cadastrar:', error);
          throw error;
        }
        
        console.log('✅ [PatientForm] Paciente cadastrado:', data);
        toast.success("Paciente cadastrado com sucesso!");
      }
      
      navigate('/pacientes');
    } catch (error) {
      console.error('❌ [PatientForm] Erro geral:', error);
      toast.error(`Erro ao salvar paciente: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <PatientFormFields 
            formData={formData}
            handleChange={handleChange}
            handleDateChange={handleDateChange}
            handleGenderChange={handleGenderChange}
          />
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
