"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { uploadMedia } from "@/lib/actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ThumbnailGenerator from "@/components/thumbnail-generator"
import { useAuth } from "@/contexts/auth-context"

// Nuevas categorías
const mediaCategories = ["Amateur", "Famosas", "Monica", "Estudio"]

export default function UploadForm() {
  const [url, setUrl] = useState("")
  const [type, setType] = useState("image")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null)
  const [showThumbnailGenerator, setShowThumbnailGenerator] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

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

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para subir medios",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setIsLoading(true)

    try {
      const newMedia = await uploadMedia(
        url,
        type,
        title || "Sin título",
        category.toLowerCase(),
        user.id,
        customThumbnail || undefined,
      )

      // Actualizar localStorage con el nuevo medio
      try {
        const savedMedia = localStorage.getItem("mediaItems")
        const mediaItems = savedMedia ? JSON.parse(savedMedia) : []
        localStorage.setItem("mediaItems", JSON.stringify([newMedia, ...mediaItems]))
      } catch (storageError) {
        console.error("Error al actualizar localStorage:", storageError)
        // Continuar aunque falle el localStorage
      }

      toast({
        title: "Éxito",
        description: "Medio subido correctamente",
      })
      setUrl("")
      setTitle("")
      setCategory("")
      setCustomThumbnail(null)
      setShowThumbnailGenerator(false)
      setShowAlert(true)

      // Esperar 2 segundos antes de redirigir
      setTimeout(() => {
        // Redirigir a la página correspondiente después de subir
        if (type === "image") {
          router.push("/images")
        } else {
          router.push("/videos")
        }
      }, 2000)
    } catch (error) {
      console.error("Error al subir medio:", error)
      toast({
        title: "Error",
        description: "Error al subir el medio. Por favor, intenta de nuevo con otra URL.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back() // Volver a la página anterior
  }

  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    setCustomThumbnail(thumbnailUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm border border-muted">
      {showAlert && (
        <Alert className="bg-accent/20 border-accent text-white mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¡Medio subido correctamente!</AlertTitle>
          <AlertDescription>Redirigiendo a la galería...</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 bg-muted">
          <TabsTrigger value="basic" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Información Básica
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Opciones Avanzadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
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
                        const generator = new ThumbnailGenerator({
                          videoUrl: url,
                          onThumbnailGenerated: handleThumbnailGenerated,
                          autoGenerate: true,
                          hidden: true,
                        })
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
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="text-sm text-muted-foreground">
            <p className="mb-4">Opciones avanzadas para tu medio:</p>

            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Formatos de URL:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Las URLs de imágenes directas deben terminar con extensiones como .jpg, .png, .webp</li>
                  <li>Las URLs de videos directos deben terminar con extensiones como .mp4, .webm</li>
                  <li>Para videos de YouTube, usa el enlace completo (ej: https://www.youtube.com/watch?v=VIDEO_ID)</li>
                  <li>Para videos de catbox.moe, usa el enlace directo al archivo .mp4</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Propiedad del contenido:</p>
                <p>Solo tú podrás eliminar el contenido que subas. Otros usuarios no podrán eliminar tus medios.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
  )
}
