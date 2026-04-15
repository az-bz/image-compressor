interface ActionBarProps {
  imageCount: number;
  hasPending: boolean;
  isCompressing: boolean;
  hasCompressedImages: boolean;
  onCompress: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
}

export default function ActionBar({
  imageCount,
  hasPending,
  isCompressing,
  hasCompressedImages,
  onCompress,
  onDownloadZip,
  onClearAll,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Image count badge */}
      <span className="text-sm text-gray-500 font-medium">
        {imageCount} {imageCount === 1 ? 'image' : 'images'}
      </span>

      <div className="flex-1" />

      {/* Compress button */}
      <button
        onClick={onCompress}
        disabled={!hasPending || isCompressing}
        aria-label="Compress images"
        className={[
          'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-colors',
          !hasPending || isCompressing
            ? 'bg-green-300 text-white cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        ].join(' ')}
      >
        {isCompressing && (
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {isCompressing ? 'Compressing...' : 'Compress'}
      </button>

      {/* Download All as ZIP */}
      <button
        onClick={onDownloadZip}
        disabled={isCompressing || !hasCompressedImages}
        aria-label="Download all as ZIP"
        className={[
          'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-colors',
          isCompressing || !hasCompressedImages
            ? 'bg-green-300 text-white cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        ].join(' ')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
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
        Download All as ZIP
      </button>

      {/* Clear All */}
      <button
        onClick={onClearAll}
        aria-label="Clear all images"
        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}
