import React, { useState } from 'react';
import { DataLoadingMonitor } from '@/components/debug/DataLoadingMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { testSimpleAuth, demoLogin } from '@/utils/simpleAuthTest';
import { toast } from 'sonner';

const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isDemoLogin, setIsDemoLogin] = useState(false);

  const handleTestAuth = async () => {
    setIsTestingAuth(true);
    try {
      const result = await testSimpleAuth();
      if (result.success) {
        toast.success('✅ Sistema de autenticação funcionando perfeitamente!');
      } else {
        toast.error('❌ Sistema com problemas. Verifique o console para detalhes.');
      }
    } catch (error) {
      toast.error('Erro ao executar teste');
      console.error(error);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLogin(true);
    try {
      const result = await demoLogin();
      if (result.success) {
        toast.success('✅ Login de demonstração bem-sucedido!');
      } else {
        toast.error('❌ Falha no login de demonstração');
      }
    } catch (error) {
      toast.error('Erro na demonstração');
      console.error(error);
    } finally {
      setIsDemoLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🛠️ Sistema de Diagnóstico</span>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
              >
                Voltar ao Login
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Esta página permite diagnosticar problemas de conectividade e autenticação no sistema.
              Execute os testes abaixo para identificar possíveis problemas.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sistema de Autenticação Ultra-Simples:</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li><strong>Tabela 'usuarios':</strong> Sistema independente do auth nativo do Supabase</li>
                <li><strong>Login direto:</strong> Validação direta no banco de dados</li>
                <li><strong>RLS simplificado:</strong> Políticas ultra-simples para todas as tabelas</li>
                <li><strong>Token local:</strong> Armazenamento simples em localStorage</li>
              </ul>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="default" 
                  onClick={handleTestAuth}
                  disabled={isTestingAuth}
                >
                  {isTestingAuth ? 'Testando...' : '🧪 Testar Sistema Auth'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDemoLogin}
                  disabled={isDemoLogin}
                >
                  {isDemoLogin ? 'Executando...' : '🚀 Demo Login admin/admin'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataLoadingMonitor />
        
        <Card>
          <CardHeader>
            <CardTitle>📋 Nova Arquitetura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Tabela Principal:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>usuarios (username: admin, password: admin)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Função do Banco:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>validate_simple_user()</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagnosticPage;