import { useRef, useCallback } from 'react'
import { useImageCompression } from './hooks/useImageCompression'
import { downloadSingle, getOutputFilename, downloadAllAsZip } from './utils/download'
import Header from './components/Header'
import DropZone from './components/DropZone'
import SettingsBar from './components/SettingsBar'
import ActionBar from './components/ActionBar'
import BatchStats from './components/BatchStats'
import ImageList from './components/ImageList'
import Toast from './components/Toast'

export default function App() {
  const {
    images,
    settings,
    toastMessage,
    isCompressing,
    hasCompressedImages,
    addImages,
    removeImage,
    clearAll,
    startCompression,
    retryImage,
    updateSettings,
    setDownloaded,
    setAllDownloaded,
  } = useImageCompression()

  const dropZoneRef = useRef<HTMLDivElement>(null)

  const hasImages = images.length > 0
  const hasPending = images.some((img) => img.status === 'pending')

  const handleDownloadZip = useCallback(async () => {
    try {
      await downloadAllAsZip(images)
      setAllDownloaded()
    } catch (err) {
      console.error('ZIP download failed:', err)
    }
  }, [images, setAllDownloaded])

  const handleDownload = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id)
      if (!image || !image.compressedBlob) return
      downloadSingle(
        image.compressedBlob,
        getOutputFilename(image.displayName, image.compressedBlob.type)
      )
      setDownloaded(id)
    },
    [images, setDownloaded]
  )

  const handleClearAll = useCallback(() => {
    clearAll()
    // Focus the drop zone after clearing
    setTimeout(() => {
      dropZoneRef.current?.focus()
    }, 0)
  }, [clearAll])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-green-50">
      <Header />

      <DropZone ref={dropZoneRef} onFiles={addImages} />

      {hasImages && (
        <div className="flex flex-col gap-3 mt-3">
          <SettingsBar
            settings={settings}
            onUpdateSettings={updateSettings}
            disabled={isCompressing}
          />

          <ActionBar
            imageCount={images.length}
            hasPending={hasPending}
            isCompressing={isCompressing}
            hasCompressedImages={hasCompressedImages}
            onCompress={startCompression}
            onDownloadZip={handleDownloadZip}
            onClearAll={handleClearAll}
          />

          <BatchStats images={images} />

          <ImageList
            images={images}
            onDownload={handleDownload}
            onRemove={removeImage}
            onRetry={retryImage}
          />
        </div>
      )}

      <Toast message={toastMessage} />
    </div>
  )
}
