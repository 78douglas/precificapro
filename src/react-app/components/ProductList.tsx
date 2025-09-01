import { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  X,
  Grid3X3,
  List,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ProductImport from '@/react-app/components/ProductImport';
import type { Product } from '@/shared/types';

interface ProductFormData {
  description: string;
  type: string;
  customType: string;
  portion: string;
  customPortion: string;
  value: string;
  manufacturer: string;
  customManufacturer: string;
  photo_url: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('');
  const [sortBy, setSortBy] = useState<'description' | 'value' | 'type' | 'manufacturer'>('description');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<ProductFormData>({
    description: '',
    type: 'Pote',
    customType: '',
    portion: '60 cápsulas',
    customPortion: '',
    value: '',
    manufacturer: 'União Flora',
    customManufacturer: '',
    photo_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    // Validar tipo
    const finalType = formData.type === 'Outro' ? formData.customType.trim() : formData.type;
    if (!finalType) {
      newErrors.type = 'Selecione um tipo ou digite um personalizado';
    }

    // Validar fabricante
    const finalManufacturer = formData.manufacturer === 'Outro' ? formData.customManufacturer.trim() : formData.manufacturer;
    if (!finalManufacturer) {
      newErrors.manufacturer = 'Selecione um fabricante ou digite um personalizado';
    }
    
    const valueNum = parseFloat(formData.value);
    if (!formData.value || isNaN(valueNum) || valueNum <= 0) {
      newErrors.value = 'Valor deve ser um número positivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Determinar valores finais
      const finalType = formData.type === 'Outro' ? formData.customType.trim() : formData.type;
      const finalPortion = formData.portion === 'Outro' ? formData.customPortion.trim() : formData.portion;
      const finalManufacturer = formData.manufacturer === 'Outro' ? formData.customManufacturer.trim() : formData.manufacturer;

      const productData = {
        description: formData.description,
        type: finalType,
        portion: finalPortion || null,
        value: parseFloat(formData.value),
        manufacturer: finalManufacturer,
        photo_url: formData.photo_url || null,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar produto');
      }

      await fetchProducts();
      handleCloseForm();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setErrors({ general: 'Erro ao salvar produto. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      description: '',
      type: 'Pote',
      customType: '',
      portion: '60 cápsulas',
      customPortion: '',
      value: '',
      manufacturer: 'União Flora',
      customManufacturer: '',
      photo_url: '',
    });
    setErrors({});
    setIsSaving(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Parse existing values
    const typeOptions = ['Pote', 'Blister', 'Frasco'];
    const manufacturerOptions = ['União Flora', 'Force Sens'];
    const portionOptions = ['30 cápsulas', '60 cápsulas', '120 cápsulas', '500ml', '1L'];
    
    const isCustomType = !typeOptions.includes(product.type);
    const isCustomManufacturer = !manufacturerOptions.includes(product.manufacturer || '');
    const isCustomPortion = !portionOptions.includes(product.portion || '');
    
    setFormData({
      description: product.description,
      type: isCustomType ? 'Outro' : product.type,
      customType: isCustomType ? product.type : '',
      portion: isCustomPortion ? 'Outro' : (product.portion || '60 cápsulas'),
      customPortion: isCustomPortion ? (product.portion || '') : '',
      value: product.value.toString(),
      manufacturer: isCustomManufacturer ? 'Outro' : (product.manufacturer || 'União Flora'),
      customManufacturer: isCustomManufacturer ? (product.manufacturer || '') : '',
      photo_url: product.photo_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir produto');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const deletePromises = selectedProducts.map(productId =>
        fetch(`/api/products/${productId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      await fetchProducts();
      setSelectedProducts([]);
    } catch (error) {
      console.error('Erro ao deletar produtos selecionados:', error);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleImport = async (importedProducts: any[]) => {
    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: importedProducts }),
      });

      if (!response.ok) {
        throw new Error('Erro ao importar produtos');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      throw error;
    }
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      alert('Nenhum produto para exportar');
      return;
    }

    try {
      console.log('Iniciando exportação de', products.length, 'produtos');
      
      // Preparar dados para exportação com validação
      const exportData = products.map((product, index) => {
        try {
          // Validar e limpar dados
          const description = String(product.description || '').trim();
          const type = String(product.type || '').trim();
          const portion = String(product.portion || '').trim();
          const manufacturer = String(product.manufacturer || '').trim();
          
          // Tratar valor com segurança
          let valueFormatted = 'R$ 0,00';
          if (typeof product.value === 'number' && !isNaN(product.value)) {
            valueFormatted = `R$ ${product.value.toFixed(2).replace('.', ',')}`;
          }
          
          // Tratar URL da foto (truncar se muito longa para Excel)
          const photoUrl = String(product.photo_url || '').trim();
          const truncatedPhotoUrl = photoUrl.length > 32700 ? photoUrl.substring(0, 32700) + '...' : photoUrl;
          
          // Tratar data de criação
          let createdDate = '';
          if (product.created_at) {
            try {
              const date = new Date(product.created_at);
              if (!isNaN(date.getTime())) {
                createdDate = date.toLocaleDateString('pt-BR');
              }
            } catch (dateError) {
              console.warn('Erro ao formatar data para produto', index, dateError);
            }
          }

          // Truncar campos longos para evitar limite do Excel
          const truncatedDescription = description.length > 32700 ? description.substring(0, 32700) + '...' : description;
          const truncatedType = type.length > 32700 ? type.substring(0, 32700) + '...' : type;
          const truncatedPortion = portion.length > 32700 ? portion.substring(0, 32700) + '...' : portion;
          const truncatedManufacturer = manufacturer.length > 32700 ? manufacturer.substring(0, 32700) + '...' : manufacturer;

          return {
            'Descrição': truncatedDescription,
            'Tipo': truncatedType,
            'Porção': truncatedPortion,
            'Fabricante': truncatedManufacturer,
            'Valor': valueFormatted,
            'URL da Foto': truncatedPhotoUrl,
            'Data de Criação': createdDate,
          };
        } catch (productError) {
          console.warn('Erro ao processar produto', index, productError);
          return {
            'Descrição': 'Erro no produto',
            'Tipo': '',
            'Porção': '',
            'Fabricante': '',
            'Valor': 'R$ 0,00',
            'URL da Foto': '',
            'Data de Criação': '',
          };
        }
      });

      console.log('Dados preparados:', exportData.length, 'itens');

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Descrição
        { wch: 15 }, // Tipo
        { wch: 15 }, // Porção
        { wch: 15 }, // Fabricante
        { wch: 15 }, // Valor
        { wch: 45 }, // URL da Foto
        { wch: 15 }  // Data de Criação
      ];
      worksheet['!cols'] = colWidths;

      // Baixar arquivo
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
      const fileName = `produtos_${dateStr}.xlsx`;
      
      console.log('Iniciando download do arquivo:', fileName);
      XLSX.writeFile(workbook, fileName);
      
      console.log('Exportação concluída com sucesso!');
      alert(`Exportação concluída! Arquivo "${fileName}" foi baixado.`);
      
    } catch (error) {
      console.error('Erro detalhado na exportação:', error);
      alert('Erro ao exportar a planilha. Verifique o console para mais detalhes.');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Pote': return 'bg-blue-100 text-blue-800';
      case 'Frasco': return 'bg-green-100 text-green-800';
      case 'Blister': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getManufacturerColor = (manufacturer: string) => {
    switch (manufacturer) {
      case 'União Flora': return 'bg-emerald-100 text-emerald-800';
      case 'Force Sens': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filterType || product.type === filterType;
      const matchesManufacturer = !filterManufacturer || product.manufacturer === filterManufacturer;
      return matchesSearch && matchesType && matchesManufacturer;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'manufacturer':
          const aManuf = a.manufacturer || '';
          const bManuf = b.manufacturer || '';
          comparison = aManuf.localeCompare(bManuf);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterManufacturer('');
  };

  const hasActiveFilters = searchTerm || filterType || filterManufacturer;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
          
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Importar
          </button>

          <button
            onClick={handleExportProducts}
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar XLS
          </button>
          
          {selectedProducts.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produto(s) selecionado(s)?`)) {
                  handleDeleteSelected();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Excluir Selecionados ({selectedProducts.length})
            </button>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Grade
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Todos os tipos</option>
              <option value="Pote">Pote</option>
              <option value="Blister">Blister</option>
              <option value="Frasco">Frasco</option>
            </select>

            {/* Manufacturer Filter */}
            <select
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Todos os fabricantes</option>
              <option value="União Flora">União Flora</option>
              <option value="Force Sens">Force Sens</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'description' | 'value' | 'type' | 'manufacturer');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="description-asc">Nome A-Z</option>
              <option value="description-desc">Nome Z-A</option>
              <option value="value-asc">Menor Preço</option>
              <option value="value-desc">Maior Preço</option>
              <option value="type-asc">Tipo A-Z</option>
              <option value="manufacturer-asc">Fabricante A-Z</option>
            </select>
          </div>
        </div>

        {/* Active Filters and Results */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {hasActiveFilters ? (
                <span>
                  Mostrando <span className="font-semibold text-gray-900">{filteredAndSortedProducts.length}</span> de{' '}
                  <span className="font-semibold text-gray-900">{products.length}</span> produtos
                </span>
              ) : (
                <span>
                  Total: <span className="font-semibold text-gray-900">{products.length}</span> produtos
                </span>
              )}
            </div>
            
            {filteredAndSortedProducts.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(filteredAndSortedProducts.map(p => p.id!));
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Selecionar todos
              </label>
            )}
            
            {selectedProducts.length > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {selectedProducts.length} selecionado(s)
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Novo Produto
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Descrição do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder=""
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Tipo
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {['Pote', 'Blister', 'Frasco'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, customType: '' }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        value="Outro"
                        checked={formData.type === 'Outro'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Outro:</span>
                      <input
                        type="text"
                        value={formData.customType}
                        onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value, type: 'Outro' }))}
                        placeholder="Digite aqui"
                        className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Porção
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {['60 cápsulas', '120 cápsulas', '30 cápsulas', '500ml'].map(portion => (
                      <label key={portion} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="portion"
                          value={portion}
                          checked={formData.portion === portion}
                          onChange={(e) => setFormData(prev => ({ ...prev, portion: e.target.value, customPortion: '' }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{portion === '60 cápsulas' ? '60 caps' : portion === '120 cápsulas' ? '120 caps' : portion === '30 cápsulas' ? '30 caps' : '500 ml'}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="portion"
                        value="Outro"
                        checked={formData.portion === 'Outro'}
                        onChange={(e) => setFormData(prev => ({ ...prev, portion: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Outro:</span>
                      <input
                        type="text"
                        value={formData.customPortion}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPortion: e.target.value, portion: 'Outro' }))}
                        placeholder="Digite aqui"
                        className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Fabricante
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {['União Flora', 'Force Sens'].map(manufacturer => (
                      <label key={manufacturer} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="manufacturer"
                          value={manufacturer}
                          checked={formData.manufacturer === manufacturer}
                          onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value, customManufacturer: '' }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{manufacturer}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="manufacturer"
                        value="Outro"
                        checked={formData.manufacturer === 'Outro'}
                        onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Outro:</span>
                      <input
                        type="text"
                        value={formData.customManufacturer}
                        onChange={(e) => setFormData(prev => ({ ...prev, customManufacturer: e.target.value, manufacturer: 'Outro' }))}
                        placeholder="Digite aqui"
                        className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {errors.manufacturer && <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.value ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder=""
                  />
                  {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Foto do Produto
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    {formData.photo_url ? (
                      <div className="space-y-3">
                        <img 
                          src={formData.photo_url} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded-lg mx-auto"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, photo_url: '' }));
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remover foto
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="space-y-3 cursor-pointer"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                setFormData(prev => ({ ...prev, photo_url: result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 hover:text-blue-700">
                            Clique ou arraste uma imagem aqui
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Máximo: 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Salvando...' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ProductImport 
          onImport={handleImport} 
          onClose={() => setShowImport(false)} 
        />
      )}

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters 
              ? 'Tente ajustar os filtros de busca' 
              : 'Cadastre seu primeiro produto para começar'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Filter className="w-4 h-4" />
              Limpar filtros
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id!)}
                    onChange={() => handleSelectProduct(product.id!)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    {product.photo_url && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                        <img
                          src={product.photo_url}
                          alt={product.description}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.description}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(product.type)}`}>
                          {product.type}
                        </span>
                        {product.manufacturer && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getManufacturerColor(product.manufacturer)}`}>
                            {product.manufacturer}
                          </span>
                        )}
                      </div>
                      {product.portion && (
                        <p className="text-sm text-gray-600">{product.portion}</p>
                      )}
                      <p className="text-lg font-bold text-green-600">
                        R$ {product.value.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredAndSortedProducts.map(p => p.id!));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porção
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fabricante
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor (R$)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id!)}
                        onChange={() => handleSelectProduct(product.id!)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.photo_url && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={product.photo_url}
                              alt={product.description}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(product.type)}`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.portion ? (
                        <span className="text-sm text-gray-900">{product.portion}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.manufacturer ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getManufacturerColor(product.manufacturer)}`}>
                          {product.manufacturer}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-semibold text-green-600">
                        R$ {product.value.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
    </div>
  );
}
