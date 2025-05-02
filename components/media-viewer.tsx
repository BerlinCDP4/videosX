"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X, Heart, Lock, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/lib/types"

interface MediaViewerProps {
  item: MediaItem
  onClose: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

export default function MediaViewer({ item, onClose, isFavorite, onToggleFavorite }: MediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showProtectionMessage, setShowProtectionMessage] = useState(false)

  // Detectar captura de pantalla
  useEffect(() => {
    const handleScreenCapture = () => {
      setShowProtectionMessage(true)
      setTimeout(() => setShowProtectionMessage(false), 3000)
    }

    document.addEventListener("keydown", (e) => {
      // Detectar combinaciones de teclas comunes para capturas de pantalla
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key === "p") ||
        (e.metaKey && e.shiftKey && e.key === "3") ||
        (e.metaKey && e.shiftKey && e.key === "4") ||
        (e.metaKey && e.shiftKey && e.key === "5")
      ) {
        e.preventDefault()
        handleScreenCapture()
      }
    })

    return () => {
      document.removeEventListener("keydown", handleScreenCapture)
    }
  }, [])

  // Handle keyboard navigation for TV interfaces
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }

      // Video controls with keyboard
      if (item.type === "video" && videoRef.current) {
        if (e.key === " " || e.key === "k") {
          if (videoRef.current.paused) {
            videoRef.current.play()
          } else {
            videoRef.current.pause()
          }
          e.preventDefault()
        } else if (e.key === "ArrowRight") {
          videoRef.current.currentTime += 10
          e.preventDefault()
        } else if (e.key === "ArrowLeft") {
          videoRef.current.currentTime -= 10
          e.preventDefault()
        } else if (e.key === "f") {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            videoRef.current.requestFullscreen()
          }
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [item, onClose])

  // Generar miniatura para videos de catbox.moe
  useEffect(() => {
    if (item.type === "video" && videoRef.current && !isVideoLoaded) {
      const video = videoRef.current

      // Cuando el video esté cargado, extraer un fotograma como miniatura
      const handleLoadedData = () => {
        setIsVideoLoaded(true)

        // Intentar capturar un fotograma a los 2 segundos
        video.currentTime = 2

        // Cuando el tiempo cambie, capturar el fotograma
        const handleTimeUpdate = () => {
          // Ya tenemos el fotograma, podemos pausar el video
          video.pause()
          video.removeEventListener("timeupdate", handleTimeUpdate)
        }

        video.addEventListener("timeupdate", handleTimeUpdate)
      }

      video.addEventListener("loadeddata", handleLoadedData)

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData)
      }
    }
  }, [item, isVideoLoaded])

  // Translate category
  const translateCategory = (category: string) => {
    const translations: Record<string, string> = {
      amateur: "Amateur",
      famosas: "Famosas",
      monica: "Monica",
      estudio: "Estudio",
    }

    return translations[category] || category
  }

  // Translate media type
  const translateType = (type: string) => {
    const translations: Record<string, string> = {
      image: "Imagen",
      video: "Video",
    }

    return translations[type] || type
  }

  // Render content based on media type
  const renderContent = () => {
    switch (item.type) {
      case "image":
        return (
          <div className="relative w-full aspect-[16/9]" ref={containerRef}>
            {/* Marca de agua */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-30 select-none">
              <div className="text-white text-4xl font-bold transform rotate-[-30deg] bg-black/30 px-4 py-2 rounded">
                PROTEGIDO
              </div>
            </div>

            <Image
              src={item.url || "/placeholder.svg"}
              alt={item.title || "Imagen"}
              fill
              className="object-contain select-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              unoptimized={true}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        )
      case "video":
        return (
          <div className="relative w-full aspect-[16/9]" ref={containerRef}>
            {/* Marca de agua */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-30 select-none">
              <div className="text-white text-4xl font-bold transform rotate-[-30deg] bg-black/30 px-4 py-2 rounded">
                PROTEGIDO
              </div>
            </div>

            <video
              ref={videoRef}
              src={item.url}
              controls
              className="w-full h-full select-none"
              poster={item.thumbnail || "/placeholder.svg?height=400&width=600"}
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
            >
              Tu navegador no soporta la etiqueta de video.
            </video>
          </div>
        )
      default:
        return <div>Tipo de medio no soportado</div>
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] bg-card border-muted">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <DialogTitle>{item.title || "Sin título"}</DialogTitle>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <Badge variant="outline" className="capitalize bg-muted text-accent border-accent">
                {translateCategory(item.category || "sin categoría")}
              </Badge>
              <span className="text-xs text-gray-400 capitalize">{translateType(item.type)}</span>
              <Badge variant="outline" className="bg-muted border-accent">
                <Lock className="h-3 w-3 mr-1" /> Protegido
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggleFavorite} className="rounded-full hover:text-accent">
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-accent text-accent" : ""}`} />
              <span className="sr-only">Favorito</span>
            </Button>
            <DialogClose className="rounded-full hover:text-accent">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}

          {/* Mensaje de protección contra capturas de pantalla */}
          {showProtectionMessage && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in">
              <div className="bg-card p-6 rounded-lg max-w-md text-center">
                <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Contenido Protegido</h3>
                <p className="text-gray-400">
                  Este contenido está protegido contra capturas de pantalla y descargas no autorizadas.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
