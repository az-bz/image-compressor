import type { ImageItem } from '../types/image';
import ImageRow from './ImageRow';

interface ImageListProps {
  images: ImageItem[];
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export default function ImageList({ images, onDownload, onRemove, onRetry }: ImageListProps) {
  return (
    <div
      className="max-h-[600px] overflow-y-auto space-y-2 pr-1"
      aria-live="polite"
      aria-label="Image list"
    >
      {images.map((image) => (
        <ImageRow
          key={image.id}
          image={image}
          onDownload={() => onDownload(image.id)}
          onRemove={() => onRemove(image.id)}
          onRetry={() => onRetry(image.id)}
        />
      ))}
    </div>
  );
}
