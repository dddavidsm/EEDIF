import { useRef } from 'react'
import { Camera, Trash2, UploadCloud } from 'lucide-react'
import { fileToDataUrl, newId } from '@/utils/codeGenerator'
import { useProjectStore } from '@/store/useProjectStore'
import type { Photo } from '@/types'

interface Props {
  lesionId: string
  photos: Photo[]
  enabled?: boolean
}

export function PhotoManager({ lesionId, photos, enabled = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addPhoto = useProjectStore(s => s.addPhoto)
  const deletePhoto = useProjectStore(s => s.deletePhoto)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !enabled || !lesionId) return
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-t2 tracking-[0.2em] uppercase">
          Fotos ({photos.length})
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!enabled}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text shadow-sm transition hover:border-accent/35 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="h-4 w-4" strokeWidth={2.2} />
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

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!enabled}
        className="border-2 border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-800/30 text-center transition hover:border-accent/55 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UploadCloud className="h-12 w-12 text-slate-400" strokeWidth={1.9} />
        <p className="mt-3 text-base font-semibold text-slate-200">Toca para añadir fotos de la lesion</p>
        <p className="mt-1 text-sm text-slate-300/80">
          Puedes tomar una foto o seleccionar imagenes desde el dispositivo.
        </p>
      </button>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <img
                src={p.dataUrl}
                alt={p.filename}
                className="w-full aspect-[4/3] object-cover bg-s2"
              />
              <button
                type="button"
                onClick={() => deletePhoto(p.id)}
                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Eliminar foto"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.3} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-5 text-center text-sm text-t2">
          No hay fotos adjuntas en esta lesion.
        </div>
      )}
    </div>
  )
}
