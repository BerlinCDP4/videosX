"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Check, X, ZoomIn, ZoomOut, Move } from "lucide-react"

interface ImageCropperProps {
  imageUrl: string
  onCrop: (croppedImage: string) => void
  onCancel: () => void
}

export default function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Cargar la imagen cuando cambia la URL
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imageRef.current = img
      drawImage()
    }
    img.src = imageUrl
  }, [imageUrl])

  // Dibujar la imagen en el canvas
  const drawImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const img = imageRef.current

    if (!canvas || !ctx || !img) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calcular dimensiones
    const size = Math.min(img.width, img.height)
    const sx = (img.width - size) / 2
    const sy = (img.height - size) / 2

    // Aplicar zoom y posición
    const scaledSize = size * zoom
    const dx = (canvas.width - scaledSize) / 2 + position.x
    const dy = (canvas.height - scaledSize) / 2 + position.y

    // Dibujar la imagen
    ctx.drawImage(img, sx, sy, size, size, dx, dy, scaledSize, scaledSize)

    // Dibujar overlay para mostrar área de recorte
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Recortar un círculo transparente en el centro
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2)
    ctx.fill()

    // Restaurar modo de composición
    ctx.globalCompositeOperation = "source-over"

    // Dibujar borde del círculo
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Manejar cambio de zoom
  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
    drawImage()
  }

  // Manejar inicio de arrastre
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  // Manejar arrastre
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })

    drawImage()
  }

  // Manejar fin de arrastre
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Manejar eventos táctiles
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return

    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return

    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })

    drawImage()
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Generar imagen recortada
  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Crear un nuevo canvas para la imagen recortada
    const cropCanvas = document.createElement("canvas")
    const size = canvas.width - 20
    cropCanvas.width = size
    cropCanvas.height = size

    const ctx = cropCanvas.getContext("2d")
    if (!ctx) return

    // Dibujar solo la parte visible (el círculo)
    ctx.drawImage(canvas, 10, 10, size, size, 0, 0, size, size)

    // Convertir a círculo
    ctx.globalCompositeOperation = "destination-in"
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Obtener la imagen recortada como data URL
    const croppedImage = cropCanvas.toDataURL("image/png")
    onCrop(croppedImage)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-card rounded-lg border border-muted">
      <div className="text-center mb-2">
        <h3 className="text-lg font-medium">Recortar imagen de perfil</h3>
        <p className="text-sm text-muted-foreground">Arrastra y ajusta el zoom para recortar tu foto</p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-lg cursor-move touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center">
          <Move className="h-3 w-3 mr-1" /> Arrastra
        </div>
      </div>

      <div className="w-full max-w-xs flex items-center gap-2">
        <ZoomOut className="h-4 w-4 text-muted-foreground" />
        <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={handleZoomChange} className="flex-1" />
        <ZoomIn className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" onClick={onCancel} className="w-24">
          <X className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button onClick={handleCrop} className="w-24 bg-accent hover:bg-accent/90">
          <Check className="h-4 w-4 mr-2" /> Aplicar
        </Button>
      </div>
    </div>
  )
}
