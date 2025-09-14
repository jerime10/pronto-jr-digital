
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useClinicSettings, ClinicInfo } from '@/hooks/useClinicSettings';

const ClinicInfoSettings: React.FC = () => {
  const { getClinicInfo, saveClinicInfo, settings, isLoading } = useClinicSettings();
  const [formData, setFormData] = useState<ClinicInfo>({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
  });

  // Load clinic information
  useEffect(() => {
    if (!isLoading && settings) {
      setFormData({
        clinicName: settings.clinicName || '',
        clinicAddress: settings.clinicAddress || '',
        clinicPhone: settings.clinicPhone || '',
      });
    }
  }, [isLoading, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveClinicInfo.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Nome do consultorio</Label>
            <Input 
              id="clinicName" 
              name="clinicName" 
              value={formData.clinicName} 
              onChange={handleChange}
              placeholder="Nome da Clínica ou Consultório"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Endereço</Label>
            <Textarea 
              id="clinicAddress" 
              name="clinicAddress" 
              value={formData.clinicAddress} 
              onChange={handleChange}
              placeholder="Endereço completo"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clinicPhone">Telefone</Label>
            <Input 
              id="clinicPhone" 
              name="clinicPhone" 
              value={formData.clinicPhone} 
              onChange={handleChange}
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full sm:w-auto" 
            disabled={saveClinicInfo.isPending}
          >
            {saveClinicInfo.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Informações'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClinicInfoSettings;
