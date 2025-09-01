import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface DiscountInputProps {
  value: string;
  onChange: (value: string, type: 'percentage' | 'fixed') => void;
  placeholder?: string;
  className?: string;
}

export default function DiscountInput({
  value,
  onChange,
  placeholder = "Ex: -10%, +5%, -2.50, +10",
  className = '',
}: DiscountInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const parseDiscountInput = (input: string): { value: number; type: 'percentage' | 'fixed' } | null => {
    if (!input.trim()) return null;

    // Remove spaces and normalize comma to dot
    const normalized = input.trim().replace(/,/g, '.');
    
    // Check for percentage
    if (normalized.includes('%')) {
      const numStr = normalized.replace('%', '');
      const num = parseFloat(numStr);
      
      if (isNaN(num)) return null;
      
      return {
        value: num, // Mantém o sinal original para porcentagem
        type: 'percentage'
      };
    }
    
    // Check for fixed value (with + or - operators)
    const hasOperator = normalized.startsWith('+') || normalized.startsWith('-');
    if (hasOperator) {
      const num = parseFloat(normalized); // Parse com sinal
      
      if (isNaN(num)) return null;
      
      return {
        value: num, // Mantém o sinal original para valor fixo também
        type: 'fixed'
      };
    }
    
    // Plain number - treat as percentage if >= 0 and <= 100, otherwise as fixed
    const num = parseFloat(normalized);
    if (isNaN(num)) return null;
    
    return {
      value: num,
      type: Math.abs(num) >= 0 && Math.abs(num) <= 100 ? 'percentage' : 'fixed'
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError('');

    if (!newValue.trim()) {
      onChange('', 'percentage');
      return;
    }

    // Permitir digitação parcial sem validação imediata
    const isPartialInput = newValue === '-' || newValue === '+' || newValue.endsWith('%') && newValue.length <= 2;
    if (isPartialInput) {
      return; // Não valida nem mostra erro para entradas parciais
    }

    const parsed = parseDiscountInput(newValue);
    if (parsed) {
      // Manter o sinal original tanto para porcentagem quanto para valor fixo
      onChange(parsed.value.toString(), parsed.type);
    } else {
      // Só mostra erro se não for uma entrada parcial válida
      const isValidPartial = /^[+-]?\d*[.,]?\d*%?$/.test(newValue);
      if (!isValidPartial) {
        setError('Formato inválido. Use: -10%, +5%, -2.50, +10');
      }
    }
  };

  const getDisplayType = () => {
    const parsed = parseDiscountInput(inputValue);
    if (!parsed) return '';
    
    return parsed.type === 'percentage' ? '(Porcentagem)' : '(Valor fixo)';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative">
        <Calculator className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        {inputValue && !error && (
          <span className="absolute right-3 top-3 text-xs text-gray-500">
            {getDisplayType()}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Exemplos: <code>-10%</code> (menos 10%), <code>+5%</code> (mais 5%), <code>-2.50</code> (menos R$ 2,50)</p>
      </div>
    </div>
  );
}
