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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceService } from '@/services/serviceService';

const EditarServico: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    available: true
  });

  // Buscar dados do serviço
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      if (!id) return null;
      console.log('🔍 DEBUG - Carregando serviço para edição:', id);
      return await serviceService.getServiceById(id);
    },
    enabled: !!id
  });

  useEffect(() => {
    if (service) {
      console.log('🔍 DEBUG - Serviço carregado para edição:', service);
      setFormData({
        name: service.name || '',
        price: service.price?.toString() || '',
        duration: service.duration?.toString() || '',
        available: service.available ?? true
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      console.log('🔍 DEBUG - Atualizando serviço:', id, formData);
      
      const updateData = {
        name: formData.name,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        available: formData.available
      };
      
      await serviceService.updateService(id, updateData);
      
      // Invalidar cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      
      toast.success('Serviço atualizado com sucesso!');
      navigate('/servicos');
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar serviço');
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