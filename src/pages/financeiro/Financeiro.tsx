import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  RefreshCw,
  Plus,
  MoreHorizontal,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppointments } from '@/hooks/useAppointments';
import { useTransactions } from '@/hooks/useTransactions';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';

interface FinancialMetrics {
  totalRevenue: number;
  netProfit: number;
  pendingPayments: number;
  growthRate: number;
}

interface ChartData {
  month: string;
  receitas: number;
  despesas: number;
}

interface Transaction {
  id: string;
  appointment_id: string | null;
  transaction_date: string;
  type: 'Entrada' | 'Saída';
  description: string;
  value: number;
  status: 'Pendente' | 'Pago';
  origin: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  date: string;
  type: string;
  description: string;
  value: number;
  status: 'pendente' | 'pago';
  origin: string;
}

const Financeiro: React.FC = () => {
  const { permissions, checkPermission } = usePermissions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState<'Mensal' | 'Anual'>('Mensal');
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    netProfit: 0,
    pendingPayments: 0,
    growthRate: 100
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('todos_tipos');
  const [statusFilter, setStatusFilter] = useState<string>('todos_status');
  const [originFilter, setOriginFilter] = useState<string>('todas_origens');
  const [descriptionFilter, setDescriptionFilter] = useState<string>('todas_descricoes');

  // Hook para buscar agendamentos
  const { data: appointments = [] } = useAppointments({
    startDate: format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'),
    endDate: format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd')
  });

  // Hook para buscar transações
  const { 
    transactions, 
    isLoading: isLoadingTransactions, 
    syncTransactions, 
    isSyncing,
    updateStatus,
    deleteTransaction,
    isUpdatingStatus,
    isDeleting
  } = useTransactions();

  // Função para filtrar transações
  const getFilteredTransactions = () => {
    if (!transactions.length) return [];

    return transactions.filter(transaction => {
      // Filtro de data - incluindo as datas dos limites
      // Usar formato ISO (YYYY-MM-DD) para comparação correta de datas
      const transactionDate = new Date(transaction.transaction_date).toISOString().split('T')[0];
      
      if (dateFrom) {
        if (transactionDate < dateFrom) {
          return false;
        }
      }
      
      if (dateTo) {
        if (transactionDate > dateTo) {
          return false;
        }
      }

      // Filtro de tipo
      if (typeFilter && typeFilter !== 'todos_tipos' && transaction.type !== typeFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter && statusFilter !== 'todos_status' && transaction.status !== statusFilter) {
        return false;
      }

      // Filtro de origem
      if (originFilter && originFilter !== 'todas_origens' && transaction.origin !== originFilter) {
        return false;
      }

      // Filtro de descrição
      if (descriptionFilter && descriptionFilter !== 'todas_descricoes' && transaction.description !== descriptionFilter) {
        return false;
      }

      return true;
    });
  };

  // Função para obter origens únicas
  const getUniqueOrigins = () => {
    if (!transactions.length) return [];
    const origins = [...new Set(transactions.map(t => t.origin))];
    return origins.filter(origin => origin && origin.trim() !== '').sort();
  };

  // Função para obter descrições únicas
  const getUniqueDescriptions = () => {
    if (!transactions.length) return [];
    const descriptions = [...new Set(transactions.map(t => t.description))];
    return descriptions.filter(desc => desc && desc.trim() !== '').sort();
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('todos_tipos');
    setStatusFilter('todos_status');
    setOriginFilter('todas_origens');
    setDescriptionFilter('todas_descricoes');
  };

  // Função para calcular valores dinâmicos baseados nos filtros
  const getFilteredFinancialSummary = () => {
    const filteredTransactions = getFilteredTransactions();
    
    const totalEntradas = filteredTransactions
      .filter(t => t.type === 'Entrada')
      .reduce((sum, t) => sum + t.value, 0);
    
    const totalSaidas = filteredTransactions
      .filter(t => t.type === 'Saída')
      .reduce((sum, t) => sum + t.value, 0);
    
    const saldoLiquido = totalEntradas - totalSaidas;
    
    const entradasPendentes = filteredTransactions
      .filter(t => t.type === 'Entrada' && t.status === 'Pendente')
      .reduce((sum, t) => sum + t.value, 0);
    
    const saidasPendentes = filteredTransactions
      .filter(t => t.type === 'Saída' && t.status === 'Pendente')
      .reduce((sum, t) => sum + t.value, 0);

    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido,
      entradasPendentes,
      saidasPendentes,
      totalTransacoes: filteredTransactions.length
    };
  };

  // Calcular métricas financeiras baseadas nas transações
  useEffect(() => {
    // Obter transações filtradas
    const filteredTransactions = getFilteredTransactions();
    
    if (!filteredTransactions.length) {
      setMetrics({
        totalRevenue: 0,
        netProfit: 0,
        pendingPayments: 0,
        growthRate: 100
      });
      setChartData([]);
      setPayments([]);
      return;
    }

    // Filtrar transações do ano selecionado (se não houver filtro de data específico)
    const yearTransactions = filteredTransactions.filter(transaction => {
      // Se há filtro de data, não aplicar filtro de ano
      if (dateFrom || dateTo) return true;
      
      const transactionYear = new Date(transaction.transaction_date).getFullYear();
      return transactionYear === selectedYear;
    });

    // Calcular receita total (entradas)
    const totalRevenue = yearTransactions
      .filter(t => t.type === 'Entrada')
      .reduce((sum, t) => sum + t.value, 0);

    // Calcular despesas totais (saídas)
    const totalExpenses = yearTransactions
      .filter(t => t.type === 'Saída')
      .reduce((sum, t) => sum + t.value, 0);

    const netProfit = totalRevenue - totalExpenses;

    // Calcular pagamentos pendentes
    const pendingPayments = yearTransactions
      .filter(t => t.status === 'Pendente')
      .reduce((sum, t) => sum + t.value, 0);

    setMetrics({
      totalRevenue,
      netProfit,
      pendingPayments,
      growthRate: 100 // Placeholder para taxa de crescimento
    });

    // Gerar dados para o gráfico
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
    
    yearTransactions.forEach(transaction => {
      const month = format(new Date(transaction.transaction_date), 'MMM', { locale: ptBR });
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      
      if (transaction.type === 'Entrada') {
        monthlyData[month].revenue += transaction.value;
      } else {
        monthlyData[month].expenses += transaction.value;
      }
    });

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      receitas: data.revenue,
      despesas: data.expenses
    }));

    setChartData(chartData);

    // Gerar pagamentos baseados em transações pendentes
     const mockPayments: Payment[] = yearTransactions
       .filter(t => t.status === 'Pendente' && t.type === 'Entrada')
       .map(transaction => ({
         id: `pay-${transaction.id}`,
         date: transaction.transaction_date,
         type: transaction.type,
         description: transaction.description,
         value: transaction.value,
         status: 'pendente',
         origin: transaction.origin
       }));

    setPayments(mockPayments);
  }, [transactions, selectedYear, dateFrom, dateTo, typeFilter, statusFilter, originFilter, descriptionFilter]);

  const formatCurrency = (value: number | null | undefined) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie suas receitas, despesas e transferências</p>
        </div>
        <ActionButtonGuard 
          requiredPermission="financial_management"
          fallback={null}
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncTransactions()}
            disabled={isSyncing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Atualizar dados'}</span>
            <span className="sm:hidden">{isSyncing ? 'Sync...' : 'Atualizar'}</span>
          </Button>
        </ActionButtonGuard>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="dashboard" className="flex items-center justify-center space-x-1 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center justify-center space-x-1 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center justify-center space-x-1 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="hidden sm:inline">Categorias</span>
            <span className="sm:hidden">Cat.</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center justify-center space-x-1 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="hidden sm:inline">Pagamentos</span>
            <span className="sm:hidden">Pag.</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
                  Lucro Líquido
                </CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-green-800">
                  {formatCurrency(metrics.netProfit)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">
                  Pagamentos Pendentes
                </CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-orange-800">
                  {formatCurrency(metrics.pendingPayments)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
                  Taxa de Crescimento
                </CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-blue-800">
                  {formatPercentage(metrics.growthRate)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Fluxo de Caixa</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Visualize o fluxo de caixa mensal e anual
                  </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Select value={viewType} onValueChange={(value: 'Mensal' | 'Anual') => setViewType(value)}>
                    <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        // Formato mais compacto para mobile
                        if (value >= 1000) {
                          return `R$ ${(value / 1000).toFixed(0)}k`;
                        }
                        return `R$ ${value}`;
                      }}
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Receitas"
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Despesas"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transações Financeiras</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie suas receitas, despesas e transferências
              </p>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros de Data - sempre em linha no mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom" className="text-sm font-medium">Data Inicial</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateTo" className="text-sm font-medium">Data Final</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Filtros de Seleção - grid responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Filtro de Tipo */}
                  <div className="space-y-2">
                    <Label htmlFor="typeFilter" className="text-sm font-medium">Tipo</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos_tipos">Todos os tipos</SelectItem>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Status */}
                  <div className="space-y-2">
                    <Label htmlFor="statusFilter" className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos_status">Todos os status</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Origem */}
                  <div className="space-y-2">
                    <Label htmlFor="originFilter" className="text-sm font-medium">Origem</Label>
                    <Select value={originFilter} onValueChange={setOriginFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todas as origens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas_origens">Todas as origens</SelectItem>
                        {getUniqueOrigins().map((origin) => (
                          <SelectItem key={origin} value={origin}>
                            {origin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descriptionFilter" className="text-sm font-medium">Descrição</Label>
                    <Select value={descriptionFilter} onValueChange={setDescriptionFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todas as descrições" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas_descricoes">Todas as descrições</SelectItem>
                        {getUniqueDescriptions().map((description) => (
                          <SelectItem key={description} value={description}>
                            {description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botão para limpar filtros */}
                <div className="flex justify-center sm:justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    disabled={!dateFrom && !dateTo && typeFilter === 'todos_tipos' && statusFilter === 'todos_status' && originFilter === 'todas_origens' && descriptionFilter === 'todas_descricoes'}
                    className="w-full sm:w-auto"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Financeiro Dinâmico */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                {(() => {
                  const summary = getFilteredFinancialSummary();
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Total de Entradas */}
                      <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">Total Entradas</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(summary.totalEntradas)}
                            </p>
                            {summary.entradasPendentes > 0 && (
                              <p className="text-xs text-green-500 mt-1">
                                Pendente: {formatCurrency(summary.entradasPendentes)}
                              </p>
                            )}
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </div>

                      {/* Total de Saídas */}
                      <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-700">Total Saídas</p>
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(summary.totalSaidas)}
                            </p>
                            {summary.saidasPendentes > 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                Pendente: {formatCurrency(summary.saidasPendentes)}
                              </p>
                            )}
                          </div>
                          <TrendingDown className="h-8 w-8 text-red-500" />
                        </div>
                      </div>

                      {/* Saldo Líquido */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Saldo Líquido</p>
                            <p className={`text-2xl font-bold ${summary.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(summary.saldoLiquido)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {summary.totalTransacoes} transação{summary.totalTransacoes !== 1 ? 'ões' : ''}
                            </p>
                          </div>
                          <DollarSign className={`h-8 w-8 ${summary.saldoLiquido >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Layout responsivo: Cards no mobile, tabela no desktop */}
            {isLoadingTransactions ? (
              <div className="py-8 text-center text-muted-foreground">
                Carregando transações...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <>
                {/* Layout de Cards para Mobile */}
                <div className="block lg:hidden space-y-3">
                  {getFilteredTransactions().map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="space-y-3">
                        {/* Linha 1: Data e Valor */}
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-gray-600">
                            {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className={`font-bold text-lg ${transaction.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'Entrada' ? '+' : '-'}{formatCurrency(transaction.value)}
                          </div>
                        </div>

                        {/* Linha 2: Descrição */}
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {transaction.description}
                        </div>

                        {/* Linha 3: Badges e Origem */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge 
                            variant="secondary" 
                            className={transaction.type === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {transaction.type}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={transaction.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {transaction.status}
                          </Badge>
                          <span className="text-xs text-gray-500 flex-1 text-right">
                            {transaction.origin}
                          </span>
                        </div>

                        {/* Linha 4: Ações */}
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <ActionButtonGuard permission="financeiro_editar">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu de ações</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => updateStatus({ id: transaction.id, status: 'Pago' })}
                                  disabled={isUpdatingStatus || transaction.status === 'Pago'}
                                  className={transaction.status === 'Pago' ? 'opacity-50' : ''}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Pago
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateStatus({ id: transaction.id, status: 'Pendente' })}
                                  disabled={isUpdatingStatus || transaction.status === 'Pendente'}
                                  className={transaction.status === 'Pendente' ? 'opacity-50' : ''}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Pendente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Implementar edição
                                    alert('Funcionalidade de edição será implementada em breve');
                                  }}
                                  disabled={isUpdatingStatus}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta transação?')) {
                                      deleteTransaction(transaction.id);
                                    }
                                  }}
                                  disabled={isDeleting}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ActionButtonGuard>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Layout de Tabela para Desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Origem</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTransactions().map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="secondary" 
                              className={transaction.type === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {transaction.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm max-w-xs">
                            <div className="truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${transaction.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'Entrada' ? '+' : '-'}{formatCurrency(transaction.value)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="secondary" 
                              className={transaction.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {transaction.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">{transaction.origin}</td>
                          <td className="py-3 px-4">
                            <ActionButtonGuard permission="financeiro_editar">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu de ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => updateStatus({ id: transaction.id, status: 'Pago' })}
                                    disabled={isUpdatingStatus || transaction.status === 'Pago'}
                                    className={transaction.status === 'Pago' ? 'opacity-50' : ''}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Pago
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateStatus({ id: transaction.id, status: 'Pendente' })}
                                    disabled={isUpdatingStatus || transaction.status === 'Pendente'}
                                    className={transaction.status === 'Pendente' ? 'opacity-50' : ''}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Pendente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // TODO: Implementar edição
                                      alert('Funcionalidade de edição será implementada em breve');
                                    }}
                                    disabled={isUpdatingStatus}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm('Tem certeza que deseja excluir esta transação?')) {
                                        deleteTransaction(transaction.id);
                                      }
                                    }}
                                    disabled={isDeleting}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </ActionButtonGuard>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Placeholder tabs */}
        <TabsContent value="categories">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Seção de Categorias em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pagamentos</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie os pagamentos realizados e pendentes
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Origem</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nenhum pagamento pendente encontrado
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(payment.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="secondary" 
                            className={payment.type === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {payment.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm max-w-xs">
                          <div className="truncate" title={payment.description}>
                            {payment.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${payment.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(payment.value)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="secondary" 
                            className={payment.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{payment.origin}</td>
                        <td className="py-3 px-4">
                          <ActionButtonGuard permission="financeiro_editar">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateStatus({
                                id: payment.id.replace('pay-', ''),
                                status: 'Pago'
                              })}
                              disabled={isUpdatingStatus}
                            >
                              Marcar como Pago
                            </Button>
                          </ActionButtonGuard>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;