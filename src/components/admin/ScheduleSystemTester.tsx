import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  testScheduleSystem, 
  quickAvailabilityTest, 
  performanceTest 
} from '@/utils/scheduleSystemTest';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  message: string;
  results?: any;
  stats?: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
  error?: any;
}

interface QuickTestParams {
  attendantId: string;
  date: string;
  serviceId: string;
}

const ScheduleSystemTester: React.FC = () => {
  const [isRunningFullTest, setIsRunningFullTest] = useState(false);
  const [isRunningQuickTest, setIsRunningQuickTest] = useState(false);
  const [isRunningPerformanceTest, setIsRunningPerformanceTest] = useState(false);
  
  const [fullTestResult, setFullTestResult] = useState<TestResult | null>(null);
  const [quickTestResult, setQuickTestResult] = useState<any>(null);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  
  const [quickTestParams, setQuickTestParams] = useState<QuickTestParams>({
    attendantId: 'test-attendant-id',
    date: new Date().toISOString().split('T')[0],
    serviceId: 'test-service-id'
  });

  // ============================================
  // TESTE COMPLETO DO SISTEMA
  // ============================================
  
  const runFullTest = async () => {
    setIsRunningFullTest(true);
    setFullTestResult(null);
    
    try {
      toast.info('Iniciando teste completo do sistema de horários...');
      const result = await testScheduleSystem();
      setFullTestResult(result);
      
      if (result.success) {
        toast.success('Teste completo concluído com sucesso!');
      } else {
        toast.warning('Teste completo concluído com algumas falhas');
      }
    } catch (error: any) {
      const errorResult: TestResult = {
        success: false,
        message: error.message || 'Erro durante execução do teste',
        error
      };
      setFullTestResult(errorResult);
      toast.error('Erro durante teste completo');
    } finally {
      setIsRunningFullTest(false);
    }
  };

  // ============================================
  // TESTE RÁPIDO DE DISPONIBILIDADE
  // ============================================
  
  const runQuickTest = async () => {
    if (!quickTestParams.attendantId || !quickTestParams.date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    setIsRunningQuickTest(true);
    setQuickTestResult(null);
    
    try {
      toast.info('Executando teste rápido de disponibilidade...');
      const result = await quickAvailabilityTest(
        quickTestParams.attendantId,
        quickTestParams.date,
        quickTestParams.serviceId || undefined
      );
      setQuickTestResult(result);
      
      if (result.success) {
        toast.success('Teste rápido concluído com sucesso!');
      } else {
        toast.warning('Teste rápido retornou resultado negativo');
      }
    } catch (error: any) {
      setQuickTestResult({
        success: false,
        error: error.message || 'Erro durante teste rápido'
      });
      toast.error('Erro durante teste rápido');
    } finally {
      setIsRunningQuickTest(false);
    }
  };

  // ============================================
  // TESTE DE PERFORMANCE
  // ============================================
  
  const runPerformanceTest = async () => {
    setIsRunningPerformanceTest(true);
    setPerformanceResult(null);
    
    try {
      toast.info('Iniciando teste de performance...');
      const result = await performanceTest();
      setPerformanceResult(result);
      
      if (result.successRate >= 90) {
        toast.success('Teste de performance concluído - Excelente!');
      } else if (result.successRate >= 70) {
        toast.warning('Teste de performance concluído - Bom');
      } else {
        toast.error('Teste de performance concluído - Necessita atenção');
      }
    } catch (error: any) {
      setPerformanceResult({
        error: error.message || 'Erro durante teste de performance'
      });
      toast.error('Erro durante teste de performance');
    } finally {
      setIsRunningPerformanceTest(false);
    }
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  
  const renderFullTestResults = () => {
    if (!fullTestResult) return null;
    
    return (
      <div className="space-y-4">
        <Alert variant={fullTestResult.success ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {fullTestResult.message}
          </AlertDescription>
        </Alert>
        
        {fullTestResult.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{fullTestResult.stats.total}</div>
              <div className="text-sm text-blue-500">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{fullTestResult.stats.passed}</div>
              <div className="text-sm text-green-500">Aprovados</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{fullTestResult.stats.failed}</div>
              <div className="text-sm text-red-500">Falharam</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{fullTestResult.stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-purple-500">Taxa de Sucesso</div>
            </div>
          </div>
        )}
        
        {fullTestResult.results && (
          <div className="space-y-2">
            <h4 className="font-semibold">Detalhamento por Categoria:</h4>
            {Object.entries(fullTestResult.results).map(([category, tests]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{category}</span>
                <div className="flex gap-1">
                  {Object.entries(tests).map(([test, passed]: [string, any]) => (
                    <Badge 
                      key={test} 
                      variant={passed ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {test}: {passed ? '✓' : '✗'}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderQuickTestResults = () => {
    if (!quickTestResult) return null;
    
    return (
      <div className="space-y-4">
        <Alert variant={quickTestResult.success ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {quickTestResult.success ? 'Disponibilidade verificada com sucesso' : 'Falha na verificação de disponibilidade'}
          </AlertDescription>
        </Alert>
        
        {quickTestResult.success && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{quickTestResult.available_slots?.length || 0}</div>
              <div className="text-sm text-blue-500">Slots Disponíveis</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{quickTestResult.date}</div>
              <div className="text-sm text-green-500">Data Consultada</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{quickTestResult.day_of_week}</div>
              <div className="text-sm text-purple-500">Dia da Semana</div>
            </div>
          </div>
        )}
        
        {quickTestResult.available_slots && quickTestResult.available_slots.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Horários Disponíveis:</h4>
            <div className="flex flex-wrap gap-2">
              {quickTestResult.available_slots.map((slot: any, index: number) => (
                <Badge key={index} variant="outline">
                  {slot.start_time} - {slot.end_time}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderPerformanceResults = () => {
    if (!performanceResult) return null;
    
    return (
      <div className="space-y-4">
        {performanceResult.error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {performanceResult.error}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{performanceResult.totalTime}ms</div>
                <div className="text-sm text-blue-500">Tempo Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{performanceResult.averageTime?.toFixed(2)}ms</div>
                <div className="text-sm text-green-500">Tempo Médio</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{performanceResult.successfulQueries}/{performanceResult.totalQueries}</div>
                <div className="text-sm text-purple-500">Sucessos</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{performanceResult.successRate?.toFixed(1)}%</div>
                <div className="text-sm text-orange-500">Taxa de Sucesso</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Tempos por Iteração:</h4>
              <div className="flex flex-wrap gap-1">
                {performanceResult.results?.map((time: number, index: number) => (
                  <Badge 
                    key={index} 
                    variant={time > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {time > 0 ? `${time}ms` : 'Erro'}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Testador do Sistema de Horários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="full">Teste Completo</TabsTrigger>
            <TabsTrigger value="quick">Teste Rápido</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          {/* ============================================ */}
          {/* TESTE COMPLETO */}
          {/* ============================================ */}
          <TabsContent value="full" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Teste Completo do Sistema</h3>
                <p className="text-sm text-gray-500">
                  Executa todos os testes de CRUD para horários, atribuições, agendamentos e disponibilidade.
                </p>
              </div>
              <Button 
                onClick={runFullTest} 
                disabled={isRunningFullTest}
                className="flex items-center gap-2"
              >
                {isRunningFullTest ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunningFullTest ? 'Executando...' : 'Executar Teste'}
              </Button>
            </div>
            
            {renderFullTestResults()}
          </TabsContent>
          
          {/* ============================================ */}
          {/* TESTE RÁPIDO */}
          {/* ============================================ */}
          <TabsContent value="quick" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Teste Rápido de Disponibilidade</h3>
              <p className="text-sm text-gray-500">
                Verifica rapidamente a disponibilidade de um atendente em uma data específica.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="attendantId">ID do Atendente</Label>
                <Input
                  id="attendantId"
                  value={quickTestParams.attendantId}
                  onChange={(e) => setQuickTestParams(prev => ({ ...prev, attendantId: e.target.value }))}
                  placeholder="test-attendant-id"
                />
              </div>
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={quickTestParams.date}
                  onChange={(e) => setQuickTestParams(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="serviceId">ID do Serviço (Opcional)</Label>
                <Input
                  id="serviceId"
                  value={quickTestParams.serviceId}
                  onChange={(e) => setQuickTestParams(prev => ({ ...prev, serviceId: e.target.value }))}
                  placeholder="test-service-id"
                />
              </div>
            </div>
            
            <Button 
              onClick={runQuickTest} 
              disabled={isRunningQuickTest}
              className="flex items-center gap-2"
            >
              {isRunningQuickTest ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isRunningQuickTest ? 'Testando...' : 'Executar Teste Rápido'}
            </Button>
            
            {renderQuickTestResults()}
          </TabsContent>
          
          {/* ============================================ */}
          {/* TESTE DE PERFORMANCE */}
          {/* ============================================ */}
          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Teste de Performance</h3>
                <p className="text-sm text-gray-500">
                  Executa 10 consultas de disponibilidade consecutivas para medir performance.
                </p>
              </div>
              <Button 
                onClick={runPerformanceTest} 
                disabled={isRunningPerformanceTest}
                className="flex items-center gap-2"
              >
                {isRunningPerformanceTest ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {isRunningPerformanceTest ? 'Testando...' : 'Executar Teste de Performance'}
              </Button>
            </div>
            
            {renderPerformanceResults()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScheduleSystemTester;