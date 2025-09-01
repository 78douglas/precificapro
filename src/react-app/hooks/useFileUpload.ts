import { useState } from 'react';

interface UseFileUploadOptions {
  accept?: string;
  maxSize?: number; // in bytes
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const uploadFile = async (file: File): Promise<string> => {
    const { maxSize = 5 * 1024 * 1024, onError } = options; // 5MB default

    if (file.size > maxSize) {
      const error = `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`;
      onError?.(error);
      throw new Error(error);
    }

    setIsUploading(true);
    
    try {
      // Convert file to base64 for simple upload simulation
      const base64 = await fileToBase64(file);
      
      // In a real app, you would upload to a cloud service like Cloudflare Images
      // For now, we'll simulate an upload and return a data URL
      const simulatedUrl = base64;
      
      setUploadedUrl(simulatedUrl);
      return simulatedUrl;
    } catch (error) {
      const errorMsg = 'Erro ao fazer upload do arquivo';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return {
    uploadFile,
    isUploading,
    uploadedUrl,
    setUploadedUrl,
  };
}
