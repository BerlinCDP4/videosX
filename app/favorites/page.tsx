"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { StarOff } from "lucide-react"

// Versión simplificada de MediaItem
interface SimpleMediaItem {
  id: string
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
  userId: string
}

export default function FavoritesPage() {
  const [activeSection, setActiveSection] = useState<string>("favorites")
  const [mediaItems, setMediaItems] = useState<SimpleMediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, isAuthenticated, getFavorites, removeFromFavorites, addToHistory } = useAuth()

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/auth/login?callbackUrl=/favorites")
    }
  }, [isAuthenticated, isLoading, router])

  // Cargar favoritos
  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false)
        return
      }

      try {
        const favoriteIds = getFavorites()
        const savedMedia = localStorage.getItem("mediaItems")

        if (savedMedia && favoriteIds.length > 0) {
          try {
            const allMedia = JSON.parse(savedMedia)
            if (Array.isArray(allMedia)) {
              // Filtrar solo los favoritos
              const favorites = allMedia.filter((item) => favoriteIds.includes(item.id))
              setMediaItems(favorites)
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
        console.error("Error al cargar favoritos:", e)
        setMediaItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [isAuthenticated, user, getFavorites])

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
      history: "/history",
    }

    const path = routes[section]
    if (path) {
      router.push(path)
    }
  }

  // Función para abrir un medio
  const handleMediaClick = (item: SimpleMediaItem) => {
    // Añadir al historial
    if (user) {
      addToHistory(item.id)
    }

    // Abrir el medio
    if (item.type === "image") {
      window.open(item.url, "_blank")
    } else if (item.type === "video") {
      window.open(item.url, "_blank")
    }
  }

  // Función para quitar de favoritos
  const handleRemoveFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeFromFavorites(id)
    setMediaItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (!isAuthenticated && !isLoading) {
    return null // No renderizar nada mientras redirige
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader title="Favoritos" subtitle="Tu colección de medios favoritos" />

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
                <p className="text-gray-400 mb-4">
                  No tienes favoritos. Marca algunos medios como favoritos para verlos aquí.
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                  <Link href="/">Explorar Galería</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md bg-card border-muted"
                    onClick={() => handleMediaClick(item)}
                  >
                    <CardContent className="p-0 relative">
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
                          onClick={(e) => handleRemoveFavorite(e, item.id)}
                        >
                          <StarOff className="h-4 w-4 text-accent" />
                          <span className="sr-only">Quitar de favoritos</span>
                        </Button>
                      </div>
                      <div className="aspect-video relative">
                        {item.type === "image" ? (
                          <Image
                            src={item.url || "/placeholder.svg"}
                            alt={item.title || "Imagen"}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium truncate">{item.title || "Sin título"}</h3>
                        <div className="flex justify-between">
                          <p className="text-xs text-gray-400 capitalize">{item.category || "sin categoría"}</p>
                          <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                        </div>
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
