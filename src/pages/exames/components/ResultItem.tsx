
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { CompletedExam } from '@/types/database';

interface ResultItemProps {
  result: CompletedExam;
  onEdit: (result: CompletedExam) => void;
  onDelete: (id: string) => void;
}

export const ResultItem: React.FC<ResultItemProps> = ({ result, onEdit, onDelete }) => {
  return (
    <TableRow key={result.id}>
      <TableCell className="font-medium">{result.name}</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="truncate max-w-[400px]">
          {result.result_template}
        </div>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(result)}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(result.id)}>
          <Trash className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </TableCell>
    </TableRow>
  );
};
