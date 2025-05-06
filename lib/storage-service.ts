/**
 * Servicio de almacenamiento persistente
 *
 * Este servicio proporciona funciones para guardar y recuperar datos
 * de forma persistente usando localStorage, con manejo de errores
 * y validación de datos.
 */

// Claves para almacenamiento
export const STORAGE_KEYS = {
  USERS: "media_gallery_users",
  CURRENT_USER: "media_gallery_current_user",
  MEDIA_ITEMS: "media_gallery_media_items",
  COMMENTS: "media_gallery_comments",
  PROFILE_IMAGES: "media_gallery_profile_images",
  SETTINGS: "media_gallery_settings",
  REMEMBER_ME: "media_gallery_remember_me",
}

// Interfaz para el servicio de almacenamiento
export interface StorageService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): boolean
  remove(key: string): boolean
  clear(): boolean
}

// Implementación del servicio de almacenamiento usando localStorage
export const localStorageService: StorageService = {
  // Obtener datos
  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (error) {
      console.error(`Error al obtener datos de ${key}:`, error)
      return null
    }
  },

  // Guardar datos
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error al guardar datos en ${key}:`, error)
      return false
    }
  },

  // Eliminar datos
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error al eliminar datos de ${key}:`, error)
      return false
    }
  },

  // Limpiar todos los datos
  clear(): boolean {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error("Error al limpiar localStorage:", error)
      return false
    }
  },
}

// Servicio de almacenamiento por defecto
export const storageService: StorageService = localStorageService

// Función para inicializar el almacenamiento
export function initializeStorage(): void {
  // Verificar si ya existen los datos
  if (!storageService.get(STORAGE_KEYS.USERS)) {
    storageService.set(STORAGE_KEYS.USERS, [])
  }

  if (!storageService.get(STORAGE_KEYS.MEDIA_ITEMS)) {
    storageService.set(STORAGE_KEYS.MEDIA_ITEMS, [])
  }

  if (!storageService.get(STORAGE_KEYS.COMMENTS)) {
    storageService.set(STORAGE_KEYS.COMMENTS, [])
  }

  if (!storageService.get(STORAGE_KEYS.PROFILE_IMAGES)) {
    storageService.set(STORAGE_KEYS.PROFILE_IMAGES, {})
  }

  if (!storageService.get(STORAGE_KEYS.SETTINGS)) {
    storageService.set(STORAGE_KEYS.SETTINGS, {
      theme: "dark",
      viewMode: "grid",
    })
  }

  console.log("Almacenamiento inicializado correctamente")
}
