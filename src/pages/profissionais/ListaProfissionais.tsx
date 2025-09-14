
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash } from 'lucide-react';

// Dummy data for demonstration
const PROFISSIONAIS = [
  { id: 1, nome: 'Dr. Ricardo Silva', especialidade: 'Clínico Geral', contato: '(11) 98765-4321', registro: 'CRM/SP 123456' },
  { id: 2, nome: 'Dra. Mariana Costa', especialidade: 'Cardiologista', contato: '(11) 97654-3210', registro: 'CRM/SP 234567' },
  { id: 3, nome: 'Dr. Paulo Oliveira', especialidade: 'Dermatologista', contato: '(11) 96543-2109', registro: 'CRM/SP 345678' },
  { id: 4, nome: 'Dra. Juliana Santos', especialidade: 'Ortopedista', contato: '(11) 95432-1098', registro: 'CRM/SP 456789' },
  { id: 5, nome: 'Dr. André Pereira', especialidade: 'Oftalmologista', contato: '(11) 94321-0987', registro: 'CRM/SP 567890' },
];

const ListaProfissionais = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [profissionais, setProfissionais] = useState(PROFISSIONAIS);
  
  const filteredProfissionais = profissionais.filter(
    profissional => 
      profissional.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profissional.especialidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profissional.registro.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Profissionais de Saúde</h1>
          <p className="text-gray-500 mt-1">Gestão de cadastros de profissionais</p>
        </div>
        
        <Button asChild>
          <Link to="/profissionais/novo" className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Link>
        </Button>
      </div>
      
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        <Input
          placeholder="Buscar por nome, especialidade ou registro..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Registro Profissional</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfissionais.length > 0 ? (
              filteredProfissionais.map((profissional) => (
                <TableRow key={profissional.id}>
                  <TableCell className="font-medium">{profissional.nome}</TableCell>
                  <TableCell>{profissional.especialidade}</TableCell>
                  <TableCell>{profissional.contato}</TableCell>
                  <TableCell>{profissional.registro}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/profissionais/${profissional.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhum profissional encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListaProfissionais;
