"use client"

import { useState } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import UploadForm from "@/components/upload-form"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const [activeSection, setActiveSection] = useState<string>("upload")
  const router = useRouter()

  const handleCancel = () => {
    router.back() // Volver a la página anterior
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <GalleryHeader title="Subir Medio" subtitle="Sube tus imágenes y videos favoritos" />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="border-muted bg-secondary hover:bg-muted hover:text-accent"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <section className="mb-10">
            <UploadForm />
          </section>
        </div>
      </main>
    </div>
  )
}
