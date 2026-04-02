import { useRef } from 'react'
import { fileToDataUrl, newId } from '@/utils/codeGenerator'
import { useProjectStore } from '@/store/useProjectStore'
import type { Photo } from '@/types'

interface Props {
  lesionId: string
  photos: Photo[]
}

export function PhotoManager({ lesionId, photos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addPhoto = useProjectStore(s => s.addPhoto)
  const deletePhoto = useProjectStore(s => s.deletePhoto)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file)
      const photo: Photo = {
        id: newId(),
        lesionId,
        dataUrl,
        mimeType: file.type,
        filename: file.name,
        capturedAt: new Date().toISOString(),
      }
      await addPhoto(photo)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
          Fotos ({photos.length})
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[11px] font-semibold text-accent cursor-pointer hover:underline"
        >
          + Agregar foto
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map(p => (
            <div key={p.id} className="relative group">
              <img
                src={p.dataUrl}
                alt={p.filename}
                className="w-full aspect-[4/3] object-cover rounded-[var(--radius)] border border-border bg-s2"
              />
              <button
                type="button"
                onClick={() => deletePhoto(p.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger/80 text-white text-[10px] font-bold
                  opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-t3 text-[11px] border border-dashed border-border rounded-[var(--radius)]">
          📷 Sin fotos. Toca "Agregar foto" para capturar.
        </div>
      )}
    </div>
  )
}
