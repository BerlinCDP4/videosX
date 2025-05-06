/**
 * Servicio de almacenamiento para Vercel
 *
 * Este servicio proporciona una capa de abstracción para utilizar
 * servicios de almacenamiento de Vercel como Vercel Blob (para imágenes)
 * y Vercel KV (para datos estructurados).
 *
 * En desarrollo local, simula estos servicios con localStorage.
 */

import type { MediaItem, Comment, User } from "@/lib/types"

// Claves para almacenamiento
const STORAGE_KEYS = {
  SHARED_MEDIA: "shared_media_db",
  SHARED_COMMENTS: "shared_comments_db",
  USERS: "users_db",
  USER_SESSION: "user_session",
  USER_REMEMBERED: "user_remembered",
  PROFILE_IMAGES: "profile_images_db", // Nueva clave para imágenes de perfil
}

// Función para simular almacenamiento persistente
// En producción, esto se reemplazaría con llamadas a Vercel KV o Postgres
const persistentStorage = {
  // Obtener datos
  get: (key: string): any => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Error al obtener datos de ${key}:`, error)
      return null
    }
  },

  // Guardar datos
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error al guardar datos en ${key}:`, error)
      return false
    }
  },

  // Eliminar datos
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error al eliminar datos de ${key}:`, error)
      return false
    }
  },
}

// Servicio para imágenes (simula Vercel Blob)
// En producción, esto se reemplazaría con llamadas a Vercel Blob
export const blobStorage = {
  // Guardar imagen (en base64)
  uploadImage: (imageData: string, userId: string, type = "profile"): string => {
    try {
      // Generar un ID único para la imagen
      const imageId = `${type}_${userId}_${Date.now()}`

      // En producción, aquí se subiría la imagen a Vercel Blob
      // Para la simulación, guardamos en localStorage
      const images = persistentStorage.get(STORAGE_KEYS.PROFILE_IMAGES) || {}
      images[imageId] = imageData
      persistentStorage.set(STORAGE_KEYS.PROFILE_IMAGES, images)

      // Devolver la URL simulada
      return imageId
    } catch (error) {
      console.error("Error al subir imagen:", error)
      return ""
    }
  },

  // Obtener imagen por ID
  getImage: (imageId: string): string => {
    try {
      const images = persistentStorage.get(STORAGE_KEYS.PROFILE_IMAGES) || {}
      return images[imageId] || ""
    } catch (error) {
      console.error("Error al obtener imagen:", error)
      return ""
    }
  },

  // Eliminar imagen
  deleteImage: (imageId: string): boolean => {
    try {
      const images = persistentStorage.get(STORAGE_KEYS.PROFILE_IMAGES) || {}
      if (images[imageId]) {
        delete images[imageId]
        persistentStorage.set(STORAGE_KEYS.PROFILE_IMAGES, images)
        return true
      }
      return false
    } catch (error) {
      console.error("Error al eliminar imagen:", error)
      return false
    }
  },
}

// Funciones para medios compartidos
export const mediaService = {
  // Obtener todos los medios
  getAll: (): MediaItem[] => {
    try {
      return persistentStorage.get(STORAGE_KEYS.SHARED_MEDIA) || []
    } catch (error) {
      console.error("Error al obtener medios:", error)
      return []
    }
  },

  // Obtener un medio por ID
  getById: (id: string): MediaItem | null => {
    try {
      const media = mediaService.getAll()
      return media.find((item) => item.id === id) || null
    } catch (error) {
      console.error("Error al obtener medio por ID:", error)
      return null
    }
  },

  // Obtener medios por tipo
  getByType: (type: "image" | "video"): MediaItem[] => {
    try {
      const media = mediaService.getAll()
      return media.filter((item) => item.type === type)
    } catch (error) {
      console.error(`Error al obtener medios de tipo ${type}:`, error)
      return []
    }
  },

  // Obtener medios por categoría
  getByCategory: (category: string): MediaItem[] => {
    try {
      const media = mediaService.getAll()
      return media.filter((item) => item.category === category)
    } catch (error) {
      console.error(`Error al obtener medios de categoría ${category}:`, error)
      return []
    }
  },

  // Añadir un nuevo medio
  add: (item: MediaItem): MediaItem => {
    try {
      const media = mediaService.getAll()
      const newMedia = { ...item, id: item.id || Date.now().toString() }
      persistentStorage.set(STORAGE_KEYS.SHARED_MEDIA, [newMedia, ...media])
      return newMedia
    } catch (error) {
      console.error("Error al añadir medio:", error)
      throw new Error("No se pudo añadir el medio a la base de datos")
    }
  },

  // Actualizar un medio existente
  update: (id: string, updates: Partial<MediaItem>): MediaItem | null => {
    try {
      const media = mediaService.getAll()
      const index = media.findIndex((item) => item.id === id)

      if (index === -1) return null

      const updatedItem = { ...media[index], ...updates }
      media[index] = updatedItem
      persistentStorage.set(STORAGE_KEYS.SHARED_MEDIA, media)

      return updatedItem
    } catch (error) {
      console.error("Error al actualizar medio:", error)
      return null
    }
  },

  // Eliminar un medio
  delete: (id: string, userId: string): boolean => {
    try {
      const media = mediaService.getAll()
      const item = media.find((item) => item.id === id)

      // Verificar que el usuario es el propietario
      if (!item || item.userId !== userId) return false

      const updatedMedia = media.filter((item) => item.id !== id)
      persistentStorage.set(STORAGE_KEYS.SHARED_MEDIA, updatedMedia)

      return true
    } catch (error) {
      console.error("Error al eliminar medio:", error)
      return false
    }
  },

  // Obtener medios recientes
  getRecent: (limit = 10): MediaItem[] => {
    try {
      const media = mediaService.getAll()
      return media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
    } catch (error) {
      console.error("Error al obtener medios recientes:", error)
      return []
    }
  },

  // Obtener medios favoritos de un usuario
  getFavorites: (favoriteIds: string[]): MediaItem[] => {
    try {
      const media = mediaService.getAll()
      return media.filter((item) => favoriteIds.includes(item.id))
    } catch (error) {
      console.error("Error al obtener favoritos:", error)
      return []
    }
  },
}

// Funciones para comentarios
export const commentService = {
  // Obtener todos los comentarios
  getAll: (): Comment[] => {
    try {
      return persistentStorage.get(STORAGE_KEYS.SHARED_COMMENTS) || []
    } catch (error) {
      console.error("Error al obtener comentarios:", error)
      return []
    }
  },

  // Obtener comentarios por ID de medio
  getByMediaId: (mediaId: string): Comment[] => {
    try {
      const comments = commentService.getAll()
      return comments
        .filter((comment) => comment.mediaId === mediaId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error(`Error al obtener comentarios para el medio ${mediaId}:`, error)
      return []
    }
  },

  // Añadir un nuevo comentario
  add: (comment: Comment): Comment => {
    try {
      const comments = commentService.getAll()
      const newComment = { ...comment, id: comment.id || Date.now().toString() }
      persistentStorage.set(STORAGE_KEYS.SHARED_COMMENTS, [newComment, ...comments])
      return newComment
    } catch (error) {
      console.error("Error al añadir comentario:", error)
      throw new Error("No se pudo añadir el comentario a la base de datos")
    }
  },

  // Eliminar un comentario
  delete: (id: string, userId: string): boolean => {
    try {
      const comments = commentService.getAll()
      const comment = comments.find((c) => c.id === id)

      // Verificar que el usuario es el autor
      if (!comment || comment.userId !== userId) return false

      const updatedComments = comments.filter((c) => c.id !== id)
      persistentStorage.set(STORAGE_KEYS.SHARED_COMMENTS, updatedComments)

      return true
    } catch (error) {
      console.error("Error al eliminar comentario:", error)
      return false
    }
  },
}

// Funciones para usuarios
export const userService = {
  // Obtener todos los usuarios
  getAll: (): User[] => {
    try {
      const users = persistentStorage.get(STORAGE_KEYS.USERS) || []
      // No devolver las contraseñas
      return users.map(({ password, ...user }: any) => user)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      return []
    }
  },

  // Obtener usuario por ID
  getById: (id: string): User | null => {
    try {
      const users = userService.getAllWithPasswords()
      const user = users.find((u) => u.id === id)
      if (!user) return null

      // No devolver la contraseña
      const { password, ...userData } = user
      return userData
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error)
      return null
    }
  },

  // Función interna para obtener usuarios con contraseñas
  getAllWithPasswords: (): any[] => {
    try {
      return persistentStorage.get(STORAGE_KEYS.USERS) || []
    } catch (error) {
      console.error("Error al obtener usuarios con contraseñas:", error)
      return []
    }
  },

  // Registrar un nuevo usuario
  register: (userData: { name: string; email: string; password: string }): User | null => {
    try {
      const users = userService.getAllWithPasswords()

      // Verificar si el email ya está registrado
      if (users.some((u) => u.email === userData.email)) {
        return null
      }

      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: userData.password, // En una app real, esto debería estar hasheado
        image: "", // Imagen de perfil vacía por defecto
        favorites: [],
        history: [],
        createdAt: new Date().toISOString(),
      }

      persistentStorage.set(STORAGE_KEYS.USERS, [...users, newUser])

      // Devolver usuario sin contraseña
      const { password, ...userWithoutPassword } = newUser
      return userWithoutPassword
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      return null
    }
  },

  // Iniciar sesión
  login: (email: string, password: string): User | null => {
    try {
      const users = userService.getAllWithPasswords()
      const user = users.find((u) => u.email === email && u.password === password)

      if (!user) return null

      // Devolver usuario sin contraseña
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return null
    }
  },

  // Actualizar usuario
  update: (id: string, updates: Partial<User>): User | null => {
    try {
      const users = userService.getAllWithPasswords()
      const index = users.findIndex((u) => u.id === id)

      if (index === -1) return null

      // No permitir actualizar el email a uno que ya existe
      if (updates.email && users.some((u) => u.email === updates.email && u.id !== id)) {
        return null
      }

      const updatedUser = { ...users[index], ...updates }
      users[index] = updatedUser
      persistentStorage.set(STORAGE_KEYS.USERS, users)

      // Devolver usuario sin contraseña
      const { password, ...userWithoutPassword } = updatedUser
      return userWithoutPassword
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      return null
    }
  },

  // Actualizar imagen de perfil
  updateProfileImage: (userId: string, imageData: string): string => {
    try {
      // Subir imagen a blob storage
      const imageUrl = blobStorage.uploadImage(imageData, userId, "profile")

      if (!imageUrl) {
        throw new Error("Error al subir imagen de perfil")
      }

      // Actualizar usuario con la nueva URL de imagen
      const users = userService.getAllWithPasswords()
      const index = users.findIndex((u) => u.id === userId)

      if (index === -1) {
        throw new Error("Usuario no encontrado")
      }

      // Eliminar imagen anterior si existe
      if (users[index].image && users[index].image.startsWith("profile_")) {
        blobStorage.deleteImage(users[index].image)
      }

      users[index].image = imageUrl
      persistentStorage.set(STORAGE_KEYS.USERS, users)

      // Actualizar sesión si es el usuario actual
      const session = userService.getSession()
      if (session.user && session.user.id === userId) {
        const updatedUser = { ...session.user, image: imageUrl }
        userService.saveSession(updatedUser, session.remembered)
      }

      return imageUrl
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error)
      return ""
    }
  },

  // Obtener imagen de perfil
  getProfileImage: (imageId: string): string => {
    if (!imageId || !imageId.startsWith("profile_")) {
      return ""
    }
    return blobStorage.getImage(imageId)
  },

  // Guardar sesión
  saveSession: (user: User, remember: boolean): void => {
    try {
      persistentStorage.set(STORAGE_KEYS.USER_SESSION, user)
      if (remember) {
        persistentStorage.set(STORAGE_KEYS.USER_REMEMBERED, true)
      } else {
        persistentStorage.remove(STORAGE_KEYS.USER_REMEMBERED)
        sessionStorage.setItem("auth_session", "true")
      }
    } catch (error) {
      console.error("Error al guardar sesión:", error)
    }
  },

  // Obtener sesión
  getSession: (): { user: User | null; remembered: boolean } => {
    try {
      const userData = persistentStorage.get(STORAGE_KEYS.USER_SESSION)
      const remembered = persistentStorage.get(STORAGE_KEYS.USER_REMEMBERED) === true

      if (!userData) return { user: null, remembered }

      // Verificar si la sesión es válida
      if (!remembered && !sessionStorage.getItem("auth_session")) {
        return { user: null, remembered: false }
      }

      return { user: userData, remembered }
    } catch (error) {
      console.error("Error al obtener sesión:", error)
      return { user: null, remembered: false }
    }
  },

  // Cerrar sesión
  logout: (): void => {
    try {
      persistentStorage.remove(STORAGE_KEYS.USER_SESSION)
      persistentStorage.remove(STORAGE_KEYS.USER_REMEMBERED)
      sessionStorage.removeItem("auth_session")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Añadir a favoritos
  addToFavorites: (userId: string, mediaId: string): boolean => {
    try {
      const users = userService.getAllWithPasswords()
      const index = users.findIndex((u) => u.id === userId)

      if (index === -1) return false

      // Evitar duplicados
      if (!users[index].favorites) {
        users[index].favorites = []
      }

      if (!users[index].favorites.includes(mediaId)) {
        users[index].favorites.push(mediaId)
        persistentStorage.set(STORAGE_KEYS.USERS, users)

        // Actualizar sesión si es el usuario actual
        const session = userService.getSession()
        if (session.user && session.user.id === userId) {
          const updatedUser = { ...session.user, favorites: users[index].favorites }
          userService.saveSession(updatedUser, session.remembered)
        }
      }

      return true
    } catch (error) {
      console.error("Error al añadir a favoritos:", error)
      return false
    }
  },

  // Eliminar de favoritos
  removeFromFavorites: (userId: string, mediaId: string): boolean => {
    try {
      const users = userService.getAllWithPasswords()
      const index = users.findIndex((u) => u.id === userId)

      if (index === -1 || !users[index].favorites) return false

      users[index].favorites = users[index].favorites.filter((id) => id !== mediaId)
      persistentStorage.set(STORAGE_KEYS.USERS, users)

      // Actualizar sesión si es el usuario actual
      const session = userService.getSession()
      if (session.user && session.user.id === userId) {
        const updatedUser = { ...session.user, favorites: users[index].favorites }
        userService.saveSession(updatedUser, session.remembered)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error)
      return false
    }
  },

  // Añadir al historial
  addToHistory: (userId: string, mediaId: string): boolean => {
    try {
      const users = userService.getAllWithPasswords()
      const index = users.findIndex((u) => u.id === userId)

      if (index === -1) return false

      // Inicializar historial si no existe
      if (!users[index].history) {
        users[index].history = []
      }

      // Mover al principio si ya existe
      users[index].history = [mediaId, ...users[index].history.filter((id) => id !== mediaId)].slice(0, 100) // Limitar a 100 elementos

      persistentStorage.set(STORAGE_KEYS.USERS, users)

      // Actualizar sesión si es el usuario actual
      const session = userService.getSession()
      if (session.user && session.user.id === userId) {
        const updatedUser = { ...session.user, history: users[index].history }
        userService.saveSession(updatedUser, session.remembered)
      }

      return true
    } catch (error) {
      console.error("Error al añadir al historial:", error)
      return false
    }
  },

  // Obtener favoritos
  getFavorites: (userId: string): string[] => {
    try {
      const user = userService.getById(userId)
      return user?.favorites || []
    } catch (error) {
      console.error("Error al obtener favoritos:", error)
      return []
    }
  },

  // Obtener historial
  getHistory: (userId: string): string[] => {
    try {
      const user = userService.getById(userId)
      return user?.history || []
    } catch (error) {
      console.error("Error al obtener historial:", error)
      return []
    }
  },
}

// Inicializar la "base de datos" si no existe
export const initializeDatabase = () => {
  if (!persistentStorage.get(STORAGE_KEYS.SHARED_MEDIA)) {
    persistentStorage.set(STORAGE_KEYS.SHARED_MEDIA, [])
  }

  if (!persistentStorage.get(STORAGE_KEYS.SHARED_COMMENTS)) {
    persistentStorage.set(STORAGE_KEYS.SHARED_COMMENTS, [])
  }

  if (!persistentStorage.get(STORAGE_KEYS.USERS)) {
    persistentStorage.set(STORAGE_KEYS.USERS, [])
  }

  if (!persistentStorage.get(STORAGE_KEYS.PROFILE_IMAGES)) {
    persistentStorage.set(STORAGE_KEYS.PROFILE_IMAGES, {})
  }
}
