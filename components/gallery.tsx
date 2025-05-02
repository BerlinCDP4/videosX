"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MediaCard from "@/components/media-card"
import MediaViewer from "@/components/media-viewer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MediaItem } from "@/lib/types"

interface GalleryProps {
  mediaItems: MediaItem[]
  isLoading: boolean
  favorites: string[]
  onToggleFavorite: (id: string) => void
  showTypeFilter?: boolean
  defaultType?: string
}

export default function Gallery({
  mediaItems,
  isLoading,
  favorites,
  onToggleFavorite,
  showTypeFilter = true,
  defaultType = "all",
}: GalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [activeTab, setActiveTab] = useState(defaultType)
  const [activeCategory, setActiveCategory] = useState("all")

  // Get unique categories from media items
  const categories = ["all", ...new Set(mediaItems.map((item) => item.category))]

  // Filter media by type and category
  const filteredMedia = mediaItems.filter((item) => {
    const typeMatch = activeTab === "all" || item.type === activeTab
    const categoryMatch = activeCategory === "all" || item.category === activeCategory

    return typeMatch && categoryMatch
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
          ))}
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    if (category === "all") return "Todas las Categorías"

    const translations: Record<string, string> = {
      amateur: "Amateur",
      famosas: "Famosas",
      monica: "Monica",
      estudio: "Estudio",
    }

    return translations[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {showTypeFilter && (
          <Tabs defaultValue={defaultType} value={activeTab} onValueChange={setActiveTab}>
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
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-[180px] bg-muted border-muted text-white">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent className="bg-card border-muted">
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {getCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No se encontraron medios. ¡Sube algunos para comenzar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          ))}
        </div>
      )}

      {selectedMedia && (
        <MediaViewer
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          isFavorite={favorites.includes(selectedMedia.id)}
          onToggleFavorite={() => onToggleFavorite(selectedMedia.id)}
        />
      )}
    </div>
  )
}
