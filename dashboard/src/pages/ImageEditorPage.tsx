import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { useToast } from '@/components/ui/use-toast'
import { Download, Trash2, ImageIcon, Type, Plus, ChevronUp, ChevronDown } from 'lucide-react'

type LayerType = 'image' | 'text' | 'rect'

interface Layer {
  id: string
  type: LayerType
  x: number
  y: number
  width: number
  height: number
  // image
  src?: string
  // text
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  bold?: boolean
  // rect
  fill?: string
  opacity?: number
}

const CANVAS_PRESETS = [
  { label: 'Banner (1200×400)', w: 1200, h: 400 },
  { label: 'Poster (800×1100)', w: 800, h: 1100 },
  { label: 'Flyer (595×842)', w: 595, h: 842 },
  { label: 'Square (800×800)', w: 800, h: 800 },
  { label: 'Story (1080×1920)', w: 1080, h: 1920 },
]

const FONTS = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Times New Roman', 'Courier New']

function uid() { return Math.random().toString(36).slice(2) }

export default function ImageEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [canvasW, setCanvasW] = useState(1200)
  const [canvasH, setCanvasH] = useState(400)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scale, setScale] = useState(0.5)

  // Drag state
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null)

  const selected = layers.find(l => l.id === selectedId) ?? null

  // Fit canvas to container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      const s = Math.min((el.clientWidth - 32) / canvasW, (el.clientHeight - 32) / canvasH, 1)
      setScale(Math.max(s, 0.1))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [canvasW, canvasH])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasW, canvasH)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasW, canvasH)

    for (const layer of layers) {
      ctx.save()
      ctx.globalAlpha = layer.opacity ?? 1

      if (layer.type === 'rect') {
        ctx.fillStyle = layer.fill ?? '#000000'
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height)
      } else if (layer.type === 'text') {
        ctx.fillStyle = layer.color ?? '#000000'
        ctx.font = `${layer.bold ? 'bold ' : ''}${layer.fontSize ?? 32}px ${layer.fontFamily ?? 'Inter'}`
        ctx.fillText(layer.text ?? '', layer.x, layer.y + (layer.fontSize ?? 32))
      } else if (layer.type === 'image' && layer.src) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          ctx.globalAlpha = layer.opacity ?? 1
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
          ctx.restore()
          // Draw selection border
          if (layer.id === selectedId) {
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 3])
            ctx.strokeRect(layer.x - 1, layer.y - 1, layer.width + 2, layer.height + 2)
          }
        }
        img.src = layer.src
        ctx.restore()
        continue
      }

      // Selection border for non-image layers
      if (layer.id === selectedId) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 3])
        ctx.strokeRect(layer.x - 1, layer.y - 1, layer.width + 2, layer.height + 2)
      }

      ctx.restore()
    }
  }, [layers, bgColor, canvasW, canvasH, selectedId])

  useEffect(() => { draw() }, [draw])

  const addImage = (url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxW = Math.min(img.naturalWidth, canvasW * 0.4)
      const ratio = img.naturalHeight / img.naturalWidth
      setLayers(prev => [...prev, {
        id: uid(), type: 'image', src: url,
        x: 50, y: 50, width: maxW, height: maxW * ratio,
      }])
    }
    img.src = url
  }

  const addText = () => {
    setLayers(prev => [...prev, {
      id: uid(), type: 'text', text: 'Your text here',
      x: 50, y: 50, width: 300, height: 50,
      fontSize: 36, fontFamily: 'Inter', color: '#000000', bold: false,
    }])
  }

  const addRect = () => {
    setLayers(prev => [...prev, {
      id: uid(), type: 'rect',
      x: 50, y: 50, width: 200, height: 100,
      fill: '#f59e0b', opacity: 1,
    }])
  }

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id))
    setSelectedId(null)
  }

  const moveLayer = (id: string, dir: 'up' | 'down') => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id)
      if (dir === 'up' && idx < prev.length - 1) {
        const arr = [...prev]
        ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
        return arr
      }
      if (dir === 'down' && idx > 0) {
        const arr = [...prev]
        ;[arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]]
        return arr
      }
      return prev
    })
  }

  // Canvas click to select layer
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    // Check from top layer down
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height) {
        setSelectedId(l.id)
        return
      }
    }
    setSelectedId(null)
  }

  // Canvas drag to move layer
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height) {
        setSelectedId(l.id)
        dragging.current = { id: l.id, ox: x - l.x, oy: y - l.y }
        return
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    updateLayer(dragging.current.id, {
      x: Math.max(0, x - dragging.current.ox),
      y: Math.max(0, y - dragging.current.oy),
    })
  }

  const handleMouseUp = () => { dragging.current = null }

  const exportImage = (format: 'png' | 'jpg') => {
    // Redraw without selection borders for clean export
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prevSelected = selectedId
    setSelectedId(null)

    setTimeout(() => {
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const ext = format
      canvas.toBlob(blob => {
        if (!blob) { toast({ variant: 'destructive', title: 'Export failed' }); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `kakebe-design.${ext}`
        a.click()
        URL.revokeObjectURL(a.href)
        toast({ title: `Exported as ${ext.toUpperCase()}` })
        setSelectedId(prevSelected)
      }, mime, 0.95)
    }, 100)
  }

  const applyPreset = (w: number, h: number) => { setCanvasW(w); setCanvasH(h) }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 overflow-hidden">
      {/* Left panel — tools */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <Card className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canvas Size</p>
          <Select onChange={e => { const p = CANVAS_PRESETS[parseInt(e.target.value)]; if (p) applyPreset(p.w, p.h) }}>
            <option value="">Custom</option>
            {CANVAS_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Width</Label>
              <Input type="number" value={canvasW} onChange={e => setCanvasW(parseInt(e.target.value) || 800)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input type="number" value={canvasH} onChange={e => setCanvasH(parseInt(e.target.value) || 600)} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Background</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-12 rounded border border-border cursor-pointer" />
              <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 text-xs flex-1" />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add Elements</p>
          <CloudinaryUploader onUpload={addImage} folder="designs" buttonText="Add Image" variant="outline" />
          <Button variant="outline" size="sm" className="w-full" onClick={addText}>
            <Type className="h-4 w-4 mr-2" /> Add Text
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={addRect}>
            <Plus className="h-4 w-4 mr-2" /> Add Shape
          </Button>
        </Card>

        {/* Selected layer properties */}
        {selected && (
          <Card className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input type="number" value={Math.round(selected.x)} onChange={e => updateLayer(selected.id, { x: parseInt(e.target.value) || 0 })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input type="number" value={Math.round(selected.y)} onChange={e => updateLayer(selected.id, { y: parseInt(e.target.value) || 0 })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Width</Label>
                <Input type="number" value={Math.round(selected.width)} onChange={e => updateLayer(selected.id, { width: parseInt(e.target.value) || 10 })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Height</Label>
                <Input type="number" value={Math.round(selected.height)} onChange={e => updateLayer(selected.id, { height: parseInt(e.target.value) || 10 })} className="mt-1 h-8 text-xs" />
              </div>
            </div>

            {selected.type === 'text' && (
              <>
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input value={selected.text ?? ''} onChange={e => updateLayer(selected.id, { text: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <Input type="number" value={selected.fontSize ?? 32} onChange={e => updateLayer(selected.id, { fontSize: parseInt(e.target.value) || 12 })} className="mt-1 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <input type="color" value={selected.color ?? '#000000'} onChange={e => updateLayer(selected.id, { color: e.target.value })} className="mt-1 h-8 w-full rounded border border-border cursor-pointer" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Font</Label>
                  <Select className="mt-1" value={selected.fontFamily ?? 'Inter'} onChange={e => updateLayer(selected.id, { fontFamily: e.target.value })}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={selected.bold ?? false} onChange={e => updateLayer(selected.id, { bold: e.target.checked })} />
                  Bold
                </label>
              </>
            )}

            {selected.type === 'rect' && (
              <div>
                <Label className="text-xs">Fill Color</Label>
                <input type="color" value={selected.fill ?? '#000000'} onChange={e => updateLayer(selected.id, { fill: e.target.value })} className="mt-1 h-8 w-full rounded border border-border cursor-pointer" />
              </div>
            )}

            <div>
              <Label className="text-xs">Opacity</Label>
              <input type="range" min="0" max="1" step="0.05" value={selected.opacity ?? 1} onChange={e => updateLayer(selected.id, { opacity: parseFloat(e.target.value) })} className="w-full mt-1" />
            </div>

            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => moveLayer(selected.id, 'up')} title="Move up"><ChevronUp className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => moveLayer(selected.id, 'down')} title="Move down"><ChevronDown className="h-3 w-3" /></Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => deleteLayer(selected.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </Card>
        )}

        {/* Export */}
        <Card className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Export</p>
          <Button className="w-full" size="sm" onClick={() => exportImage('png')}>
            <Download className="h-4 w-4 mr-2" /> Download PNG
          </Button>
          <Button variant="outline" className="w-full" size="sm" onClick={() => exportImage('jpg')}>
            <Download className="h-4 w-4 mr-2" /> Download JPG
          </Button>
        </Card>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 bg-muted/30 rounded-xl border border-border overflow-hidden flex items-center justify-center">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="shadow-xl cursor-crosshair"
            style={{ display: 'block' }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      {/* Right panel — layers */}
      <div className="w-48 flex-shrink-0">
        <Card className="p-3 h-full overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Layers</p>
          {layers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-30" />
              <p className="text-xs text-center">Add elements to start designing</p>
            </div>
          )}
          <div className="space-y-1">
            {[...layers].reverse().map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${selectedId === l.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
              >
                {l.type === 'image' && <ImageIcon className="h-3 w-3 flex-shrink-0" />}
                {l.type === 'text' && <Type className="h-3 w-3 flex-shrink-0" />}
                {l.type === 'rect' && <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: l.fill }} />}
                <span className="truncate">
                  {l.type === 'text' ? (l.text ?? 'Text') : l.type === 'image' ? 'Image' : 'Shape'}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
