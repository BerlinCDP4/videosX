"use client"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import UploadForm from "@/components/upload-form"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function UploadPage() {
  const [activeSection, setActiveSection] = useState<string>("upload")
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/upload")
    }
  }, [isAuthenticated, isLoading, router])

  const handleCancel = () => {
    router.back() // Volver a la página anterior
  }

  // Mostrar mensaje de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        <MainNavigation activeSection={activeSection} onNavigate={setActiveSection} />
        <main className="flex-1 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <GalleryHeader title="Subir Medio" subtitle="Cargando..." />
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Mostrar mensaje de acceso denegado si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        <MainNavigation activeSection={activeSection} onNavigate={setActiveSection} />
        <main className="flex-1 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <GalleryHeader title="Acceso Denegado" subtitle="Necesitas iniciar sesión para subir medios" />
            </div>
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acceso Denegado</AlertTitle>
              <AlertDescription>
                Necesitas iniciar sesión para subir medios. Por favor,{" "}
                <Link href="/auth/login?callbackUrl=/upload" className="underline font-medium">
                  inicia sesión
                </Link>{" "}
                para continuar.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
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
