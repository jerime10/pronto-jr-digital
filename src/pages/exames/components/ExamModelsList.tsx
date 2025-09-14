
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { ExamModelItem } from './ExamModelItem';
import { ExamModel } from '@/types/database';

interface ExamModelsListProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
  filteredExams: ExamModel[];
  onEdit: (exam: ExamModel) => void;
  onDelete: (id: string) => void;
}

export const ExamModelsList: React.FC<ExamModelsListProps> = ({
  searchQuery,
  onSearchChange,
  onAddNew,
  filteredExams,
  onEdit,
  onDelete
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          <Input
            placeholder="Buscar exames..."
            className="pl-10"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
        
        <Button onClick={onAddNew} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          Novo Exame
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Instruções</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.length > 0 ? (
              filteredExams.map((exam) => (
                <ExamModelItem
                  key={exam.id}
                  exam={exam}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhum exame encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
