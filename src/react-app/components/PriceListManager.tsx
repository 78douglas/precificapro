import { useState, useEffect } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  FileText, 
  Users, 
  Calendar,
  X,
  DollarSign,
  Percent,
  Package
} from 'lucide-react';
import DiscountInput from '@/react-app/components/DiscountInput';
import type { Product, PriceList } from '@/shared/types';

interface PriceListFormData {
  name: string;
  selectedProducts: number[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export default function PriceListManager() {
  const [priceLists, setPriceLists] = useState<(PriceList & { item_count: number })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filtros para seleção de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<PriceListFormData>({
    name: '',
    selectedProducts: [],
    discountType: 'percentage',
    discountValue: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priceListsRes, productsRes] = await Promise.all([
        fetch('/api/price-lists'),
        fetch('/api/products')
      ]);

      if (priceListsRes.ok) {
        const priceListsData = await priceListsRes.json();
        setPriceLists(priceListsData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da lista é obrigatório';
    }
    
    if (formData.selectedProducts.length === 0) {
      newErrors.products = 'Selecione pelo menos um produto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/price-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          product_ids: formData.selectedProducts,
          discount_type: formData.discountType,
          discount_value: formData.discountValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar lista de preços');
      }

      const result = await response.json();
      
      await fetchData();
      handleCloseForm();
      
      // Mostrar URL da lista criada
      alert(`Lista criada com sucesso!\n\nURL pública: ${result.url}\n\nVocê pode compartilhar esta URL com seus clientes.`);
      
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      setErrors({ general: 'Erro ao criar lista de preços. Tente novamente.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      name: '',
      selectedProducts: [],
      discountType: 'percentage',
      discountValue: 0,
    });
    setErrors({});
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedManufacturers([]);
  };

  const handleDelete = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista de preços?')) return;
    
    try {
      const response = await fetch(`/api/price-lists/${listId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir lista');
      }

      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
    }
  };

  const handleProductToggle = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  const handleSelectAllProducts = () => {
    const filteredProductIds = getFilteredProducts().map(p => p.id!);
    const allSelected = filteredProductIds.every(id => formData.selectedProducts.includes(id));
    
    if (allSelected) {
      // Deselecionar todos os filtrados
      setFormData(prev => ({
        ...prev,
        selectedProducts: prev.selectedProducts.filter(id => !filteredProductIds.includes(id))
      }));
    } else {
      // Selecionar todos os filtrados
      setFormData(prev => ({
        ...prev,
        selectedProducts: [...new Set([...prev.selectedProducts, ...filteredProductIds])]
      }));
    }
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleManufacturerToggle = (manufacturer: string) => {
    setSelectedManufacturers(prev =>
      prev.includes(manufacturer)
        ? prev.filter(m => m !== manufacturer)
        : [...prev, manufacturer]
    );
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => 
        product.type?.toLowerCase().includes(type.toLowerCase())
      );
      const matchesManufacturer = selectedManufacturers.length === 0 || selectedManufacturers.some(manufacturer => 
        product.manufacturer?.toLowerCase().includes(manufacturer.toLowerCase())
      );
      
      return matchesSearch && matchesType && matchesManufacturer;
    });
  };

  const getUniqueTypes = () => {
    const allTypes = products.flatMap(p => p.type?.split(', ') || []);
    return [...new Set(allTypes)].filter(Boolean);
  };

  const getUniqueManufacturers = () => {
    const allManufacturers = products.flatMap(p => p.manufacturer?.split(', ') || []);
    return [...new Set(allManufacturers)].filter(Boolean);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada para a área de transferência!');
  };

  const filteredProducts = getFilteredProducts();
  const uniqueTypes = getUniqueTypes();
  const uniqueManufacturers = getUniqueManufacturers();

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listas de Preços</h2>
          <p className="text-gray-600 mt-1">
            Crie listas personalizadas com desconto para seus clientes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Nova Lista
        </button>
      </div>

      {/* Price Lists Grid */}
      {priceLists.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma lista criada
          </h3>
          <p className="text-gray-500 mb-6">
            Crie sua primeira lista de preços personalizada
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Criar Lista
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceLists.map((list) => (
            <div key={list.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {list.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{list.item_count} produtos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(list.created_at!).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {list.discount_type && list.discount_value !== 0 && (
                      <div className="flex items-center gap-2">
                        {list.discount_type === 'percentage' ? (
                          <Percent className="w-4 h-4" />
                        ) : (
                          <DollarSign className="w-4 h-4" />
                        )}
                        <span>
                          {list.discount_type === 'percentage' 
                            ? `${list.discount_value > 0 ? '+' : ''}${list.discount_value}%`
                            : `${list.discount_value > 0 ? '+' : ''}R$ ${Math.abs(list.discount_value).toFixed(2)}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/lista/${list.id}`;
                      window.open(url, '_blank');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Abrir lista pública"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/lista/${list.id}`;
                      copyToClipboard(url);
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Copiar URL"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/lista/${list.id}`;
                    copyToClipboard(url);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Copiar Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Nova Lista de Preços</h3>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-80px)]">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.general}</p>
                  </div>
                )}

                {/* Nome da Lista */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Lista *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Lista para Farmácias"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Desconto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto/Acréscimo (opcional)
                  </label>
                  <DiscountInput
                    value={formData.discountValue.toString()}
                    onChange={(value, type) => {
                      setFormData(prev => ({
                        ...prev,
                        discountValue: parseFloat(value) || 0,
                        discountType: type || 'percentage'
                      }));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valores negativos aplicam desconto, positivos aplicam acréscimo
                  </p>
                </div>

                {/* Filtros de Produtos */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Selecionar Produtos</h4>
                  
                  {/* Busca */}
                  <div>
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtros por Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por Tipo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => handleTypeToggle(type)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Filtros por Fabricante */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por Fabricante
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueManufacturers.map(manufacturer => (
                        <label key={manufacturer} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedManufacturers.includes(manufacturer)}
                            onChange={() => handleManufacturerToggle(manufacturer)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{manufacturer}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Produtos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {formData.selectedProducts.length} de {filteredProducts.length} produtos selecionados
                      </span>
                      {filteredProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllProducts}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {filteredProducts.every(p => formData.selectedProducts.includes(p.id!)) 
                            ? 'Desmarcar todos' 
                            : 'Selecionar todos'
                          }
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {products.length === 0 
                            ? 'Nenhum produto cadastrado' 
                            : 'Nenhum produto encontrado com os filtros aplicados'
                          }
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredProducts.map((product) => (
                            <label key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.selectedProducts.includes(product.id!)}
                                onChange={() => handleProductToggle(product.id!)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{product.description}</div>
                                <div className="text-sm text-gray-600">
                                  {product.type} • R$ {product.value.toFixed(2).replace('.', ',')}
                                  {product.manufacturer && ` • ${product.manufacturer}`}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.products && <p className="mt-1 text-sm text-red-600">{errors.products}</p>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={isCreating}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || formData.selectedProducts.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isCreating ? 'Criando...' : 'Criar Lista'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
