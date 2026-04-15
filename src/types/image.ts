export type CompressionStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ImageItem {
  id: string;
  file: File;
  displayName: string;
  status: CompressionStatus;
  originalSize: number;
  compressedSize: number | null;
  compressedBlob: Blob | null;
  thumbnailUrl: string;
  progress: number;
  error: string | null;
  downloaded: boolean;
}

export interface CompressionSettings {
  convertToWebP: boolean;
  resize: boolean;
  maxDimension: 360 | 720 | 1024 | 2048 | 4096;
}
