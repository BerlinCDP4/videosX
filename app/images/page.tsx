"use client"

import { Suspense, useState, useEffect } from "react"
import Gallery from "@/components/gallery"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { getMediaByType } from "@/lib/actions"
import type { MediaItem } from "@/lib/types"

export default function ImagesPage() {
  const [activeSection, setActiveSection] = useState<string>("images")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const data = await getMediaByType("image")
        setMediaItems(data)
      } catch (error) {
        console.error("Error al cargar las imágenes:", error)
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
  }, [])

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]

      // Save to localStorage
      localStorage.setItem("favorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader title="Imágenes" subtitle="Explora tu colección de imágenes" />

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
              />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
}
