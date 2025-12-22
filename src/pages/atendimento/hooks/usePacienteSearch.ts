
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/database';

export const usePacienteSearch = (initialPatient?: Patient | null) => {
  // Função para validar se o paciente tem dados válidos
  const isValidPatient = (patient: any): boolean => {
    if (!patient) {
      return false;
    }
    
    if (!patient.name || patient.name.trim() === '') {
      return false;
    }
    
    if (!patient.id) {
      return false;
    }
    
    // Aceitar tanto UUIDs quanto IDs temporários
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patient.id);
    const isTempId = patient.id.toString().startsWith('temp-');
    
    if (!isUUID && !isTempId) {
      return false;
    }
    
    return true;
  };
  
  const [buscarPaciente, setBuscarPaciente] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(
    initialPatient && isValidPatient(initialPatient) ? initialPatient : null
  );
  const [mostrarResultadosBusca, setMostrarResultadosBusca] = useState(false);
  
  // Efeito para definir paciente inicial quando fornecido
  useEffect(() => {
    if (initialPatient && !pacienteSelecionado && isValidPatient(initialPatient)) {
      setPacienteSelecionado(initialPatient);
    }
  }, [initialPatient, pacienteSelecionado]);
  
  // Query para buscar todos os pacientes ou filtrados
  const { data: filteredPacientes, isLoading: isSearchingPacientes } = useQuery({
    queryKey: ['patients_search', buscarPaciente],
    queryFn: async () => {
      let query = supabase.from('patients').select('*');
      
      // Se há termo de busca, filtra por nome ou SUS
      if (buscarPaciente.trim().length > 0) {
        const searchTerm = buscarPaciente.trim();
        query = query.or(`name.ilike.%${searchTerm}%,sus.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('name', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error('Error searching patients:', error);
        throw error;
      }
      
      return data?.map(p => ({
        id: p.id,
        name: p.name,
        sus: p.sus,
        age: p.age || null,
        gender: p.gender || null,
        phone: p.phone || '',
        address: p.address || '',
        bairro: p.bairro || null,
        date_of_birth: p.date_of_birth,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      })) || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
  
  // Modified to support both event and direct string input
  const handlePacienteSearch = (input: React.ChangeEvent<HTMLInputElement> | string) => {
    const searchValue = typeof input === 'string' ? input : input.target.value;
    setBuscarPaciente(searchValue);
    
    // Sempre mostra os resultados quando há foco no campo
    if (mostrarResultadosBusca) {
      // Já está mostrando, mantém aberto
    } else if (searchValue.length >= 0) {
      // Abre a lista assim que começa a digitar ou quando clica no campo vazio
      setMostrarResultadosBusca(true);
    }
  };
  
  const handleSelectPaciente = (paciente: any) => {
    console.log('🔍 DEBUG - Selecionando paciente:', {
      id: paciente?.id,
      name: paciente?.name,
      isValid: isValidPatient(paciente),
      isUUID: paciente?.id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paciente.id) : false,
      isTemp: paciente?.id ? paciente.id.startsWith('temp-') : false
    });
    
    if (isValidPatient(paciente)) {
      setPacienteSelecionado(paciente);
      setBuscarPaciente('');
      setMostrarResultadosBusca(false);
      console.log('✅ DEBUG - Paciente selecionado com sucesso:', paciente.id);
    } else {
      console.error('❌ DEBUG - Paciente inválido não foi selecionado:', paciente);
    }
  };
  
  const handleClearPaciente = () => {
    setPacienteSelecionado(null);
    setBuscarPaciente('');
    setMostrarResultadosBusca(false);
  };

  // Nova função para mostrar lista ao clicar no campo
  const handleInputFocus = () => {
    setMostrarResultadosBusca(true);
  };

  // Nova função para esconder lista ao clicar fora
  const handleInputBlur = () => {
    // Pequeno delay para permitir clique nos resultados
    setTimeout(() => {
      setMostrarResultadosBusca(false);
    }, 200);
  };
  
  return {
    buscarPaciente,
    pacienteSelecionado,
    mostrarResultadosBusca,
    filteredPacientes,
    isSearchingPacientes,
    handlePacienteSearch,
    handleSelectPaciente,
    handleClearPaciente,
    handleInputFocus,
    handleInputBlur
  };
};
