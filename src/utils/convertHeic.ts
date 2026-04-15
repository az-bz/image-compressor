import libheif from 'libheif-js/wasm-bundle';

export async function convertHeic(file: File): Promise<Blob> {
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new libheif.HeifDecoder();
    const data = decoder.decode(new Uint8Array(buffer));

    if (!data || data.length === 0) {
      throw new Error('No images found in HEIC file');
    }

    const image = data[0];
    const width = image.get_width();
    const height = image.get_height();

    const imageData = await new Promise<ImageData>((resolve, reject) => {
      image.display(
        { data: new Uint8ClampedArray(width * height * 4), width, height },
        (displayData: { data: Uint8ClampedArray; width: number; height: number } | null) => {
          if (!displayData) {
            reject(new Error('Failed to decode HEIC image'));
            return;
          }
          resolve(new ImageData(new Uint8ClampedArray(displayData.data.buffer as ArrayBuffer), displayData.width, displayData.height));
        }
      );
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert HEIC to JPEG'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.92
      );
    });
  } catch {
    throw new Error('HEIC format not supported. Please convert to JPEG first.');
  }
}
