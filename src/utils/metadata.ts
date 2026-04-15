import piexifjs from 'piexifjs';
import { generateRandomExifData } from './deviceProfiles';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timer = setTimeout(() => {
      reader.abort();
      reject(new Error('FileReader timed out'));
    }, 10_000);
    reader.onload = () => {
      clearTimeout(timer);
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      clearTimeout(timer);
      reject(reader.error ?? new Error('FileReader failed'));
    };
    reader.onabort = () => {
      clearTimeout(timer);
      reject(new Error('FileReader aborted'));
    };
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid DataURL: missing base64 segment');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function stripAndInjectMetadata(
  blob: Blob,
  width: number,
  height: number
): Promise<Blob> {
  // Only process JPEG blobs
  if (blob.type !== 'image/jpeg') {
    return blob;
  }

  try {
    // Step 1: Convert Blob to base64 DataURL
    const dataUrl = await blobToDataUrl(blob);

    // Step 2: Strip existing EXIF
    const stripped = piexifjs.remove(dataUrl);

    // Step 3: Generate fake EXIF data
    const exifObj = generateRandomExifData(width, height);

    // Step 4: Dump EXIF to binary string
    const exifStr = piexifjs.dump(exifObj);

    // Step 5: Insert fake EXIF into stripped DataURL
    const withExif = piexifjs.insert(exifStr, stripped);

    // Step 6: Convert back to Blob (CSP-safe: atob + Uint8Array)
    return dataUrlToBlob(withExif, 'image/jpeg');
  } catch {
    // If anything fails, return original blob unchanged
    return blob;
  }
}
