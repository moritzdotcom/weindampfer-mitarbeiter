import { useState } from 'react';

type UseImageUploadOptions = {
  maxWidth?: number;
  allowedTypes?: string[];
};

export function useImageUpload(options?: UseImageUploadOptions) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setError(null);
    setUploading(true);

    try {
      // Check MIME type
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Nicht unterstütztes Dateiformat');
      }

      let processedFile = file;

      // HEIC zu JPEG konvertieren
      if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        processedFile = new File([convertedBlob as BlobPart], 'converted.jpg', {
          type: 'image/jpeg',
        });
      }

      // Vorschau setzen (optional)
      const preview = URL.createObjectURL(processedFile);
      setPreviewUrl(preview);

      // Base64 kodieren
      const base64 = await fileToBase64(processedFile);
      return base64;
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hochladen');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    handleImageUpload,
    previewUrl,
    uploading,
    error,
  };
}

// Hilfsfunktion: Datei in base64 umwandeln
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
