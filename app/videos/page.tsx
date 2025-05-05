"use client"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

// Versión simplificada de MediaItem
interface SimpleMediaItem {
  id: string
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
}

export default function VideosPage() {
  const [activeSection, setActiveSection] = useState<string>("videos")
  const [mediaItems, setMediaItems] = useState<SimpleMediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Cargar videos al iniciar
  useEffect(() => {
    const loadVideos = () => {
      try {
        const savedMedia = localStorage.getItem("mediaItems")
        if (savedMedia) {
          try {
            const allMedia = JSON.parse(savedMedia)
            if (Array.isArray(allMedia)) {
              // Filtrar solo videos
              const videos = allMedia.filter((item) => item.type === "video")
              setMediaItems(videos)
            } else {
              setMediaItems([])
            }
          } catch (e) {
            console.error("Error al parsear datos:", e)
            setMediaItems([])
          }
        } else {
          setMediaItems([])
        }
      } catch (e) {
        console.error("Error al cargar videos:", e)
        setMediaItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadVideos()
  }, [])

  // Función simplificada para manejar la navegación
  const handleNavigate = (section: string) => {
    setActiveSection(section)

    // Mapa de rutas simplificado
    const routes: Record<string, string> = {
      home: "/",
      images: "/images",
      videos: "/videos",
      upload: "/upload",
      favorites: "/favorites",
      recent: "/recent",
      profile: "/profile",
    }

    const path = routes[section]
    if (path) {
      router.push(path)
    }
  }

  // Función para abrir un video
  const handleVideoClick = (videoUrl: string) => {
    window.open(videoUrl, "_blank")
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader title="Videos" subtitle="Explora tu colección de videos" />

          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
                  ))}
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-muted p-8">
                <p className="text-gray-400 mb-4">No se encontraron videos. ¡Sube algunos para comenzar!</p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Video
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md bg-card border-muted"
                    onClick={() => handleVideoClick(item.url)}
                  >
                    <CardContent className="p-0 relative">
                      <div className="aspect-video relative">
                        <Image
                          src={item.thumbnail || "/video-thumbnail.png"}
                          alt={item.title || "Video"}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M8 5V19L19 12L8 5Z" fill="white" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium truncate">{item.title || "Sin título"}</h3>
                        <p className="text-xs text-gray-400 capitalize">{item.category || "sin categoría"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
