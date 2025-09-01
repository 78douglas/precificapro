import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Loader2, ShoppingCart, DollarSign, FileText } from 'lucide-react';
import LoginButton from '@/react-app/components/LoginButton';

export default function Home() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PrecificaPro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sistema profissional para geração de listas de preços personalizadas
            </p>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
              Gerencie seus produtos, ajuste preços e crie listas compartilháveis 
              com facilidade e profissionalismo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <LoginButton />
              <div className="text-sm text-gray-500">
                Faça login com sua conta Google
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar e compartilhar suas listas de preços
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Gestão de Produtos
              </h3>
              <p className="text-gray-600">
                Cadastre e organize seus produtos com fotos, descrições e categorias. 
                Mantenha seu catálogo sempre atualizado.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Ajuste de Preços
              </h3>
              <p className="text-gray-600">
                Aplique descontos em porcentagem ou valor fixo. 
                Ajuste preços individualmente ou em lote para agilizar seu trabalho.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Listas Compartilháveis
              </h3>
              <p className="text-gray-600">
                Gere links únicos para suas listas de preços. 
                Visualização otimizada para impressão e geração de PDF.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">PrecificaPro</h3>
          <p className="text-gray-400 mb-6">
            Sistema profissional para geração de listas de preços
          </p>
          <p className="text-sm text-gray-500">
            © 2024 PrecificaPro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
