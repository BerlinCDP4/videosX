"use client"

import { useState } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RecentPage() {
  const [activeSection, setActiveSection] = useState<string>("recent")
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
          <GalleryHeader title="Añadidos Recientemente" subtitle="Los últimos medios agregados a tu colección" />

          <section>
            <div className="text-center py-12 bg-card rounded-lg border border-muted p-8">
              <p className="text-gray-400 mb-4">No hay medios recientes. ¡Sube algunos para comenzar!</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-white">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" /> Subir Nuevo Medio
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
