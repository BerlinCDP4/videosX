/**
 * Servicio de medios
 *
 * Este servicio proporciona funciones para gestionar medios,
 * incluyendo obtener, añadir, actualizar y eliminar medios.
 */

import { executeQuery } from "./db"
import { deleteFile } from "./blob-service"
import type { MediaItem } from "./types"

// Interfaz para el servicio de medios
export interface MediaService {
  // Obtener todos los medios
  getAllMedia(): Promise<MediaItem[]>

  // Obtener un medio por ID
  getMediaById(id: number): Promise<MediaItem | null>

  // Obtener medios por tipo
  getMediaByType(type: "image" | "video"): Promise<MediaItem[]>

  // Obtener medios por categoría
  getMediaByCategory(category: string): Promise<MediaItem[]>

  // Obtener medios por tipo y categoría
  getMediaByTypeAndCategory(type: "image" | "video", category: string): Promise<MediaItem[]>

  // Añadir un nuevo medio
  addMedia(item: Omit<MediaItem, "id" | "createdAt">): Promise<MediaItem>

  // Actualizar un medio existente
  updateMedia(id: number, updates: Partial<MediaItem>): Promise<MediaItem | null>

  // Eliminar un medio
  deleteMedia(id: number, userId: number): Promise<boolean>

  // Obtener medios recientes
  getRecentMedia(limit?: number): Promise<MediaItem[]>

  // Obtener medios favoritos
  getFavoriteMedia(userId: number): Promise<MediaItem[]>

  // Obtener historial de medios
  getHistoryMedia(userId: number): Promise<MediaItem[]>
}

// Implementación del servicio de medios
export const mediaService: MediaService = {
  // Obtener todos los medios
  async getAllMedia(): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(`
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
      `)

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error("Error al obtener medios:", error)
      return []
    }
  },

  // Obtener un medio por ID
  async getMediaById(id: number): Promise<MediaItem | null> {
    try {
      const result = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
      `,
        [id],
      )

      if (result.length === 0) return null

      const item = result[0]
      return {
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }
    } catch (error) {
      console.error("Error al obtener medio por ID:", error)
      return null
    }
  },

  // Obtener medios por tipo
  async getMediaByType(type: "image" | "video"): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE m.type = $1
        ORDER BY m.created_at DESC
      `,
        [type],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error(`Error al obtener medios de tipo ${type}:`, error)
      return []
    }
  },

  // Obtener medios por categoría
  async getMediaByCategory(category: string): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE LOWER(m.category) = LOWER($1)
        ORDER BY m.created_at DESC
      `,
        [category],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error(`Error al obtener medios de categoría ${category}:`, error)
      return []
    }
  },

  // Obtener medios por tipo y categoría
  async getMediaByTypeAndCategory(type: "image" | "video", category: string): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE m.type = $1 AND LOWER(m.category) = LOWER($2)
        ORDER BY m.created_at DESC
      `,
        [type, category],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error(`Error al obtener medios de tipo ${type} y categoría ${category}:`, error)
      return []
    }
  },

  // Añadir un nuevo medio
  async addMedia(item: Omit<MediaItem, "id" | "createdAt">): Promise<MediaItem> {
    try {
      const result = await executeQuery<any[]>(
        `
        INSERT INTO media (title, url, type, category, thumbnail_url, user_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, title, url, type, category, thumbnail_url, user_id, created_at
      `,
        [item.title, item.url, item.type, item.category.toLowerCase(), item.thumbnail || null, item.userId],
      )

      if (result.length === 0) {
        throw new Error("Error al añadir medio")
      }

      const newItem = result[0]

      // Obtener el nombre del usuario
      const userResult = await executeQuery<any[]>(
        `
        SELECT name FROM users WHERE id = $1
      `,
        [item.userId],
      )

      return {
        id: newItem.id,
        title: newItem.title,
        url: newItem.url,
        type: newItem.type as "image" | "video",
        category: newItem.category,
        thumbnail: newItem.thumbnail_url,
        userId: newItem.user_id,
        userName: userResult[0]?.name || "Usuario",
        createdAt: newItem.created_at,
      }
    } catch (error) {
      console.error("Error al añadir medio:", error)
      throw new Error("No se pudo añadir el medio")
    }
  },

  // Actualizar un medio existente
  async updateMedia(id: number, updates: Partial<MediaItem>): Promise<MediaItem | null> {
    try {
      // Construir la consulta de actualización dinámicamente
      const updateFields = []
      const params = []
      let paramIndex = 1

      if (updates.title) {
        updateFields.push(`title = $${paramIndex}`)
        params.push(updates.title)
        paramIndex++
      }

      if (updates.url) {
        updateFields.push(`url = $${paramIndex}`)
        params.push(updates.url)
        paramIndex++
      }

      if (updates.type) {
        updateFields.push(`type = $${paramIndex}`)
        params.push(updates.type)
        paramIndex++
      }

      if (updates.category) {
        updateFields.push(`category = $${paramIndex}`)
        params.push(updates.category.toLowerCase())
        paramIndex++
      }

      if (updates.thumbnail) {
        updateFields.push(`thumbnail_url = $${paramIndex}`)
        params.push(updates.thumbnail)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return await this.getMediaById(id)
      }

      // Añadir el ID como último parámetro
      params.push(id)

      const result = await executeQuery<any[]>(
        `
        UPDATE media 
        SET ${updateFields.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING id, title, url, type, category, thumbnail_url, user_id, created_at
      `,
        params,
      )

      if (result.length === 0) return null

      const item = result[0]

      // Obtener el nombre del usuario
      const userResult = await executeQuery<any[]>(
        `
        SELECT name FROM users WHERE id = $1
      `,
        [item.user_id],
      )

      return {
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: userResult[0]?.name || "Usuario",
        createdAt: item.created_at,
      }
    } catch (error) {
      console.error("Error al actualizar medio:", error)
      return null
    }
  },

  // Eliminar un medio
  async deleteMedia(id: number, userId: number): Promise<boolean> {
    try {
      // Verificar que el usuario es el propietario
      const media = await this.getMediaById(id)

      if (!media || media.userId !== userId) {
        return false
      }

      // Eliminar el medio de la base de datos
      await executeQuery(
        `
        DELETE FROM media 
        WHERE id = $1
      `,
        [id],
      )

      // Si hay una URL de miniatura, eliminarla de Vercel Blob
      if (media.thumbnail && !media.thumbnail.includes("youtube.com")) {
        await deleteFile(media.thumbnail)
      }

      // Si es una imagen y está almacenada en Vercel Blob, eliminarla
      if (media.type === "image" && !media.url.includes("http")) {
        await deleteFile(media.url)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar medio:", error)
      return false
    }
  },

  // Obtener medios recientes
  async getRecentMedia(limit = 10): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
        LIMIT $1
      `,
        [limit],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error("Error al obtener medios recientes:", error)
      return []
    }
  },

  // Obtener medios favoritos
  async getFavoriteMedia(userId: number): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        JOIN favorites f ON m.id = f.media_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `,
        [userId],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error("Error al obtener medios favoritos:", error)
      return []
    }
  },

  // Obtener historial de medios
  async getHistoryMedia(userId: number): Promise<MediaItem[]> {
    try {
      const media = await executeQuery<any[]>(
        `
        SELECT m.id, m.title, m.url, m.type, m.category, m.thumbnail_url, m.user_id, m.created_at, u.name as user_name, h.viewed_at
        FROM media m
        JOIN users u ON m.user_id = u.id
        JOIN history h ON m.id = h.media_id
        WHERE h.user_id = $1
        ORDER BY h.viewed_at DESC
      `,
        [userId],
      )

      return media.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type as "image" | "video",
        category: item.category,
        thumbnail: item.thumbnail_url,
        userId: item.user_id,
        userName: item.user_name,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error("Error al obtener historial de medios:", error)
      return []
    }
  },
}
