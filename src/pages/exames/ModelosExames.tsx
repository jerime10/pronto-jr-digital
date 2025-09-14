
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamModelsList } from './components/ExamModelsList';
import { ResultsList } from './components/ResultsList';
import { ExamModelForm } from './components/ExamModelForm';
import { ResultForm } from './components/ResultForm';
import { useExamModels } from './hooks/useExamModels';
import { useCompletedExams } from './hooks/useCompletedExams';

const ModelosExames = () => {
  const [activeTab, setActiveTab] = useState('exams');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the hooks
  const examModels = useExamModels();
  const completedExams = useCompletedExams();
  
  // Set the shared search query
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    examModels.setSearchQuery(value);
    completedExams.setSearchQuery(value);
  };
  
  const isLoaded = !examModels.isLoadingExams && !completedExams.isLoadingResults;
  const hasError = examModels.examError || completedExams.resultError;
  
  if (!isLoaded) {
    return <div className="flex justify-center p-10">Carregando modelos de exames...</div>;
  }
  
  if (hasError) {
    return <div className="text-red-500 p-10">Erro ao carregar dados: {((examModels.examError || completedExams.resultError) as Error).message}</div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exames</h1>
          <p className="text-gray-500 mt-1">Gerencie tipos de exames e modelos de resultados</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams">Solicitação de Exames</TabsTrigger>
          <TabsTrigger value="results">Modelos de Laudo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exams" className="space-y-4">
          <ExamModelsList 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddNew={examModels.handleOpenNewExam}
            filteredExams={examModels.filteredExams}
            onEdit={examModels.handleOpenEditExam}
            onDelete={examModels.handleDeleteExam}
          />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <ResultsList 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddNew={completedExams.handleOpenNewResult}
            filteredResults={completedExams.filteredResults as any}
            onEdit={completedExams.handleOpenEditResult}
            onDelete={completedExams.handleDeleteResult}
          />
        </TabsContent>
      </Tabs>
      
      {/* Dialog for exam models */}
      <Dialog open={examModels.isExamDialogOpen} onOpenChange={examModels.setIsExamDialogOpen}>
        <ExamModelForm
          currentExam={examModels.currentExam}
          isEditing={examModels.isEditing}
          isLoading={examModels.isLoading}
          onCancel={() => examModels.setIsExamDialogOpen(false)}
          onChange={examModels.handleExamChange}
          onSave={examModels.handleSaveExam}
        />
      </Dialog>
      
      {/* Dialog for completed exams */}
      <Dialog open={completedExams.isResultDialogOpen} onOpenChange={completedExams.setIsResultDialogOpen}>
        <ResultForm
          currentResult={completedExams.currentResult}
          isEditing={completedExams.isEditing}
          isLoading={completedExams.isLoading}
          onCancel={() => completedExams.setIsResultDialogOpen(false)}
          onChange={completedExams.handleResultChange}
          onSave={completedExams.handleSaveResult}
        />
      </Dialog>
    </div>
  );
};

export default ModelosExames;
