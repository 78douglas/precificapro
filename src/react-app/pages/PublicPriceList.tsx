import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { 
  Loader2, 
  Search, 
  Download, 
  Phone,
  User,
  AlertTriangle
} from 'lucide-react';
import type { PublicPriceListView } from '@/shared/types';

export default function PublicPriceList() {
  const { id } = useParams<{ id: string }>();
  const [priceList, setPriceList] = useState<PublicPriceListView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'description' | 'value' | 'type'>('description');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (id) {
      fetchPriceList();
    }
  }, [id]);

  const fetchPriceList = async () => {
    try {
      const response = await fetch(`/api/price-lists/${id}/public`);
      if (response.ok) {
        const data = await response.json();
        setPriceList(data);
      } else if (response.status === 404) {
        setError('Lista de preços não encontrada');
      } else {
        setError('Erro ao carregar lista de preços');
      }
    } catch (error) {
      console.error('Erro ao buscar lista de preços:', error);
      setError('Erro ao carregar lista de preços');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedItems = priceList ? priceList.items
    .filter(item => {
      const matchesSearch = item.product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.product.type);
      const matchesManufacturer = selectedTypes.length === 0 || (item.product.manufacturer && selectedTypes.includes(item.product.manufacturer));
      return matchesSearch && (matchesType || matchesManufacturer);
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'description':
          comparison = a.product.description.localeCompare(b.product.description);
          break;
        case 'value':
          comparison = a.adjusted_value - b.adjusted_value;
          break;
        case 'type':
          comparison = a.product.type.localeCompare(b.product.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    }) : [];

  const handlePrint = () => {
    window.print();
  };

  

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Pote': return 'bg-blue-100 text-blue-800';
      case 'Frasco': return 'bg-green-100 text-green-800';
      case 'Blister': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPortionColor = (portion: string) => {
    if (portion.includes('60')) return 'bg-yellow-100 text-yellow-800';
    if (portion.includes('120')) return 'bg-orange-100 text-orange-800';
    if (portion.includes('500') || portion.includes('ml')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800';
  };

  

  const productTypes = priceList ? [...new Set(priceList.items.map(item => item.product.type))] : [];

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Carregando lista de preços...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!priceList) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable, .printable * {
            visibility: visible;
          }
          .printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .print-break {
            page-break-before: always;
          }
        }
        
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      {/* Screen Controls */}
      <div className="no-print bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{priceList.name}</h1>
              <p className="text-gray-600">{priceList.company.name}</p>
            </div>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || selectedTypes.length > 0) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTypes([]);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Filters */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Tipos de Produto</label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {productTypes.map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-md p-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 font-medium">{type}</span>
                    </label>
                  ))}
                  {productTypes.length === 0 && (
                    <p className="text-sm text-gray-500 italic p-2">Nenhum tipo disponível</p>
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'description' | 'value' | 'type')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="description">Nome do Produto</option>
                  <option value="value">Preço</option>
                  <option value="type">Tipo</option>
                </select>
              </div>

              {/* Manufacturer Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Fabricantes</label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {[...new Set(priceList?.items.map(item => item.product.manufacturer).filter(Boolean))].map(manufacturer => (
                    <label key={manufacturer} className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-md p-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(manufacturer!)}
                        onChange={() => handleTypeToggle(manufacturer!)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 font-medium">{manufacturer}</span>
                    </label>
                  ))}
                  {(!priceList || [...new Set(priceList.items.map(item => item.product.manufacturer).filter(Boolean))].length === 0) && (
                    <p className="text-sm text-gray-500 italic p-2">Nenhum fabricante disponível</p>
                  )}
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {(searchTerm || selectedTypes.length > 0) ? (
                  <span>
                    Mostrando <span className="font-semibold text-gray-900">{filteredAndSortedItems.length}</span> de{' '}
                    <span className="font-semibold text-gray-900">{priceList.items.length}</span> produtos
                  </span>
                ) : (
                  <span>
                    Total: <span className="font-semibold text-gray-900">{priceList.items.length}</span> produtos
                  </span>
                )}
              </div>
              
              {selectedTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTypes.map(filter => (
                    <span
                      key={filter}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {filter}
                      <button
                        onClick={() => handleTypeToggle(filter)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div className="printable max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Print Header - Only visible when printing */}
        <div className="print-header mb-8 text-center">
          <div className="flex flex-col items-center mb-4">
            {priceList.company.logo_url && (
              <img
                src={priceList.company.logo_url}
                alt={priceList.company.name}
                className="h-16 w-auto object-contain mb-4"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{priceList.company.name}</h1>
              {priceList.company.phone && (
                <p className="text-gray-600">Tel: {priceList.company.phone}</p>
              )}
              {priceList.company.contact_person && (
                <p className="text-gray-600">Contato: {priceList.company.contact_person}</p>
              )}
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-6">
            <p className="text-sm text-yellow-800 font-medium">
              A tabela pode sofrer reajuste sem aviso prévio, devido ao aumento repentino nos preços das matérias primas.
            </p>
          </div>
        </div>

        {/* Screen Header */}
        <div className="no-print bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col items-center text-center gap-4">
            {priceList.company.logo_url && (
              <img
                src={priceList.company.logo_url}
                alt={priceList.company.name}
                className="h-20 w-auto object-contain"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{priceList.company.name}</h2>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                {priceList.company.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{priceList.company.phone}</span>
                  </div>
                )}
                
                {priceList.company.contact_person && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{priceList.company.contact_person}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-800 font-medium">
              A tabela pode sofrer reajuste sem aviso prévio, devido ao aumento repentino nos preços das matérias primas.
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (sortBy === 'description') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('description');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Produto
                      {sortBy === 'description' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (sortBy === 'type') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('type');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Tipo
                      {sortBy === 'type' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porção
                  </th>
                  
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (sortBy === 'value') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('value');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valor (R$)
                      {sortBy === 'value' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedItems.map((item, index) => (
                  <tr key={item.product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.product.photo_url && (
                          <div className="w-12 h-8 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={item.product.photo_url}
                              alt={item.product.description}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.product.type)}`}>
                        {item.product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.product.portion ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortionColor(item.product.portion)}`}>
                          {item.product.portion}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-semibold text-green-600">
                        {item.adjusted_value.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Print Footer */}
        <div className="print-header mt-8 text-center text-sm text-gray-500">
          <p>Total de produtos: {filteredAndSortedItems.length}</p>
        </div>
      </div>
    </div>
  );
}
