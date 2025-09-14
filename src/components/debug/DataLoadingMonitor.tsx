import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDiagnostics } from '@/hooks/useEnhancedQuery';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const DataLoadingMonitor: React.FC = () => {
  const { user, isLoading: authLoading } = useSimpleAuth();
  const { data: diagnostics, isLoading: diagLoading, error } = useDiagnostics();

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  if (authLoading || diagLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Clock className="w-4 h-4 mr-2" />
          Verificando status do sistema...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Monitor de Carregamento de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Autenticação */}
        <div>
          <h4 className="font-medium mb-2">Autenticação</h4>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(!!user, 'Usuário Logado')}
            {user && (
              <Badge variant="outline">
                {user.username} ({user.isAdmin ? 'admin' : 'user'})
              </Badge>
            )}
          </div>
        </div>

        {/* Status das Tabelas */}
        <div>
          <h4 className="font-medium mb-2">Acesso aos Dados</h4>
          <div className="flex flex-wrap gap-2">
            {diagnostics && (
              <>
                {getStatusBadge(diagnostics.patients, 'Pacientes')}
                {getStatusBadge(diagnostics.prescriptions, 'Prescrições')}
                {getStatusBadge(diagnostics.exams, 'Exames')}
                {getStatusBadge(diagnostics.professionals, 'Profissionais')}
              </>
            )}
          </div>
        </div>

        {/* Status Geral */}
        <div>
          <h4 className="font-medium mb-2">Status Geral</h4>
          <div className="flex flex-wrap gap-2">
            {diagnostics && (
              <>
                {getStatusBadge(
                  Object.values(diagnostics).every(Boolean),
                  'Todos os Dados Acessíveis'
                )}
                {getStatusBadge(
                  !error,
                  'Sem Erros de Conectividade'
                )}
              </>
            )}
          </div>
        </div>

        {/* Informações de Debug */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-600">
              <strong>Erro:</strong> {error.message}
            </p>
          </div>
        )}

        {diagnostics && !Object.values(diagnostics).every(Boolean) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700">
              <strong>Aviso:</strong> Algumas tabelas não estão acessíveis. 
              Isso pode indicar problemas com RLS ou autenticação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};