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
  autoGenerate?: boolean
  hidden?: boolean // Nueva propiedad para ocultar el componente
}

export default function ThumbnailGenerator({
  videoUrl,
  onThumbnailGenerated,
  autoGenerate = true,
  hidden = false, // Por defecto, el componente es visible
}: ThumbnailGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Función para validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Función para detectar si es una URL de YouTube
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be")
  }

  // Función para obtener ID de YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    try {
      if (url.includes("youtu.be")) {
        return url.split("/").pop()?.split("?")[0] || null
      } else if (url.includes("v=")) {
        return new URL(url).searchParams.get("v")
      }
      return null
    } catch (e) {
      return null
    }
  }

  useEffect(() => {
    if (!videoUrl || !isValidUrl(videoUrl)) {
      setError("URL de video inválida")
      return
    }

    setError(null)
    setIsLoading(true)

    // Si es YouTube, generar miniatura directamente
    if (isYouTubeUrl(videoUrl)) {
      const videoId = getYouTubeVideoId(videoUrl)
      if (videoId) {
        const youtubeThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        setThumbnailUrl(youtubeThumb)
        onThumbnailGenerated(youtubeThumb)
        setIsLoading(false)
        return
      }
    }

    // Para videos directos
    const video = videoRef.current
    if (!video) return

    // Reset state
    setCurrentTime(0)
    setDuration(0)
    setThumbnailUrl(null)
    setVideoLoaded(false)

    // Handle video metadata loaded
    const handleMetadataLoaded = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
        // Set initial time to a quarter of the duration for better thumbnails
        const initialTime = Math.min(video.duration / 4, 5)
        video.currentTime = initialTime
        setCurrentTime(initialTime)
        setVideoLoaded(true)
        setIsLoading(false)

        // Auto-generate thumbnail if enabled
        if (autoGenerate) {
          setTimeout(() => {
            try {
              captureThumbnail()
            } catch (e) {
              console.error("Error en auto-generación de miniatura:", e)
              setError("No se pudo generar la miniatura automáticamente. Intenta capturarla manualmente.")
            }
          }, 1000)
        }
      }
    }

    // Handle video errors
    const handleError = () => {
      console.error("Error al cargar el video")
      setError("Error al cargar el video. Verifica que la URL sea válida y accesible.")
      setIsLoading(false)

      // Generar una miniatura predeterminada para videos que no se pueden cargar
      setThumbnailUrl("/video-thumbnail.png")
      onThumbnailGenerated("/video-thumbnail.png")
    }

    video.addEventListener("loadedmetadata", handleMetadataLoaded)
    video.addEventListener("error", handleError)

    // Load the video with error handling
    try {
      video.crossOrigin = "anonymous"
      video.src = videoUrl
      video.load()
    } catch (e) {
      console.error("Error al establecer la URL del video:", e)
      setError("Error al cargar el video. La URL podría ser inválida.")
      setIsLoading(false)

      // Generar una miniatura predeterminada
      setThumbnailUrl("/video-thumbnail.png")
      onThumbnailGenerated("/video-thumbnail.png")
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadataLoaded)
      video.removeEventListener("error", handleError)
    }
  }, [videoUrl, autoGenerate, onThumbnailGenerated])

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

  // Capture thumbnail con mejor manejo de errores
  const captureThumbnail = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("No se pudo acceder al video o al canvas")

      // Usar miniatura predeterminada en caso de error
      setThumbnailUrl("/video-thumbnail.png")
      onThumbnailGenerated("/video-thumbnail.png")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      setError("No se pudo obtener el contexto del canvas")

      // Usar miniatura predeterminada en caso de error
      setThumbnailUrl("/video-thumbnail.png")
      onThumbnailGenerated("/video-thumbnail.png")
      return
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setThumbnailUrl(dataUrl)
      onThumbnailGenerated(dataUrl)
    } catch (err) {
      console.error("Error al generar miniatura:", err)
      setError("Error al generar la miniatura. Usando miniatura predeterminada.")

      // Usar miniatura predeterminada en caso de error
      setThumbnailUrl("/video-thumbnail.png")
      onThumbnailGenerated("/video-thumbnail.png")
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Si el componente debe estar oculto, solo renderizar los elementos necesarios para la funcionalidad
  if (hidden) {
    return (
      <div style={{ display: "none" }}>
        <video ref={videoRef} onTimeUpdate={handleTimeUpdate} playsInline muted crossOrigin="anonymous" />
        <canvas ref={canvasRef} />
      </div>
    )
  }

  // Si es una URL de YouTube, mostrar una versión simplificada
  if (isYouTubeUrl(videoUrl)) {
    const videoId = getYouTubeVideoId(videoUrl)
    const youtubeThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/video-thumbnail.png"

    return (
      <Card className="w-full bg-card border-muted">
        <CardHeader>
          <CardTitle>Miniatura de YouTube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <img
              src={youtubeThumb || "/placeholder.svg"}
              alt="Miniatura de YouTube"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground">Miniatura generada automáticamente para video de YouTube</p>
        </CardContent>
      </Card>
    )
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
          disabled={!duration && !isLoading}
        >
          <Camera className="mr-2 h-4 w-4" />
          {thumbnailUrl ? "Capturar Nueva Miniatura" : "Capturar Miniatura"}
        </Button>
      </CardFooter>

      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  )
}
