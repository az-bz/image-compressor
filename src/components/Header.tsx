export default function Header() {
  return (
    <header className="text-center py-8">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/panda.svg"
          alt="Panda mascot"
          width={90}
          height={90}
          className="drop-shadow-sm"
          aria-hidden="true"
        />
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Image Compressor</h1>
      </div>
      <p className="mt-2 text-gray-500 text-lg">
        Compress images right in your browser. Private. Free. Fast.
      </p>
      <p className="mt-1 text-gray-400 text-sm">
        Strips all metadata (EXIF, GPS, AI markers) and replaces with realistic smartphone camera data.
      </p>
    </header>
  );
}
