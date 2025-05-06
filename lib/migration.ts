"use server"

import { userService } from "./user-service"
import { mediaService } from "./media-service"
import { commentService } from "./comment-service"

// Función para migrar datos de localStorage a la base de datos
export async function migrateData(
  users: any[],
  media: any[],
  comments: any[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Migrar usuarios
    const userMap = new Map<string, number>() // Mapeo de IDs antiguos a nuevos

    for (const user of users) {
      const newUser = await userService.registerUser({
        name: user.name,
        email: user.email,
        password: user.password || "123456", // Contraseña por defecto si no existe
      })

      if (newUser) {
        userMap.set(user.id, newUser.id)

        // Actualizar imagen de perfil si existe
        if (user.image) {
          await userService.updateUser(newUser.id, { image: user.image })
        }
      }
    }

    // Migrar medios
    const mediaMap = new Map<string, number>() // Mapeo de IDs antiguos a nuevos

    for (const item of media) {
      const userId = userMap.get(item.userId) || 1 // Usuario por defecto si no existe

      const newMedia = await mediaService.addMedia({
        title: item.title || "Sin título",
        url: item.url,
        type: item.type,
        category: item.category || "sin categoría",
        thumbnail: item.thumbnail,
        userId,
      })

      if (newMedia) {
        mediaMap.set(item.id, newMedia.id)
      }
    }

    // Migrar comentarios
    for (const comment of comments) {
      const userId = userMap.get(comment.userId) || 1 // Usuario por defecto si no existe
      const mediaId = mediaMap.get(comment.mediaId)

      if (mediaId) {
        await commentService.addComment({
          mediaId,
          userId,
          userName: comment.userName || "Usuario",
          text: comment.text,
        })
      }
    }

    // Migrar favoritos
    for (const user of users) {
      const newUserId = userMap.get(user.id)

      if (newUserId && user.favorites && Array.isArray(user.favorites)) {
        for (const oldMediaId of user.favorites) {
          const newMediaId = mediaMap.get(oldMediaId)

          if (newMediaId) {
            await userService.addToFavorites(newUserId, newMediaId)
          }
        }
      }
    }

    // Migrar historial
    for (const user of users) {
      const newUserId = userMap.get(user.id)

      if (newUserId && user.history && Array.isArray(user.history)) {
        for (const oldMediaId of user.history) {
          const newMediaId = mediaMap.get(oldMediaId)

          if (newMediaId) {
            await userService.addToHistory(newUserId, newMediaId)
          }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error al migrar datos:", error)
    return { success: false, error: "Error al migrar datos" }
  }
}
