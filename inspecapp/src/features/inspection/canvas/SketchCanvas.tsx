import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Text, Group, Shape } from 'react-konva'
import type Konva from 'konva'
import { useProjectStore } from '@/store/useProjectStore'
import { LESION_TYPES } from '@/types'
import type { LesionTypeCode } from '@/types'
import { newId, generateLesionCode, getLesionColor } from '@/utils/codeGenerator'
import { QuickTypePicker } from './QuickTypePicker'

// ─── Types ──────────────────────────────────────────────────────────────────

export type CanvasTool = 'select' | 'rect' | 'lesion'

interface Props {
  tool: CanvasTool
  selectedLesionId: string | null
  onSelectLesion: (id: string | null) => void
}

interface DrawState {
  x: number; y: number; w: number; h: number
}

interface PendingPin {
  /** Canvas coordinates (virtual) */
  cx: number; cy: number
  /** Screen coordinates relative to container */
  sx: number; sy: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GRID = 50
const GRID_S = 10
const MIN_RECT = 15

// ─── Component ──────────────────────────────────────────────────────────────

export function SketchCanvas({ tool, selectedLesionId, onSelectLesion }: Props) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null)

  const [size, setSize] = useState({ w: 800, h: 500 })
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [draw, setDraw] = useState<DrawState | null>(null)
  const [pending, setPending] = useState<PendingPin | null>(null)

  // Store
  const elements = useProjectStore(s => s.canvasElements)
  const lesions = useProjectStore(s => s.lesions)
  const zoneId = useProjectStore(s => s.activeZoneId)
  const upsert = useProjectStore(s => s.upsertCanvasElement)
  const createLesion = useProjectStore(s => s.createLesion)

  // ─── Resize observer ────────────────────────────────────────────────────

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

  // ─── Pointer → canvas coords ────────────────────────────────────────────

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

  // ─── Wheel zoom (centered on pointer) ──────────────────────────────────

  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const old = stage.scaleX()
    const factor = 1.08
    const next = e.evt.deltaY < 0
      ? Math.min(old * factor, 5)
      : Math.max(old / factor, 0.15)

    const mp = {
      x: (pointer.x - stage.x()) / old,
      y: (pointer.y - stage.y()) / old,
    }

    setScale(next)
    setPos({
      x: pointer.x - mp.x * next,
      y: pointer.y - mp.y * next,
    })
  }, [])

  // ─── Touch pinch zoom + pan ─────────────────────────────────────────────

  const onTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const ts = e.evt.touches
    if (ts.length !== 2) return
    e.evt.preventDefault()

    const d = Math.hypot(
      ts[0].clientX - ts[1].clientX,
      ts[0].clientY - ts[1].clientY,
    )
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
  }, [])

  const onTouchEnd = useCallback(() => {
    lastPinchRef.current = null
  }, [])

  // ─── Mouse down (start rect drawing) ───────────────────────────────────

  const onMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return
    if (tool === 'rect') {
      const p = toCanvas()
      setDraw({ x: p.x, y: p.y, w: 0, h: 0 })
    }
  }, [tool, toCanvas])

  // ─── Mouse move (update rect preview) ──────────────────────────────────

  const onMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'rect' && draw) {
      const p = toCanvas()
      setDraw(prev => prev ? { ...prev, w: p.x - prev.x, h: p.y - prev.y } : null)
    }
  }, [tool, draw, toCanvas])

  // ─── Mouse up (finish rect / place lesion / deselect) ──────────────────

  const onMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'rect' && draw) {
      if (Math.abs(draw.w) > MIN_RECT && Math.abs(draw.h) > MIN_RECT) {
        const norm = {
          x: draw.w < 0 ? draw.x + draw.w : draw.x,
          y: draw.h < 0 ? draw.y + draw.h : draw.y,
          w: Math.abs(draw.w),
          h: Math.abs(draw.h),
        }
        const label = window.prompt('Etiqueta (ej: H1, Sala, Comedor...):') || ''
        if (zoneId) {
          upsert({ id: newId(), zoneId, ...norm, label })
        }
      }
      setDraw(null)
      return
    }

    if (tool === 'lesion') {
      const c = toCanvas()
      const stage = stageRef.current
      const sp = stage?.getPointerPosition()
      if (sp) {
        setPending({ cx: c.x, cy: c.y, sx: sp.x, sy: sp.y })
      }
      return
    }

    if (tool === 'select') {
      const cls = e.target.getClassName()
      if (cls === 'Stage' || cls === 'Rect' && !e.target.getParent()?.id()) {
        onSelectLesion(null)
      }
    }
  }, [tool, draw, toCanvas, zoneId, upsert, onSelectLesion])

  // ─── Create lesion from QuickTypePicker ─────────────────────────────────

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

  // ─── Stage drag end (sync pan position to state) ────────────────────────

  const onDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target !== stageRef.current) return
    setPos({ x: e.target.x(), y: e.target.y() })
  }, [])

  // ─── Cursor ─────────────────────────────────────────────────────────────

  const cursor = tool === 'select' ? 'grab' : 'crosshair'

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-bg"
      style={{ cursor }}
    >
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
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDragEnd={onDragEnd}
      >
        {/* ── Grid background ───────────────────────────────────── */}
        <Layer listening={false}>
          <GridShape scale={scale} pos={pos} size={size} />
        </Layer>

        {/* ── Canvas elements (rectangles) ──────────────────────── */}
        <Layer>
          {elements.map(el => (
            <Group key={el.id} id={el.id}>
              <Rect
                x={el.x}
                y={el.y}
                width={el.w}
                height={el.h}
                fill="rgba(37,99,235,0.04)"
                stroke="rgba(37,99,235,0.22)"
                strokeWidth={1.5}
                cornerRadius={2}
              />
              {el.label && (
                <Text
                  x={el.x + 6}
                  y={el.y + 5}
                  text={el.label}
                  fill="rgba(139,163,199,0.55)"
                  fontSize={11}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontStyle="600"
                />
              )}
            </Group>
          ))}
        </Layer>

        {/* ── Drawing preview ───────────────────────────────────── */}
        {draw && (
          <Layer listening={false}>
            <Rect
              x={draw.w < 0 ? draw.x + draw.w : draw.x}
              y={draw.h < 0 ? draw.y + draw.h : draw.y}
              width={Math.abs(draw.w)}
              height={Math.abs(draw.h)}
              fill="rgba(37,99,235,0.08)"
              stroke="#2563EB"
              strokeWidth={1.5}
              dash={[6, 3]}
              cornerRadius={2}
            />
          </Layer>
        )}

        {/* ── Lesion pins ───────────────────────────────────────── */}
        <Layer>
          {lesions.map(l => (
            <LesionPin
              key={l.id}
              l={l}
              isSelected={selectedLesionId === l.id}
              scale={scale}
              onSelect={() => onSelectLesion(l.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* ── Quick type picker (HTML overlay) ──────────────────── */}
      {pending && (
        <QuickTypePicker
          x={pending.sx}
          y={pending.sy}
          onSelect={onTypeSelected}
          onCancel={() => setPending(null)}
        />
      )}

      {/* ── Zoom indicator ────────────────────────────────────── */}
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-t3 bg-bg/80 backdrop-blur-sm px-2 py-1 rounded-[var(--radius-sm)] border border-border select-none">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

// ─── Grid (custom Konva Shape for performance) ──────────────────────────────

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

        // Major grid
        c.beginPath()
        c.strokeStyle = 'rgba(255,255,255,0.055)'
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

        // Minor grid (only when zoomed enough)
        if (scale > 0.5) {
          c.beginPath()
          c.strokeStyle = 'rgba(255,255,255,0.022)'
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

// ─── Lesion Pin (Konva group) ───────────────────────────────────────────────

function LesionPin({
  l,
  isSelected,
  scale,
  onSelect,
}: {
  l: { id: string; x: number; y: number; code: string; tipus: string; obs: string }
  isSelected: boolean
  scale: number
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
      {/* Selection halo */}
      {isSelected && (
        <Circle
          x={l.x} y={l.y} radius={22}
          fill={color + '18'}
          stroke={color + '44'}
          strokeWidth={1}
        />
      )}

      {/* Main circle */}
      <Circle
        x={l.x} y={l.y} radius={r}
        fill={color + (isSelected ? '35' : '22')}
        stroke={color}
        strokeWidth={isSelected ? 2.5 : 1.8}
        shadowBlur={isSelected ? 6 : 0}
        shadowColor={color}
        shadowOpacity={isSelected ? 0.5 : 0}
      />

      {/* Code label */}
      <Text
        x={l.x - 22} y={l.y - fs / 2}
        width={44}
        align="center"
        text={l.code}
        fill={color}
        fontSize={fs}
        fontFamily="'IBM Plex Mono', monospace"
        fontStyle="700"
      />

      {/* Observation text (when selected) */}
      {isSelected && l.obs && (
        <Text
          x={l.x - 60} y={l.y + 22}
          width={120}
          align="center"
          text={l.obs.length > 35 ? l.obs.slice(0, 35) + '...' : l.obs}
          fill="rgba(255,255,255,0.5)"
          fontSize={8}
          fontFamily="'IBM Plex Mono', monospace"
        />
      )}
    </Group>
  )
}
