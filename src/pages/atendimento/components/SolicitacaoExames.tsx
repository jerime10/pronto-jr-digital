
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from '@/components/ui/card';

interface SolicitacaoExamesProps {
  examRequests: string[];
  onExamRequestsChange: (exams: string[]) => void;
  availableExams: { id: string; name: string; instructions: string | null }[];
  isLoading: boolean;
}

const SolicitacaoExames: React.FC<SolicitacaoExamesProps> = ({
  examRequests,
  onExamRequestsChange,
  availableExams,
  isLoading
}) => {
  const handleRemoveExam = (examToRemove: string) => {
    onExamRequestsChange(examRequests.filter(exam => exam !== examToRemove));
  };

  const toggleExam = (examName: string) => {
    if (examRequests.includes(examName)) {
      onExamRequestsChange(examRequests.filter(e => e !== examName));
    } else {
      onExamRequestsChange([...examRequests, examName]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Exames solicitados:</h4>
        {examRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exame solicitado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {examRequests.map((exam) => (
              <Badge key={exam} variant="secondary" className="flex items-center gap-1">
                {exam}
                <button
                  onClick={() => handleRemoveExam(exam)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-3">Exames disponíveis:</h4>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando exames...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableExams.map((exam) => (
                <div key={exam.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`exam-${exam.id}`}
                    checked={examRequests.includes(exam.name)}
                    onCheckedChange={() => toggleExam(exam.name)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`exam-${exam.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {exam.name}
                    </label>
                    {exam.instructions && (
                      <p className="text-xs text-muted-foreground">
                        {exam.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SolicitacaoExames;
