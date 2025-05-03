"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Camera } from "lucide-react"

interface ThumbnailGeneratorProps {
  videoUrl: string
  onThumbnailGenerated: (thumbnailUrl: string) => void
}

export default function ThumbnailGenerator({ videoUrl, onThumbnailGenerated }: ThumbnailGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!videoUrl) return

    const video = videoRef.current
    if (!video) return

    // Reset state when video URL changes
    setCurrentTime(0)
    setDuration(0)
    setThumbnailUrl(null)
    setError(null)

    // Handle video metadata loaded
    const handleMetadataLoaded = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
        // Set initial time to 0
        video.currentTime = 0
      }
    }

    // Handle video errors
    const handleError = () => {
      setError("Error al cargar el video. Verifica la URL e intenta de nuevo.")
      setIsLoading(false)
    }

    video.addEventListener("loadedmetadata", handleMetadataLoaded)
    video.addEventListener("error", handleError)

    // Load the video
    video.src = videoUrl
    video.load()

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadataLoaded)
      video.removeEventListener("error", handleError)
    }
  }, [videoUrl])

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newTime = value[0]
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Capture thumbnail
  const captureThumbnail = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setThumbnailUrl(dataUrl)
      onThumbnailGenerated(dataUrl)
    } catch (err) {
      setError("Error al generar la miniatura. Intenta de nuevo.")
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full bg-card border-muted">
      <CardHeader>
        <CardTitle>Generar Miniatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            playsInline
            muted
            crossOrigin="anonymous"
          />
          {thumbnailUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="relative w-1/2 aspect-video">
                <img
                  src={thumbnailUrl || "/placeholder.svg"}
                  alt="Miniatura generada"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            disabled={!duration}
          />
        </div>

        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-1/2"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.play()
              }
            }}
            disabled={!duration}
          >
            Reproducir
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-1/2"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.pause()
              }
            }}
            disabled={!duration}
          >
            Pausar
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full bg-accent hover:bg-accent/90"
          onClick={captureThumbnail}
          disabled={!duration}
        >
          <Camera className="mr-2 h-4 w-4" />
          Capturar Miniatura
        </Button>
      </CardFooter>

      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  )
}
