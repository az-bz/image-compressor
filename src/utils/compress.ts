import imageCompression from 'browser-image-compression';
import type { CompressionSettings } from '../types/image';
import { compressSvg } from './compressSvg';
import { compressGif } from './compressGif';
import { convertHeic } from './convertHeic';
import { stripAndInjectMetadata } from './metadata';

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      // Revoke before resolving so the URL is always cleaned up
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension detection'));
    };
    img.src = url;
  });
}

async function compressTiff(
  file: File,
  settings: CompressionSettings,
  onProgress: (p: number) => void,
  signal?: AbortSignal,
): Promise<{ blob: Blob; size: number }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);

      if (signal?.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      onProgress(30);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.drawImage(img, 0, 0);
        onProgress(60);

        const mimeType = settings.convertToWebP ? 'image/webp' : 'image/jpeg';
        const quality = 0.6;

        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(
            (b) => {
              if (!b) rej(new Error('Canvas toBlob failed'));
              else res(b);
            },
            mimeType,
            quality
          );
        });

        onProgress(90);

        let outputBlob = blob;
        if (!settings.convertToWebP) {
          const dims = { width: img.naturalWidth, height: img.naturalHeight };
          outputBlob = await stripAndInjectMetadata(blob, dims.width, dims.height);
        }

        onProgress(100);
        resolve({ blob: outputBlob, size: outputBlob.size });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('TIFF format not supported by this browser'));
    };

    img.src = url;
  });
}

export async function compressImage(
  file: File,
  settings: CompressionSettings,
  onProgress: (p: number) => void,
  signal?: AbortSignal,
): Promise<{ blob: Blob; size: number }> {
  const mimeType = file.type.toLowerCase();

  // SVG
  if (mimeType === 'image/svg+xml') {
    onProgress(50);
    const result = await compressSvg(file);
    onProgress(100);
    return result;
  }

  // GIF
  if (mimeType === 'image/gif') {
    onProgress(30);
    // Re-throw on failure — passing through silently would show 0% savings with no indication of error
    const result = await compressGif(file);
    if (signal?.aborted) throw new Error('Aborted');
    onProgress(100);
    return result;
  }

  // TIFF
  if (mimeType === 'image/tiff') {
    return compressTiff(file, settings, onProgress, signal);
  }

  // HEIC/HEIF
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    if (signal?.aborted) throw new Error('Aborted');
    onProgress(20);
    const jpegBlob = await convertHeic(file);
    if (signal?.aborted) throw new Error('Aborted');
    const jpegFile = new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
    });
    onProgress(40);

    const options: Parameters<typeof imageCompression>[1] = {
      maxSizeMB: 0.15,
      initialQuality: 0.55,
      alwaysKeepResolution: true,
      useWebWorker: false,
      preserveExif: false,
      onProgress: (p: number) => onProgress(40 + Math.round(p * 0.5)),
      signal,
    };

    if (settings.resize) {
      options.maxWidthOrHeight = settings.maxDimension;
    }
    if (settings.convertToWebP) {
      options.fileType = 'image/webp';
    }

    const compressed = await imageCompression(jpegFile, options);
    onProgress(90);

    const dims = await getImageDimensions(compressed).catch(() => ({ width: 0, height: 0 }));
    const outputBlob = settings.convertToWebP
      ? compressed
      : await stripAndInjectMetadata(compressed, dims.width, dims.height);

    onProgress(100);
    return { blob: outputBlob, size: outputBlob.size };
  }

  // JPEG / PNG / WebP / BMP
  const options: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: 0.15,
    initialQuality: 0.55,
    alwaysKeepResolution: true,
    useWebWorker: false,
    preserveExif: false,
    onProgress: (p: number) => onProgress(Math.round(p * 0.9)),
    signal,
  };

  if (settings.resize) {
    options.maxWidthOrHeight = settings.maxDimension;
  }
  if (settings.convertToWebP) {
    options.fileType = 'image/webp';
  } else if (mimeType === 'image/jpeg') {
    options.fileType = 'image/jpeg';
  }

  const compressed = await imageCompression(file, options);
  onProgress(90);

  // Only call getImageDimensions when we need metadata injection (JPEG input staying JPEG)
  let outputBlob: Blob;
  if (mimeType === 'image/jpeg' && !settings.convertToWebP) {
    const dims = await getImageDimensions(compressed).catch(() => ({ width: 0, height: 0 }));
    outputBlob = await stripAndInjectMetadata(compressed, dims.width, dims.height);
  } else {
    outputBlob = compressed;
  }

  onProgress(100);
  return { blob: outputBlob, size: outputBlob.size };
}
