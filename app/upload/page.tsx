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
import ThumbnailGenerator from "@/components/thumbnail-generator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Categorías disponibles
const mediaCategories = ["Amateur", "Famosas", "Monica", "Estudio"]

export default function UploadPage() {
  const [activeSection, setActiveSection] = useState<string>("upload")
  const [url, setUrl] = useState("")
  const [type, setType] = useState("image")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null)
  const [showThumbnailGenerator, setShowThumbnailGenerator] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
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

  // Reset form when type changes
  useEffect(() => {
    setCategory("")
    setCustomThumbnail(null)
    setShowThumbnailGenerator(false)
    setUrlError(null)
  }, [type])

  // Mostrar generador de miniaturas automáticamente cuando se ingresa una URL de video válida
  useEffect(() => {
    if (type === "video" && isValidUrl(url)) {
      setShowThumbnailGenerator(true)
      setUrlError(null)
    }
  }, [url, type])

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?callbackUrl=/upload")
    }
  }, [isAuthenticated, router])

  // Validar URL con mejor manejo de errores
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || urlString.trim() === "") return false

    try {
      new URL(urlString)
      return true
    } catch (e) {
      return false
    }
  }

  // Validar URL de video con mejor detección
  const isValidVideoUrl = (urlString: string): boolean => {
    if (!isValidUrl(urlString)) return false

    // Verificar si es una URL de YouTube
    if (urlString.includes("youtube.com") || urlString.includes("youtu.be")) {
      return true
    }

    // Verificar si es una URL directa de video
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"]
    const lowercaseUrl = urlString.toLowerCase()
    return videoExtensions.some((ext) => lowercaseUrl.endsWith(ext))
  }

  // Validar URL de imagen con mejor detección
  const isValidImageUrl = (urlString: string): boolean => {
    if (!isValidUrl(urlString)) return false

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]
    const lowercaseUrl = urlString.toLowerCase()
    return imageExtensions.some((ext) => lowercaseUrl.endsWith(ext))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUrlError(null)

    // Validaciones básicas
    if (!url || url.trim() === "") {
      toast({
        title: "Error",
        description: "Por favor, introduce una URL",
        variant: "destructive",
      })
      return
    }

    // Validar URL según el tipo
    if (type === "video") {
      if (!isValidVideoUrl(url)) {
        setUrlError(
          "La URL no parece ser un video válido. Debe ser un enlace de YouTube o terminar en .mp4, .webm, etc.",
        )
        return
      }
    } else if (type === "image") {
      if (!isValidImageUrl(url)) {
        setUrlError("La URL no parece ser una imagen válida. Debe terminar en .jpg, .png, .webp, etc.")
        return
      }
    }

    if (!category) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una categoría",
        variant: "destructive",
      })
      return
    }

    // Si es un video y no tiene miniatura personalizada
    if (type === "video" && !customThumbnail) {
      toast({
        title: "Error",
        description: "Por favor, genera una miniatura para el video",
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
        thumbnail: customThumbnail || undefined,
        createdAt: new Date().toISOString(),
        userId: user?.id || "anonymous",
      }

      // Guardar en localStorage con manejo de errores
      try {
        const savedMedia = localStorage.getItem("mediaItems")
        let mediaItems = []

        if (savedMedia) {
          try {
            mediaItems = JSON.parse(savedMedia)
            if (!Array.isArray(mediaItems)) {
              mediaItems = []
            }
          } catch (parseError) {
            console.error("Error al parsear mediaItems:", parseError)
            mediaItems = []
          }
        }

        localStorage.setItem("mediaItems", JSON.stringify([newMedia, ...mediaItems]))
      } catch (storageError) {
        console.error("Error al guardar en localStorage:", storageError)
        // Intentar guardar solo el nuevo elemento
        try {
          localStorage.setItem("mediaItems", JSON.stringify([newMedia]))
        } catch (e) {
          console.error("Error al guardar el nuevo elemento:", e)
        }
      }

      toast({
        title: "Éxito",
        description: "Medio subido correctamente",
      })

      // Limpiar formulario
      setUrl("")
      setTitle("")
      setCategory("")
      setCustomThumbnail(null)
      setShowThumbnailGenerator(false)

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

  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    setCustomThumbnail(thumbnailUrl)
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
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setUrlError(null)
                    }}
                    className={`w-full bg-muted border-muted ${urlError ? "border-red-500" : ""}`}
                  />
                  {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
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
                      setCategory("") // Reset category when type changes
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

              {/* Mostrar generador de miniaturas solo para videos */}
              {type === "video" && url && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <Label>Miniatura del Video</Label>
                  </div>

                  {/* Generador de miniaturas oculto pero funcional */}
                  <ThumbnailGenerator
                    videoUrl={url}
                    onThumbnailGenerated={handleThumbnailGenerated}
                    autoGenerate={true}
                    hidden={true}
                  />

                  {customThumbnail ? (
                    <div className="relative aspect-video w-full max-w-md mx-auto border border-muted rounded-md overflow-hidden">
                      <img
                        src={customThumbnail || "/placeholder.svg"}
                        alt="Miniatura personalizada"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // Generar nueva miniatura automáticamente
                            const video = document.createElement("video")
                            video.crossOrigin = "anonymous"
                            video.src = url
                            video.onloadedmetadata = () => {
                              const canvas = document.createElement("canvas")
                              canvas.width = video.videoWidth || 640
                              canvas.height = video.videoHeight || 360
                              const ctx = canvas.getContext("2d")
                              if (ctx) {
                                video.currentTime = Math.min(video.duration / 4, 5)
                                setTimeout(() => {
                                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
                                  handleThumbnailGenerated(dataUrl)
                                }, 1000)
                              }
                            }
                            video.onerror = () => {
                              // Usar miniatura predeterminada en caso de error
                              handleThumbnailGenerated("/video-thumbnail.png")
                            }
                            video.load()
                          }}
                        >
                          Regenerar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <p className="text-muted-foreground mb-2">Generando miniatura automáticamente...</p>
                      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  )}
                </div>
              )}

              <Alert className="bg-blue-500/20 border-blue-500 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para videos de YouTube, usa el enlace completo (ej: https://www.youtube.com/watch?v=VIDEO_ID)
                </AlertDescription>
              </Alert>

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
