export type CompressionResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  width: number;
  height: number;
  dataUrl: string;
};

export type CompressionOptions = {
  maxDimension?: number;
  quality?: number;
  outputFormat?: "image/webp" | "image/jpeg";
};

/**
 * Client-Side Hybrid Image Compressor
 * - Automatically downscales high-res photos to maxDimension (default 1600px).
 * - Converts to optimized WebP format with tuned quality (default 82%).
 * - Preserves transparency for jewellery pngs if present.
 * - Drastically shrinks camera photos (e.g. 8 MB -> ~100 KB) in ~100-200ms before upload.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    outputFormat = "image/webp"
  } = options;

  // If file is already a tiny WebP/SVG, we still ensure sizing constraint
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to decode image data."));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas context is not available."));
        }

        // High quality bicubic filtering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to compress image to WebP blob."));
            }

            const cleanBase = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${cleanBase}.webp`;
            const compressedFile = new File([blob], newFileName, {
              type: outputFormat,
              lastModified: Date.now()
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const savedPercent = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            const dataUrl = canvas.toDataURL(outputFormat, quality);

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              savedPercent,
              width,
              height,
              dataUrl
            });
          },
          outputFormat,
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable string (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

