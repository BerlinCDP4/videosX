"use client"

import { Suspense, useState, useEffect } from "react"
import Gallery from "@/components/gallery"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { getMediaByType } from "@/lib/actions"
import type { MediaItem } from "@/lib/types"
import { useRouter, useParams } from "next/navigation"

export default function ImageCategoryPage() {
  const params = useParams()
  const category = params.category as string
  const [activeSection, setActiveSection] = useState<string>(`images/${category}`)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const router = useRouter()

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
      try {
        // Intentar cargar desde localStorage primero
        const savedMedia = localStorage.getItem("mediaItems")
        if (savedMedia) {
          const parsedMedia = JSON.parse(savedMedia) as MediaItem[]
          // Filtrar por tipo imagen y categoría
          setMediaItems(
            parsedMedia.filter(
              (item) => item.type === "image" && item.category.toLowerCase() === category.toLowerCase(),
            ),
          )
        } else {
          // Si no hay datos en localStorage, cargar desde el servidor
          const allImages = await getMediaByType("image")
          const filteredImages = allImages.filter((item) => item.category.toLowerCase() === category.toLowerCase())
          setMediaItems(filteredImages)
        }
      } catch (error) {
        console.error(`Error al cargar las imágenes de la categoría ${category}:`, error)

        // Intentar cargar desde el servidor como respaldo
        try {
          const allImages = await getMediaByType("image")
          const filteredImages = allImages.filter((item) => item.category.toLowerCase() === category.toLowerCase())
          setMediaItems(filteredImages)
        } catch (e) {
          console.error(`Error al cargar las imágenes de la categoría ${category} desde el servidor:`, e)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    fetchMedia()
  }, [category])

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
    // Actualizar la lista local
    setMediaItems((prev) => prev.filter((item) => item.id !== id))

    // Actualizar localStorage
    const savedMedia = localStorage.getItem("mediaItems")
    if (savedMedia) {
      const parsedMedia = JSON.parse(savedMedia) as MediaItem[]
      const updatedMedia = parsedMedia.filter((item) => item.id !== id)
      localStorage.setItem("mediaItems", JSON.stringify(updatedMedia))
    }
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

    if (selectedCategory?.path) {
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
          <GalleryHeader
            title={`Imágenes - ${translateCategory(category)}`}
            subtitle={`Explora tu colección de imágenes de la categoría ${translateCategory(category)}`}
          />

          <section>
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
                showTypeFilter={false}
                defaultType="image"
                onMediaDeleted={handleMediaDeleted}
              />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
}
