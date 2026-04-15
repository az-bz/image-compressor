import { optimize } from 'svgo/browser';

export async function compressSvg(file: File): Promise<{ blob: Blob; size: number }> {
  const text = await file.text();
  const result = optimize(text, { multipass: true });
  if (!result.data || result.data.length === 0) {
    throw new Error('SVG optimization produced empty output');
  }
  const blob = new Blob([result.data], { type: 'image/svg+xml' });
  return { blob, size: blob.size };
}
