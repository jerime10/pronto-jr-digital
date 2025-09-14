
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { ExamModel } from '@/types/database';

interface ExamModelItemProps {
  exam: ExamModel;
  onEdit: (exam: ExamModel) => void;
  onDelete: (id: string) => void;
}

export const ExamModelItem: React.FC<ExamModelItemProps> = ({ exam, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{exam.name}</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="truncate max-w-[400px]">
          {exam.instructions}
        </div>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(exam)}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(exam.id)}>
          <Trash className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </TableCell>
    </TableRow>
  );
};
