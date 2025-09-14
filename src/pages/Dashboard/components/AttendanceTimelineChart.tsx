
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from 'lucide-react';

interface AttendanceTimelineChartProps {
  data: Array<{ date: string; atendimentos: number }>;
}

export const AttendanceTimelineChart: React.FC<AttendanceTimelineChartProps> = ({ data }) => {
  const chartConfig = {
    atendimentos: {
      label: "Atendimentos",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Timeline de Atendimentos</CardTitle>
          <CardDescription>Evolução diária dos atendimentos</CardDescription>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Line 
                type="monotone" 
                dataKey="atendimentos" 
                stroke="var(--color-atendimentos)"
                strokeWidth={3}
                dot={{ fill: "var(--color-atendimentos)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-atendimentos)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
