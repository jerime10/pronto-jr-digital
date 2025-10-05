
import React from 'react';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileEdit, Trash2 } from 'lucide-react';
import { MedicalRecord } from '../hooks/useMedicalRecords';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onGeneratePdf: (record: MedicalRecord) => void;
  onDelete: (recordId: string) => void;
}

export const MedicalRecordCard: React.FC<MedicalRecordCardProps> = ({ 
  record, 
  onGeneratePdf, 
  onDelete
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-muted pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{record.patient?.name || 'Paciente'}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
          </span>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          <span>SUS: {record.patient?.sus || 'N/A'}</span>
          <span className="ml-2">Dr(a). {record.professional?.name || 'Médico'}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {record.main_complaint && (
          <div className="mb-3">
            <p className="font-medium text-sm">Queixa Principal:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{record.main_complaint}</p>
          </div>
        )}
        
        {record.evolution && (
          <div className="mb-3">
            <p className="font-medium text-sm">Evolução:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{record.evolution}</p>
          </div>
        )}
        
        {record.exam_observations && (
          <div className="mb-3">
            <p className="font-medium text-sm">Observações dos Exames:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{record.exam_observations}</p>
          </div>
        )}
        
        {record.exam_results && (
          <div className="mb-3">
            <p className="font-medium text-sm">Resultados dos Exames:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{record.exam_results}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = `/atendimento/editar/${record.id}`}
        >
          <FileEdit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        
        <Button 
          size="sm" 
          onClick={() => onGeneratePdf(record)}
        >
          <Download className="h-4 w-4 mr-1" />
          Visualizar PDF
        </Button>

        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(record.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
};
