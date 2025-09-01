import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { 
  Loader2, 
  Building2, 
  Package, 
  FileText, 
  LogOut
} from 'lucide-react';
import CompanyForm from '@/react-app/components/CompanyForm';
import ProductList from '@/react-app/components/ProductList';
import PriceListManager from '@/react-app/components/PriceListManager';
import type { Company } from '@/shared/types';

type TabType = 'company' | 'products' | 'pricelists';

export default function Dashboard() {
  const { user, isPending, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompany();
    }
  }, [user]);

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/companies/me');
      if (response.ok) {
        const companyData = await response.json();
        setCompany(companyData);
        if (companyData && activeTab === 'company') {
          setActiveTab('products');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isPending || isLoadingCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Carregando painel...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    {
      id: 'company' as TabType,
      label: 'Empresa',
      icon: Building2,
      show: true
    },
    {
      id: 'products' as TabType,
      label: 'Produtos',
      icon: Package,
      show: !!company
    },
    {
      id: 'pricelists' as TabType,
      label: 'Listas de Preços',
      icon: FileText,
      show: !!company
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PrecificaPro
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span>{user.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-8">
          <nav className="flex space-x-1">
            {tabs.filter(tab => tab.show).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {activeTab === 'company' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {company ? 'Editar Empresa' : 'Cadastrar Empresa'}
                </h2>
              </div>
              <CompanyForm 
                company={company} 
                onSave={(savedCompany) => {
                  setCompany(savedCompany);
                  setActiveTab('products');
                }} 
              />
            </div>
          )}

          {activeTab === 'products' && company && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
                </div>
              </div>
              <ProductList />
            </div>
          )}

          {activeTab === 'pricelists' && company && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Listas de Preços</h2>
              </div>
              <PriceListManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
