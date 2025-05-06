"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { userService, initializeDatabase } from "@/lib/vercel-storage"
import type { User } from "@/lib/types"

// Definir el tipo de contexto de autenticación
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>
  logout: () => void
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>
  addToFavorites: (mediaId: string) => void
  removeFromFavorites: (mediaId: string) => void
  addToHistory: (mediaId: string) => void
  getFavorites: () => string[]
  getHistory: () => string[]
  isRemembered: boolean
  updateProfile: (updatedUser: User) => void
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemembered, setIsRemembered] = useState(false)

  // Inicializar la base de datos y verificar si hay una sesión guardada al cargar
  useEffect(() => {
    // Inicializar la base de datos
    initializeDatabase()

    // Verificar si hay una sesión guardada
    const { user: sessionUser, remembered } = userService.getSession()

    if (sessionUser) {
      setUser(sessionUser)
      setIsRemembered(remembered)
    }

    setIsLoading(false)
  }, [])

  // Función de inicio de sesión con opción de recordar
  const login = async (email: string, password: string, remember = false): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar credenciales
    const loggedInUser = userService.login(email, password)

    if (loggedInUser) {
      setUser(loggedInUser)
      setIsRemembered(remember)

      // Guardar sesión
      userService.saveSession(loggedInUser, remember)

      return true
    }
    return false
  }

  // Función de registro
  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Registrar nuevo usuario
    const newUser = userService.register(userData)

    if (newUser) {
      // Iniciar sesión automáticamente después del registro
      setUser(newUser)
      setIsRemembered(false)

      // Guardar sesión
      userService.saveSession(newUser, false)
      sessionStorage.setItem("auth_session", "true")

      return true
    }

    return false
  }

  // Función de cierre de sesión
  const logout = () => {
    setUser(null)
    setIsRemembered(false)
    userService.logout()
  }

  // Función para actualizar el perfil del usuario
  const updateProfile = (updatedUser: User) => {
    setUser(updatedUser)

    // Actualizar la sesión
    if (updatedUser) {
      userService.saveSession(updatedUser, isRemembered)
    }
  }

  // Función para añadir a favoritos
  const addToFavorites = (mediaId: string) => {
    if (!user) return

    userService.addToFavorites(user.id, mediaId)

    // Actualizar estado local
    setUser((prev) => {
      if (!prev) return null
      const updatedFavorites = [...(prev.favorites || []), mediaId]
      return { ...prev, favorites: updatedFavorites }
    })
  }

  // Función para eliminar de favoritos
  const removeFromFavorites = (mediaId: string) => {
    if (!user || !user.favorites) return

    userService.removeFromFavorites(user.id, mediaId)

    // Actualizar estado local
    setUser((prev) => {
      if (!prev) return null
      const updatedFavorites = prev.favorites?.filter((id) => id !== mediaId) || []
      return { ...prev, favorites: updatedFavorites }
    })
  }

  // Función para añadir al historial
  const addToHistory = (mediaId: string) => {
    if (!user) return

    userService.addToHistory(user.id, mediaId)

    // Actualizar estado local
    setUser((prev) => {
      if (!prev) return null
      const currentHistory = prev.history || []
      const updatedHistory = [mediaId, ...currentHistory.filter((id) => id !== mediaId)].slice(0, 100)
      return { ...prev, history: updatedHistory }
    })
  }

  // Función para obtener favoritos
  const getFavorites = (): string[] => {
    return user?.favorites || []
  }

  // Función para obtener historial
  const getHistory = (): string[] => {
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
