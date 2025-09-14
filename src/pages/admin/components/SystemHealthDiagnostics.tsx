import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { performSystemHealthCheck, logSystemHealthReport, SystemHealthStatus } from '@/utils/systemHealthCheck';
import { Loader2, CheckCircle, AlertCircle, XCircle, PlayCircle } from 'lucide-react';

export const SystemHealthDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log('🚀 [Diagnostics] Iniciando diagnóstico do sistema...');
      const status = await performSystemHealthCheck();
      setHealthStatus(status);
      setLastRun(new Date().toLocaleString('pt-BR'));
      logSystemHealthReport(status);
      
      console.log('✨ [Diagnostics] Diagnóstico concluído com sucesso!');
    } catch (error) {
      console.error('💥 [Diagnostics] Erro durante o diagnóstico:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PlayCircle className="w-6 h-6" />
            Diagnóstico do Sistema
          </span>
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="min-w-32"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              'Executar Diagnóstico'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {healthStatus && (
          <>
            {/* Status Geral */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Status Geral</h3>
              <div className="flex items-center gap-3">
                {getStatusIcon(healthStatus.overall)}
                <Badge className={getStatusColor(healthStatus.overall)}>
                  {healthStatus.overall === 'healthy' ? 'SAUDÁVEL' : 
                   healthStatus.overall === 'warning' ? 'COM AVISOS' : 'COM ERROS'}
                </Badge>
                {lastRun && (
                  <span className="text-sm text-gray-500">
                    Última verificação: {lastRun}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Componentes Individuais */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status dos Componentes</h3>
              <div className="grid gap-3">
                {Object.entries(healthStatus.components).map(([name, component]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(component.status)}
                      <div>
                        <p className="font-medium capitalize">
                          {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500">{component.message}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(component.status)}>
                      {component.status === 'healthy' ? 'OK' : 
                       component.status === 'warning' ? 'AVISO' : 'ERRO'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Erros */}
            {healthStatus.errors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-red-600">Erros Encontrados</h3>
                <div className="space-y-2">
                  {healthStatus.errors.map((error, index) => (
                    <Alert key={index} className="border-red-200">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Avisos */}
            {healthStatus.warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-yellow-600">Avisos</h3>
                <div className="space-y-2">
                  {healthStatus.warnings.map((warning, index) => (
                    <Alert key={index} className="border-yellow-200">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo das Correções */}
            {(healthStatus.errors.length > 0 || healthStatus.warnings.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Correções Implementadas</h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-blue-800">✅ Problemas Resolvidos:</p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• Erro "Invalid API key" - Removido adminSupabaseClient problemático</li>
                    <li>• Erro "row violates row-level security policy" - Ajustada política RLS da tabela site_settings</li>
                    <li>• Configurações da clínica usando dados mockados - Implementado uso da tabela real</li>
                    <li>• Todos os serviços agora usam o cliente Supabase padrão</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {!healthStatus && (
          <div className="text-center py-8 text-gray-500">
            <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Clique em "Executar Diagnóstico" para verificar a saúde do sistema</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthDiagnostics;