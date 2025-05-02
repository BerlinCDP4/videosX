"use client"

import { MoonIcon, SunIcon, LayoutGrid, LayoutList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface GalleryHeaderProps {
  title?: string
  subtitle?: string
}

export function GalleryHeader({
  title = "Galería de Medios",
  subtitle = "Visualiza tus imágenes y videos favoritos",
}: GalleryHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const isMobile = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 pt-16 md:pt-0">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 mt-2">{subtitle}</p>
      </div>

      {mounted && (
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            aria-label="Cambiar modo de vista"
            className="border-muted bg-secondary hover:bg-muted hover:text-accent"
          >
            {viewMode === "grid" ? <LayoutList className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
            className="border-muted bg-secondary hover:bg-muted hover:text-accent"
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </header>
  )
}
