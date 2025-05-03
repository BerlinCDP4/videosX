"use server"

import type { MediaItem } from "./types"
import { revalidatePath } from "next/cache"

// Base de datos simulada para almacenar medios
// En una implementación real, esto sería una base de datos persistente
let mediaDatabase: MediaItem[] = []

// Función para cargar medios desde localStorage (se ejecuta en el cliente)
export async function getMedia(): Promise<MediaItem[]> {
  // Simular retraso de API
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Ordenar por más reciente primero
  return [...mediaDatabase].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getMediaByType(type: "image" | "video"): Promise<MediaItem[]> {
  // Obtener medios por tipo
  const media = await getMedia()
  return media.filter((item) => item.type === type)
}

export async function getMediaByCategory(category: string): Promise<MediaItem[]> {
  // Obtener medios por categoría
  const media = await getMedia()
  return media.filter((item) => item.category === category)
}

export async function getFavorites(favoriteIds: string[]): Promise<MediaItem[]> {
  // Obtener medios favoritos
  const media = await getMedia()
  return media.filter((item) => favoriteIds.includes(item.id))
}

export async function getRecentMedia(limit = 10): Promise<MediaItem[]> {
  // Obtener medios recientes
  const media = await getMedia()
  return media.slice(0, limit)
}

export async function uploadMedia(url: string, type: string, title: string, category: string): Promise<MediaItem> {
  // Validar URL
  try {
    new URL(url)
  } catch (e) {
    throw new Error("URL inválida")
  }

  // Validar tipo
  if (type !== "image" && type !== "video") {
    throw new Error("Tipo de medio inválido")
  }

  let thumbnail: string | undefined

  // Procesar según el tipo
  if (type === "video") {
    // Para YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = null

      if (url.includes("youtu.be")) {
        videoId = url.split("/").pop()?.split("?")[0]
      } else if (url.includes("v=")) {
        videoId = new URL(url).searchParams.get("v")
      }

      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    }
    // Para Vimeo
    else if (url.includes("vimeo.com")) {
      // En una implementación real, se haría una llamada a la API de Vimeo
      thumbnail = "/placeholder.svg?height=400&width=600&text=Video"
    }
    // Para catbox.moe y otros servicios de alojamiento de videos
    else if (url.includes("catbox.moe") || url.endsWith(".mp4") || url.endsWith(".webm")) {
      // Usar un placeholder genérico para videos
      thumbnail = "/placeholder.svg?height=400&width=600&text=Video"
    }
    // Para otros videos, usar un placeholder
    else {
      thumbnail = "/placeholder.svg?height=400&width=600&text=Video"
    }
  }

  // Crear nuevo elemento de medio
  const newMedia: MediaItem = {
    id: Date.now().toString(),
    title: title || "Sin título",
    url: url,
    type: type as "image" | "video",
    category: category.toLowerCase(),
    thumbnail,
    createdAt: new Date().toISOString(),
  }

  // Añadir a la base de datos
  mediaDatabase = [newMedia, ...mediaDatabase]

  // Revalidar la ruta para actualizar la UI
  revalidatePath("/")
  revalidatePath("/upload")
  revalidatePath("/images")
  revalidatePath("/videos")
  revalidatePath("/favorites")
  revalidatePath("/recent")

  return newMedia
}

// Función para sincronizar la base de datos con localStorage
export async function syncMediaDatabase(items: MediaItem[]): Promise<void> {
  mediaDatabase = items
  revalidatePath("/")
}
