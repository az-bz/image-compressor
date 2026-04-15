import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ImageItem } from '../types/image';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/heic': '.jpg',
  'image/heif': '.jpg',
};

export function getOutputFilename(displayName: string, outputMimeType: string): string {
  // SVG always stays .svg
  if (outputMimeType === 'image/svg+xml') {
    return displayName;
  }

  const newExt = MIME_TO_EXT[outputMimeType];
  if (!newExt) {
    return displayName;
  }

  // Replace the existing extension
  const dotIndex = displayName.lastIndexOf('.');
  if (dotIndex === -1) {
    return displayName + newExt;
  }

  return displayName.substring(0, dotIndex) + newExt;
}

export function downloadSingle(blob: Blob, displayName: string): void {
  saveAs(blob, displayName);
}

export async function downloadAllAsZip(images: ImageItem[]): Promise<void> {
  const doneImages = images.filter((img) => img.status === 'done' && img.compressedBlob !== null);

  if (doneImages.length === 0) {
    return;
  }

  const zip = new JSZip();

  // Track seen filenames to avoid silent overwrites when two images map to the same output name
  const seen = new Map<string, number>();
  for (const img of doneImages) {
    if (!img.compressedBlob) continue;
    let filename = getOutputFilename(img.displayName, img.compressedBlob.type);
    if (seen.has(filename)) {
      const count = seen.get(filename)! + 1;
      seen.set(filename, count);
      const dot = filename.lastIndexOf('.');
      if (dot > 0) {
        filename = `${filename.slice(0, dot)} (${count})${filename.slice(dot)}`;
      } else {
        filename = `${filename} (${count})`;
      }
    } else {
      seen.set(filename, 1);
    }
    zip.file(filename, img.compressedBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');

  const zipName = `compressed-images-${year}-${month}-${day}-${hours}-${minutes}.zip`;
  saveAs(zipBlob, zipName);
}
