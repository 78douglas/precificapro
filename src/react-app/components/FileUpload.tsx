import { useState, useRef } from 'react';
import { Upload, X, Image, AlertCircle, Check } from 'lucide-react';
import { useFileUpload } from '@/react-app/hooks/useFileUpload';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  currentUrl?: string;
  onUpload: (url: string) => void;
  placeholder?: string;
}

export default function FileUpload({ 
  accept = "*", 
  maxSize = 5 * 1024 * 1024,
  currentUrl = '',
  onUpload,
  placeholder = "Clique ou arraste um arquivo aqui"
}: FileUploadProps) {
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useFileUpload({
    accept,
    maxSize,
    onError: setError,
  });

  const handleFileSelect = async (file: File) => {
    setError('');
    try {
      const url = await uploadFile(file);
      onUpload(url);
    } catch (err) {
      // Error is already handled in useFileUpload
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onUpload('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = accept?.includes('image');

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : currentUrl ? (
          <div className="space-y-3">
            {isImage && (
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={currentUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Arquivo carregado</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Remover
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {isImage ? (
              <Image className="w-8 h-8 text-gray-400 mx-auto" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            )}
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">
              Máximo: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
