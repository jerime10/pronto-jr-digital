import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserService } from '@/services/userService';
import { Usuario, UserType, UserPermissions, UsuarioFormData } from '@/types/database';
import { generatePartnerBookingLink, generatePartnerRegistrationLink, copyLinkToClipboard, formatLinkForDisplay } from '@/utils/partnerLinkUtils';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Copy, Link } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [formData, setFormData] = useState<UsuarioFormData>({
    username: '',
    password: '',
    user_type: 'partner',
    permissions: {
      dashboard: false,
      pacientes: false,
      prescricoes: false,
      exames: false,
      atendimento: false,
      historico_atendimentos: false,
      agendamentos: true,
      atendentes: false,
      horarios: false,
      servicos: false,
      financeiro: false,
      usuarios: false,
      configuracoes: false,
      links: true,
      relatorios: false
    },
    full_name: '',
    email: '',
    phone: '',
    commission_percentage: 10,
    partner_code: '',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await UserService.updateUser(editingUser.id, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await UserService.createUser(formData);
        toast.success('Usuário criado com sucesso!');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(editingUser ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário');
      console.error(error);
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Não preencher senha por segurança
      user_type: user.user_type,
      permissions: user.permissions,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      commission_percentage: user.commission_percentage,
      partner_code: user.partner_code || '',
      is_active: user.is_active || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      return;
    }

    try {
      await UserService.deleteUser(user.id);
      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      user_type: 'partner',
      permissions: {
        dashboard: false,
        pacientes: false,
        prescricoes: false,
        exames: false,
        atendimento: false,
        historico_atendimentos: false,
        agendamentos: true,
        atendentes: false,
        horarios: false,
        servicos: false,
        financeiro: false,
        usuarios: false,
        configuracoes: false,
        links: true,
        relatorios: false
      },
      full_name: '',
      email: '',
      phone: '',
      commission_percentage: 10,
      partner_code: '',
      is_active: true
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyPartnerLink = async (username: string) => {
    try {
      const user = users.find(u => u.username === username);
      if (user) {
        const bookingLink = generatePartnerBookingLink(user);
        const success = await copyLinkToClipboard(bookingLink);
        
        if (success) {
          toast.success('Link de agendamento copiado para a área de transferência!');
        } else {
          toast.error('Erro ao copiar link para a área de transferência');
        }
      }
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao gerar link do parceiro');
    }
  };

  const updatePermission = (permission: keyof UserPermissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const getPermissionBadges = (permissions: UserPermissions) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    return activePermissions.map(permission => (
      <Badge key={permission} variant="secondary" className="text-xs">
        {permission}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="permissions">Permissões</TabsTrigger>
                  <TabsTrigger value="partnership">Parceria</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Nome de Usuário *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Senha {!editingUser && '*'}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingUser}
                        placeholder={editingUser ? "Deixe vazio para manter atual" : ""}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_type">Tipo de Usuário</Label>
                      <Select
                        value={formData.user_type}
                        onValueChange={(value: UserType) => setFormData(prev => ({ ...prev, user_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="partner">Parceiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Usuário Ativo</Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Permissões de Acesso</h3>
                    
                    {formData.user_type === 'admin' && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Administradores têm acesso total ao sistema automaticamente.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      {/* Permissões do Menu Principal */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">Menu Principal</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_dashboard"
                              checked={formData.permissions.dashboard}
                              onCheckedChange={(checked) => updatePermission('dashboard', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_dashboard">Dashboard</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_pacientes"
                              checked={formData.permissions.pacientes}
                              onCheckedChange={(checked) => updatePermission('pacientes', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_pacientes">Pacientes</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_prescricoes"
                              checked={formData.permissions.prescricoes}
                              onCheckedChange={(checked) => updatePermission('prescricoes', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_prescricoes">Prescrições</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_exames"
                              checked={formData.permissions.exames}
                              onCheckedChange={(checked) => updatePermission('exames', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_exames">Exames</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_atendimento"
                              checked={formData.permissions.atendimento}
                              onCheckedChange={(checked) => updatePermission('atendimento', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_atendimento">Atendimento</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_historico_atendimentos"
                              checked={formData.permissions.historico_atendimentos}
                              onCheckedChange={(checked) => updatePermission('historico_atendimentos', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_historico_atendimentos">Histórico Atendimentos</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_agendamentos"
                              checked={formData.permissions.agendamentos}
                              onCheckedChange={(checked) => updatePermission('agendamentos', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_agendamentos">Agendamentos</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_atendentes"
                              checked={formData.permissions.atendentes}
                              onCheckedChange={(checked) => updatePermission('atendentes', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_atendentes">Atendentes</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_horarios"
                              checked={formData.permissions.horarios}
                              onCheckedChange={(checked) => updatePermission('horarios', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_horarios">Horários</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_servicos"
                              checked={formData.permissions.servicos}
                              onCheckedChange={(checked) => updatePermission('servicos', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_servicos">Serviços</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_financeiro"
                              checked={formData.permissions.financeiro}
                              onCheckedChange={(checked) => updatePermission('financeiro', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_financeiro">Financeiro</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Permissões Administrativas */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">Administrativo</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_usuarios"
                              checked={formData.permissions.usuarios}
                              onCheckedChange={(checked) => updatePermission('usuarios', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_usuarios">Gerenciar Usuários</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="perm_configuracoes"
                              checked={formData.permissions.configuracoes}
                              onCheckedChange={(checked) => updatePermission('configuracoes', checked)}
                              disabled={formData.user_type === 'admin'}
                            />
                            <Label htmlFor="perm_configuracoes">Configurações</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Permissões de Parceiro */}
                      {formData.user_type === 'partner' && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-gray-700">Parceria</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="perm_links"
                                checked={formData.permissions.links}
                                onCheckedChange={(checked) => updatePermission('links', checked)}
                              />
                              <Label htmlFor="perm_links">Links de Parceria</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="perm_relatorios"
                                checked={formData.permissions.relatorios}
                                onCheckedChange={(checked) => updatePermission('relatorios', checked)}
                              />
                              <Label htmlFor="perm_relatorios">Relatórios</Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="partnership" className="space-y-4">
                  {formData.user_type === 'partner' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="partner_code">Código do Parceiro</Label>
                        <Input
                          id="partner_code"
                          value={formData.partner_code || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            partner_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                          }))}
                          placeholder="Ex: UBSFLU"
                          className="font-mono uppercase"
                          maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Código único usado nos links de parceria (apenas letras e números)
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="commission_percentage">Percentual de Comissão (%)</Label>
                        <Input
                          id="commission_percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.commission_percentage}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            commission_percentage: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.user_type === 'admin' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Administradores não participam do sistema de comissões.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{user.full_name || user.username}</CardTitle>
                  <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                    {user.user_type === 'admin' ? 'Admin' : 'Parceiro'}
                  </Badge>
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {user.user_type === 'partner' && user.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPartnerLink(user.username)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar Link
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Username</p>
                  <p>{user.username}</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-600">E-mail</p>
                  <p>{user.email || 'Não informado'}</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-600">Telefone</p>
                  <p>{user.phone || 'Não informado'}</p>
                </div>
                
                {user.user_type === 'partner' && (
                  <div>
                    <p className="font-medium text-gray-600">Comissão</p>
                    <p>{user.commission_percentage}%</p>
                  </div>
                )}
              </div>
              
              {user.user_type === 'partner' && (
                <div className="mt-4">
                  <p className="font-medium text-gray-600 mb-2">Permissões</p>
                  <div className="flex flex-wrap gap-2">
                    {getPermissionBadges(user.permissions)}
                  </div>
                </div>
              )}
              
              {user.partner_code && (
                <div className="mt-4">
                  <p className="font-medium text-gray-600">Código do Parceiro</p>
                  <p className="font-mono text-sm">{user.partner_code}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum usuário encontrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Novo Usuário" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;