"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { UserContext as UserContextType } from "@/lib/types"

// Crear el contexto
const UserContext = createContext<UserContextType | undefined>(undefined)

// Proveedor del contexto
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("")

  // Al cargar el componente, verificar si ya existe un ID de usuario en localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      // Si no existe, crear uno nuevo
      const newUserId = uuidv4()
      localStorage.setItem("userId", newUserId)
      setUserId(newUserId)
    }
  }, [])

  return <UserContext.Provider value={{ userId, setUserId }}>{children}</UserContext.Provider>
}

// Hook personalizado para usar el contexto
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser debe ser usado dentro de un UserProvider")
  }
  return context
}
