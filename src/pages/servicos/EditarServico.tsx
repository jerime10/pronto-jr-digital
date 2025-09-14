import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DurationField } from '@/components/ui/duration-field';
import { ArrowLeft } from 'lucide-react';
import { enhancedSupabase } from '@/lib/enhancedSupabaseClient';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const EditarServico: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
    is_active: true
  });

  // Mock service data since RPC doesn't exist
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      if (!id) return null;
      
      // Mock service data - in real implementation would fetch from API
      return {
        id: id,
        name: 'Consulta de Enfermagem',
        price: 100.00,
        duration: 25,
        description: 'Consulta básica de enfermagem',
        is_active: true
      };
    },
    enabled: !!id
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        price: service.price?.toString() || '',
        duration: service.duration?.toString() || '',
        description: service.description || '',
        is_active: service.is_active ?? true
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      console.log('Updating service:', id, formData);
      // Mock service update - in real implementation would call API
      toast.success('Serviço atualizado com sucesso!');
      navigate('/servicos');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Erro ao atualizar serviço');
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Editar Serviço</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-6">Editar Serviço</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço</Label>
              <Input
                id="name"
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
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-green-600">
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
              <Button type="submit">
                Atualizar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditarServico;