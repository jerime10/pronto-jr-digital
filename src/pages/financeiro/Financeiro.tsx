import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Plus,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppointments } from '@/hooks/useAppointments';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  date: string;
  type: 'Receita';
  description: string;
  client: string;
  category: string;
  value: number;
  status: 'Pago';
  source: 'Agendamento';
}

const Financeiro: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState<'Mensal' | 'Anual'>('Mensal');
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    netProfit: 0,
    pendingPayments: 0,
    growthRate: 100
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Hook para buscar agendamentos
  const { appointments = [] } = useAppointments({
    startDate: format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'),
    endDate: format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd')
  });

  // Calcular métricas financeiras baseadas nos agendamentos
  useEffect(() => {
    if (appointments.length > 0) {
      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.service_price || 0), 0);
      
      // Simular despesas como 25% da receita
      const totalExpenses = totalRevenue * 0.25;
      const netProfit = totalRevenue - totalExpenses;
      
      setMetrics({
        totalRevenue,
        netProfit,
        pendingPayments: 0, // Não há pagamentos pendentes no modelo atual
        growthRate: 100 // Taxa fixa para demonstração
      });

      // Gerar dados do gráfico
      const monthlyData: ChartData[] = [];
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      months.forEach((month, index) => {
        const monthAppointments = completedAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate.getMonth() === index && aptDate.getFullYear() === selectedYear;
        });
        
        const monthRevenue = monthAppointments.reduce((sum, apt) => sum + (apt.service_price || 0), 0);
        const monthExpenses = monthRevenue * 0.25;

        monthlyData.push({
          month,
          receitas: monthRevenue,
          despesas: monthExpenses
        });
      });

      setChartData(monthlyData);

      // Gerar transações baseadas nos agendamentos completados
      const transactionList: Transaction[] = completedAppointments.map(apt => ({
        id: apt.id,
        date: format(new Date(apt.appointment_date), 'dd/MM/yyyy'),
        type: 'Receita',
        description: `Pagamento do serviço: ${apt.service_name || 'Consulta'}`,
        client: apt.patient_name || 'Cliente não informado',
        category: 'Agendamento',
        value: apt.service_price || 0,
        status: 'Pago',
        source: 'Agendamento'
      }));

      setTransactions(transactionList);
    }
  }, [appointments, selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie suas receitas, despesas e transferências</p>
        </div>
        <Button className="bg-gray-900 hover:bg-gray-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar dados
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <span>Pagamentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Lucro Líquido
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(metrics.netProfit)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Pagamentos Pendentes
                </CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrency(metrics.pendingPayments)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Taxa de Crescimento
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">
                  {formatPercentage(metrics.growthRate)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visualize o fluxo de caixa mensal e anual
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={viewType} onValueChange={(value: 'Mensal' | 'Anual') => setViewType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
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
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Despesas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transações Financeiras</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie suas receitas, despesas e transferências
              </p>
            </div>
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Nova transação
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-600">Data</th>
                      <th className="text-left p-4 font-medium text-gray-600">Tipo</th>
                      <th className="text-left p-4 font-medium text-gray-600">Descrição</th>
                      <th className="text-left p-4 font-medium text-gray-600">Categoria</th>
                      <th className="text-left p-4 font-medium text-gray-600">Valor</th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="text-left p-4 font-medium text-gray-600">Origem</th>
                      <th className="text-left p-4 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{transaction.date}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-sm">{transaction.description}</div>
                            <div className="text-xs text-gray-500">Cliente: {transaction.client}</div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{transaction.category}</td>
                        <td className="p-4">
                          <span className="font-medium text-green-600">
                            {formatCurrency(transaction.value)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {transaction.source}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs */}
        <TabsContent value="categories">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Seção de Categorias em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Seção de Pagamentos em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;