import gifsicle from 'gifsicle-wasm-browser';

export async function compressGif(file: File): Promise<{ blob: Blob; size: number }> {
  const results = await gifsicle.run({
    input: [{ file, name: 'input.gif' }],
    command: ['-O1 --lossy=30 input.gif -o /out/output.gif'],
  });
  const blob = new Blob([results[0]], { type: 'image/gif' });
  return { blob, size: blob.size };
}
