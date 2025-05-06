"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import {
  loginUser,
  registerUser,
  updateUserProfile,
  addToFavorites as addToFavoritesAction,
  removeFromFavorites as removeFromFavoritesAction,
  addToHistory as addToHistoryAction,
} from "@/lib/actions"

// Definir el tipo de contexto de autenticación
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>
  logout: () => void
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>
  addToFavorites: (mediaId: number) => Promise<boolean>
  removeFromFavorites: (mediaId: number) => Promise<boolean>
  addToHistory: (mediaId: number) => Promise<boolean>
  getFavorites: () => number[]
  getHistory: () => number[]
  isRemembered: boolean
  updateProfile: (updatedUser: Partial<User>) => Promise<boolean>
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemembered, setIsRemembered] = useState(false)
  const router = useRouter()

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("user_session")
      const remembered = localStorage.getItem("user_remembered") === "true"

      if (sessionData) {
        try {
          const sessionUser = JSON.parse(sessionData)
          setUser(sessionUser)
          setIsRemembered(remembered)
        } catch (error) {
          console.error("Error al cargar la sesión:", error)
        }
      }

      setIsLoading(false)
    }

    checkSession()
  }, [])

  // Función de inicio de sesión con opción de recordar
  const login = async (email: string, password: string, remember = false): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const { success, user: loggedInUser } = await loginUser(formData)

      if (success && loggedInUser) {
        setUser(loggedInUser)
        setIsRemembered(remember)

        // Guardar sesión
        localStorage.setItem("user_session", JSON.stringify(loggedInUser))
        if (remember) {
          localStorage.setItem("user_remembered", "true")
        } else {
          localStorage.removeItem("user_remembered")
          sessionStorage.setItem("auth_session", "true")
        }

        return true
      }

      return false
    } catch (error) {
      console.error("Error en login:", error)
      return false
    }
  }

  // Función de registro
  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append("name", userData.name)
      formData.append("email", userData.email)
      formData.append("password", userData.password)

      const { success, user: newUser } = await registerUser(formData)

      if (success && newUser) {
        setUser(newUser)
        setIsRemembered(false)

        // Guardar sesión
        localStorage.setItem("user_session", JSON.stringify(newUser))
        sessionStorage.setItem("auth_session", "true")

        return true
      }

      return false
    } catch (error) {
      console.error("Error en registro:", error)
      return false
    }
  }

  // Función de cierre de sesión
  const logout = () => {
    setUser(null)
    setIsRemembered(false)
    localStorage.removeItem("user_session")
    localStorage.removeItem("user_remembered")
    sessionStorage.removeItem("auth_session")
    router.push("/auth/login")
  }

  // Función para actualizar el perfil del usuario
  const updateProfile = async (updatedUser: Partial<User>): Promise<boolean> => {
    if (!user) return false

    try {
      const formData = new FormData()

      if (updatedUser.name) formData.append("name", updatedUser.name)
      if (updatedUser.email) formData.append("email", updatedUser.email)
      if (updatedUser.image) formData.append("image", updatedUser.image)

      const { success, user: updated } = await updateUserProfile(user.id, formData)

      if (success && updated) {
        setUser(updated)
        localStorage.setItem("user_session", JSON.stringify(updated))
        return true
      }

      return false
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      return false
    }
  }

  // Función para añadir a favoritos
  const addToFavorites = async (mediaId: number): Promise<boolean> => {
    if (!user) return false

    try {
      const { success } = await addToFavoritesAction(user.id, mediaId)

      if (success) {
        // Actualizar estado local
        const updatedFavorites = [...(user.favorites || []), mediaId]
        setUser({ ...user, favorites: updatedFavorites })
        localStorage.setItem("user_session", JSON.stringify({ ...user, favorites: updatedFavorites }))
        return true
      }

      return false
    } catch (error) {
      console.error("Error al añadir a favoritos:", error)
      return false
    }
  }

  // Función para eliminar de favoritos
  const removeFromFavorites = async (mediaId: number): Promise<boolean> => {
    if (!user || !user.favorites) return false

    try {
      const { success } = await removeFromFavoritesAction(user.id, mediaId)

      if (success) {
        // Actualizar estado local
        const updatedFavorites = user.favorites.filter((id) => id !== mediaId)
        setUser({ ...user, favorites: updatedFavorites })
        localStorage.setItem("user_session", JSON.stringify({ ...user, favorites: updatedFavorites }))
        return true
      }

      return false
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error)
      return false
    }
  }

  // Función para añadir al historial
  const addToHistory = async (mediaId: number): Promise<boolean> => {
    if (!user) return false

    try {
      const { success } = await addToHistoryAction(user.id, mediaId)

      if (success) {
        // Actualizar estado local
        const currentHistory = user.history || []
        const updatedHistory = [mediaId, ...currentHistory.filter((id) => id !== mediaId)].slice(0, 100)
        setUser({ ...user, history: updatedHistory })
        localStorage.setItem("user_session", JSON.stringify({ ...user, history: updatedHistory }))
        return true
      }

      return false
    } catch (error) {
      console.error("Error al añadir al historial:", error)
      return false
    }
  }

  // Función para obtener favoritos
  const getFavorites = (): number[] => {
    return user?.favorites || []
  }

  // Función para obtener historial
  const getHistory = (): number[] => {
    return user?.history || []
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        addToFavorites,
        removeFromFavorites,
        addToHistory,
        getFavorites,
        getHistory,
        isRemembered,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
