import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const ProfissionaisAdmin = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Administração de Profissionais</CardTitle>
        <CardDescription>
          Funcionalidade temporariamente desabilitada durante migração do sistema de autenticação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8 text-muted-foreground">
          Esta página será reativada após a conclusão da migração do sistema de autenticação.
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfissionaisAdmin;