import { useRef, forwardRef } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(function DropZone({ onFiles }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDragOver, dragHandlers } = useDragAndDrop(onFiles);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFiles(files);
    }
    // Reset so same files can be re-selected
    e.target.value = '';
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="Upload images"
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      {...dragHandlers}
      className={[
        'flex items-center justify-center w-full rounded-xl cursor-pointer select-none',
        'border-2 border-dashed transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
        isDragOver
          ? 'border-green-600 bg-green-100'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
      ].join(' ')}
      style={{ minHeight: '140px' }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        {/* Panda mascot */}
        <img
          src="/panda.svg"
          alt=""
          aria-hidden="true"
          width={48}
          height={48}
          className={`transition-opacity duration-150 ${isDragOver ? 'opacity-100' : 'opacity-70'}`}
        />

        <p className={`text-base font-medium ${isDragOver ? 'text-green-700' : 'text-gray-500'}`}>
          {isDragOver ? 'Release to upload!' : 'Drop images here or click to browse'}
        </p>
      </div>
    </div>
  );
});

export default DropZone;
