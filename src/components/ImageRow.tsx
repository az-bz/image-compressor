import type { ImageItem } from '../types/image';
import { formatBytes } from '../utils/formatBytes';
import { getOutputFilename } from '../utils/download';
import ProgressIndicator from './ProgressIndicator';

interface ImageRowProps {
  image: ImageItem;
  onDownload: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

function PlaceholderThumbnail() {
  return (
    <div className="w-[60px] h-[60px] flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5zM12.75 8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
    </div>
  );
}

export default function ImageRow({ image, onDownload, onRemove, onRetry }: ImageRowProps) {
  const savingsPct =
    image.status === 'done' && image.compressedSize != null && image.originalSize > 0
      ? Math.round((1 - image.compressedSize / image.originalSize) * 100)
      : null;

  const outputFilename = image.compressedBlob
    ? getOutputFilename(image.displayName, image.compressedBlob.type)
    : image.displayName;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-2" data-testid="image-row">
      <div className="flex items-center gap-3 min-w-0">
        {/* Thumbnail */}
        {image.thumbnailUrl ? (
          <img
            src={image.thumbnailUrl}
            alt={image.displayName}
            className="w-[60px] h-[60px] flex-shrink-0 object-cover rounded"
          />
        ) : (
          <PlaceholderThumbnail />
        )}

        {/* Filename + metadata note */}
        <div className="flex flex-col min-w-0 max-w-[200px]">
          <span
            className="truncate text-sm font-medium text-gray-800"
            title={image.displayName}
          >
            {image.displayName}
          </span>
          {image.status === 'done' && (() => {
            const inputType = image.file.type;
            const outputType = image.compressedBlob?.type;
            let note: string | null = null;
            if (outputType === 'image/jpeg') {
              note = 'Metadata cleared · iPhone/Samsung EXIF injected';
            } else if (outputType === 'image/webp' && inputType !== 'image/webp') {
              note = 'Converted to WebP · Metadata cleared';
            } else if (outputType === 'image/webp' || outputType === 'image/png' || outputType === 'image/bmp') {
              note = 'Metadata cleared';
            } else if (outputType === 'image/svg+xml') {
              note = 'Optimized · Editor metadata removed';
            }
            return note ? (
              <p className="mt-0.5 text-xs text-gray-400 truncate">{note}</p>
            ) : null;
          })()}
        </div>

        {/* Original size */}
        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
          {formatBytes(image.originalSize)}
        </span>

        {/* Arrow + Compressed size + Savings badge */}
        {image.status === 'done' && image.compressedSize != null && (
          <>
            <span className="text-gray-400 flex-shrink-0" aria-hidden="true">
              →
            </span>
            <span className="text-sm text-gray-700 whitespace-nowrap flex-shrink-0">
              {formatBytes(image.compressedSize)}
            </span>
            {savingsPct !== null && (
              <span
                className={[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0',
                  savingsPct > 0
                    ? 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600',
                ].join(' ')}
              >
                {savingsPct > 0 ? `-${savingsPct}%` : `+${Math.abs(savingsPct)}%`}
              </span>
            )}
            {image.compressedBlob?.type === 'image/webp' && image.file.type !== 'image/webp' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 flex-shrink-0">
                WebP
              </span>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress indicator */}
        <div className="flex-shrink-0">
          <ProgressIndicator status={image.status} />
        </div>

        {/* Retry button — only on error */}
        {image.status === 'error' && (
          <button
            onClick={onRetry}
            aria-label={`Retry ${image.displayName}`}
            className="flex-shrink-0 p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Download button — only when done */}
        {image.status === 'done' && (
          <button
            onClick={onDownload}
            aria-label={`Download ${outputFilename}`}
            className="flex-shrink-0 p-2 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        )}

        {/* Remove button — always visible */}
        <button
          onClick={onRemove}
          aria-label={`Remove ${image.displayName}`}
          className="flex-shrink-0 p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error message */}
      {image.status === 'error' && image.error && (
        <p className="mt-1.5 text-xs text-red-500 pl-[72px]">{image.error}</p>
      )}
    </div>
  );
}
