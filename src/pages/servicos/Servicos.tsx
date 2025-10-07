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
import { serviceService } from '@/services/serviceService';
import { serviceAssignmentService, ServiceAssignment } from '@/services/serviceAssignmentService';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';

const Servicos: React.FC = () => {
  const { permissions, checkPermission } = usePermissions();
  const navigate = useNavigate();
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('gerenciar');
  const [isAssigningServices, setIsAssigningServices] = useState<boolean>(false);
  
  // Fetch services from database
  const { data: services = [], refetch: refetchServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAllServices()
  });

  // Fetch attendants
  const { data: attendants = [] } = useQuery({
    queryKey: ['attendants'],
    queryFn: async () => {
      const { data, error } = await enhancedSupabase
        .from('attendants')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch attendant services data
  const { data: attendantServices = [], refetch: refetchAttendantServices } = useQuery({
    queryKey: ['attendant-services', selectedAttendant],
    queryFn: async () => {
      if (!selectedAttendant) return [];
      return await serviceAssignmentService.getAssignmentsByAttendant(selectedAttendant);
    },
    enabled: !!selectedAttendant
  });



  const handleToggleServiceStatus = async (serviceId: string) => {
    try {
      console.log('🔍 DEBUG - Alterando status do serviço:', serviceId);
      await serviceService.toggleServiceAvailability(serviceId);
      toast.success('Status do serviço alterado com sucesso!');
      refetchServices();
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status do serviço');
    }
  };

  const handleAssignServices = async (serviceIds: string[]) => {
    if (!selectedAttendant) {
      toast.error('Selecione um atendente primeiro');
      return;
    }

    setIsAssigningServices(true);
    try {
      let assignedCount = 0;
      let skippedCount = 0;
      
      for (const serviceId of serviceIds) {
        // Verificar se já existe atribuição
        const exists = await serviceAssignmentService.checkExistingAssignment(serviceId, selectedAttendant);
        if (exists) {
          const service = services.find(s => s.id === serviceId);
          toast.warning(`Serviço "${service?.name}" já está atribuído a este atendente`);
          skippedCount++;
          continue;
        }
        
        // Criar nova atribuição
        await serviceAssignmentService.createAssignment(serviceId, selectedAttendant);
        assignedCount++;
      }
      
      // Atualizar lista de serviços atribuídos
      await refetchAttendantServices();
      
      if (assignedCount > 0) {
        toast.success(`${assignedCount} serviço(s) atribuído(s) com sucesso!`);
      }
      if (skippedCount > 0 && assignedCount === 0) {
        toast.info('Todos os serviços selecionados já estão atribuídos a este atendente');
      }
    } catch (error) {
      console.error('Error assigning services:', error);
      toast.error('Erro ao atribuir serviços');
    } finally {
      setIsAssigningServices(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await serviceAssignmentService.removeAssignment(assignmentId);
      await refetchAttendantServices();
      toast.success('Atribuição removida com sucesso!');
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Erro ao remover atribuição');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const confirmDelete = window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.');
      if (!confirmDelete) return;
      
      await serviceService.deleteService(serviceId);
      toast.success('Serviço excluído com sucesso!');
      refetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  // Filter available services (only available and not already assigned)
  const availableServices = services.filter(service => 
    service.available && !attendantServices.some(assignment => assignment.service_id === service.id)
  );

  const selectedAttendantData = attendants.find(p => p.id === selectedAttendant);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Serviços</h1>
        </div>
        <ActionButtonGuard permission="servicos_criar">
          <Button 
            onClick={() => navigate('/servicos/novo')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Serviço</span>
          </Button>
        </ActionButtonGuard>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Serviços</h2>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        <Badge 
                          variant={service.available ? "default" : "secondary"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleToggleServiceStatus(service.id)}
                        >
                          {service.available ? "Disponível" : "Indisponível"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <ActionButtonGuard permission="servicos_editar">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/servicos/editar/${service.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </ActionButtonGuard>
                          <ActionButtonGuard permission="servicos_excluir">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </ActionButtonGuard>
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
                <Select 
                  onValueChange={(value) => {
                    setSelectedAttendant(value);
                    // Automaticamente mostrar os serviços disponíveis
                    if (value && activeTab === 'atribuir') {
                      // Scroll suave para a seção de serviços disponíveis
                      setTimeout(() => {
                        const servicesSection = document.getElementById('available-services-section');
                        if (servicesSection) {
                          servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }} 
                  value={selectedAttendant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendants.map((attendant) => (
                      <SelectItem key={attendant.id} value={attendant.id}>
                        {attendant.name} - {attendant.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAttendant && (
                <>
                  <div id="available-services-section" className="scroll-mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Serviços Disponíveis</h3>
                      <Badge variant="outline" className="text-sm">
                        {availableServices.length} serviço(s) disponível(is)
                      </Badge>
                    </div>
                    
                    {servicesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Carregando serviços...</p>
                        </div>
                      </div>
                    ) : availableServices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Nenhum serviço disponível para atribuição.</p>
                        <p className="text-sm text-gray-500 mt-1">Todos os serviços já foram atribuídos a este atendente ou não há serviços disponíveis.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableServices.map((service) => (
                          <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <h4 className="font-medium">{service.name}</h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-gray-600">R$ {service.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-gray-600">{service.duration} minutos</span>
                            </div>
                            <Button
                              className="mt-3 w-full"
                              size="sm"
                              onClick={() => handleAssignServices([service.id])}
                              disabled={isAssigningServices}
                            >
                              {isAssigningServices ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Atribuindo...
                                </>
                              ) : (
                                'Atribuir Serviço'
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="atribuidos" className="mt-6">
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Selecionar Atendente</label>
                <Select onValueChange={setSelectedAttendant} value={selectedAttendant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendants.map((attendant) => (
                      <SelectItem key={attendant.id} value={attendant.id}>
                        {attendant.name} - {attendant.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAttendantData && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold">{selectedAttendantData.name}</h3>
                    <p className="text-muted-foreground">{selectedAttendantData.position}</p>
                    <Badge variant="outline" className="mt-2">
                      {attendantServices.length} serviço(s) atribuído(s)
                    </Badge>
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
                      {attendantServices.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.service_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>R$ {assignment.service_price?.toFixed(2) || '0.00'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{assignment.service_duration} minutos</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {!selectedAttendant && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Selecione um atendente para visualizar os serviços atribuídos</p>
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