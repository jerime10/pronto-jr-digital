
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

const NotFound = () => {
  const location = useLocation();
  const { user } = useSimpleAuth();
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Determine where to redirect the user based on their authentication status
  const getHomeLink = () => {
    if (!user) {
      return '/login';
    } else if (isAdmin) {
      return '/configuracoes';
    } else {
      return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-medical-primary mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">
          Página não encontrada
        </p>
        <p className="text-gray-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild>
          <Link to={getHomeLink()}>Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
