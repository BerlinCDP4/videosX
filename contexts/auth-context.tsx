"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo de usuario
interface User {
  id: string
  name: string
  email: string
  image?: string
  favorites?: string[] // IDs de medios favoritos
  history?: string[] // IDs de medios vistos
}

// Definir el tipo de usuario completo (incluyendo contraseña)
interface UserWithPassword extends User {
  password: string
}

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
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserWithPassword[]>([])
  const [isRemembered, setIsRemembered] = useState(false)

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    // Cargar usuarios guardados primero
    const storedUsers = localStorage.getItem("auth_users")
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers)
        if (Array.isArray(parsedUsers)) {
          setUsers(parsedUsers)
        }
      } catch (e) {
        console.error("Error parsing stored users:", e)
        setUsers([])
      }
    }

    // Verificar si hay una sesión guardada
    const storedUser = localStorage.getItem("auth_user")
    const remembered = localStorage.getItem("auth_remembered") === "true"

    if (storedUser && (remembered || sessionStorage.getItem("auth_session"))) {
      try {
        setUser(JSON.parse(storedUser))
        setIsRemembered(remembered)
      } catch (e) {
        console.error("Error parsing stored user:", e)
        localStorage.removeItem("auth_user")
        localStorage.removeItem("auth_remembered")
        sessionStorage.removeItem("auth_session")
      }
    }

    setIsLoading(false)
  }, [])

  // Función para guardar usuarios en localStorage
  const saveUsers = (updatedUsers: UserWithPassword[]) => {
    try {
      localStorage.setItem("auth_users", JSON.stringify(updatedUsers))
    } catch (e) {
      console.error("Error saving users to localStorage:", e)
    }
  }

  // Función para actualizar el usuario actual en localStorage
  const updateCurrentUser = (updatedUser: User) => {
    try {
      setUser(updatedUser)
      localStorage.setItem("auth_user", JSON.stringify(updatedUser))

      // También actualizar en la lista de usuarios
      const userIndex = users.findIndex((u) => u.id === updatedUser.id)
      if (userIndex >= 0) {
        const updatedUsers = [...users]
        updatedUsers[userIndex] = { ...updatedUsers[userIndex], ...updatedUser }
        setUsers(updatedUsers)
        saveUsers(updatedUsers)
      }
    } catch (e) {
      console.error("Error updating current user:", e)
    }
  }

  // Función de inicio de sesión con opción de recordar
  const login = async (email: string, password: string, remember = false): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar credenciales
    const foundUser = users.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        favorites: foundUser.favorites || [],
        history: foundUser.history || [],
      }
      setUser(userData)

      // Guardar en localStorage y/o sessionStorage según la opción de recordar
      localStorage.setItem("auth_user", JSON.stringify(userData))

      if (remember) {
        localStorage.setItem("auth_remembered", "true")
        setIsRemembered(true)
      } else {
        localStorage.removeItem("auth_remembered")
        sessionStorage.setItem("auth_session", "true")
        setIsRemembered(false)
      }

      return true
    }
    return false
  }

  // Función de registro
  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar si el email ya está registrado
    if (users.some((u) => u.email === userData.email)) {
      return false
    }

    // Crear nuevo usuario
    const newUser: UserWithPassword = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      favorites: [],
      history: [],
    }

    // Actualizar lista de usuarios
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    saveUsers(updatedUsers)

    // Iniciar sesión automáticamente después del registro
    const userInfo = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      favorites: [],
      history: [],
    }
    setUser(userInfo)
    localStorage.setItem("auth_user", JSON.stringify(userInfo))
    sessionStorage.setItem("auth_session", "true")

    return true
  }

  // Función de cierre de sesión
  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
    localStorage.removeItem("auth_remembered")
    sessionStorage.removeItem("auth_session")
    setIsRemembered(false)
  }

  // Función para añadir a favoritos
  const addToFavorites = (mediaId: string) => {
    if (!user) return

    // Evitar duplicados
    if (user.favorites?.includes(mediaId)) return

    const updatedFavorites = [...(user.favorites || []), mediaId]
    const updatedUser = { ...user, favorites: updatedFavorites }
    updateCurrentUser(updatedUser)
  }

  // Función para eliminar de favoritos
  const removeFromFavorites = (mediaId: string) => {
    if (!user || !user.favorites) return

    const updatedFavorites = user.favorites.filter((id) => id !== mediaId)
    const updatedUser = { ...user, favorites: updatedFavorites }
    updateCurrentUser(updatedUser)
  }

  // Función para añadir al historial
  const addToHistory = (mediaId: string) => {
    if (!user) return

    // Si ya está en el historial, lo movemos al principio (más reciente)
    const currentHistory = user.history || []
    const updatedHistory = [mediaId, ...currentHistory.filter((id) => id !== mediaId)].slice(0, 100) // Limitar a 100 elementos

    const updatedUser = { ...user, history: updatedHistory }
    updateCurrentUser(updatedUser)
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
