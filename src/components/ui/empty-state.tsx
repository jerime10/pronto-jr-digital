
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon 
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-10">
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        <p className="text-center text-muted-foreground mb-4">
          {title}
        </p>
        {description && (
          <p className="text-center text-sm">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
