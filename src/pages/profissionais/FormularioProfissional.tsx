
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const FormularioProfissional = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdicao = !!id;
  
  const [form, setForm] = useState({
    nome: '',
    especialidade: '',
    contato: '',
    registro: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Simulando carregamento de dados para edição
  React.useEffect(() => {
    if (isEdicao) {
      // Aqui seria uma chamada à API para buscar os dados do profissional
      // Simulando com dados fictícios
      setForm({
        nome: 'Dr. Ricardo Silva',
        especialidade: 'Clínico Geral',
        contato: '(11) 98765-4321',
        registro: 'CRM/SP 123456'
      });
    }
  }, [id, isEdicao]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo for alterado
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.nome) {
      newErrors.nome = 'O nome é obrigatório.';
    }
    
    if (!form.especialidade) {
      newErrors.especialidade = 'A especialidade é obrigatória.';
    }
    
    if (!form.contato) {
      newErrors.contato = 'O contato é obrigatório.';
    }
    
    if (!form.registro) {
      newErrors.registro = 'O registro profissional é obrigatório.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    
    // Aqui seria uma chamada à API para salvar os dados
    console.log('Formulário submetido:', form);
    
    toast.success(isEdicao ? "Profissional atualizado com sucesso!" : "Profissional cadastrado com sucesso!");
    navigate('/profissionais');
  };
  
  const handleCancel = () => {
    navigate('/profissionais');
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdicao ? 'Editar Profissional' : 'Novo Profissional'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdicao ? 'Atualize os dados do profissional' : 'Preencha todos os dados para cadastrar um novo profissional'}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Informações Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Digite o nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  className={errors.nome ? "border-red-500" : ""}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade <span className="text-red-500">*</span></Label>
                <Input
                  id="especialidade"
                  name="especialidade"
                  placeholder="Digite a especialidade"
                  value={form.especialidade}
                  onChange={handleChange}
                  className={errors.especialidade ? "border-red-500" : ""}
                />
                {errors.especialidade && (
                  <p className="text-sm text-red-500">{errors.especialidade}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contato">Contato <span className="text-red-500">*</span></Label>
                <Input
                  id="contato"
                  name="contato"
                  placeholder="Ex: (11) 98765-4321"
                  value={form.contato}
                  onChange={handleChange}
                  className={errors.contato ? "border-red-500" : ""}
                />
                {errors.contato && (
                  <p className="text-sm text-red-500">{errors.contato}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registro">Registro Profissional <span className="text-red-500">*</span></Label>
                <Input
                  id="registro"
                  name="registro"
                  placeholder="Ex: CRM/SP 123456"
                  value={form.registro}
                  onChange={handleChange}
                  className={errors.registro ? "border-red-500" : ""}
                />
                {errors.registro && (
                  <p className="text-sm text-red-500">{errors.registro}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEdicao ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormularioProfissional;
