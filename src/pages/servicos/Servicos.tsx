import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Clock, DollarSign, Users, FileText } from 'lucide-react';
import { enhancedSupabase } from '@/lib/enhancedSupabaseClient';
import { useQuery } from '@tanstack/react-query';

const Servicos: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  
  // Mock services data since table doesn't exist in types
  const { data: services = [], refetch: refetchServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      // Using mock data for now since services table is not properly typed
      return [
        {
          id: '1',
          name: 'Consulta de Enfermagem',
          price: 100.00,
          duration: 25,
          is_active: true,
          description: 'Consulta básica de enfermagem'
        },
        {
          id: '2',
          name: 'Consulta de Enfermagem com USG ABD Total',
          price: 170.00,
          duration: 45,
          is_active: false,
          description: 'Consulta com ultrassom abdominal'
        },
        {
          id: '3',
          name: 'Consulta de Enfermagem com USG Obstétrica',
          price: 170.00,
          duration: 25,
          is_active: true,
          description: 'Consulta com ultrassom obstétrico'
        },
        {
          id: '4',
          name: 'Consulta de Enfermagem com USG Próstata',
          price: 130.00,
          duration: 30,
          is_active: false,
          description: 'Consulta com ultrassom da próstata'
        },
        {
          id: '5',
          name: 'Consulta de Enfermagem com USG Transvaginal ginecológica',
          price: 150.00,
          duration: 45,
          is_active: false,
          description: 'Consulta com ultrassom transvaginal'
        }
      ];
    }
  });

  // Fetch professionals
  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await enhancedSupabase
        .from('professionals')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mock professional services data
  const { data: professionalServices = [] } = useQuery({
    queryKey: ['professional-services', selectedProfessional],
    queryFn: async () => {
      if (!selectedProfessional) return [];
      
      // Mock data for assigned services
      return [
        {
          id: '1',
          professional_id: selectedProfessional,
          service_id: '1',
          service: services.find(s => s.id === '1')
        },
        {
          id: '2',
          professional_id: selectedProfessional,
          service_id: '3',
          service: services.find(s => s.id === '3')
        }
      ];
    },
    enabled: !!selectedProfessional && services.length > 0
  });

  const handleDeleteService = async (serviceId: string) => {
    try {
      console.log('Deleting service:', serviceId);
      // Mock delete - in real implementation, would call API
      refetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleAssignServices = async (serviceIds: string[]) => {
    if (!selectedProfessional) return;

    try {
      console.log('Assigning services to professional:', selectedProfessional, serviceIds);
      // Mock assignment - in real implementation, would call API
    } catch (error) {
      console.error('Error assigning services:', error);
    }
  };

  const availableServices = services.filter(service => 
    !professionalServices.some(ps => ps.service?.id === service.id)
  );

  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Serviços</h1>
        </div>
        <Button 
          onClick={() => navigate('/servicos/novo')}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Serviços</h2>
          </div>

          <Tabs defaultValue="gerenciar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gerenciar" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Gerenciar Serviços</span>
              </TabsTrigger>
              <TabsTrigger value="atribuir" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Atribuir Serviços</span>
              </TabsTrigger>
              <TabsTrigger value="atribuidos" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Serviços Atribuídos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gerenciar" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {service.price?.toFixed(2) || '0.00'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{service.duration} minutos</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Disponível" : "Indisponível"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/servicos/editar/${service.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="atribuir" className="mt-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Selecionar Atendente</label>
                <Select onValueChange={setSelectedProfessional} value={selectedProfessional}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name} - {professional.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProfessional && (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Serviços Disponíveis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {availableServices.map((service) => (
                        <Card key={service.id} className="p-4">
                          <h4 className="font-medium">{service.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                            <DollarSign className="h-3 w-3" />
                            <span>R$ {service.price?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{service.duration} minutos</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleAssignServices(availableServices.map(s => s.id))}
                      disabled={availableServices.length === 0}
                    >
                      Atribuir Serviços
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="atribuidos" className="mt-6">
              {selectedProfessionalData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">{selectedProfessionalData.name}</h3>
                    <p className="text-muted-foreground">{selectedProfessionalData.specialty}</p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professionalServices.map((ps) => (
                        <TableRow key={ps.id}>
                          <TableCell className="font-medium">{ps.service?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>R$ {ps.service?.price?.toFixed(2) || '0.00'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{ps.service?.duration} minutos</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteService(ps.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Servicos;