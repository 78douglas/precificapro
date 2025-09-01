import { useState, useEffect } from 'react';
import { Building2, Phone, User, Save } from 'lucide-react';
import FileUpload from '@/react-app/components/FileUpload';
import type { Company, CreateCompany } from '@/shared/types';

interface CompanyFormProps {
  company: Company | null;
  onSave: (company: Company) => void;
}

export default function CompanyForm({ company, onSave }: CompanyFormProps) {
  const [formData, setFormData] = useState<CreateCompany>({
    name: '',
    phone: '',
    contact_person: '',
    logo_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        phone: company.phone || '',
        contact_person: company.contact_person || '',
        logo_url: company.logo_url || '',
      });
    }
  }, [company]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const method = company ? 'PUT' : 'POST';
      const url = company ? '/api/companies/me' : '/api/companies';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar empresa');
      }

      const savedCompany = await response.json();
      onSave(savedCompany);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      setErrors({ general: 'Erro ao salvar empresa. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCompany, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4" />
            Nome da Empresa *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Digite o nome da empresa"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4" />
            Telefone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Pessoa de Contato
          </label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => handleChange('contact_person', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nome do responsável"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4" />
            Logo da Empresa
          </label>
          <FileUpload
            accept="image/*"
            maxSize={2 * 1024 * 1024} // 2MB
            currentUrl={formData.logo_url}
            onUpload={(url) => handleChange('logo_url', url)}
            placeholder="Clique ou arraste o logo da empresa aqui"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isLoading ? 'Salvando...' : 'Salvar Empresa'}
        </button>
      </div>
    </form>
  );
}
