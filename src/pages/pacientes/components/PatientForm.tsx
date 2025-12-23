
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Usar ref para rastrear se já inicializamos com os dados corretos
  const initializedRef = useRef<string | null>(null);
  
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
  
  // CORREÇÃO CRÍTICA: Usar patientId + initialData.id para garantir consistência
  useEffect(() => {
    // Só atualizar se temos initialData E o ID corresponde ao patientId atual
    if (initialData && patientId) {
      // Verificar se o initialData corresponde ao patientId correto
      if (initialData.id === patientId && initializedRef.current !== patientId) {
        console.log('🔄 [PatientForm] Inicializando com dados do paciente:', patientId, initialData.name);
        initializedRef.current = patientId;
        
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
      } else if (initialData.id !== patientId) {
        console.warn('⚠️ [PatientForm] ALERTA: initialData.id não corresponde ao patientId!', {
          initialDataId: initialData.id,
          patientId: patientId
        });
      }
    } else if (!patientId) {
      // Modo cadastro novo - resetar o formulário
      if (initializedRef.current !== 'new') {
        initializedRef.current = 'new';
        setFormData({
          name: '',
          sus: '',
          gender: '',
          date_of_birth: null,
          age: 0,
          phone: '',
          address: '',
          bairro: ''
        });
      }
    }
  }, [initialData, patientId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Campos que devem ser convertidos para maiúsculo
    const upperCaseFields = ['name', 'address'];
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
    
    console.log('🔍 [PatientForm] Iniciando salvamento:', {
      patientId,
      isEditMode,
      formData: formData.name
    });
    
    if (!formData.name || !formData.sus) {
      toast.error("Nome e número SUS são obrigatórios.");
      return;
    }
    
    // PROTEÇÃO CRÍTICA: Verificar se temos patientId válido em modo edição
    if (isEditMode && !patientId) {
      toast.error("Erro: ID do paciente não encontrado. Não é possível salvar.");
      console.error('❌ [PatientForm] Tentativa de update sem patientId!');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the date for database storage
      const formattedData = {
        ...formData,
        date_of_birth: formatDateForDB(formData.date_of_birth)
      };
      
      console.log('📝 [PatientForm] Dados formatados para salvar:', {
        patientId,
        name: formattedData.name,
        sus: formattedData.sus
      });
      
      if (isEditMode && patientId) {
        console.log('✏️ [PatientForm] Modo edição - Atualizando ID:', patientId);
        
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
        
        if (!data || data.length === 0) {
          throw new Error('Nenhum registro foi atualizado. O paciente pode não existir.');
        }
        
        console.log('✅ [PatientForm] Paciente atualizado com sucesso:', data[0]?.name);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        console.log('➕ [PatientForm] Modo cadastro - Criando novo paciente');
        
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
        
        console.log('✅ [PatientForm] Paciente cadastrado:', data?.[0]?.name);
        toast.success("Paciente cadastrado com sucesso!");
      }
      
      navigate('/pacientes');
    } catch (error: any) {
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
