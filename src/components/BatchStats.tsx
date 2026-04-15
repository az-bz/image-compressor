import type { ImageItem } from '../types/image';
import { formatBytes } from '../utils/formatBytes';

interface BatchStatsProps {
  images: ImageItem[];
}

export default function BatchStats({ images }: BatchStatsProps) {
  const doneImages = images.filter(
    (img) => img.status === 'done' && img.compressedSize != null
  );

  if (doneImages.length === 0) return null;

  const totalOriginal = doneImages.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressed = doneImages.reduce((sum, img) => sum + (img.compressedSize ?? 0), 0);
  const savedBytes = totalOriginal - totalCompressed;
  const savedPct =
    totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 100) : 0;

  const grew = savedBytes < 0;

  return (
    <div className={grew ? 'bg-orange-50 border border-orange-100 rounded-lg px-4 py-3' : 'bg-green-50 border border-green-100 rounded-lg px-4 py-3'}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          Total:{' '}
          <span className="text-gray-900">{formatBytes(totalOriginal)}</span>
          {' → '}
          <span className={grew ? 'text-orange-600 font-semibold' : 'text-green-700 font-semibold'}>{formatBytes(totalCompressed)}</span>
        </span>
        <span className={`text-sm font-semibold ${grew ? 'text-orange-600' : 'text-green-700'}`}>
          {grew
            ? `Grew ${formatBytes(Math.abs(savedBytes))} (+${Math.abs(savedPct)}%)`
            : `Saved ${formatBytes(savedBytes)} (${savedPct}%)`}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        All metadata stripped and replaced with smartphone camera data
      </p>
    </div>
  );
}
