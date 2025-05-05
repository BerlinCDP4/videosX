"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registrar el error en la consola para depuración
    console.error("Error en la aplicación:", error)
  }, [error])

  // Función para limpiar localStorage y reiniciar
  const handleCleanAndReset = () => {
    try {
      // Limpiar datos que podrían estar causando el error
      localStorage.removeItem("mediaItems")
      localStorage.removeItem("favorites")

      // Reiniciar la aplicación
      reset()
    } catch (e) {
      console.error("Error al limpiar datos:", e)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="max-w-md w-full bg-card p-6 rounded-lg border border-muted shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Ha ocurrido un error</h1>
        <p className="text-muted-foreground mb-6">
          Se ha producido un error al cargar la aplicación. Esto podría deberse a datos corruptos en el almacenamiento
          local.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleCleanAndReset} className="w-full bg-accent hover:bg-accent/90">
            Limpiar datos y reintentar
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full">
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
