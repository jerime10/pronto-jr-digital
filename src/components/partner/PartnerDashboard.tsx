import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserService } from '@/services/userService';
import { Usuario, PartnerLink } from '@/types/database';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { generatePartnerBookingLink, generatePartnerRegistrationLink, copyLinkToClipboard, formatLinkForDisplay, generatePartnerQRCode } from '@/utils/partnerLinkUtils';
import { 
  Copy, 
  Link, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  ExternalLink,
  QrCode,
  UserPlus,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';

export const PartnerDashboard: React.FC = () => {
  const { user: authUser } = useSimpleAuth();
  const { permissions, isPartner } = usePermissions();
  const [user, setUser] = useState<Usuario | null>(null);
  const [bookingLink, setBookingLink] = useState<string>('');
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    thisMonthAppointments: 0,
    totalCommission: 0,
    thisMonthCommission: 0
  });

  useEffect(() => {
    loadUserData();
  }, [authUser]);

  useEffect(() => {
    if (user) {
      generateLinks();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!authUser?.username) return;
    
    try {
      const userData = await UserService.getUserByUsername(authUser.username);
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    }
  };

  const generateLinks = async () => {
    if (!user?.username || !user?.partner_code) return;
    
    try {
      setLoading(true);
      
      const booking = generatePartnerBookingLink(user);
      const registration = generatePartnerRegistrationLink(user);
      
      setBookingLink(booking);
      setRegistrationLink(registration);
      
      // Gerar QR Code para o link de agendamento
      try {
        const qrUrl = await generatePartnerQRCode(booking);
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.error('Erro ao gerar QR Code:', qrError);
      }
      
      // TODO: Implementar carregamento de estatísticas
      // Por enquanto, dados mockados para demonstração
      setStats({
        totalAppointments: 0,
        thisMonthAppointments: 0,
        totalCommission: 0,
        thisMonthCommission: 0
      });
      
    } catch (error) {
      console.error('Erro ao gerar links do parceiro:', error);
      toast.error('Erro ao gerar links do parceiro');
    } finally {
      setLoading(false);
    }
  };

  const copyBookingLink = async () => {
    if (!bookingLink) return;
    
    try {
      const success = await copyLinkToClipboard(bookingLink);
      if (success) {
        toast.success('Link de agendamento copiado para a área de transferência!');
      } else {
        toast.error('Erro ao copiar link');
      }
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const copyRegistrationLink = async () => {
    if (!registrationLink) return;
    
    try {
      const success = await copyLinkToClipboard(registrationLink);
      if (success) {
        toast.success('Link de cadastro copiado para a área de transferência!');
      } else {
        toast.error('Erro ao copiar link');
      }
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const openBookingLink = () => {
    if (!bookingLink) return;
    window.open(bookingLink, '_blank');
  };

  const openRegistrationLink = () => {
    if (!registrationLink) return;
    window.open(registrationLink, '_blank');
  };



  // Verificar se o usuário está autenticado e é um parceiro
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.isPartner) {
    return <Navigate to="/dashboard" replace />;
  }

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados do parceiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard do Parceiro</h1>
          <p className="text-gray-600">
            Bem-vindo, {user.full_name || user.username}!
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Comissão: {user.commission_percentage}%
          </Badge>
          <Badge variant={user.is_active ? 'default' : 'destructive'}>
            {user.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      {/* Link de Agendamento */}
      <PermissionGuard permission="partner_links">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Link de Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingLink ? (
              <>
                <div className="p-3 bg-slate-100 rounded-lg border">
                  <p className="text-sm text-slate-600 break-all">
                    {formatLinkForDisplay(bookingLink, 60)}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={copyBookingLink} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button onClick={openBookingLink} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Link
                  </Button>
                  {qrCodeUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.open(qrCodeUrl, '_blank')}>
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500">Gerando link...</p>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Link de Cadastro */}
      <PermissionGuard permission="partner_links">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Link de Cadastro de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {registrationLink ? (
              <>
                <div className="p-3 bg-slate-100 rounded-lg border">
                  <p className="text-sm text-slate-600 break-all">
                    {formatLinkForDisplay(registrationLink, 60)}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={copyRegistrationLink} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button onClick={openRegistrationLink} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Link
                  </Button>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Este link direciona pacientes para o cadastro e depois automaticamente para o agendamento vinculado ao seu código de parceiro.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <p className="text-slate-500">Gerando link...</p>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Estatísticas */}
      <PermissionGuard permission="partner_relatorios_proprios">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Agendamentos</p>
                  <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold">{stats.thisMonthAppointments}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissão Total</p>
                  <p className="text-2xl font-bold">R$ {stats.totalCommission.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissão do Mês</p>
                  <p className="text-2xl font-bold">R$ {stats.thisMonthCommission.toFixed(2)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>

      {/* Instruções de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar Seu Link de Parceria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Compartilhe seu link</p>
                <p className="text-sm text-gray-600">
                  Envie seu link exclusivo para clientes interessados em agendar consultas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Cliente agenda pelo seu link</p>
                <p className="text-sm text-gray-600">
                  Quando o cliente usar seu link, o agendamento será automaticamente vinculado a você.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Receba sua comissão</p>
                <p className="text-sm text-gray-600">
                  Você receberá {user.commission_percentage}% de comissão sobre cada agendamento realizado.
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Certifique-se de que seus clientes sempre usem seu link exclusivo 
              para garantir que você receba a comissão pelos agendamentos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Nome de Usuário</p>
              <p>{user.username}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600">Nome Completo</p>
              <p>{user.full_name || 'Não informado'}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600">E-mail</p>
              <p>{user.email || 'Não informado'}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600">Telefone</p>
              <p>{user.phone || 'Não informado'}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600">Último Login</p>
              <p>
                {user.last_login 
                  ? new Date(user.last_login).toLocaleString('pt-BR')
                  : 'Nunca'
                }
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600">Membro desde</p>
              <p>
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString('pt-BR')
                  : 'Data não disponível'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDashboard;