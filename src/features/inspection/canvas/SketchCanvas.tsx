import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Text, Group, Shape } from 'react-konva'
import type Konva from 'konva'
import { useProjectStore } from '@/store/useProjectStore'
import { LESION_TYPES } from '@/types'
import type { LesionTypeCode } from '@/types'
import { newId, generateLesionCode, getLesionColor } from '@/utils/codeGenerator'
import { QuickTypePicker } from './QuickTypePicker'

export type CanvasTool = 'select' | 'rect' | 'lesion'

interface Props {
  tool: CanvasTool
  selectedLesionId: string | null
  onSelectLesion: (id: string | null) => void
}

interface DrawState {
  x: number
  y: number
  w: number
  h: number
}

interface PendingPin {
  cx: number
  cy: number
  sx: number
  sy: number
}

interface PendingRect {
  norm: { x: number; y: number; w: number; h: number }
  sx: number
  sy: number
  label: string
}

const GRID = 50
const GRID_S = 10
const MIN_RECT = 15

export function SketchCanvas({ tool, selectedLesionId, onSelectLesion }: Props) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null)

  const [size, setSize] = useState({ w: 800, h: 500 })
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [draw, setDraw] = useState<DrawState | null>(null)
  const [pending, setPending] = useState<PendingPin | null>(null)
  const [pendingRect, setPendingRect] = useState<PendingRect | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const elements = useProjectStore(s => s.canvasElements)
  const lesions = useProjectStore(s => s.lesions)
  const zoneId = useProjectStore(s => s.activeZoneId)
  const upsert = useProjectStore(s => s.upsertCanvasElement)
  const createLesion = useProjectStore(s => s.createLesion)
  const deleteCanvasElement = useProjectStore(s => s.deleteCanvasElement)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        void deleteCanvasElement(selectedElementId)
        setSelectedElementId(null)
      }
      if (e.key === 'Escape') {
        setPending(null)
        setPendingRect(null)
        setDraw(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedElementId, deleteCanvasElement])

  const toCanvas = useCallback((): { x: number; y: number } => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const p = stage.getPointerPosition()
    if (!p) return { x: 0, y: 0 }
    return {
      x: (p.x - stage.x()) / stage.scaleX(),
      y: (p.y - stage.y()) / stage.scaleY(),
    }
  }, [])

  const finalizeRect = useCallback(() => {
    if (!draw) return
    if (Math.abs(draw.w) <= MIN_RECT || Math.abs(draw.h) <= MIN_RECT) {
      setDraw(null)
      return
    }

    const norm = {
      x: draw.w < 0 ? draw.x + draw.w : draw.x,
      y: draw.h < 0 ? draw.y + draw.h : draw.y,
      w: Math.abs(draw.w),
      h: Math.abs(draw.h),
    }

    const stage = stageRef.current
    if (stage && zoneId) {
      const centerCanvas = { x: norm.x + norm.w / 2, y: norm.y + norm.h / 2 }
      const sx = centerCanvas.x * scale + stage.x()
      const sy = centerCanvas.y * scale + stage.y()
      setPendingRect({ norm, sx, sy, label: '' })
    }

    setDraw(null)
  }, [draw, zoneId, scale])

  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const old = stage.scaleX()
    const factor = 1.08
    const next = e.evt.deltaY < 0 ? Math.min(old * factor, 5) : Math.max(old / factor, 0.15)
    const mp = { x: (pointer.x - stage.x()) / old, y: (pointer.y - stage.y()) / old }

    setScale(next)
    setPos({ x: pointer.x - mp.x * next, y: pointer.y - mp.y * next })
  }, [])

  const onTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const ts = e.evt.touches

    if (ts.length === 2) {
      e.evt.preventDefault()
      const d = Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY)
      const cx = (ts[0].clientX + ts[1].clientX) / 2
      const cy = (ts[0].clientY + ts[1].clientY) / 2

      if (lastPinchRef.current) {
        const prev = lastPinchRef.current
        const ratio = d / prev.dist

        setScale(s => {
          const next = Math.min(Math.max(s * ratio, 0.15), 5)
          setPos(p => {
            const rect = containerRef.current?.getBoundingClientRect()
            const sx = cx - (rect?.left ?? 0)
            const sy = cy - (rect?.top ?? 0)
            const mp = { x: (sx - p.x) / s, y: (sy - p.y) / s }
            return {
              x: sx - mp.x * next + (cx - prev.cx),
              y: sy - mp.y * next + (cy - prev.cy),
            }
          })
          return next
        })
      }

      lastPinchRef.current = { dist: d, cx, cy }
      return
    }

    if (tool === 'rect' && draw && ts.length === 1) {
      const p = toCanvas()
      setDraw(prev => (prev ? { ...prev, w: p.x - prev.x, h: p.y - prev.y } : null))
    }
  }, [tool, draw, toCanvas])

  const onTouchEnd = useCallback(() => {
    if (tool === 'rect' && draw) finalizeRect()
    lastPinchRef.current = null
  }, [tool, draw, finalizeRect])

  const onMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return

    if (tool === 'rect') {
      const p = toCanvas()
      setDraw({ x: p.x, y: p.y, w: 0, h: 0 })
      setSelectedElementId(null)
      onSelectLesion(null)
    }
  }, [tool, toCanvas, onSelectLesion])

  const onTouchStart = useCallback(() => {
    if (tool === 'rect') {
      const p = toCanvas()
      setDraw({ x: p.x, y: p.y, w: 0, h: 0 })
      setSelectedElementId(null)
      onSelectLesion(null)
    }
    if (tool === 'lesion') {
      const c = toCanvas()
      const stage = stageRef.current
      const sp = stage?.getPointerPosition()
      if (sp) setPending({ cx: c.x, cy: c.y, sx: sp.x, sy: sp.y })
    }
  }, [tool, toCanvas, onSelectLesion])

  const onMouseMove = useCallback(() => {
    if (tool === 'rect' && draw) {
      const p = toCanvas()
      setDraw(prev => (prev ? { ...prev, w: p.x - prev.x, h: p.y - prev.y } : null))
    }
  }, [tool, draw, toCanvas])

  const onMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'rect' && draw) {
      finalizeRect()
      return
    }

    if (tool === 'lesion') {
      const c = toCanvas()
      const stage = stageRef.current
      const sp = stage?.getPointerPosition()
      if (sp) setPending({ cx: c.x, cy: c.y, sx: sp.x, sy: sp.y })
      return
    }

    if (tool === 'select') {
      const cls = e.target.getClassName()
      if (cls === 'Stage') {
        onSelectLesion(null)
        setSelectedElementId(null)
      }
    }
  }, [tool, draw, toCanvas, onSelectLesion, finalizeRect])

  const confirmRect = useCallback(() => {
    if (!pendingRect || !zoneId) return
    void upsert({ id: newId(), zoneId, ...pendingRect.norm, label: pendingRect.label.trim() })
    setPendingRect(null)
  }, [pendingRect, zoneId, upsert])

  const onTypeSelected = useCallback(async (typeCode: LesionTypeCode) => {
    if (!pending || !zoneId) return

    const lesionType = LESION_TYPES.find(t => t.code === typeCode)
    const defaultSit = 'P' as const
    const defaultOri = lesionType?.hasOrientation ? ('H' as const) : null
    const code = generateLesionCode(typeCode, defaultSit, defaultOri, lesions)

    await createLesion({
      id: newId(),
      zoneId,
      code,
      tipus: typeCode,
      sit: defaultSit,
      ori: defaultOri,
      urgency: 'L',
      obs: '',
      x: pending.cx,
      y: pending.cy,
      photoIds: [],
    })

    setPending(null)
  }, [pending, zoneId, lesions, createLesion])

  const onDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target !== stageRef.current) return
    setPos({ x: e.target.x(), y: e.target.y() })
  }, [])

  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) ?? null : null

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-bg" style={{ cursor: tool === 'select' ? 'grab' : 'crosshair' }}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable={tool === 'select'}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDragEnd={onDragEnd}
      >
        <Layer listening={false}>
          <GridShape scale={scale} pos={pos} size={size} />
        </Layer>

        <Layer>
          {elements.map(el => {
            const isSel = selectedElementId === el.id
            return (
              <Group key={el.id} id={el.id}>
                <Rect
                  x={el.x}
                  y={el.y}
                  width={el.w}
                  height={el.h}
                  fill={isSel ? 'rgba(37,99,235,0.16)' : 'rgba(37,99,235,0.06)'}
                  stroke={isSel ? '#1D4ED8' : 'rgba(37,99,235,0.38)'}
                  strokeWidth={isSel ? 2.5 : 1.7}
                  cornerRadius={4}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (tool !== 'select') return
                    setSelectedElementId(el.id)
                    onSelectLesion(null)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    if (tool !== 'select') return
                    setSelectedElementId(el.id)
                    onSelectLesion(null)
                  }}
                  onDragEnd={(e) => {
                    const x = e.target.x()
                    const y = e.target.y()
                    void upsert({ ...el, x, y })
                  }}
                />
                {el.label && (
                  <Text
                    x={el.x + 8}
                    y={el.y + 7}
                    text={el.label}
                    fill="rgba(16,35,62,0.74)"
                    fontSize={12}
                    fontFamily="'IBM Plex Mono', monospace"
                    fontStyle="600"
                  />
                )}
              </Group>
            )
          })}
        </Layer>

        {draw && (
          <Layer listening={false}>
            <Rect
              x={draw.w < 0 ? draw.x + draw.w : draw.x}
              y={draw.h < 0 ? draw.y + draw.h : draw.y}
              width={Math.abs(draw.w)}
              height={Math.abs(draw.h)}
              fill="rgba(37,99,235,0.14)"
              stroke="#1D4ED8"
              strokeWidth={2}
              dash={[6, 3]}
              cornerRadius={4}
            />
          </Layer>
        )}

        <Layer>
          {lesions.map(l => (
            <LesionPin
              key={l.id}
              l={l}
              isSelected={selectedLesionId === l.id}
              onSelect={() => {
                setSelectedElementId(null)
                onSelectLesion(l.id)
              }}
            />
          ))}
        </Layer>
      </Stage>

      {pending && (
        <QuickTypePicker
          x={pending.sx}
          y={pending.sy}
          onSelect={onTypeSelected}
          onCancel={() => setPending(null)}
        />
      )}

      {pendingRect && (
        <div
          className="absolute z-20 animate-fade-in"
          style={{
            left: Math.max(12, Math.min(pendingRect.sx - 110, size.w - 240)),
            top: Math.max(12, Math.min(pendingRect.sy - 20, size.h - 110)),
          }}
        >
          <div className="bg-s1 border border-border rounded-[var(--radius-md)] shadow-[0_12px_35px_rgba(16,35,62,.2)] p-3.5 w-[230px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-2">Etiqueta del area</div>
            <input
              autoFocus
              type="text"
              value={pendingRect.label}
              onChange={e => setPendingRect(r => (r ? { ...r, label: e.target.value } : null))}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRect()
                if (e.key === 'Escape') setPendingRect(null)
              }}
              placeholder="Ej: Sala, Cocina, Pasillo..."
              className="w-full bg-s2 border border-border rounded-[var(--radius)] text-[13px] text-text px-3 py-2 outline-none focus:border-accent transition-colors mb-2.5"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
            <div className="flex gap-2">
              <button onClick={confirmRect} className="app-btn app-btn-accent flex-1 !min-h-[34px] !text-[12px] !py-1.5">Guardar</button>
              <button onClick={() => setPendingRect(null)} className="app-btn app-btn-ghost !min-h-[34px] !text-[12px] !py-1.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {selectedElement && (
        <div className="absolute right-2 bottom-2 z-10 flex items-center gap-2 bg-s1/95 border border-border rounded-[var(--radius)] px-2.5 py-2 shadow-sm">
          <span className="text-[11px] text-t2 font-mono truncate max-w-[140px]">{selectedElement.label || 'Area sin etiqueta'}</span>
          <button
            className="app-btn !min-h-[30px] !px-2.5 !py-1 !text-[11px] bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20"
            onClick={() => {
              if (!selectedElementId) return
              void deleteCanvasElement(selectedElementId)
              setSelectedElementId(null)
            }}
          >
            Eliminar
          </button>
        </div>
      )}

      <div className="absolute bottom-2 left-2 text-[11px] font-mono text-t2 bg-s1/92 backdrop-blur-sm px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-border select-none">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

function GridShape({
  scale,
  pos,
  size,
}: {
  scale: number
  pos: { x: number; y: number }
  size: { w: number; h: number }
}) {
  return (
    <Shape
      sceneFunc={(ctx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = (ctx as any)._context as CanvasRenderingContext2D

        const x0 = Math.floor(-pos.x / scale / GRID) * GRID
        const x1 = x0 + size.w / scale + GRID * 2
        const y0 = Math.floor(-pos.y / scale / GRID) * GRID
        const y1 = y0 + size.h / scale + GRID * 2

        c.save()

        c.beginPath()
        c.strokeStyle = 'rgba(16,35,62,0.14)'
        c.lineWidth = 1 / scale
        for (let x = x0; x <= x1; x += GRID) {
          c.moveTo(x, y0)
          c.lineTo(x, y1)
        }
        for (let y = y0; y <= y1; y += GRID) {
          c.moveTo(x0, y)
          c.lineTo(x1, y)
        }
        c.stroke()

        if (scale > 0.5) {
          c.beginPath()
          c.strokeStyle = 'rgba(16,35,62,0.07)'
          c.lineWidth = 0.5 / scale
          for (let x = x0; x <= x1; x += GRID_S) {
            if (x % GRID === 0) continue
            c.moveTo(x, y0)
            c.lineTo(x, y1)
          }
          for (let y = y0; y <= y1; y += GRID_S) {
            if (y % GRID === 0) continue
            c.moveTo(x0, y)
            c.lineTo(x1, y)
          }
          c.stroke()
        }

        c.restore()
      }}
    />
  )
}

function LesionPin({
  l,
  isSelected,
  onSelect,
}: {
  l: { id: string; x: number; y: number; code: string; tipus: string; obs: string }
  isSelected: boolean
  onSelect: () => void
}) {
  const color = getLesionColor(l.tipus as LesionTypeCode)
  const r = isSelected ? 14 : 11
  const fs = l.code.length > 4 ? 7 : 8.5

  return (
    <Group
      onClick={(e) => { e.cancelBubble = true; onSelect() }}
      onTap={(e) => { e.cancelBubble = true; onSelect() }}
    >
      {isSelected && (
        <Circle x={l.x} y={l.y} radius={22} fill={color + '22'} stroke={color + '55'} strokeWidth={1.2} />
      )}

      <Circle
        x={l.x}
        y={l.y}
        radius={r}
        fill={color + (isSelected ? '40' : '2A')}
        stroke={color}
        strokeWidth={isSelected ? 2.8 : 2}
        shadowBlur={isSelected ? 6 : 0}
        shadowColor={color}
        shadowOpacity={isSelected ? 0.45 : 0}
      />

      <Text
        x={l.x - 22}
        y={l.y - fs / 2}
        width={44}
        align="center"
        text={l.code}
        fill={isSelected ? '#0F172A' : color}
        fontSize={fs}
        fontFamily="'IBM Plex Mono', monospace"
        fontStyle="700"
      />

      {isSelected && l.obs && (
        <Text
          x={l.x - 62}
          y={l.y + 22}
          width={124}
          align="center"
          text={l.obs.length > 35 ? l.obs.slice(0, 35) + '...' : l.obs}
          fill="rgba(16,35,62,0.64)"
          fontSize={9}
          fontFamily="'IBM Plex Mono', monospace"
        />
      )}
    </Group>
  )
}
