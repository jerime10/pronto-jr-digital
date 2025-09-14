
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/database';

export const usePacienteSearch = () => {
  const [buscarPaciente, setBuscarPaciente] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(null);
  const [mostrarResultadosBusca, setMostrarResultadosBusca] = useState(false);
  
  // Query para buscar todos os pacientes ou filtrados
  const { data: filteredPacientes, isLoading: isSearchingPacientes } = useQuery({
    queryKey: ['patients_search', buscarPaciente],
    queryFn: async () => {
      console.log('Searching for patients with query:', buscarPaciente);
      
      let query = supabase.from('patients').select('*');
      
      // Se há termo de busca, filtra por nome ou SUS
      if (buscarPaciente.trim().length > 0) {
        const searchTerm = buscarPaciente.trim();
        query = query.or(`name.ilike.%${searchTerm}%,sus.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('name', { ascending: true })
        .limit(50); // Aumentado para mostrar mais pacientes
      
      if (error) {
        console.error('Error searching patients:', error);
        throw error;
      }
      
      console.log('Found patients:', data);
      return data?.map(p => ({
        id: p.id,
        name: p.name,
        sus: p.sus,
        age: p.age || 0,
        gender: p.gender || 'não informado',
        phone: p.phone || '',
        address: p.address || '',
        date_of_birth: p.date_of_birth,
        created_at: p.created_at,
        updated_at: p.updated_at
      })) || [];
    },
    enabled: true, // Sempre habilitado para carregar todos os pacientes
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
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
    setPacienteSelecionado(paciente);
    setBuscarPaciente('');
    setMostrarResultadosBusca(false);
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
