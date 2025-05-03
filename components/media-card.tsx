"use client"

import type React from "react"

import Image from "next/image"
import { Play, Heart, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/lib/types"
import { useRef, useEffect, useState } from "react"
import { useUser } from "@/contexts/user-context"

interface MediaCardProps {
  item: MediaItem
  onClick: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onDelete?: (id: string) => void
}

export default function MediaCard({ item, onClick, isFavorite, onToggleFavorite, onDelete }: MediaCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(item.thumbnail || "/placeholder.svg?height=400&width=600")
  const { userId } = useUser()
  const isOwner = userId === item.userId

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
          setThumbnailUrl("/placeholder.svg?height=400&width=600&text=Video")
        }
      }
      // Para videos de catbox.moe y otros servicios directos
      else if (item.url.includes("catbox.moe") || item.url.endsWith(".mp4") || item.url.endsWith(".webm")) {
        // Usar una miniatura personalizada para videos
        setThumbnailUrl("/video-thumbnail.png?height=400&width=600")
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(item.id)
    }
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

          {/* Botón de eliminar (solo visible para el propietario) */}
          {isOwner && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 hover:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          )}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-5"></div>
              <Image
                src={thumbnailUrl || "/placeholder.svg"}
                alt={item.title || "Miniatura de video"}
                fill
                className="object-cover"
                unoptimized={true}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
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
