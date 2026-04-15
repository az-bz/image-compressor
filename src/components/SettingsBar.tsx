import type { CompressionSettings } from '../types/image';

interface SettingsBarProps {
  settings: CompressionSettings;
  onUpdateSettings: (partial: Partial<CompressionSettings>) => void;
  disabled: boolean;
}

const DIMENSION_OPTIONS: CompressionSettings['maxDimension'][] = [360, 720, 1024, 2048, 4096];

export default function SettingsBar({ settings, onUpdateSettings, disabled }: SettingsBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      title={disabled ? 'Settings cannot be changed while compressing' : undefined}
    >
      {/* WebP Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.convertToWebP}
          onChange={(e) => onUpdateSettings({ convertToWebP: e.target.checked })}
          disabled={disabled}
          className="w-4 h-4 accent-green-600 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Convert to WebP</span>
      </label>

      {/* Resize Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.resize}
          onChange={(e) => onUpdateSettings({ resize: e.target.checked })}
          disabled={disabled}
          className="w-4 h-4 accent-green-600 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Resize images</span>
      </label>

      {/* Resize Dropdown — only when resize is ON */}
      {settings.resize && (
        <label className="flex items-center gap-2 select-none">
          <span className="text-sm text-gray-600">Max dimension:</span>
          <select
            value={settings.maxDimension}
            onChange={(e) =>
              onUpdateSettings({ maxDimension: Number(e.target.value) as CompressionSettings['maxDimension'] })
            }
            disabled={disabled}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DIMENSION_OPTIONS.map((dim) => (
              <option key={dim} value={dim}>
                {dim}px
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
