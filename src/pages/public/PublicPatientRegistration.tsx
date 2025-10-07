import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, CheckCircle, AlertCircle, Sparkles, Shield, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PatientFormFields } from '../pacientes/components/PatientFormFields';
import { calculateAgeInYears, formatDateForDB } from '@/utils/dateUtils';
import { formatPhoneNumber, isValidPhoneNumber, cleanPhoneNumber } from '@/utils/phoneUtils';
import { formatCpfOrSus, isValidCpfOrSus, cleanCpfOrSus, validateSevenDigitInput } from '@/utils/cpfSusUtils';
import { UserService } from '@/services/userService';
import { Usuario } from '@/types/database';


interface PatientFormData {
  name: string;
  sus: string;
  gender: string;
  date_of_birth: Date | null;
  age: number;
  phone: string;
  address: string;
  bairro: string;
}

type RegistrationStep = 'sus_validation' | 'form_fields' | 'existing_user' | 'form';

export const PublicPatientRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('sus_validation');
  const [susNumber, setSusNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [dynamicMessage, setDynamicMessage] = useState('Digite o CPF');
  const [publicLinks, setPublicLinks] = useState({
    scheduling_url: '',
    exit_url: ''
  });
  
  // Estados para sistema de parcerias
  const [partnerInfo, setPartnerInfo] = useState<Usuario | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string>('');
  const [partnerCode, setPartnerCode] = useState<string>('');
  const [isPartnerContext, setIsPartnerContext] = useState(false);
  const [shouldRedirectToScheduling, setShouldRedirectToScheduling] = useState(false);
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    sus: '',
    gender: '',
    date_of_birth: null,
    age: 0,
    phone: '',
    address: '',
    bairro: ''
  });

  useEffect(() => {
    loadPublicLinks();
    extractAndValidatePartnerInfo();
  }, []);

  // Função para obter parâmetros da URL
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      redirect: urlParams.get('redirect'),
      partner: urlParams.get('partner'),
      code: urlParams.get('code'),
      cpf_sus: urlParams.get('cpf_sus')
    };
  };

  // Função para extrair e validar informações do parceiro
  const extractAndValidatePartnerInfo = async () => {
    try {
      const urlParams = getUrlParams();
      const { redirect, partner, code, cpf_sus } = urlParams;
      
      console.log('🔍 Parâmetros da URL detectados:', { redirect, partner, code, cpf_sus });
      
      // Verificar se é um contexto de parceiro
      if (partner || code) {
        setIsPartnerContext(true);
        
        // Verificar se deve redirecionar para agendamento após cadastro
        if (redirect === 'agendamento') {
          setShouldRedirectToScheduling(true);
        }
        
        // Pré-preencher CPF/SUS se fornecido
        if (cpf_sus) {
          setSusNumber(formatCpfOrSus(cpf_sus));
          updateDynamicMessage(cpf_sus);
        }
        
        // Validar parceiro por username
        if (partner) {
          setPartnerUsername(partner);
          
          const partnerData = await UserService.getUserByUsername(partner);
          
          if (partnerData && partnerData.user_type === 'partner' && partnerData.is_active) {
            setPartnerInfo(partnerData);
            setPartnerCode(partnerData.partner_code || '');
            console.log('✅ Parceiro válido encontrado:', partnerData.full_name || partnerData.username);
            
            toast.success(`Cadastro via parceiro: ${partnerData.full_name || partnerData.username}`);
          } else {
            console.log('⚠️ Parceiro inválido ou inativo');
            setIsPartnerContext(false);
            toast.error('Link de parceiro inválido ou inativo.');
          }
        }
        
        // Validar parceiro por código
        else if (code) {
          setPartnerCode(code);
          
          const { data: partnerData, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('partner_code', code)
            .eq('user_type', 'partner')
            .eq('is_active', true)
            .single();
            
          if (!error && partnerData) {
            setPartnerInfo(partnerData);
            setPartnerUsername(partnerData.username);
            console.log('✅ Parceiro encontrado pelo código:', partnerData.full_name || partnerData.username);
            
            toast.success(`Cadastro via parceiro: ${partnerData.full_name || partnerData.username}`);
          } else {
            console.log('⚠️ Código de parceiro inválido');
            setIsPartnerContext(false);
            toast.error('Código de parceiro inválido.');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao extrair informações do parceiro:', error);
      setIsPartnerContext(false);
    }
  };

  const loadPublicLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao carregar links públicos:', error);
        return;
      }

      if (data) {
        setPublicLinks({
          scheduling_url: (data as any).n8n_webhook_url || 'https://preview--cjrs-landing-craft.lovable.app',
          exit_url: (data as any).medical_record_webhook_url || 'https://preview--cjrs-landing-craft.lovable.app'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de links:', error);
      // Usar URLs padrão em caso de erro
      setPublicLinks({
        scheduling_url: 'https://preview--cjrs-landing-craft.lovable.app',
        exit_url: 'https://preview--cjrs-landing-craft.lovable.app'
      });
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const updateDynamicMessage = (value: string) => {
    const cleanNumber = value.replace(/\D/g, '');
    const length = cleanNumber.length;
    
    if (length === 0) {
      setDynamicMessage('Digite o CPF');
      setIsButtonEnabled(false);
    } else if (length <= 11) {
      setDynamicMessage('Digite o CPF');
      setIsButtonEnabled(length === 11);
    } else {
      setDynamicMessage('Digite o SUS');
      setIsButtonEnabled(length === 15);
    }
  };

  const validateSusNumber = async () => {
    if (!susNumber.trim()) {
      toast.error('Por favor, insira o CPF ou SUS.');
      return;
    }

    // Verificar se o usuário digitou 7 números (validação especial para CPF)
    const sevenDigitValidation = validateSevenDigitInput(susNumber.trim());
    
    if (sevenDigitValidation.isSevenDigits) {
      if (sevenDigitValidation.shouldRedirectToRegistration) {
        // CPF válido de 7 dígitos - prosseguir para o formulário
        setFormData(prev => ({ ...prev, sus: cleanCpfOrSus(susNumber.trim()) }));
        setCurrentStep('form_fields');
        return;
      } else {
        // CPF inválido de 7 dígitos - mostrar erro e não prosseguir
        toast.error(sevenDigitValidation.message);
        return;
      }
    }

    // Validar formato antes de prosseguir
    const cleanNumber = cleanCpfOrSus(susNumber.trim());
    const isValid = isValidCpfOrSus(susNumber.trim());
    
    if (!isValid) {
      // Se o CPF/SUS é inválido, permitir prosseguir para cadastro
      // mas mostrar uma mensagem informativa
      if (cleanNumber.length === 11) {
        toast.error('CPF inválido. Prosseguindo para cadastro com os dados informados.');
        setFormData(prev => ({ ...prev, sus: cleanNumber }));
        setCurrentStep('form_fields');
        return;
      } else if (cleanNumber.length === 15) {
        toast.error('SUS inválido. Prosseguindo para cadastro com os dados informados.');
        setFormData(prev => ({ ...prev, sus: cleanNumber }));
        setCurrentStep('form_fields');
        return;
      } else {
        toast.error('CPF deve ter 11 dígitos ou SUS deve ter 15 dígitos.');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Limpar estado anterior
      setExistingPatient(null);
      
      // Verificar se o número já existe no banco
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, sus, gender, date_of_birth, age, phone, address')
        .eq('sus', cleanNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows found (que é o que queremos)
        throw error;
      }

      if (data) {
        // Usuário já existe
        setExistingPatient(data);
        setCurrentStep('existing_user');
        const firstName = data.name.split(' ')[0];
        toast.success(`${getTimeGreeting()}, ${firstName}! Bem-vindo(a) de volta!`);
        return;
      }

      // Documento não existe, pode prosseguir
      setFormData(prev => ({ ...prev, sus: cleanNumber }));
      setCurrentStep('form_fields');
      toast.success('Documento válido! Preencha seus dados pessoais para continuar.');
      
    } catch (error) {
      console.error('Erro ao validar documento:', error);
      toast.error('Erro ao validar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Campos que devem ser convertidos para maiúsculo (exceto telefone)
    const upperCaseFields = ['name', 'address'];
    let processedValue = upperCaseFields.includes(name) ? value.toUpperCase() : value;
    
    // Para telefone, aplicar formatação automática
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    // Para CPF/SUS, aplicar formatação automática
    if (name === 'sus') {
      processedValue = formatCpfOrSus(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      date_of_birth: date,
      age: date ? calculateAgeInYears(date) : 0
    }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sus) {
      toast.error('Nome e número SUS são obrigatórios.');
      return;
    }

    // Validar telefone se foi preenchido
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast.error('Por favor, insira um número de telefone válido no formato (XX)XXXXX-XXXX.');
      return;
    }

    try {
      setLoading(true);
      
      const formattedData = {
        ...formData,
        date_of_birth: formatDateForDB(formData.date_of_birth),
        // Limpar formatação do telefone para armazenar apenas números
        phone: formData.phone ? cleanPhoneNumber(formData.phone) : '',
        // Limpar formatação do CPF/SUS para armazenar apenas números
        sus: cleanCpfOrSus(formData.sus)
      };

      const { error } = await supabase
        .from('patients')
        .insert([{
          name: formattedData.name,
          phone: formattedData.phone,
          sus: formattedData.sus,
          date_of_birth: formattedData.date_of_birth,
          age: formattedData.age,
          gender: formattedData.gender,
          address: formattedData.address,
          bairro: formattedData.bairro
        }]);

      if (error) throw error;

      toast.success('Cadastro realizado com sucesso!');
      
      // Verificar se há parâmetro redirect para redirecionar adequadamente
      const urlParams = getUrlParams();
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        if (urlParams.redirect === 'agendamento') {
          // Se veio do link de parceiro, redirecionar para agendamento com os parâmetros
          const redirectParams = new URLSearchParams();
          if (urlParams.partner) redirectParams.set('partner', urlParams.partner);
          if (urlParams.code) redirectParams.set('code', urlParams.code);
          
          const redirectUrl = `/agendamento${redirectParams.toString() ? '?' + redirectParams.toString() : ''}`;
          window.location.href = redirectUrl;
        } else if (publicLinks.exit_url) {
          // Redirecionamento padrão
          window.location.href = publicLinks.exit_url;
        }
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSusNumber('');
    setExistingPatient(null);
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
    setCurrentStep('sus_validation');
  };

  const handleUpdateData = () => {
    // Preencher formulário com dados existentes para atualização
    setFormData({
      name: existingPatient.name,
      gender: existingPatient.gender,
      date_of_birth: existingPatient.date_of_birth ? new Date(existingPatient.date_of_birth) : null,
      age: existingPatient.age,
      // Formatar telefone se existir
      phone: existingPatient.phone ? formatPhoneNumber(existingPatient.phone) : '',
      // Formatar CPF/SUS para exibição
      sus: formatCpfOrSus(existingPatient.sus),
      address: existingPatient.address,
      bairro: existingPatient.bairro || ''
    });
    setCurrentStep('form');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sus) {
      toast.error('Nome e número SUS são obrigatórios.');
      return;
    }

    // Validar telefone se foi preenchido
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast.error('Por favor, insira um número de telefone válido no formato (XX)XXXXX-XXXX.');
      return;
    }

    // Mostrar confirmação antes de atualizar
    const confirmed = window.confirm('Tem certeza que deseja atualizar seus dados?');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      
      const formattedData = {
        ...formData,
        date_of_birth: formatDateForDB(formData.date_of_birth),
        // Limpar formatação do telefone para armazenar apenas números
        phone: formData.phone ? cleanPhoneNumber(formData.phone) : '',
        // Limpar formatação do CPF/SUS para armazenar apenas números
        sus: cleanCpfOrSus(formData.sus)
      };

      // Atualizar dados existentes em vez de inserir
      const { error } = await supabase
        .from('patients')
        .update({
          name: formattedData.name,
          phone: formattedData.phone,
          date_of_birth: formattedData.date_of_birth,
          age: formattedData.age,
          gender: formattedData.gender,
          address: formattedData.address,
          bairro: formattedData.bairro
        })
        .eq('sus', formattedData.sus);

      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      
      // Verificar se há parâmetro redirect para redirecionar adequadamente
      const urlParams = getUrlParams();
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        if (urlParams.redirect === 'agendamento') {
          // Se veio do link de parceiro, redirecionar para agendamento com os parâmetros
          const redirectParams = new URLSearchParams();
          if (urlParams.partner) redirectParams.set('partner', urlParams.partner);
          if (urlParams.code) redirectParams.set('code', urlParams.code);
          
          const redirectUrl = `/agendamento${redirectParams.toString() ? '?' + redirectParams.toString() : ''}`;
          window.location.href = redirectUrl;
        } else if (publicLinks.exit_url) {
          // Redirecionamento padrão
          window.location.href = publicLinks.exit_url;
        } else {
          toast.error('URL de saída não configurada.');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao atualizar dados do paciente:', error);
      toast.error('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduling = () => {
    console.log('🚀 Iniciando redirecionamento para agendamento...');
    console.log('📋 Estado atual:', {
      shouldRedirectToScheduling,
      isPartnerContext,
      partnerUsername,
      partnerCode,
      partnerInfo: partnerInfo?.full_name || partnerInfo?.username
    });
    
    // Se é contexto de parceiro ou deve redirecionar para agendamento
    if (shouldRedirectToScheduling || isPartnerContext) {
      const redirectParams = new URLSearchParams();
      
      // Priorizar informações do estado sobre parâmetros da URL
      if (partnerUsername) {
        redirectParams.set('partner', partnerUsername);
      }
      if (partnerCode) {
        redirectParams.set('code', partnerCode);
      }
      
      // Fallback para parâmetros da URL se não tiver no estado
      if (!partnerUsername && !partnerCode) {
        const urlParams = getUrlParams();
        if (urlParams.partner) redirectParams.set('partner', urlParams.partner);
        if (urlParams.code) redirectParams.set('code', urlParams.code);
      }
      
      const redirectUrl = `/agendamento${redirectParams.toString() ? '?' + redirectParams.toString() : ''}`;
      
      console.log('🎯 Redirecionando para agendamento interno:', redirectUrl);
      console.log('📋 Parâmetros preservados:', Object.fromEntries(redirectParams));
      
      // Mostrar mensagem de sucesso se há parceiro
      if (partnerInfo) {
        toast.success(`Redirecionando para agendamento via ${partnerInfo.full_name || partnerInfo.username}`);
      }
      
      window.location.href = redirectUrl;
    } else if (publicLinks.scheduling_url) {
      // Redirecionamento padrão para URL externa
      console.log('🌐 Redirecionando para URL externa:', publicLinks.scheduling_url);
      window.open(publicLinks.scheduling_url, '_blank');
    } else {
      console.log('❌ Nenhum link de agendamento configurado');
      toast.error('Link de agendamento não configurado.');
    }
  };

  const handleExit = () => {
    if (publicLinks.exit_url) {
      window.open(publicLinks.exit_url, '_blank');
    } else {
      toast.error('Link de saída não configurado.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="scan-line"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 sm:w-80 h-60 sm:h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-30 animate-float"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-cyan-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">
        <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-purple-500/10 card-glow glass-effect">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-cyan-500 p-3 rounded-full gradient-button">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-gradient">
              CADASTRO DE PACIENTE
            </CardTitle>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed px-2">
              REALIZE SEU CADASTRO NO SISTEMA DE PRONTUÁRIO DIGITAL
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium tracking-wide">SEGURO E CONFIDENCIAL</span>
            </div>
          </CardHeader>
          
          {/* Exibição das informações do parceiro */}
          {isPartnerContext && partnerInfo && (
            <div className="px-6 sm:px-8 pb-4">
              <Alert className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 backdrop-blur-sm">
                <Users className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Cadastro via parceiro:</span>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {partnerInfo.full_name || partnerInfo.username}
                      </Badge>
                    </div>
                    {shouldRedirectToScheduling && (
                      <div className="flex items-center gap-1 text-xs text-cyan-400">
                        <ExternalLink className="h-3 w-3" />
                        <span>Retornará ao agendamento</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <CardContent className="p-6 sm:p-8">
            {currentStep === 'existing_user' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full gradient-button">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {getTimeGreeting()}, {existingPatient?.name.split(' ')[0]}!
                  </h3>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-6">
                    O QUE VOCÊ GOSTARIA DE FAZER HOJE?
                  </p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleUpdateData}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 futuristic-hover focus-glow smooth-transition"
                    aria-label="Atualizar dados pessoais"
                  >
                    <UserPlus className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    ATUALIZAR DADOS
                    <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  <Button 
                    onClick={handleScheduling}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 futuristic-hover focus-glow smooth-transition"
                    aria-label="Agendar consulta"
                  >
                    <Search className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    AGENDAMENTO
                    <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  <Button 
                    onClick={handleExit}
                    variant="outline"
                    className="w-full h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                    aria-label="Ir para o site"
                  >
                    SITE
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'sus_validation' && (
              <div className="space-y-6">
                <Alert className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <AlertDescription className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      PARA INICIAR SEU CADASTRO, INFORME SEU CPF OU NÚMERO DO SUS.
                    </AlertDescription>
                  </div>
                </Alert>
                
                <div className="space-y-3">
                  <Label htmlFor="sus" className="text-slate-200 font-semibold text-sm sm:text-base tracking-wide">
                    CPF OU SUS <span className="text-pink-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="sus"
                      value={susNumber}
                      onChange={(e) => {
                        const formattedValue = formatCpfOrSus(e.target.value);
                        setSusNumber(formattedValue);
                        updateDynamicMessage(formattedValue);
                      }}
                      placeholder="CPF (XXX.XXX.XXX-XX) OU SUS (XXX XXXX XXXX XXXX)"
                      required
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-md pointer-events-none opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                  </div>
                </div>
                
                {!isButtonEnabled && (
                  <div className="text-center text-slate-400 text-sm py-2">
                    {dynamicMessage}
                  </div>
                )}
                
                <Button 
                    onClick={validateSusNumber} 
                    disabled={loading || !isButtonEnabled}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 futuristic-hover focus-glow smooth-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label="Verificar número do SUS"
                  >
                    {loading && <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />}
                    <Search className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    VERIFICAR DOCUMENTO
                    <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
              </div>
            )}

            {currentStep === 'form_fields' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Alert className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <AlertDescription className="text-green-100 text-sm sm:text-base leading-relaxed">
                      PREENCHA SEUS DADOS PESSOAIS PARA CONTINUAR.
                    </AlertDescription>
                  </div>
                </Alert>
                
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-600/30">
                  <PatientFormFields 
                    formData={formData}
                    handleChange={handleChange}
                    handleDateChange={handleDateChange}
                    handleGenderChange={handleGenderChange}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                    aria-label="Voltar para validação do SUS"
                  >
                    VOLTAR
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 futuristic-hover focus-glow smooth-transition"
                    aria-label="Cadastrar novo paciente"
                  >
                    {loading && <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />}
                    <UserPlus className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    CADASTRAR
                    <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </form>
            )}

            {currentStep === 'form' && (
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <Alert className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <AlertDescription className="text-green-100 text-sm sm:text-base leading-relaxed">
                      REVISE E ATUALIZE SEUS DADOS PESSOAIS CONFORME NECESSÁRIO.
                    </AlertDescription>
                  </div>
                </Alert>
                
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-600/30">
                  <PatientFormFields 
                    formData={{
                      ...formData,
                      name: formData.name ? formData.name.toUpperCase() : '',
                      sus: formData.sus,
                      gender: formData.gender,
                      phone: formData.phone,
                      address: formData.address,
                      bairro: formData.bairro
                    }}
                    handleChange={handleChange}
                    handleDateChange={handleDateChange}
                    handleGenderChange={handleGenderChange}
                    readOnlyFields={['name', 'sus', 'gender', 'date_of_birth']}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                    aria-label="Voltar para validação do SUS"
                  >
                    VOLTAR
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 futuristic-hover focus-glow smooth-transition"
                    aria-label="Atualizar dados do paciente"
                  >
                    {loading && <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />}
                    <UserPlus className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    ATUALIZAR DADOS
                    <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </form>
            )}


          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicPatientRegistration;