"use client"

import { useState } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function FavoritesPage() {
  const [activeSection, setActiveSection] = useState<string>("favorites")
  const router = useRouter()

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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader title="Favoritos" subtitle="Tu colección de medios favoritos" />

          <section>
            <div className="text-center py-12 bg-card rounded-lg border border-muted p-8">
              <p className="text-gray-400 mb-4">
                No tienes favoritos. Marca algunos medios como favoritos para verlos aquí.
              </p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                <Link href="/">Explorar Galería</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
