"use server"

import type { MediaItem } from "./types"
import { revalidatePath } from "next/cache"

// Base de datos simulada para almacenar medios
// En una implementación real, esto sería una base de datos persistente
let mediaDatabase: MediaItem[] = []

// Base de datos simulada para usuarios
// Añadimos un usuario de prueba para facilitar el inicio de sesión
const userDatabase: any[] = [
  {
    id: "1",
    email: "usuario@ejemplo.com",
    password: "123456", // En producción, esto debería ser un hash
    name: "Usuario de Prueba",
    username: "usuario_test",
    profilePicture: "/default-avatar.png",
    createdAt: new Date().toISOString(),
    provider: "email",
  },
]

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

export async function uploadMedia(
  url: string,
  type: string,
  title: string,
  category: string,
  userId: string,
  customThumbnail?: string,
): Promise<MediaItem> {
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

  // Validar que el usuario esté autenticado
  if (!userId) {
    throw new Error("Debes iniciar sesión para subir medios")
  }

  let thumbnail: string | undefined

  // Procesar según el tipo
  if (type === "video") {
    // Si hay una miniatura personalizada, usarla
    if (customThumbnail) {
      thumbnail = customThumbnail
    } else {
      // Para YouTube
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = null

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
          thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        } else {
          thumbnail = "/video-thumbnail.png"
        }
      }
      // Para todos los demás videos
      else {
        thumbnail = "/video-thumbnail.png"
      }
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
    userId: userId, // Guardar el ID del usuario que subió el medio
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

// Función para eliminar un medio
export async function deleteMedia(mediaId: string, userId: string): Promise<boolean> {
  // Buscar el medio en la base de datos
  const mediaIndex = mediaDatabase.findIndex((item) => item.id === mediaId)

  // Si no se encuentra el medio, retornar false
  if (mediaIndex === -1) {
    return false
  }

  // Verificar que el usuario que intenta eliminar es el propietario
  if (mediaDatabase[mediaIndex].userId !== userId) {
    return false
  }

  // Eliminar el medio de la base de datos
  mediaDatabase.splice(mediaIndex, 1)

  // Revalidar la ruta para actualizar la UI
  revalidatePath("/")
  revalidatePath("/images")
  revalidatePath("/videos")
  revalidatePath("/favorites")
  revalidatePath("/recent")

  return true
}

// Función para sincronizar la base de datos con localStorage
export async function syncMediaDatabase(items: MediaItem[]): Promise<void> {
  try {
    mediaDatabase = items || []
    revalidatePath("/")
  } catch (error) {
    console.error("Error al sincronizar la base de datos:", error)
    // Si hay un error, inicializar con un array vacío
    mediaDatabase = []
  }
}

// Funciones para la autenticación y gestión de usuarios

// Registrar un nuevo usuario
export async function registerUser(userData: {
  email: string
  password: string
  name: string
  username: string
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validar datos
    if (!userData.email || !userData.password || !userData.name || !userData.username) {
      return { success: false, error: "Todos los campos son obligatorios" }
    }

    // Verificar si el email ya está registrado
    const existingUser = userDatabase.find((user) => user.email === userData.email)
    if (existingUser) {
      return { success: false, error: "El email ya está registrado" }
    }

    // Verificar si el nombre de usuario ya está en uso
    const existingUsername = userDatabase.find((user) => user.username === userData.username)
    if (existingUsername) {
      return { success: false, error: "El nombre de usuario ya está en uso" }
    }

    // En una implementación real, aquí se haría hash de la contraseña
    // Por simplicidad, no lo hacemos en este ejemplo

    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password, // En producción, esto debería ser un hash
      name: userData.name,
      username: userData.username,
      profilePicture: "/default-avatar.png",
      createdAt: new Date().toISOString(),
      provider: "email",
    }

    // Añadir a la base de datos
    userDatabase.push(newUser)

    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return { success: false, error: "Error al registrar usuario" }
  }
}

// Iniciar sesión
export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Buscar usuario por email
    const user = userDatabase.find((u) => u.email === email)

    // Si no existe el usuario o la contraseña no coincide
    if (!user || user.password !== password) {
      return { success: false, error: "Email o contraseña incorrectos" }
    }

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return { success: false, error: "Error al iniciar sesión" }
  }
}

// Obtener datos de usuario
export async function getUserData(userId: string): Promise<any> {
  const user = userDatabase.find((u) => u.id === userId)

  if (!user) {
    return null
  }

  // No devolver la contraseña
  const { password, ...userData } = user
  return userData
}

// Actualizar perfil de usuario
export async function updateUserProfile(
  userId: string,
  profileData: {
    name?: string
    username?: string
    profilePicture?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar usuario
    const userIndex = userDatabase.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return { success: false, error: "Usuario no encontrado" }
    }

    // Verificar si el nombre de usuario ya está en uso (si se está cambiando)
    if (profileData.username && profileData.username !== userDatabase[userIndex].username) {
      const existingUsername = userDatabase.find((user) => user.username === profileData.username)
      if (existingUsername) {
        return { success: false, error: "El nombre de usuario ya está en uso" }
      }
    }

    // Actualizar datos
    userDatabase[userIndex] = {
      ...userDatabase[userIndex],
      ...profileData,
    }

    return { success: true }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return { success: false, error: "Error al actualizar perfil" }
  }
}

// Social Login
export async function socialLogin(
  provider: string,
  token: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // En una implementación real, aquí se verificaría el token con el proveedor
    // y se obtendrían los datos del usuario

    // Simulación de un usuario existente o nuevo
    let user = userDatabase.find((u) => u.email === `social_${provider}@example.com`)

    if (!user) {
      // Crear un nuevo usuario simulado
      user = {
        id: Date.now().toString(),
        email: `social_${provider}@example.com`,
        password: "social_login", // No se usa, pero se requiere
        name: `Usuario Social ${provider}`,
        username: `social_${provider}`,
        profilePicture: "/default-avatar.png",
        createdAt: new Date().toISOString(),
        provider: provider,
      }
      userDatabase.push(user)
    }

    return { success: true, userId: user.id }
  } catch (error) {
    console.error(`Error al iniciar sesión con ${provider}:`, error)
    return { success: false, error: `Error al iniciar sesión con ${provider}` }
  }
}
