"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { UserContext as UserContextType, UserProfile, RegisterData } from "@/lib/types"
import {
  getUserData,
  loginUser,
  registerUser,
  updateUserProfile,
  socialLogin as socialLoginAction,
} from "@/lib/actions"

// Crear el contexto
const UserContext = createContext<UserContextType | undefined>(undefined)

// Proveedor del contexto
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Al cargar el componente, verificar si ya existe un ID de usuario en localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)

      // Intentar cargar los datos del usuario
      const loadUserData = async () => {
        try {
          const userData = await getUserData(storedUserId)
          if (userData) {
            setUser(userData)
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error("Error al cargar datos de usuario:", error)
        }
      }

      loadUserData()
    } else {
      // Si no existe, crear uno nuevo (usuario anónimo)
      const newUserId = uuidv4()
      localStorage.setItem("userId", newUserId)
      setUserId(newUserId)
    }
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      const result = await loginUser(email, password)

      if (result.success && result.userId) {
        // Guardar ID de usuario en localStorage
        localStorage.setItem("userId", result.userId)
        setUserId(result.userId)

        // Cargar datos del usuario
        const userData = await getUserData(result.userId)
        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        }

        return { success: true }
      }

      return { success: false, error: result.error || "Error al iniciar sesión" }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return { success: false, error: "Error al iniciar sesión" }
    }
  }

  // Función para registrar un nuevo usuario
  const register = async (userData: RegisterData) => {
    try {
      const result = await registerUser(userData)

      if (result.success && result.userId) {
        // Iniciar sesión automáticamente después del registro
        localStorage.setItem("userId", result.userId)
        setUserId(result.userId)

        // Cargar datos del usuario
        const userProfile = await getUserData(result.userId)
        if (userProfile) {
          setUser(userProfile)
          setIsAuthenticated(true)
        }

        return { success: true }
      }

      return { success: false, error: result.error || "Error al registrar usuario" }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      return { success: false, error: "Error al registrar usuario" }
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    // Crear un nuevo ID para usuario anónimo
    const newUserId = uuidv4()
    localStorage.setItem("userId", newUserId)
    setUserId(newUserId)
    setUser(null)
    setIsAuthenticated(false)
  }

  // Función para iniciar sesión con proveedores sociales
  const socialLogin = async (provider: string) => {
    try {
      // En una implementación real, aquí se integraría con el SDK del proveedor
      // Para este ejemplo, simulamos un token
      const token = `mock_token_${Date.now()}`

      const result = await socialLoginAction(provider, token)

      if (result.success && result.userId) {
        // Guardar ID de usuario en localStorage
        localStorage.setItem("userId", result.userId)
        setUserId(result.userId)

        // Cargar datos del usuario
        const userData = await getUserData(result.userId)
        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        }

        return { success: true }
      }

      return { success: false, error: result.error || `Error al iniciar sesión con ${provider}` }
    } catch (error) {
      console.error(`Error al iniciar sesión con ${provider}:`, error)
      return { success: false, error: `Error al iniciar sesión con ${provider}` }
    }
  }

  // Función para actualizar perfil
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!userId) {
        return { success: false, error: "Usuario no autenticado" }
      }

      const result = await updateUserProfile(userId, profileData)

      if (result.success) {
        // Actualizar datos locales
        const updatedUserData = await getUserData(userId)
        if (updatedUserData) {
          setUser(updatedUserData)
        }

        return { success: true }
      }

      return { success: false, error: result.error || "Error al actualizar perfil" }
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      return { success: false, error: "Error al actualizar perfil" }
    }
  }

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        user,
        setUser,
        isAuthenticated,
        login,
        register,
        logout,
        socialLogin,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser debe ser usado dentro de un UserProvider")
  }
  return context
}
