"use client"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Versión simplificada de MediaItem para reducir posibles errores
interface SimpleMediaItem {
  id: string
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Inicialización segura
  useEffect(() => {
    try {
      // Verificar si hay datos corruptos en localStorage
      try {
        const savedMedia = localStorage.getItem("mediaItems")
        if (savedMedia) {
          JSON.parse(savedMedia) // Intentar parsear para verificar si es JSON válido
        }
      } catch (e) {
        console.error("Datos corruptos en localStorage, limpiando...", e)
        localStorage.removeItem("mediaItems")
      }

      // Verificar favoritos
      try {
        const savedFavorites = localStorage.getItem("favorites")
        if (savedFavorites) {
          JSON.parse(savedFavorites)
        }
      } catch (e) {
        console.error("Datos de favoritos corruptos, limpiando...", e)
        localStorage.removeItem("favorites")
      }
    } catch (e) {
      console.error("Error al inicializar la aplicación:", e)
    } finally {
      setIsLoading(false)
    }
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
    if (path && path !== "/") {
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

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-muted p-8">
                <p className="text-gray-400 mb-4">
                  Bienvenido a tu galería de medios. Comienza subiendo imágenes o videos.
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Medio
                  </Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
