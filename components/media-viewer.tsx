"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X, Heart, Trash2 } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/lib/types"
import { useUser } from "@/contexts/user-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MediaViewerProps {
  item: MediaItem
  onClose: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onDelete?: (id: string) => void
}

export default function MediaViewer({ item, onClose, isFavorite, onToggleFavorite, onDelete }: MediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { userId } = useUser()
  const isOwner = userId === item.userId
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("/video-thumbnail.png")

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

  // Mejorar la generación de miniaturas para videos
  useEffect(() => {
    if (item.type === "video") {
      // Para videos de YouTube
      if (item.url.includes("youtube.com") || item.url.includes("youtu.be")) {
        let videoId = null
        if (item.url.includes("youtu.be")) {
          videoId = item.url.split("/").pop()?.split("?")[0]
        } else if (item.url.includes("v=")) {
          videoId = new URL(item.url).searchParams.get("v")
        }

        if (videoId) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
        } else {
          setThumbnailUrl("/video-thumbnail.png")
        }
      }
      // Para videos de catbox.moe y otros servicios directos
      else {
        setThumbnailUrl("/video-thumbnail.png")
      }
    }
  }, [item])

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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id)
      onClose()
    }
  }

  // Render content based on media type
  const renderContent = () => {
    switch (item.type) {
      case "image":
        return (
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={item.url || "/placeholder.svg"}
              alt={item.title || "Imagen"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              unoptimized={true}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>
        )
      case "video":
        return (
          <div className="relative w-full aspect-[16/9]">
            <video
              ref={videoRef}
              src={item.url}
              controls
              className="w-full h-full"
              poster={thumbnailUrl}
              controlsList="nodownload"
              playsInline
              onContextMenu={(e) => e.preventDefault()}
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
    <>
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onToggleFavorite} className="rounded-full hover:text-accent">
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-accent text-accent" : ""}`} />
                <span className="sr-only">Favorito</span>
              </Button>

              {/* Botón de eliminar (solo visible para el propietario) */}
              {isOwner && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-full hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              )}

              <DialogClose className="rounded-full hover:text-accent">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="mt-4">{renderContent()}</div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-muted">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este{" "}
              {item.type === "image" ? "imagen" : "video"} de tu galería.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-white hover:bg-muted/80">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
