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
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>
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
  const [users, setUsers] = useState<Array<typeof TEST_USER>>([TEST_USER])

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

    // Cargar usuarios guardados
    const storedUsers = localStorage.getItem("auth_users")
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers)
        setUsers([TEST_USER, ...parsedUsers.filter((u: any) => u.email !== TEST_USER.email)])
      } catch (e) {
        console.error("Error parsing stored users:", e)
      }
    }

    setIsLoading(false)
  }, [])

  // Función de inicio de sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular una petición de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar credenciales
    const foundUser = users.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      }
      setUser(userData)
      localStorage.setItem("auth_user", JSON.stringify(userData))
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
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
    }

    // Actualizar lista de usuarios
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)

    // Guardar en localStorage
    localStorage.setItem("auth_users", JSON.stringify(updatedUsers.filter((u) => u.email !== TEST_USER.email)))

    // Iniciar sesión automáticamente
    const userInfo = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    }
    setUser(userInfo)
    localStorage.setItem("auth_user", JSON.stringify(userInfo))

    return true
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
        register,
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
