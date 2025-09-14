
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Componente com documentação completa para customização visual do sistema
const AppearanceDocumentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Guia de Personalização Visual</h2>
        <p className="text-gray-600">
          Este guia explica como personalizar cores, logos, fontes e textos editando diretamente o código do projeto.
        </p>
      </div>

      {/* SEÇÃO: CORES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 Personalização de Cores
            <Badge variant="outline">CSS/Tailwind</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Cores Principais do Sistema</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>src/index.css</code></p>
              <p className="text-sm mt-2">
                Edite as variáveis CSS no bloco <code>:root</code> para alterar as cores principais:
              </p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
{`:root {
  --primary: 142 69% 58%;     /* Cor primária (botões, links) */
  --secondary: 210 40% 95%;   /* Cor secundária (fundos) */
  --accent: 210 40% 10%;      /* Cor de destaque */
  --background: 0 0% 100%;    /* Cor de fundo principal */
  --foreground: 222.2 84% 4.9%; /* Cor do texto principal */
}`}
              </pre>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">2. Cores Específicas de Componentes</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>tailwind.config.ts</code></p>
              <p className="text-sm mt-2">
                Para adicionar cores personalizadas no Tailwind:
              </p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
{`extend: {
  colors: {
    'minha-cor': '#FF6B35',        // uso: bg-minha-cor
    'clinica-azul': '#2563EB',     // uso: text-clinica-azul
    'verde-sucesso': '#10B981',    // uso: border-verde-sucesso
  }
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: LOGO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🖼️ Personalização do Logo
            <Badge variant="outline">Componente React</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Logo Principal do Sistema</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>src/components/Logo.tsx</code></p>
              <p className="text-sm mt-2">
                Substitua a imagem do logo editando o componente:
              </p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
{`// Substitua o src pela URL da sua nova imagem
<img 
  src="/caminho/para/seu/logo.png" 
  alt="Logo da Clínica"
  className="h-8 w-auto"
/>`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Logo nos PDFs</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>src/pages/atendimentos/utils/documentActions.ts</code></p>
              <p className="text-sm mt-2">
                Para alterar o logo nos documentos PDF, substitua a string base64 na variável <code>logoBase64</code>.
                Converta sua imagem em base64 em sites como base64-image.de
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: FONTES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Personalização de Fontes
            <Badge variant="outline">CSS/Config</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Fonte Principal do Sistema</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>index.html</code></p>
              <p className="text-sm mt-2">Adicione a fonte do Google Fonts:</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
{`<link href="https://fonts.googleapis.com/css2?family=SuaFonte:wght@400;500;600;700&display=swap" rel="stylesheet">`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Configuração da Fonte</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Arquivo:</strong> <code>tailwind.config.ts</code></p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
{`fontFamily: {
  'sans': ['SuaFonte', 'ui-sans-serif', 'system-ui'],
  'titulo': ['SuaFonteTitulo', 'Georgia', 'serif'],
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: TEXTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✏️ Edição de Textos do Sistema
            <Badge variant="outline">Componentes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Textos Principais por Seção:</h4>
            
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded">
                <strong>Dashboard:</strong> <code>src/pages/Dashboard.tsx</code>
                <p className="text-sm">Títulos, estatísticas, mensagens de boas-vindas</p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <strong>Formulários:</strong> <code>src/pages/*/components/*Form*.tsx</code>
                <p className="text-sm">Labels, placeholders, mensagens de validação</p>
              </div>

              <div className="bg-purple-50 p-3 rounded">
                <strong>Navegação:</strong> <code>src/components/layout/MainLayout.tsx</code>
                <p className="text-sm">Menus, links, navegação principal</p>
              </div>

              <div className="bg-orange-50 p-3 rounded">
                <strong>Mensagens/Toasts:</strong> Busque por <code>toast.success</code> e <code>toast.error</code>
                <p className="text-sm">Mensagens de sucesso, erro e informação</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: LAYOUT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📐 Personalização de Layout
            <Badge variant="outline">CSS/Tailwind</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Principais Arquivos de Layout:</h4>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Layout Principal:</strong> <code>src/components/layout/MainLayout.tsx</code>
                <p className="text-sm">Estrutura geral, sidebar, header</p>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <strong>Estilos Globais:</strong> <code>src/index.css</code>
                <p className="text-sm">Reset CSS, variáveis globais, estilos base</p>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <strong>Configuração Tailwind:</strong> <code>tailwind.config.ts</code>
                <p className="text-sm">Cores, fontes, espaçamentos, breakpoints</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: DICAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Dicas Importantes
            <Badge variant="outline">Boas Práticas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
              <p className="font-semibold">🔄 Reinicie o servidor</p>
              <p className="text-sm">Após alterar <code>tailwind.config.ts</code> ou <code>index.html</code>, reinicie o servidor de desenvolvimento</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
              <p className="font-semibold">🎨 Use variáveis CSS</p>
              <p className="text-sm">Prefira variáveis CSS a valores fixos para facilitar futuras alterações</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-3">
              <p className="font-semibold">📱 Teste responsividade</p>
              <p className="text-sm">Sempre teste suas alterações em dispositivos móveis e desktop</p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-3">
              <p className="font-semibold">💾 Faça backup</p>
              <p className="text-sm">Faça backup dos arquivos antes de fazer alterações significativas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceDocumentation;
