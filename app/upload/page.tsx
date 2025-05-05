"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Categorías disponibles
const mediaCategories = ["Amateur", "Famosas", "Monica", "Estudio"]

export default function UploadPage() {
  const [activeSection, setActiveSection] = useState<string>("upload")
  const [url, setUrl] = useState("")
  const [type, setType] = useState("image")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

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

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?callbackUrl=/upload")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!url) {
      toast({
        title: "Error",
        description: "Por favor, introduce una URL",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una categoría",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear nuevo elemento de medio
      const newMedia = {
        id: Date.now().toString(),
        title: title || "Sin título",
        url: url,
        type: type as "image" | "video",
        category: category.toLowerCase(),
        thumbnail: type === "video" ? "/video-thumbnail.png" : undefined,
        createdAt: new Date().toISOString(),
        userId: user?.id || "anonymous",
      }

      // Guardar en localStorage
      try {
        const savedMedia = localStorage.getItem("mediaItems")
        const mediaItems = savedMedia ? JSON.parse(savedMedia) : []
        localStorage.setItem("mediaItems", JSON.stringify([newMedia, ...mediaItems]))
      } catch (storageError) {
        console.error("Error al guardar en localStorage:", storageError)
        localStorage.setItem("mediaItems", JSON.stringify([newMedia]))
      }

      toast({
        title: "Éxito",
        description: "Medio subido correctamente",
      })

      // Redirigir después de subir
      setTimeout(() => {
        if (type === "image") {
          router.push("/images")
        } else {
          router.push("/videos")
        }
      }, 1000)
    } catch (error) {
      console.error("Error al subir medio:", error)
      toast({
        title: "Error",
        description: "Error al subir el medio. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (!isAuthenticated) {
    return null // No renderizar nada mientras redirige
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

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
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm border border-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Introduce un título para tu medio"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-muted border-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL del Medio</Label>
                  <Input
                    id="url"
                    placeholder="https://ejemplo.com/tu-medio.jpg"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-muted border-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Medio</Label>
                  <RadioGroup
                    defaultValue="image"
                    value={type}
                    onValueChange={(value) => {
                      setType(value)
                      setCategory("")
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" className="border-accent text-accent" />
                      <Label htmlFor="image">Imagen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" className="border-accent text-accent" />
                      <Label htmlFor="video">Video</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="bg-muted border-muted">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-muted">
                      {mediaCategories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 border-muted hover:bg-muted hover:text-accent"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-2/3 bg-accent hover:bg-accent/90 text-white" disabled={isLoading}>
                  {isLoading ? "Subiendo..." : "Subir Medio"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
