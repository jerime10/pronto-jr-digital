
import React from 'react';
import { HistoricoDocumentsList } from './components/HistoricoDocumentsList';

const HistoricoAtendimentos = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0 w-full overflow-hidden">
      <div className="flex flex-col space-y-2 sm:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Histórico de Atendimentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Visualize documentos com informações completas dos pacientes e atendimentos</p>
        </div>
      </div>

      {/* Nova listagem com dados combinados */}
      <HistoricoDocumentsList />
    </div>
  );
};

export default HistoricoAtendimentos;
