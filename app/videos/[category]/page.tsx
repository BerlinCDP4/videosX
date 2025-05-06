"use client"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import type { MediaItem } from "@/lib/types"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import MediaCard from "@/components/media-card"
import MediaViewer from "@/components/media-viewer"

export default function VideoCategoryPage() {
  const params = useParams()
  const category = params.category as string
  const [activeSection, setActiveSection] = useState<string>(`videos/${category}`)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const router = useRouter()
  const { user, addToFavorites, removeFromFavorites, getFavorites, addToHistory } = useAuth()
  const favorites = getFavorites()

  // Traducir categoría para el título
  const translateCategory = (cat: string) => {
    const translations: Record<string, string> = {
      amateur: "Amateur",
      famosas: "Famosas",
      monica: "Monica",
      estudio: "Estudio",
    }

    return translations[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true)
      try {
        // Intentar cargar desde localStorage
        const savedMedia = localStorage.getItem("mediaItems")
        if (savedMedia) {
          try {
            const parsedMedia = JSON.parse(savedMedia) as MediaItem[]
            // Filtrar por tipo video y categoría (insensible a mayúsculas/minúsculas)
            const filteredMedia = parsedMedia.filter(
              (item) => item.type === "video" && item.category.toLowerCase() === category.toLowerCase(),
            )
            setMediaItems(filteredMedia)
          } catch (parseError) {
            console.error("Error al parsear los datos guardados:", parseError)
            setMediaItems([])
          }
        } else {
          setMediaItems([])
        }
      } catch (error) {
        console.error(`Error al cargar los videos de la categoría ${category}:`, error)
        setMediaItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [category])

  // Manejar la eliminación de un medio
  const handleMediaDeleted = (id: string) => {
    // Actualizar la lista local
    setMediaItems((prev) => prev.filter((item) => item.id !== id))

    // Actualizar localStorage
    const savedMedia = localStorage.getItem("mediaItems")
    if (savedMedia) {
      const parsedMedia = JSON.parse(savedMedia) as MediaItem[]
      const updatedMedia = parsedMedia.filter((item) => item.id !== id)
      localStorage.setItem("mediaItems", JSON.stringify(updatedMedia))
    }

    // Cerrar el visor si el medio eliminado es el que se está viendo
    if (selectedMedia && selectedMedia.id === id) {
      setSelectedMedia(null)
    }
  }

  // Función para abrir un medio
  const handleMediaClick = (item: MediaItem) => {
    // Añadir al historial
    if (user) {
      addToHistory(item.id)
    }

    // Mostrar el medio en el visor
    setSelectedMedia(item)
  }

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      removeFromFavorites(id)
    } else {
      addToFavorites(id)
    }
  }

  // Función para volver al inicio
  const handleGoHome = () => {
    router.push("/")
  }

  // Actualizar la función que maneja la navegación:
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Botón de inicio para móvil */}
          <div className="md:hidden flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoHome}
              className="bg-accent hover:bg-accent/90 text-white border-none"
            >
              <Home className="h-4 w-4 mr-2" /> Inicio
            </Button>
          </div>

          <GalleryHeader
            title={`Videos - ${translateCategory(category)}`}
            subtitle={`Explora tu colección de videos de la categoría ${translateCategory(category)}`}
          />

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
                <p className="text-gray-400 mb-4">No se encontraron videos en esta categoría.</p>
                <Button onClick={() => router.push("/videos")} className="bg-accent hover:bg-accent/90 text-white">
                  Ver todas las categorías
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onClick={() => handleMediaClick(item)}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onDelete={user?.id === item.userId ? handleMediaDeleted : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Visor de medios */}
      {selectedMedia && (
        <MediaViewer
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          isFavorite={favorites.includes(selectedMedia.id)}
          onToggleFavorite={() => toggleFavorite(selectedMedia.id)}
          onDelete={user?.id === selectedMedia.userId ? handleMediaDeleted : undefined}
        />
      )}
    </div>
  )
}
