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
          className="app-btn app-btn-ghost !min-h-[34px] !px-3 !py-1.5 !text-[12px]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Agregar foto
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-danger/90 text-white text-[10px] font-bold
                  opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                aria-label="Eliminar foto"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-t2 text-[12px] border border-dashed border-border rounded-[var(--radius)] bg-s2/45">
          Sin fotos adjuntas. Usa "Agregar foto" para capturar o subir imagen.
        </div>
      )}
    </div>
  )
}
