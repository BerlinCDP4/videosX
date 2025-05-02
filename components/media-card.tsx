"use client"

import type React from "react"

import Image from "next/image"
import { Play, Heart, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/lib/types"
import { useRef, useEffect, useState } from "react"

interface MediaCardProps {
  item: MediaItem
  onClick: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

export default function MediaCard({ item, onClick, isFavorite, onToggleFavorite }: MediaCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(item.thumbnail || "/placeholder.svg?height=400&width=600")

  // Generar miniatura para videos de catbox.moe
  useEffect(() => {
    if (item.type === "video" && item.url.includes("catbox.moe") && videoRef.current) {
      const video = videoRef.current

      // Crear un elemento de video oculto para generar la miniatura
      video.src = item.url
      video.muted = true
      video.preload = "metadata"

      // Cuando el video esté cargado, extraer un fotograma como miniatura
      const handleLoadedData = () => {
        // Intentar capturar un fotograma a los 2 segundos
        video.currentTime = 2

        // Cuando el tiempo cambie, capturar el fotograma
        const handleTimeUpdate = () => {
          try {
            // Crear un canvas para capturar el fotograma
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Dibujar el fotograma en el canvas
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              // Convertir el canvas a una URL de datos
              const dataUrl = canvas.toDataURL("image/jpeg")
              setThumbnailUrl(dataUrl)
            }

            // Ya tenemos el fotograma, podemos pausar el video
            video.pause()
            video.removeEventListener("timeupdate", handleTimeUpdate)
          } catch (error) {
            console.error("Error al generar miniatura:", error)
          }
        }

        video.addEventListener("timeupdate", handleTimeUpdate)
      }

      video.addEventListener("loadeddata", handleLoadedData)

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData)
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite()
  }

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent bg-card border-muted"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick()
        }
      }}
    >
      <CardContent className="p-0 relative">
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 hover:text-accent"
            onClick={handleFavoriteClick}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-accent text-accent" : ""}`} />
            <span className="sr-only">Favorito</span>
          </Button>
        </div>

        <div className="absolute top-2 left-2 z-20">
          <Badge variant="outline" className="bg-black/30 border-none text-white">
            <Lock className="h-3 w-3 mr-1" /> Protegido
          </Badge>
        </div>

        <div className="aspect-video relative">
          {item.type === "image" ? (
            <Image
              src={item.url || "/placeholder.svg"}
              alt={item.title || "Imagen"}
              fill
              className="object-cover"
              unoptimized={true}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          ) : item.type === "video" ? (
            <>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <div className="bg-black/70 rounded-full p-3">
                  <Play className="h-8 w-8 text-accent" />
                </div>
              </div>
              <Image
                src={thumbnailUrl || "/placeholder.svg"}
                alt={item.title || "Miniatura de video"}
                fill
                className="object-cover"
                unoptimized={true}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
              {/* Video oculto para generar miniaturas */}
              {item.url.includes("catbox.moe") && <video ref={videoRef} className="hidden" muted preload="metadata" />}
            </>
          ) : null}
        </div>
        <div className="p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium truncate">{item.title || "Sin título"}</h3>
            <Badge variant="outline" className="ml-2 capitalize bg-muted text-accent border-accent">
              {translateCategory(item.category || "sin categoría")}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400 capitalize">{translateType(item.type)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
