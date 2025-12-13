import React from 'react';
import { useActiveAttendants } from '@/hooks/useAttendants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, User } from 'lucide-react';

interface Props {
  onSelect: (attendantId: string, attendantName: string) => void;
}

const PublicProfessionalsList: React.FC<Props> = ({ onSelect }) => {
  const { data, isLoading } = useActiveAttendants();

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-r-transparent mx-auto mb-4" />
        <p className="text-slate-300">Carregando profissionais...</p>
      </div>
    );
  }

  const attendants = data || [];

  if (attendants.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-400">Nenhum profissional disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attendants.map((attendant) => (
        <Card
          key={attendant.id}
          className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 transition-all duration-300 hover:bg-slate-600/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-blue-500/30">
                {attendant.photo_url && (
                  <AvatarImage src={attendant.photo_url} alt={attendant.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-blue-500/20 text-blue-400 font-semibold">
                  {attendant.name ? attendant.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AT'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-white font-semibold text-lg">{attendant.name}</h4>
                <p className="text-slate-300 text-sm">Profissional Especializado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-400" />
              <Button
                onClick={() => onSelect(attendant.id, attendant.name)}
                className="h-10 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold text-xs tracking-wide"
              >
                <User className="mr-2 h-4 w-4" />
                Selecionar
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PublicProfessionalsList;
