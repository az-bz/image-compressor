import { useState, useCallback } from 'react'
import type { DragEvent } from 'react'

interface DragHandlers {
  onDragEnter: (e: DragEvent<HTMLElement>) => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragLeave: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
}

interface UseDragAndDropReturn {
  isDragOver: boolean
  dragHandlers: DragHandlers
}

export function useDragAndDrop(onFiles: (files: File[]) => void): UseDragAndDropReturn {
  const [isDragOver, setIsDragOver] = useState(false)

  const onDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if leaving the drop zone itself (not a child element)
    const relatedTarget = e.relatedTarget as Node | null
    const currentTarget = e.currentTarget as Node
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setIsDragOver(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const dt = e.dataTransfer
      if (!dt) return

      const files = Array.from(dt.files)
      if (files.length > 0) {
        onFiles(files)
      }
    },
    [onFiles]
  )

  return {
    isDragOver,
    dragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  }
}
