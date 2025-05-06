/**
 * Servicio de usuarios
 *
 * Este servicio proporciona funciones para gestionar usuarios,
 * incluyendo registro, inicio de sesión, actualización de perfil, etc.
 */

import { executeQuery } from "./db"
import { uploadBase64Image } from "./blob-service"
import type { User } from "./types"

// Interfaz para el servicio de usuarios
export interface UserService {
  // Obtener todos los usuarios
  getAllUsers(): Promise<User[]>

  // Obtener usuario por ID
  getUserById(id: number): Promise<User | null>

  // Obtener usuario por email
  getUserByEmail(email: string): Promise<User | null>

  // Registrar un nuevo usuario
  registerUser(userData: { name: string; email: string; password: string }): Promise<User | null>

  // Iniciar sesión
  loginUser(email: string, password: string): Promise<User | null>

  // Actualizar usuario
  updateUser(id: number, updates: Partial<User>): Promise<User | null>

  // Actualizar imagen de perfil
  updateProfileImage(userId: number, imageData: string): Promise<string>

  // Añadir a favoritos
  addToFavorites(userId: number, mediaId: number): Promise<boolean>

  // Eliminar de favoritos
  removeFromFavorites(userId: number, mediaId: number): Promise<boolean>

  // Añadir al historial
  addToHistory(userId: number, mediaId: number): Promise<boolean>

  // Obtener favoritos
  getFavorites(userId: number): Promise<number[]>

  // Obtener historial
  getHistory(userId: number): Promise<number[]>
}

// Implementación del servicio de usuarios
export const userService: UserService = {
  // Obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await executeQuery<any[]>(`
        SELECT id, name, email, image_url, created_at 
        FROM users
      `)

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }))
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      return []
    }
  },

  // Obtener usuario por ID
  async getUserById(id: number): Promise<User | null> {
    try {
      const result = await executeQuery<any[]>(
        `
        SELECT id, name, email, image_url, created_at 
        FROM users 
        WHERE id = $1
      `,
        [id],
      )

      if (result.length === 0) return null

      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error)
      return null
    }
  },

  // Obtener usuario por email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await executeQuery<any[]>(
        `
        SELECT id, name, email, image_url, created_at 
        FROM users 
        WHERE email = $1
      `,
        [email.toLowerCase()],
      )

      if (result.length === 0) return null

      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }
    } catch (error) {
      console.error("Error al obtener usuario por email:", error)
      return null
    }
  },

  // Registrar un nuevo usuario
  async registerUser(userData: { name: string; email: string; password: string }): Promise<User | null> {
    try {
      // Verificar si el email ya está registrado
      const existingUser = await this.getUserByEmail(userData.email)
      if (existingUser) {
        console.error("El email ya está registrado")
        return null
      }

      // Crear nuevo usuario
      const result = await executeQuery<any[]>(
        `
        INSERT INTO users (name, email, password) 
        VALUES ($1, $2, $3) 
        RETURNING id, name, email, image_url, created_at
      `,
        [userData.name, userData.email.toLowerCase(), userData.password],
      )

      if (result.length === 0) return null

      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      return null
    }
  },

  // Iniciar sesión
  async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const result = await executeQuery<any[]>(
        `
        SELECT id, name, email, image_url, created_at 
        FROM users 
        WHERE email = $1 AND password = $2
      `,
        [email.toLowerCase(), password],
      )

      if (result.length === 0) return null

      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return null
    }
  },

  // Actualizar usuario
  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    try {
      // Construir la consulta de actualización dinámicamente
      const updateFields = []
      const params = []
      let paramIndex = 1

      if (updates.name) {
        updateFields.push(`name = $${paramIndex}`)
        params.push(updates.name)
        paramIndex++
      }

      if (updates.email) {
        // Verificar si el email ya está en uso
        if (updates.email) {
          const existingUser = await this.getUserByEmail(updates.email)
          if (existingUser && existingUser.id !== id) {
            console.error("El email ya está en uso")
            return null
          }
        }

        updateFields.push(`email = $${paramIndex}`)
        params.push(updates.email.toLowerCase())
        paramIndex++
      }

      if (updates.image) {
        updateFields.push(`image_url = $${paramIndex}`)
        params.push(updates.image)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return await this.getUserById(id)
      }

      // Añadir el ID como último parámetro
      params.push(id)

      const result = await executeQuery<any[]>(
        `
        UPDATE users 
        SET ${updateFields.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING id, name, email, image_url, created_at
      `,
        params,
      )

      if (result.length === 0) return null

      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image_url,
        createdAt: user.created_at,
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      return null
    }
  },

  // Actualizar imagen de perfil
  async updateProfileImage(userId: number, imageData: string): Promise<string> {
    try {
      // Subir imagen a Vercel Blob
      const imageUrl = await uploadBase64Image(imageData, "profiles")

      // Actualizar usuario con la nueva URL de imagen
      await executeQuery(
        `
        UPDATE users 
        SET image_url = $1 
        WHERE id = $2
      `,
        [imageUrl, userId],
      )

      return imageUrl
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error)
      throw new Error("Error al actualizar imagen de perfil")
    }
  },

  // Añadir a favoritos
  async addToFavorites(userId: number, mediaId: number): Promise<boolean> {
    try {
      // Verificar si ya existe en favoritos
      const existingFavorite = await executeQuery<any[]>(
        `
        SELECT id FROM favorites 
        WHERE user_id = $1 AND media_id = $2
      `,
        [userId, mediaId],
      )

      if (existingFavorite.length > 0) {
        return true // Ya está en favoritos
      }

      // Añadir a favoritos
      await executeQuery(
        `
        INSERT INTO favorites (user_id, media_id) 
        VALUES ($1, $2)
      `,
        [userId, mediaId],
      )

      return true
    } catch (error) {
      console.error("Error al añadir a favoritos:", error)
      return false
    }
  },

  // Eliminar de favoritos
  async removeFromFavorites(userId: number, mediaId: number): Promise<boolean> {
    try {
      await executeQuery(
        `
        DELETE FROM favorites 
        WHERE user_id = $1 AND media_id = $2
      `,
        [userId, mediaId],
      )

      return true
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error)
      return false
    }
  },

  // Añadir al historial
  async addToHistory(userId: number, mediaId: number): Promise<boolean> {
    try {
      // Verificar si ya existe en el historial
      const existingHistory = await executeQuery<any[]>(
        `
        SELECT id FROM history 
        WHERE user_id = $1 AND media_id = $2
      `,
        [userId, mediaId],
      )

      if (existingHistory.length > 0) {
        // Actualizar la fecha de visualización
        await executeQuery(
          `
          UPDATE history 
          SET viewed_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 AND media_id = $2
        `,
          [userId, mediaId],
        )
      } else {
        // Añadir al historial
        await executeQuery(
          `
          INSERT INTO history (user_id, media_id) 
          VALUES ($1, $2)
        `,
          [userId, mediaId],
        )
      }

      return true
    } catch (error) {
      console.error("Error al añadir al historial:", error)
      return false
    }
  },

  // Obtener favoritos
  async getFavorites(userId: number): Promise<number[]> {
    try {
      const favorites = await executeQuery<any[]>(
        `
        SELECT media_id 
        FROM favorites 
        WHERE user_id = $1
      `,
        [userId],
      )

      return favorites.map((fav) => fav.media_id)
    } catch (error) {
      console.error("Error al obtener favoritos:", error)
      return []
    }
  },

  // Obtener historial
  async getHistory(userId: number): Promise<number[]> {
    try {
      const history = await executeQuery<any[]>(
        `
        SELECT media_id 
        FROM history 
        WHERE user_id = $1 
        ORDER BY viewed_at DESC
      `,
        [userId],
      )

      return history.map((item) => item.media_id)
    } catch (error) {
      console.error("Error al obtener historial:", error)
      return []
    }
  },
}
