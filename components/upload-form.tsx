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

// Nuevas categorías
const mediaCategories = ["Amateur", "Famosas", "Monica", "Estudio"]

export default function UploadForm() {
  const [url, setUrl] = useState("")
  const [type, setType] = useState("image")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  // Reset form when type changes
  useEffect(() => {
    setCategory("")
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    setIsUploading(true)

    try {
      await uploadMedia(url, type, title, category.toLowerCase())

      toast({
        title: "Éxito",
        description: "Medio subido correctamente",
      })
      setUrl("")
      setTitle("")
      setCategory("")

      // Redirigir a la página correspondiente después de subir
      if (type === "image") {
        router.push("/images")
      } else {
        router.push("/videos")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir el medio",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm border border-muted">
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
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={isUploading}>
        {isUploading ? "Subiendo..." : "Subir Medio"}
      </Button>
    </form>
  )
}
