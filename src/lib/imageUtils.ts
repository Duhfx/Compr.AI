/**
 * Utilitários para manipulação de imagens
 */

/**
 * Comprime uma imagem mantendo proporções
 * 
 * @param file - Arquivo de imagem original
 * @param maxWidth - Largura máxima em pixels (padrão: 1024)
 * @param quality - Qualidade JPEG de 0 a 1 (padrão: 0.8)
 * @returns Promise com Blob da imagem comprimida
 * 
 * @example
 * const compressed = await compressImage(file, 1024, 0.8);
 * const reader = new FileReader();
 * reader.readAsDataURL(compressed);
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar se necessário
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao criar contexto canvas'));
            return;
          }

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const sizeKB = (blob.size / 1024).toFixed(2);
                console.log('[ImageUtils] Imagem comprimida: ' + sizeKB + ' KB');
                resolve(blob);
              } else {
                reject(new Error('Erro ao comprimir imagem'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converte Blob para Base64
 * 
 * @param blob - Blob da imagem
 * @returns Promise com string base64
 * 
 * @example
 * const base64 = await blobToBase64(blob);
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Valida se o arquivo é uma imagem válida
 * 
 * @param file - Arquivo para validar
 * @returns true se for uma imagem válida
 * 
 * @example
 * if (isValidImage(file)) {
 *   // processar imagem
 * }
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    console.warn('[ImageUtils] Tipo de arquivo inválido: ' + file.type);
    return false;
  }

  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.warn('[ImageUtils] Arquivo muito grande: ' + sizeMB + ' MB');
    return false;
  }

  return true;
}

/**
 * Formata tamanho de arquivo para exibição
 * 
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 * 
 * @example
 * formatFileSize(1024) // "1.0 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
