import { useState, useRef, useCallback } from 'react'
import type { ImageItem, CompressionSettings } from '../types/image'
import { compressImage } from '../utils/compress'

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
])

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif'])

const MAX_CONCURRENT = 1
const MAX_IMAGES = 100

interface UseImageCompressionReturn {
  images: ImageItem[]
  settings: CompressionSettings
  toastMessage: string | null
  isCompressing: boolean
  hasCompressedImages: boolean
  addImages: (files: File[]) => void
  removeImage: (id: string) => void
  clearAll: () => void
  startCompression: () => void
  retryImage: (id: string) => void
  updateSettings: (partial: Partial<CompressionSettings>) => void
  setDownloaded: (id: string) => void
  setAllDownloaded: () => void
}

export function useImageCompression(): UseImageCompressionReturn {
  const [images, setImages] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<CompressionSettings>({
    convertToWebP: false,
    resize: false,
    maxDimension: 2048,
  })
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Refs for values needed synchronously inside async closures
  const generationRef = useRef<number>(0)
  const imagesRef = useRef<ImageItem[]>([])
  const settingsRef = useRef<CompressionSettings>(settings)
  const activeCountRef = useRef<number>(0)
  const queueRef = useRef<Array<() => void>>([])

  // Keep refs in sync with state
  const updateImages = useCallback((updater: (prev: ImageItem[]) => ImageItem[]) => {
    setImages((prev) => {
      const next = updater(prev)
      imagesRef.current = next
      return next
    })
  }, [])

  const updateSettingsState = useCallback((updater: (prev: CompressionSettings) => CompressionSettings) => {
    setSettings((prev) => {
      const next = updater(prev)
      settingsRef.current = next
      return next
    })
  }, [])

  const showToast = useCallback((message: string) => {
    // Reset to null first so React doesn't bail out when the same message is
    // shown twice in a row (e.g. two identical validation errors back-to-back).
    // The microtask fires synchronously after React flushes the null update.
    setToastMessage(null)
    setTimeout(() => setToastMessage(message), 0)
  }, [])

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) return
    if (activeCountRef.current >= MAX_CONCURRENT) return
    const next = queueRef.current.shift()
    if (next) next()
  }, [])

  const enqueueImage = useCallback(
    (id: string, skipStatusUpdate: boolean = false) => {
      const capturedGeneration = generationRef.current
      const settingsSnapshot = { ...settingsRef.current }

      const run = async () => {
        activeCountRef.current += 1

        // Get file from current images synchronously via ref
        const imgSnapshot = imagesRef.current.find((i) => i.id === id)
        if (!imgSnapshot) {
          activeCountRef.current -= 1
          processNext()
          return
        }

        const file = imgSnapshot.file

        // Set status to processing (skip if already set by a batch call in startCompression)
        if (!skipStatusUpdate) {
          updateImages((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: 'processing' as const } : i))
          )
        }

        try {
          // Check generation is still valid
          if (generationRef.current !== capturedGeneration) {
            activeCountRef.current -= 1
            processNext()
            return
          }

          const COMPRESSION_TIMEOUT_MS = 15_000
          const abortController = new AbortController()
          let timeoutId: ReturnType<typeof setTimeout> | null = null

          let result: Awaited<ReturnType<typeof compressImage>>
          try {
            result = await Promise.race([
              compressImage(
                file,
                settingsSnapshot,
                (progress: number) => {
                  if (generationRef.current !== capturedGeneration) return
                  updateImages((prev) =>
                    prev.map((i) => (i.id === id ? { ...i, progress } : i))
                  )
                },
                abortController.signal,
              ),
              new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                  abortController.abort()
                  reject(new Error('Compression timed out after 15 seconds'))
                }, COMPRESSION_TIMEOUT_MS)
              }),
            ])
            if (timeoutId) clearTimeout(timeoutId)
          } catch (raceErr) {
            if (timeoutId) clearTimeout(timeoutId)
            throw raceErr
          }

          if (generationRef.current !== capturedGeneration) {
            activeCountRef.current -= 1
            processNext()
            return
          }

          updateImages((prev) => {
            const img = prev.find((i) => i.id === id)
            if (!img) return prev
            const isHeic = HEIC_MIME_TYPES.has(img.file.type)
            const newThumbnailUrl =
              isHeic ? URL.createObjectURL(result.blob) : img.thumbnailUrl
            return prev.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: 'done' as const,
                    compressedBlob: result.blob,
                    compressedSize: result.size,
                    progress: 100,
                    thumbnailUrl: isHeic ? newThumbnailUrl : i.thumbnailUrl,
                  }
                : i
            )
          })
        } catch (err) {
          if (generationRef.current !== capturedGeneration) {
            activeCountRef.current -= 1
            processNext()
            return
          }
          const message = err instanceof Error ? err.message : 'Compression failed'
          updateImages((prev) => {
            const img = prev.find((i) => i.id === id)
            if (!img) return prev
            return prev.map((i) =>
              i.id === id
                ? { ...i, status: 'error' as const, error: message, progress: 0 }
                : i
            )
          })
        } finally {
          activeCountRef.current -= 1
          processNext()
        }
      }

      if (activeCountRef.current < MAX_CONCURRENT) {
        run()
      } else {
        queueRef.current.push(run)
      }
    },
    [processNext, updateImages]
  )

  const addImages = useCallback(
    (files: File[]) => {
      const toastMessages: string[] = []
      const validFiles: File[] = []

      for (const file of files) {
        if (file.size === 0) {
          toastMessages.push(`Empty file skipped: ${file.name}`)
          continue
        }
        if (file.size > 50 * 1024 * 1024) {
          toastMessages.push(`File too large (max 50 MB): ${file.name}`)
          continue
        }
        if (!SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) {
          toastMessages.push(`Unsupported format: ${file.name}`)
          continue
        }
        validFiles.push(file)
      }

      if (toastMessages.length > 0 && validFiles.length === 0) {
        showToast(toastMessages.join(' | '))
        return
      }

      if (toastMessages.length > 0) {
        showToast(toastMessages.join(' | '))
      }

      if (validFiles.length === 0) return

      // Generate IDs and blob URLs OUTSIDE the state updater so that React
      // StrictMode's double-invocation of state updaters does not create
      // two different IDs for the same file (which breaks imagesRef sync).
      const preparedFiles = validFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        isHeic: HEIC_MIME_TYPES.has(file.type.toLowerCase()),
        thumbnailUrl: HEIC_MIME_TYPES.has(file.type.toLowerCase()) ? '' : URL.createObjectURL(file),
      }))

      // Compute limit-exceeded before the state updater so showToast is called
      // outside the updater (side effects inside updaters are an anti-pattern).
      const currentCount = imagesRef.current.length
      const allDownloadedNow =
        currentCount > 0 && imagesRef.current.every((img) => img.downloaded === true)
      const availableSlotsNow = allDownloadedNow ? MAX_IMAGES : MAX_IMAGES - currentCount
      let limitExceeded = false
      if (preparedFiles.length > availableSlotsNow) {
        // Revoke URLs for files that won't be added
        preparedFiles.slice(availableSlotsNow).forEach((pf) => {
          if (pf.thumbnailUrl) URL.revokeObjectURL(pf.thumbnailUrl)
        })
        limitExceeded = true
      }

      if (limitExceeded) {
        showToast('Maximum 100 images at a time. Only the first 100 were added.')
      }

      updateImages((prev) => {
        // Determine if we should replace or append
        const allDownloaded =
          prev.length > 0 && prev.every((img) => img.downloaded === true)
        const isReplacing = allDownloaded

        if (isReplacing) {
          // Revoke old URLs and increment generation
          prev.forEach((img) => {
            if (img.thumbnailUrl) URL.revokeObjectURL(img.thumbnailUrl)
          })
          generationRef.current += 1
        }

        const existingImages = isReplacing ? [] : prev

        // Check 100-image limit
        const availableSlots = MAX_IMAGES - existingImages.length
        let filesToAdd = preparedFiles

        if (preparedFiles.length > availableSlots) {
          filesToAdd = preparedFiles.slice(0, availableSlots)
        }

        if (filesToAdd.length === 0) return existingImages

        // Build set of display names already in use
        const usedDisplayNames = new Set<string>(existingImages.map((i) => i.displayName))

        const newItems: ImageItem[] = filesToAdd.map(({ file, id, thumbnailUrl }) => {
          const originalName = file.name
          let displayName = originalName

          if (usedDisplayNames.has(displayName)) {
            const dotIndex = originalName.lastIndexOf('.')
            const nameWithoutExt =
              dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName
            const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : ''

            let counter = 2
            while (usedDisplayNames.has(`${nameWithoutExt} (${counter})${ext}`)) {
              counter++
            }
            displayName = `${nameWithoutExt} (${counter})${ext}`
          }

          usedDisplayNames.add(displayName)

          return {
            id,
            file,
            displayName,
            status: 'pending' as const,
            originalSize: file.size,
            compressedSize: null,
            compressedBlob: null,
            thumbnailUrl,
            progress: 0,
            error: null,
            downloaded: false,
          }
        })

        return [...existingImages, ...newItems]
      })
    },
    [showToast, updateImages]
  )

  const removeImage = useCallback(
    (id: string) => {
      updateImages((prev) => {
        const img = prev.find((i) => i.id === id)
        if (!img) return prev
        if (img.thumbnailUrl) URL.revokeObjectURL(img.thumbnailUrl)
        return prev.filter((i) => i.id !== id)
      })
    },
    [updateImages]
  )

  const clearAll = useCallback(() => {
    generationRef.current += 1
    queueRef.current = []
    updateImages((prev) => {
      prev.forEach((img) => {
        if (img.thumbnailUrl) URL.revokeObjectURL(img.thumbnailUrl)
      })
      return []
    })
  }, [updateImages])

  const startCompression = useCallback(() => {
    const pendingIds = imagesRef.current
      .filter((i) => i.status === 'pending')
      .map((i) => i.id)
    if (pendingIds.length === 0) return
    // Single batched update so all images transition to 'processing' atomically,
    // avoiding the React state-batching race where each enqueueImage call would
    // receive the same stale `prev` snapshot and overwrite each other.
    updateImages((prev) =>
      prev.map((img) =>
        pendingIds.includes(img.id) ? { ...img, status: 'processing' as const } : img
      )
    )
    pendingIds.forEach((id) => enqueueImage(id, true))
  }, [enqueueImage, updateImages])

  const retryImage = useCallback(
    (id: string) => {
      // Revoke existing HEIC thumbnail blob URL before overwriting it
      const existing = imagesRef.current.find((i) => i.id === id)
      if (
        existing &&
        (existing.file.type === 'image/heic' || existing.file.type === 'image/heif')
      ) {
        if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(existing.thumbnailUrl)
        }
      }

      updateImages((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'pending' as const,
                progress: 0,
                compressedBlob: null,
                compressedSize: null,
                error: null,
                // Reset HEIC thumbnail to placeholder so UI shows placeholder until compression succeeds
                thumbnailUrl:
                  i.file.type === 'image/heic' || i.file.type === 'image/heif'
                    ? ''
                    : i.thumbnailUrl,
              }
            : i
        )
      )
      // Enqueue after the state update has propagated to imagesRef.
      // setTimeout(fn, 0) is safe here: React synchronously flushes the updater
      // above before this tick fires, so imagesRef.current is already up to date.
      setTimeout(() => {
        enqueueImage(id)
      }, 0)
    },
    [enqueueImage, updateImages]
  )

  const updateSettings = useCallback(
    (partial: Partial<CompressionSettings>) => {
      const currentlyCompressing = imagesRef.current.some(
        (img) => img.status === 'processing'
      )
      if (currentlyCompressing) return
      updateSettingsState((prev) => ({ ...prev, ...partial }))
    },
    [updateSettingsState]
  )

  const setDownloaded = useCallback(
    (id: string) => {
      updateImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, downloaded: true } : i))
      )
    },
    [updateImages]
  )

  const setAllDownloaded = useCallback(() => {
    updateImages((prev) =>
      prev.map((i) => (i.status === 'done' ? { ...i, downloaded: true } : i))
    )
  }, [updateImages])

  // Computed values
  const isCompressing = images.some((img) => img.status === 'processing')
  const hasCompressedImages = images.some((img) => img.status === 'done')

  return {
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
  }
}
