import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Phone, Mail, User, Shield, Calendar, Copy, Share, Camera, AlertCircle, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Attendant, AttendantFormData } from '@/types/database';
import { 
  fetchAttendants, 
  fetchActiveAttendants,
  createAttendant, 
  updateAttendant, 
  deleteAttendant,
  permanentlyDeleteAttendant, 
  searchAttendants 
} from '@/services/attendantService';
import { supabase } from '@/integrations/supabase/client';





const getStatusBadge = (isActive: boolean) => {
  return (
    <Badge className={`${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}>
      {isActive ? 'Ativo' : 'Inativo'}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getWorkingDaysBadges = (workingDays: number[] | null) => {
  if (!workingDays || workingDays.length === 0) {
    return <span className="text-sm text-muted-foreground">Não definido</span>;
  }

  const weekDays = [
    { id: 0, short: 'Dom' },
    { id: 1, short: 'Seg' },
    { id: 2, short: 'Ter' },
    { id: 3, short: 'Qua' },
    { id: 4, short: 'Qui' },
    { id: 5, short: 'Sex' },
    { id: 6, short: 'Sáb' }
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {workingDays.map((dayId) => {
        const day = weekDays.find(d => d.id === dayId);
        return (
          <Badge key={dayId} className="bg-blue-100 text-blue-800 border-0 text-xs px-2 py-1">
            {day?.short}
          </Badge>
        );
      })}
    </div>
  );
};

interface AttendantFormProps {
  attendant?: Attendant | null;
  onClose: () => void;
}

const AttendantForm: React.FC<AttendantFormProps> = ({ attendant, onClose }) => {
  const [formData, setFormData] = useState<AttendantFormData>({
    name: attendant?.name || '',
    email: attendant?.email || '',
    phone: attendant?.phone || '',
    position: attendant?.position || '',
    photo_url: attendant?.photo_url || '',
    working_days: attendant?.working_days || [],
    share_link: attendant?.share_link || '',
    is_active: attendant?.is_active ?? true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkingDays, setSelectedWorkingDays] = useState<number[]>(attendant?.working_days || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        working_days: selectedWorkingDays.length > 0 ? selectedWorkingDays : null
      };
      
      if (attendant) {
        await updateAttendant(attendant.id, dataToSubmit);
        toast.success('Atendente atualizado com sucesso!');
      } else {
        await createAttendant(dataToSubmit);
        toast.success('Atendente criado com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar atendente:', error);
      toast.error('Erro ao salvar atendente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  


  const handleWorkingDayToggle = (day: number) => {
    setSelectedWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const generateShareLink = () => {
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const shareLink = `https://painelconsult.servicoscjrs.com.br/a/${slug}`;
    setFormData({ ...formData, share_link: shareLink });
  };

  const copyShareLink = () => {
    if (formData.share_link) {
      navigator.clipboard.writeText(formData.share_link);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const weekDays = [
    { id: 1, name: 'Segunda', short: 'Seg' },
    { id: 2, name: 'Terça', short: 'Ter' },
    { id: 3, name: 'Quarta', short: 'Qua' },
    { id: 4, name: 'Quinta', short: 'Qui' },
    { id: 5, name: 'Sexta', short: 'Sex' },
    { id: 6, name: 'Sábado', short: 'Sáb' },
    { id: 0, name: 'Domingo', short: 'Dom' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="contato">Contato</TabsTrigger>
          <TabsTrigger value="compartilhar">Compartilhar Agenda</TabsTrigger>
        </TabsList>
        
        <TabsContent value="informacoes" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do atendente"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Cargo do atendente"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dias de Atendimento</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione os dias da semana em que este atendente estará disponível
              </p>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <Button
                    key={day.id}
                    type="button"
                    variant={selectedWorkingDays.includes(day.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleWorkingDayToggle(day.id)}
                    className={`h-12 text-xs transition-all duration-200 ${
                      selectedWorkingDays.includes(day.id) 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{day.short}</div>
                      <div className="text-xs opacity-75">{day.name.slice(0, 3)}</div>
                    </div>
                  </Button>
                ))}
              </div>
              {selectedWorkingDays.length > 0 ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Dias selecionados ({selectedWorkingDays.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedWorkingDays.map((dayId) => {
                      const day = weekDays.find(d => d.id === dayId);
                      return (
                        <Badge key={dayId} className="bg-blue-100 text-blue-800 border-0 text-xs px-2 py-1">
                          {day?.short}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Nenhum dia selecionado. Clique nos dias acima para definir a disponibilidade.
                  </p>
                </div>
              )}
            </div>
            

            
            <div className="flex items-center space-x-3">
              <Switch
                id="isActive"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="isActive" className="text-green-600">
                Ativo
              </Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contato" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input
                id="contact-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(91) 98595-8042"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Foto do Atendente</Label>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl bg-gray-200">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AT'}
                  </AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Adicionar foto
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="compartilhar" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Calendar className="w-16 h-16 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold">Compartilhe Sua Agenda</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Permita que seus clientes conheçam seus serviços e agendem horários através do seu link personalizado
                </p>
              </div>
              
              <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Atenção</p>
                    <p>Certifique-se de que todas as configurações de serviços, horários e prazos de agendamento estejam completas antes de compartilhar.</p>
                  </div>
                </div>
              </div>
              
              {!formData.share_link && (
                <Button type="button" onClick={generateShareLink} className="w-full max-w-md">
                  Gerar Link de Compartilhamento
                </Button>
              )}
              
              {formData.share_link && (
                <div className="w-full max-w-md space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 break-all">{formData.share_link}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={copyShareLink} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button type="button" className="flex-1">
                      <Share className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>


      </Tabs>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (attendant ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
};

const Atendentes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAttendantMode, setIsNewAttendantMode] = useState(false);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadAttendants();
  }, []);

  const loadAttendants = async (filter: 'all' | 'active' | 'inactive' = statusFilter) => {
    try {
      setIsLoading(true);
      const data = await fetchAttendants();
      setAttendants(data);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
      toast.error('Erro ao carregar atendentes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttendants = attendants.filter(attendant => {
    const matchesSearch = attendant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendant.email && attendant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (attendant.phone && attendant.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && attendant.is_active) ||
      (statusFilter === 'inactive' && !attendant.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleEditAttendant = (attendant: Attendant) => {
    setEditingAttendant(attendant);
    setIsNewAttendantMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteAttendant = async (attendant: Attendant) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir definitivamente o atendente "${attendant.name}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      await permanentlyDeleteAttendant(attendant.id);
      toast.success('Atendente excluído com sucesso!');
      await loadAttendants(statusFilter);
    } catch (error) {
      console.error('Erro ao excluir atendente:', error);
      toast.error(`Erro ao excluir atendente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleToggleStatus = async (attendant: Attendant) => {
    try {
      await updateAttendant(attendant.id, { is_active: !attendant.is_active });
      toast.success(`Atendente ${attendant.is_active ? 'desativado' : 'ativado'} com sucesso!`);
      await loadAttendants(statusFilter);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do atendente');
    }
  };

  const handleNewAttendant = () => {
    setEditingAttendant(null);
    setIsNewAttendantMode(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = async () => {
    setIsDialogOpen(false);
    setEditingAttendant(null);
    setIsNewAttendantMode(false);
    await loadAttendants(statusFilter);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atendentes</h1>
          <p className="text-muted-foreground">Gerencie os atendentes da clínica</p>
        </div>
        <Button onClick={handleNewAttendant} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Atendente</span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewAttendantMode ? 'Novo Atendente' : 'Editar Atendente'}
            </DialogTitle>
          </DialogHeader>
          <AttendantForm attendant={editingAttendant} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Atendentes</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => {
              setStatusFilter(value);
              loadAttendants(value);
            }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

            </div>

            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-3">Atendente</div>
              <div className="col-span-2">Contato</div>
              <div className="col-span-4">Dias de Atendimento</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Ações</div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando atendentes...</p>
                </div>
              </div>
            ) : filteredAttendants.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Nenhum atendente encontrado' : 'Nenhum atendente cadastrado'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Comece adicionando o primeiro atendente ao sistema.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleNewAttendant} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Atendente
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttendants.map((attendant) => (
                  <div key={attendant.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 last:border-0">
                    <div className="col-span-3 flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {attendant.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{attendant.name}</p>
                        {attendant.position && (
                          <p className="text-sm text-muted-foreground">{attendant.position}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{attendant.phone || 'Sem telefone'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{attendant.email || 'Sem email'}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-4">
                      {getWorkingDaysBadges(attendant.working_days)}
                    </div>
                    
                    <div className="col-span-2">
                      {getStatusBadge(attendant.is_active)}
                    </div>
                    
                    <div className="col-span-1 flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditAttendant(attendant)} title="Editar atendente">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(attendant)}
                        title={attendant.is_active ? 'Desativar' : 'Ativar'}
                        className={attendant.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {attendant.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAttendant(attendant)} className="text-red-600 hover:text-red-700" title="Excluir atendente">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Atendentes;