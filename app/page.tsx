"use client"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import MediaViewer from "@/components/media-viewer"
import { mediaService } from "@/lib/db-service"
import type { MediaItem } from "@/lib/types"

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const router = useRouter()
  const { user, addToHistory, addToFavorites, removeFromFavorites, getFavorites } = useAuth()
  const favorites = getFavorites()

  // Cargar medios al iniciar
  useEffect(() => {
    const loadMedia = () => {
      try {
        // Obtener medios de la base de datos
        const allMedia = mediaService.getAll()
        setMediaItems(allMedia)
      } catch (error) {
        console.error("Error al cargar medios:", error)
        setMediaItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMedia()
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
      history: "/history",
    }

    const path = routes[section]
    if (path) {
      router.push(path)
    }
  }

  // Filtrar medios según la pestaña activa
  const filteredMedia = mediaItems.filter((item) => {
    if (activeTab === "all") return true
    return item.type === activeTab
  })

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

  // Manejar la eliminación de un medio
  const handleDelete = async (id: string) => {
    if (!user) return

    // Eliminar de la base de datos
    const success = mediaService.delete(id, user.id)

    if (success) {
      // Actualizar la lista local
      setMediaItems((prev) => prev.filter((item) => item.id !== id))

      // Cerrar el visor si el medio eliminado es el que se está viendo
      if (selectedMedia && selectedMedia.id === id) {
        setSelectedMedia(null)
      }
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader />

          <div className="mb-8 flex justify-between items-center">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted">
                <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-white">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-accent data-[state=active]:text-white">
                  Imágenes
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-accent data-[state=active]:text-white">
                  Videos
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button asChild className="bg-accent hover:bg-accent/90 text-white">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Medio
              </Link>
            </Button>
          </div>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white">Galería de Medios</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
                  ))}
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-muted p-8">
                <p className="text-gray-400 mb-4">No se encontraron medios. Comienza subiendo imágenes o videos.</p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Medio
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md bg-card border-muted rounded-lg"
                    onClick={() => handleMediaClick(item)}
                  >
                    <div className="p-0 relative">
                      <div className="aspect-video relative">
                        {item.type === "image" ? (
                          <img
                            src={item.url || "/placeholder.svg"}
                            alt={item.title || "Imagen"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img
                              src={item.thumbnail || "/video-thumbnail.png"}
                              alt={item.title || "Video"}
                              className="w-full h-full object-cover"
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
                    </div>
                  </div>
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
          onDelete={(id) => handleDelete(id)}
        />
      )}
    </div>
  )
}
