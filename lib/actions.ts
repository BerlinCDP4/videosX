"use server"

import { userService } from "./db-service"
import type { UserProfile } from "./types"
import { executeQuery } from "./db"
import { uploadBase64Image } from "./blob-service"
import { revalidatePath } from "next/cache"
import type { MediaItem, Comment, User } from "./types"

// Funciones de autenticación y usuarios

export async function loginUser(formData: FormData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, error: "Email y contraseña son requeridos" }
    }

    const result = await executeQuery<any[]>(
      `
      SELECT id, name, email, image_url as image, created_at as "createdAt"
      FROM users 
      WHERE email = $1 AND password = $2
      `,
      [email.toLowerCase(), password],
    )

    if (result.length === 0) {
      return { success: false, error: "Email o contraseña incorrectos" }
    }

    const user = result[0]

    // Obtener favoritos del usuario
    const favorites = await executeQuery<any[]>(`SELECT media_id FROM favorites WHERE user_id = $1`, [user.id])

    // Obtener historial del usuario
    const history = await executeQuery<any[]>(
      `SELECT media_id FROM history WHERE user_id = $1 ORDER BY viewed_at DESC`,
      [user.id],
    )

    // Añadir favoritos e historial al usuario
    user.favorites = favorites.map((fav) => fav.media_id)
    user.history = history.map((item) => item.media_id)

    return { success: true, user }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return { success: false, error: "Error al iniciar sesión" }
  }
}

export async function registerUser(formData: FormData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
      return { success: false, error: "Todos los campos son requeridos" }
    }

    // Verificar si el email ya está registrado
    const existingUser = await executeQuery<any[]>(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()])

    if (existingUser.length > 0) {
      return { success: false, error: "El email ya está registrado" }
    }

    // Crear nuevo usuario
    const result = await executeQuery<any[]>(
      `
      INSERT INTO users (name, email, password) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, email, image_url as image, created_at as "createdAt"
      `,
      [name, email.toLowerCase(), password],
    )

    if (result.length === 0) {
      return { success: false, error: "Error al registrar usuario" }
    }

    const user = result[0]
    user.favorites = []
    user.history = []

    return { success: true, user }
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return { success: false, error: "Error al registrar usuario" }
  }
}

export async function getUserData(userId: string): Promise<UserProfile | null> {
  try {
    const user = userService.getById(userId)
    return user
  } catch (error) {
    console.error("Error al obtener datos de usuario:", error)
    return null
  }
}

export async function socialLogin(
  provider: string,
  token: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  // This is a mock implementation. In a real application, this function would:
  // 1. Verify the token with the social provider (e.g., Google, Facebook).
  // 2. Check if the user exists in the database.
  // 3. If the user exists, log them in.
  // 4. If the user doesn't exist, create a new user account.
  // 5. Return the user ID.

  // For this example, we'll just return a mock user ID.
  console.log(`Simulating social login with ${provider} and token ${token}`)

  // Check if a user with this provider already exists (e.g., by email)
  let user = userService.getAll().find((u) => u.email === `mock_${provider}_user@example.com`)

  if (!user) {
    // Create a new user
    user = userService.register({
      name: `Mock ${provider} User`,
      email: `mock_${provider}_user@example.com`,
      password: "password", // In real app, generate a random password
    })
  }

  if (user) {
    return { success: true, userId: user.id }
  } else {
    return { success: false, error: `Could not create user with ${provider}` }
  }
}

export async function updateUserProfile(
  userId: number,
  formData: FormData,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const imageData = formData.get("image") as string

    // Construir la consulta de actualización dinámicamente
    const updateFields = []
    const params = []
    let paramIndex = 1

    if (name) {
      updateFields.push(`name = $${paramIndex}`)
      params.push(name)
      paramIndex++
    }

    if (email) {
      // Verificar si el email ya está en uso
      const existingUser = await executeQuery<any[]>(`SELECT id FROM users WHERE email = $1 AND id != $2`, [
        email.toLowerCase(),
        userId,
      ])

      if (existingUser.length > 0) {
        return { success: false, error: "El email ya está en uso" }
      }

      updateFields.push(`email = $${paramIndex}`)
      params.push(email.toLowerCase())
      paramIndex++
    }

    if (imageData && imageData.startsWith("data:image")) {
      // Subir imagen a Vercel Blob
      const imageUrl = await uploadBase64Image(imageData, "profiles")

      updateFields.push(`image_url = $${paramIndex}`)
      params.push(imageUrl)
      paramIndex++
    }

    if (updateFields.length === 0) {
      // No hay campos para actualizar
      const user = await executeQuery<any[]>(
        `
        SELECT id, name, email, image_url as image, created_at as "createdAt"
        FROM users 
        WHERE id = $1
        `,
        [userId],
      )

      if (user.length === 0) {
        return { success: false, error: "Usuario no encontrado" }
      }

      return { success: true, user: user[0] }
    }

    // Añadir el ID como último parámetro
    params.push(userId)

    const result = await executeQuery<any[]>(
      `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, image_url as image, created_at as "createdAt"
      `,
      params,
    )

    if (result.length === 0) {
      return { success: false, error: "Usuario no encontrado" }
    }

    const user = result[0]

    // Obtener favoritos del usuario
    const favorites = await executeQuery<any[]>(`SELECT media_id FROM favorites WHERE user_id = $1`, [user.id])

    // Obtener historial del usuario
    const history = await executeQuery<any[]>(
      `SELECT media_id FROM history WHERE user_id = $1 ORDER BY viewed_at DESC`,
      [user.id],
    )

    // Añadir favoritos e historial al usuario
    user.favorites = favorites.map((fav) => fav.media_id)
    user.history = history.map((item) => item.media_id)

    return { success: true, user }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return { success: false, error: "Error al actualizar perfil" }
  }
}

// Funciones para medios

export async function getMedia(): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName"
      FROM media m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      `,
    )

    return media.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
    }))
  } catch (error) {
    console.error("Error al obtener medios:", error)
    return []
  }
}

export async function getMediaByType(type: "image" | "video"): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName"
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
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
    }))
  } catch (error) {
    console.error(`Error al obtener medios de tipo ${type}:`, error)
    return []
  }
}

export async function getMediaByCategory(category: string): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName"
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
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
    }))
  } catch (error) {
    console.error(`Error al obtener medios de categoría ${category}:`, error)
    return []
  }
}

export async function getFavorites(userId: number): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName"
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
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
    }))
  } catch (error) {
    console.error(`Error al obtener favoritos del usuario ${userId}:`, error)
    return []
  }
}

export async function getHistory(userId: number): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName",
        h.viewed_at as "viewedAt"
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
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
      viewedAt: item.viewedAt,
    }))
  } catch (error) {
    console.error(`Error al obtener historial del usuario ${userId}:`, error)
    return []
  }
}

export async function getRecentMedia(limit = 10): Promise<MediaItem[]> {
  try {
    const media = await executeQuery<any[]>(
      `
      SELECT 
        m.id, 
        m.title, 
        m.url, 
        m.type, 
        m.category, 
        m.thumbnail_url as thumbnail, 
        m.created_at as "createdAt", 
        m.user_id as "userId",
        u.name as "userName"
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
      type: item.type,
      category: item.category,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      userId: item.userId,
      userName: item.userName,
    }))
  } catch (error) {
    console.error("Error al obtener medios recientes:", error)
    return []
  }
}

export async function uploadMedia(
  formData: FormData,
): Promise<{ success: boolean; media?: MediaItem; error?: string }> {
  try {
    const url = formData.get("url") as string
    const type = formData.get("type") as string
    const title = formData.get("title") as string
    const category = formData.get("category") as string
    const userId = Number.parseInt(formData.get("userId") as string)
    const customThumbnail = formData.get("customThumbnail") as string

    // Validar datos
    if (!url || !type || !title || !category || !userId) {
      return { success: false, error: "Todos los campos son requeridos" }
    }

    // Validar URL
    try {
      new URL(url)
    } catch (e) {
      return { success: false, error: "URL inválida" }
    }

    // Validar tipo
    if (type !== "image" && type !== "video") {
      return { success: false, error: "Tipo de medio inválido" }
    }

    let thumbnailUrl: string | null = null

    // Procesar según el tipo
    if (type === "video") {
      // Si hay una miniatura personalizada, subirla a Vercel Blob
      if (customThumbnail && customThumbnail.startsWith("data:image")) {
        thumbnailUrl = await uploadBase64Image(customThumbnail, "thumbnails")
      } else {
        // Para YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          let videoId = null

          try {
            if (url.includes("youtu.be")) {
              videoId = url.split("/").pop()?.split("?")[0]
            } else if (url.includes("v=")) {
              try {
                videoId = new URL(url).searchParams.get("v")
              } catch (e) {
                // Si hay un error al parsear la URL, intentar extraer el ID manualmente
                const match = url.match(/[?&]v=([^&]+)/)
                if (match) videoId = match[1]
              }
            }

            if (videoId) {
              thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            } else {
              thumbnailUrl = "/video-thumbnail.png"
            }
          } catch (error) {
            console.error("Error al procesar URL de YouTube:", error)
            thumbnailUrl = "/video-thumbnail.png"
          }
        }
        // Para todos los demás videos
        else {
          thumbnailUrl = "/video-thumbnail.png"
        }
      }
    }

    // Crear nuevo elemento de medio
    const result = await executeQuery<any[]>(
      `
      INSERT INTO media (title, url, type, category, thumbnail_url, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, title, url, type, category, thumbnail_url as thumbnail, created_at as "createdAt", user_id as "userId"
      `,
      [title, url, type, category.toLowerCase(), thumbnailUrl, userId],
    )

    if (result.length === 0) {
      return { success: false, error: "Error al crear medio" }
    }

    const media = result[0]

    // Obtener nombre de usuario
    const userResult = await executeQuery<any[]>(`SELECT name FROM users WHERE id = $1`, [userId])

    if (userResult.length > 0) {
      media.userName = userResult[0].name
    }

    // Revalidar rutas
    revalidatePath("/")
    revalidatePath("/upload")
    revalidatePath("/images")
    revalidatePath("/videos")
    revalidatePath("/favorites")
    revalidatePath("/recent")
    revalidatePath(`/videos/${category.toLowerCase()}`)
    revalidatePath(`/images/${category.toLowerCase()}`)

    return { success: true, media }
  } catch (error) {
    console.error("Error al subir medio:", error)
    return { success: false, error: "Error al subir medio" }
  }
}

export async function deleteMedia(mediaId: number, userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que el usuario es el propietario
    const media = await executeQuery<any[]>(`SELECT user_id FROM media WHERE id = $1`, [mediaId])

    if (media.length === 0) {
      return { success: false, error: "Medio no encontrado" }
    }

    if (media[0].user_id !== userId) {
      return { success: false, error: "No tienes permiso para eliminar este medio" }
    }

    // Eliminar el medio
    await executeQuery(`DELETE FROM media WHERE id = $1`, [mediaId])

    // Revalidar rutas
    revalidatePath("/")
    revalidatePath("/images")
    revalidatePath("/videos")
    revalidatePath("/favorites")
    revalidatePath("/recent")

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar medio:", error)
    return { success: false, error: "Error al eliminar medio" }
  }
}

// Funciones para favoritos

export async function addToFavorites(userId: number, mediaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si ya existe en favoritos
    const existingFavorite = await executeQuery<any[]>(
      `SELECT id FROM favorites WHERE user_id = $1 AND media_id = $2`,
      [userId, mediaId],
    )

    if (existingFavorite.length > 0) {
      return { success: true } // Ya está en favoritos
    }

    // Añadir a favoritos
    await executeQuery(`INSERT INTO favorites (user_id, media_id) VALUES ($1, $2)`, [userId, mediaId])

    return { success: true }
  } catch (error) {
    console.error("Error al añadir a favoritos:", error)
    return { success: false, error: "Error al añadir a favoritos" }
  }
}

export async function removeFromFavorites(
  userId: number,
  mediaId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeQuery(`DELETE FROM favorites WHERE user_id = $1 AND media_id = $2`, [userId, mediaId])

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar de favoritos:", error)
    return { success: false, error: "Error al eliminar de favoritos" }
  }
}

// Funciones para historial

export async function addToHistory(userId: number, mediaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si ya existe en el historial
    const existingHistory = await executeQuery<any[]>(`SELECT id FROM history WHERE user_id = $1 AND media_id = $2`, [
      userId,
      mediaId,
    ])

    if (existingHistory.length > 0) {
      // Actualizar la fecha de visualización
      await executeQuery(`UPDATE history SET viewed_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND media_id = $2`, [
        userId,
        mediaId,
      ])
    } else {
      // Añadir al historial
      await executeQuery(`INSERT INTO history (user_id, media_id) VALUES ($1, $2)`, [userId, mediaId])
    }

    return { success: true }
  } catch (error) {
    console.error("Error al añadir al historial:", error)
    return { success: false, error: "Error al añadir al historial" }
  }
}

// Funciones para comentarios

export async function getComments(mediaId: number): Promise<Comment[]> {
  try {
    const comments = await executeQuery<any[]>(
      `
      SELECT 
        c.id, 
        c.media_id as "mediaId", 
        c.user_id as "userId", 
        u.name as "userName", 
        u.image_url as "userAvatar", 
        c.text, 
        c.created_at as "createdAt"
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.media_id = $1
      ORDER BY c.created_at DESC
      `,
      [mediaId],
    )

    return comments.map((comment) => ({
      id: comment.id,
      mediaId: comment.mediaId,
      userId: comment.userId,
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      text: comment.text,
      createdAt: comment.createdAt,
    }))
  } catch (error) {
    console.error(`Error al obtener comentarios del medio ${mediaId}:`, error)
    return []
  }
}

export async function addComment(formData: FormData): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const mediaId = Number.parseInt(formData.get("mediaId") as string)
    const userId = Number.parseInt(formData.get("userId") as string)
    const text = formData.get("text") as string

    if (!mediaId || !userId || !text.trim()) {
      return { success: false, error: "Todos los campos son requeridos" }
    }

    // Obtener información del usuario
    const userResult = await executeQuery<any[]>(`SELECT name, image_url FROM users WHERE id = $1`, [userId])

    if (userResult.length === 0) {
      return { success: false, error: "Usuario no encontrado" }
    }

    const userName = userResult[0].name
    const userAvatar = userResult[0].image_url

    // Crear nuevo comentario
    const result = await executeQuery<any[]>(
      `
      INSERT INTO comments (media_id, user_id, text) 
      VALUES ($1, $2, $3) 
      RETURNING id, media_id as "mediaId", user_id as "userId", text, created_at as "createdAt"
      `,
      [mediaId, userId, text.trim()],
    )

    if (result.length === 0) {
      return { success: false, error: "Error al crear comentario" }
    }

    const comment = result[0]
    comment.userName = userName
    comment.userAvatar = userAvatar

    return { success: true, comment }
  } catch (error) {
    console.error("Error al añadir comentario:", error)
    return { success: false, error: "Error al añadir comentario" }
  }
}

export async function deleteComment(commentId: number, userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que el usuario es el autor
    const comment = await executeQuery<any[]>(`SELECT user_id FROM comments WHERE id = $1`, [commentId])

    if (comment.length === 0) {
      return { success: false, error: "Comentario no encontrado" }
    }

    if (comment[0].user_id !== userId) {
      return { success: false, error: "No tienes permiso para eliminar este comentario" }
    }

    // Eliminar el comentario
    await executeQuery(`DELETE FROM comments WHERE id = $1`, [commentId])

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar comentario:", error)
    return { success: false, error: "Error al eliminar comentario" }
  }
}
