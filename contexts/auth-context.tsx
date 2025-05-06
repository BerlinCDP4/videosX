"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
    // Inicializar la base de datos si no existe
    initializeDatabase()

    // Verificar si hay una sesión guardada
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
  }, [])

  // Inicializar la base de datos
  const initializeDatabase = () => {
    if (!localStorage.getItem("users_db")) {
      localStorage.setItem("users_db", JSON.stringify([]))
    }
    if (!localStorage.getItem("mediaItems")) {
      localStorage.setItem("mediaItems", JSON.stringify([]))
    }
  }

  // Función de inicio de sesión con opción de recordar
  const login = async (email: string, password: string, remember = false): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar credenciales
    const users = JSON.parse(localStorage.getItem("users_db") || "[]")
    const foundUser = users.find((u: any) => u.email === email && u.password === password)

    if (foundUser) {
      // No devolver la contraseña
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      setIsRemembered(remember)

      // Guardar sesión
      localStorage.setItem("user_session", JSON.stringify(userWithoutPassword))
      if (remember) {
        localStorage.setItem("user_remembered", "true")
      } else {
        localStorage.removeItem("user_remembered")
        sessionStorage.setItem("auth_session", "true")
      }

      return true
    }
    return false
  }

  // Función de registro
  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    const users = JSON.parse(localStorage.getItem("users_db") || "[]")

    // Verificar si el email ya está registrado
    if (users.some((u: any) => u.email === userData.email)) {
      return false
    }

    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      image: "",
      favorites: [],
      history: [],
      createdAt: new Date().toISOString(),
    }

    // Guardar en la base de datos
    localStorage.setItem("users_db", JSON.stringify([...users, newUser]))

    // Iniciar sesión automáticamente
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    setIsRemembered(false)

    // Guardar sesión
    localStorage.setItem("user_session", JSON.stringify(userWithoutPassword))
    sessionStorage.setItem("auth_session", "true")

    return true
  }

  // Función de cierre de sesión
  const logout = () => {
    setUser(null)
    setIsRemembered(false)
    localStorage.removeItem("user_session")
    localStorage.removeItem("user_remembered")
    sessionStorage.removeItem("auth_session")
  }

  // Función para actualizar el perfil del usuario
  const updateProfile = (updatedUser: User) => {
    setUser(updatedUser)

    // Actualizar la sesión
    if (updatedUser) {
      localStorage.setItem("user_session", JSON.stringify(updatedUser))
    }
  }

  // Función para añadir a favoritos
  const addToFavorites = (mediaId: string) => {
    if (!user) return

    // Actualizar estado local
    const updatedFavorites = [...(user.favorites || []), mediaId]
    const updatedUser = { ...user, favorites: updatedFavorites }
    setUser(updatedUser)

    // Actualizar en la base de datos
    const users = JSON.parse(localStorage.getItem("users_db") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === user.id)

    if (userIndex !== -1) {
      users[userIndex].favorites = updatedFavorites
      localStorage.setItem("users_db", JSON.stringify(users))
    }

    // Actualizar sesión
    localStorage.setItem("user_session", JSON.stringify(updatedUser))
  }

  // Función para eliminar de favoritos
  const removeFromFavorites = (mediaId: string) => {
    if (!user || !user.favorites) return

    // Actualizar estado local
    const updatedFavorites = user.favorites.filter((id) => id !== mediaId)
    const updatedUser = { ...user, favorites: updatedFavorites }
    setUser(updatedUser)

    // Actualizar en la base de datos
    const users = JSON.parse(localStorage.getItem("users_db") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === user.id)

    if (userIndex !== -1) {
      users[userIndex].favorites = updatedFavorites
      localStorage.setItem("users_db", JSON.stringify(users))
    }

    // Actualizar sesión
    localStorage.setItem("user_session", JSON.stringify(updatedUser))
  }

  // Función para añadir al historial
  const addToHistory = (mediaId: string) => {
    if (!user) return

    // Actualizar estado local
    const currentHistory = user.history || []
    const updatedHistory = [mediaId, ...currentHistory.filter((id) => id !== mediaId)].slice(0, 100)
    const updatedUser = { ...user, history: updatedHistory }
    setUser(updatedUser)

    // Actualizar en la base de datos
    const users = JSON.parse(localStorage.getItem("users_db") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === user.id)

    if (userIndex !== -1) {
      users[userIndex].history = updatedHistory
      localStorage.setItem("users_db", JSON.stringify(users))
    }

    // Actualizar sesión
    localStorage.setItem("user_session", JSON.stringify(updatedUser))
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
