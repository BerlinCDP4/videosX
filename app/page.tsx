"use client"

import { Suspense, useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { getMedia, syncMediaDatabase } from "@/lib/actions"
import type { MediaItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import Gallery from "@/components/gallery"
import { useRouter } from "next/navigation"

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const router = useRouter()

  // Cargar datos guardados al iniciar con mejor manejo de errores
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Intentar cargar medios desde localStorage
        const savedMedia = localStorage.getItem("mediaItems")
        if (savedMedia) {
          try {
            const parsedMedia = JSON.parse(savedMedia) as MediaItem[]
            setMediaItems(parsedMedia)

            // Sincronizar con la base de datos del servidor
            await syncMediaDatabase(parsedMedia)
          } catch (parseError) {
            console.error("Error al parsear los datos guardados:", parseError)
            // Si hay error al parsear, cargar desde el servidor
            const data = await getMedia()
            setMediaItems(data)
          }
        } else {
          // Si no hay datos guardados, cargar desde el servidor
          const data = await getMedia()
          setMediaItems(data)

          // Guardar en localStorage
          try {
            localStorage.setItem("mediaItems", JSON.stringify(data))
          } catch (storageError) {
            console.error("Error al guardar en localStorage:", storageError)
          }
        }
      } catch (error) {
        console.error("Error al cargar los medios:", error)

        // Intentar cargar desde el servidor como respaldo
        try {
          const data = await getMedia()
          setMediaItems(data)
        } catch (e) {
          console.error("Error al cargar los medios desde el servidor:", e)
          // Establecer un array vacío en caso de error para evitar que la aplicación falle
          setMediaItems([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Load favorites from localStorage with error handling
    try {
      const savedFavorites = localStorage.getItem("favorites")
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    } catch (error) {
      console.error("Error al cargar favoritos:", error)
      setFavorites([])
    }

    loadSavedData()
  }, [])

  // Guardar cambios en localStorage cuando cambian los medios
  useEffect(() => {
    if (mediaItems.length > 0 && !isLoading) {
      localStorage.setItem("mediaItems", JSON.stringify(mediaItems))
    }
  }, [mediaItems, isLoading])

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]

      // Save to localStorage
      localStorage.setItem("favorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // Manejar la eliminación de un medio
  const handleMediaDeleted = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Actualizar la función que maneja la navegación:
  const handleNavigate = (section: string) => {
    setActiveSection(section)

    // Encontrar la categoría seleccionada
    const findCategory = (categories: any[], id: string): any | undefined => {
      for (const category of categories) {
        if (category.id === id) return category
        if (category.subcategories) {
          const found = findCategory(category.subcategories, id)
          if (found) return found
        }
      }
      return undefined
    }

    // Simular las categorías que están en MainNavigation
    const categories = [
      { id: "home", path: "/" },
      { id: "images", path: "/images" },
      { id: "videos", path: "/videos" },
      { id: "upload", path: "/upload" },
      { id: "favorites", path: "/favorites" },
      { id: "recent", path: "/recent" },
    ]

    const selectedCategory = findCategory(categories, section)

    if (selectedCategory?.path && selectedCategory.path !== "/") {
      router.push(selectedCategory.path)
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

          <div className="mb-8 flex justify-end">
            <Button asChild className="bg-accent hover:bg-accent/90 text-white">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Medio
              </Link>
            </Button>
          </div>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white">Galería de Medios</h2>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
                    ))}
                </div>
              }
            >
              <Gallery
                mediaItems={mediaItems}
                isLoading={isLoading}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onMediaDeleted={handleMediaDeleted}
              />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
}
