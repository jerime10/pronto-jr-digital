import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DurationField } from '@/components/ui/duration-field';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { serviceService } from '@/services/serviceService';

const NovoServico: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '30',
    available: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error('Duração deve ser maior que zero');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const serviceData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        available: formData.available
      };
      
      console.log('🔍 DEBUG - Criando serviço:', serviceData);
      
      await serviceService.createService(serviceData);
      
      toast.success('Serviço criado com sucesso!');
      navigate('/servicos');
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar serviço');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/servicos')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Serviço</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-6">Novo Serviço</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço</Label>
              <Input
                id="name"
                placeholder="Nome do serviço"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <DurationField
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
              required
            />

            <div className="flex items-center space-x-3">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
              <Label htmlFor="available" className="text-green-600">
                Disponível
              </Label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/servicos')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovoServico;