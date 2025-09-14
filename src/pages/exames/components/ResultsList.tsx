
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { ResultItem } from './ResultItem';
import { CompletedExam } from '@/types/database';

interface ResultsListProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
  filteredResults: CompletedExam[];
  onEdit: (result: CompletedExam) => void;
  onDelete: (id: string) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  searchQuery,
  onSearchChange,
  onAddNew,
  filteredResults,
  onEdit,
  onDelete
}) => {

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          <Input
            placeholder="Buscar modelos de laudo..."
            className="pl-10"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
        
        <Button onClick={onAddNew} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo de Laudo
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Template do Laudo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhum modelo de laudo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
