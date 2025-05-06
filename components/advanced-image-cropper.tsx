"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Check, X, ZoomOut, RotateCcw } from "lucide-react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"

interface AdvancedImageCropperProps {
  imageUrl: string
  onCrop: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number
}

export default function AdvancedImageCropper({
  imageUrl,
  onCrop,
  onCancel,
  aspectRatio = 1,
}: AdvancedImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.crossOrigin = "anonymous"
      image.src = url
    })

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation = 0): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    // Set canvas size to match the final image size
    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    // Draw rotated image
    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)
    ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2)

    // Extract the cropped image
    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    // Set canvas to final size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y),
    )

    // Convert to circular if aspect ratio is 1
    if (aspectRatio === 1) {
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.arc(pixelCrop.width / 2, pixelCrop.height / 2, pixelCrop.width / 2, 0, 2 * Math.PI)
      ctx.fill()
    }

    // As Base64 string
    return canvas.toDataURL("image/png")
  }

  const handleCrop = async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels, rotation)
      onCrop(croppedImage)
    } catch (e) {
      console.error("Error cropping image:", e)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-card rounded-lg border border-muted">
      <div className="text-center mb-2">
        <h3 className="text-lg font-medium">Recortar imagen de perfil</h3>
        <p className="text-sm text-muted-foreground">Arrastra, ajusta el zoom y rota para personalizar tu foto</p>
      </div>

      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-black rounded-lg overflow-hidden">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape={aspectRatio === 1 ? "round" : "rect"}
          showGrid={false}
          objectFit="contain"
        />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="flex items-center">
              <ZoomOut className="h-3 w-3 mr-1" /> Zoom
            </span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(value) => setZoom(value[0])} />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="flex items-center">
              <RotateCcw className="h-3 w-3 mr-1" /> Rotación
            </span>
            <span>{rotation}°</span>
          </div>
          <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(value) => setRotation(value[0])} />
        </div>
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
