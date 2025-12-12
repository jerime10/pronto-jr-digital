import React, { useState } from 'react';
import { Calendar, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { testGoogleCalendarConnection, syncAttendantCalendar } from '@/services/googleCalendarService';

interface GoogleCalendarTabProps {
  calendarId: string;
  onCalendarIdChange: (value: string) => void;
  attendantId?: string;
}

export const GoogleCalendarTab: React.FC<GoogleCalendarTabProps> = ({
  calendarId,
  onCalendarIdChange,
  attendantId,
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    if (!calendarId || !attendantId) {
      toast.error('Salve o atendente com o ID da agenda antes de testar');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const success = await testGoogleCalendarConnection(attendantId);
      if (success) {
        setConnectionStatus('success');
        toast.success('Conexão com Google Calendar estabelecida!');
      } else {
        setConnectionStatus('error');
        toast.error('Falha na conexão. Verifique o ID e as permissões.');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Erro ao testar conexão com Google Calendar');
      console.error('Connection test error:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncCalendar = async () => {
    if (!attendantId) {
      toast.error('Salve o atendente antes de sincronizar');
      return;
    }

    setIsSyncing(true);

    try {
      const result = await syncAttendantCalendar(attendantId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao sincronizar calendário');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Integração com Google Calendar</p>
            <p>Cole o ID da agenda do Google Calendar para sincronizar os horários automaticamente.</p>
            <p className="mt-2 text-xs">
              <strong>Importante:</strong> A agenda deve estar compartilhada com a conta de serviço do sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="google_calendar_id">ID da Agenda Google Calendar</Label>
        <Input
          id="google_calendar_id"
          value={calendarId}
          onChange={(e) => onCalendarIdChange(e.target.value)}
          placeholder="exemplo@group.calendar.google.com ou email@gmail.com"
        />
        <p className="text-xs text-muted-foreground">
          Encontre o ID em: Google Calendar → Configurações da Agenda → Integrar agenda → ID da agenda
        </p>
      </div>

      {calendarId && (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border ${
            connectionStatus === 'success' 
              ? 'bg-green-50 border-green-200' 
              : connectionStatus === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : connectionStatus === 'error' ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                )}
                <span className={`text-sm font-medium ${
                  connectionStatus === 'success' 
                    ? 'text-green-700' 
                    : connectionStatus === 'error'
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}>
                  {connectionStatus === 'success' 
                    ? 'Conexão verificada' 
                    : connectionStatus === 'error'
                    ? 'Falha na conexão'
                    : 'Conexão não testada'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>

          {attendantId && connectionStatus === 'success' && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleSyncCalendar}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar Eventos Agora
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="text-sm text-amber-700">
          <p className="font-medium mb-1">Instruções de configuração:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Acesse o Google Calendar e abra as configurações da agenda</li>
            <li>Vá em "Compartilhar com pessoas ou grupos específicos"</li>
            <li>Adicione o email da conta de serviço com permissão "Fazer alterações"</li>
            <li>Copie o ID da agenda em "Integrar agenda"</li>
            <li>Cole o ID no campo acima e salve</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarTab;
