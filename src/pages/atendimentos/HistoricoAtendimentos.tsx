
import React from 'react';
import { HistoricoDocumentsList } from './components/HistoricoDocumentsList';

const HistoricoAtendimentos = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Histórico de Atendimentos</h1>
          <p className="text-gray-500 mt-1">Visualize documentos com informações completas dos pacientes e atendimentos</p>
        </div>
      </div>

      {/* Nova listagem com dados combinados */}
      <HistoricoDocumentsList />
    </div>
  );
};

export default HistoricoAtendimentos;
