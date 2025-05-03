"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo de usuario
interface User {
  id: string
  name: string
  email: string
  image?: string
}

// Definir el tipo de contexto de autenticación
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

// Usuario de prueba
const TEST_USER = {
  id: "1",
  name: "Usuario de Prueba",
  email: "usuario@ejemplo.com",
  password: "123456", // En producción, esto debería ser un hash
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Error parsing stored user:", e)
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
  }, [])

  // Función de inicio de sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar credenciales
    if (email === TEST_USER.email && password === TEST_USER.password) {
      const userData = {
        id: TEST_USER.id,
        name: TEST_USER.name,
        email: TEST_USER.email,
      }
      setUser(userData)
      localStorage.setItem("auth_user", JSON.stringify(userData))
      return true
    }
    return false
  }

  // Función de cierre de sesión
  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
