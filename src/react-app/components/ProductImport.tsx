import { useState, useRef } from 'react';
import { Upload, X, Download, AlertCircle, Check, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportedProduct {
  foto: string;
  produto: string;
  tipo: string;
  porcao: string;
  fabricante: string;
  valor: number;
  isValid: boolean;
  errors: string[];
}

interface ProductImportProps {
  onImport: (products: ImportedProduct[]) => Promise<void>;
  onClose: () => void;
}

export default function ProductImport({ onImport, onClose }: ProductImportProps) {
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Foto': 'https://exemplo.com/foto1.jpg',
        'Produto': 'Vitamina C 500mg',
        'Tipo': 'Pote',
        'Porção': '60 cápsulas',
        'Fabricante': 'União Flora',
        'Valor R$': '45.90'
      },
      {
        'Foto': 'https://exemplo.com/foto2.jpg',
        'Produto': 'Omega 3 1000mg',
        'Tipo': 'Blister',
        'Porção': '120 cápsulas',
        'Fabricante': 'Force Sens',
        'Valor R$': '89.90'
      },
      {
        'Foto': '',
        'Produto': 'Colágeno Hidrolisado',
        'Tipo': 'Frasco',
        'Porção': '500 ml',
        'Fabricante': 'União Flora',
        'Valor R$': '125.00'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Foto
      { wch: 25 }, // Produto
      { wch: 10 }, // Tipo
      { wch: 15 }, // Porção
      { wch: 15 }, // Fabricante
      { wch: 12 }  // Valor R$
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'template_produtos.xlsx');
  };

  const validateProduct = (row: any): ImportedProduct => {
    const errors: string[] = [];
    
    const produto = String(row['Produto'] || '').trim();
    const tipo = String(row['Tipo'] || '').trim();
    const porcao = String(row['Porção'] || row['Porcao'] || '').trim();
    const fabricante = String(row['Fabricante'] || '').trim();
    const valorStr = String(row['Valor R$'] || row['Valor'] || '').replace(/[^\d,.-]/g, '').replace(',', '.');
    const foto = String(row['Foto'] || '').trim();

    if (!produto) {
      errors.push('Produto é obrigatório');
    }

    if (!['Pote', 'Blister', 'Frasco'].includes(tipo)) {
      errors.push('Tipo deve ser: Pote, Blister ou Frasco');
    }

    if (!['União Flora', 'Force Sens'].includes(fabricante)) {
      errors.push('Fabricante deve ser: União Flora ou Force Sens');
    }

    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0) {
      errors.push('Valor deve ser um número maior que zero');
    }

    // Validar URL da foto se fornecida
    if (foto && !foto.startsWith('http')) {
      errors.push('Foto deve ser uma URL válida (começar com http)');
    }

    return {
      foto,
      produto,
      tipo,
      porcao,
      fabricante,
      valor: isNaN(valor) ? 0 : valor,
      isValid: errors.length === 0,
      errors
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setImportedProducts([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error('A planilha está vazia');
      }

      // Validar cabeçalhos
      const firstRow = data[0] as any;
      const headers = Object.keys(firstRow);
      const requiredHeaders = ['Produto', 'Tipo', 'Fabricante', 'Valor'];
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingHeaders.join(', ')}`);
      }

      const products = data.map((row) => validateProduct(row));
      setImportedProducts(products);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar planilha');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validProducts = importedProducts.filter(p => p.isValid);
    if (validProducts.length === 0) {
      setError('Nenhum produto válido para importar');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(validProducts);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar produtos');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = importedProducts.filter(p => p.isValid).length;
  const invalidCount = importedProducts.length - validCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Importar Produtos</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions and Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Como usar:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Baixe o modelo da planilha clicando no botão abaixo</li>
              <li>Preencha com seus produtos seguindo o formato do exemplo</li>
              <li>Salve como Excel (.xlsx) ou CSV</li>
              <li>Faça o upload da planilha preenchida</li>
            </ol>
            <div className="mt-3">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Modelo
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo da Planilha
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Clique para selecionar ou arraste sua planilha aqui
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Formatos suportados: Excel (.xlsx, .xls) ou CSV
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Results Summary */}
          {importedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{validCount} produtos válidos</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{invalidCount} produtos com erro</span>
                  </div>
                )}
              </div>

              {/* Products Preview */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Produto</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Porção</th>
                      <th className="text-left p-3">Fabricante</th>
                      <th className="text-left p-3">Valor</th>
                      <th className="text-left p-3">Erros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importedProducts.map((product, index) => (
                      <tr key={index} className={product.isValid ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="p-3">
                          {product.isValid ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="p-3 font-medium">{product.produto}</td>
                        <td className="p-3">{product.tipo}</td>
                        <td className="p-3">{product.porcao || '-'}</td>
                        <td className="p-3">{product.fabricante}</td>
                        <td className="p-3">R$ {product.valor.toFixed(2)}</td>
                        <td className="p-3 text-red-600 text-xs">
                          {product.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {importedProducts.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isImporting ? 'Importando...' : `Importar ${validCount} Produtos`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
