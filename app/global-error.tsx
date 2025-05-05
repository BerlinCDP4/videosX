"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registrar el error en la consola para depuración
    console.error("Error global en la aplicación:", error)
  }, [error])

  // Función para limpiar localStorage y reiniciar
  const handleCleanAndReset = () => {
    try {
      // Limpiar todos los datos de localStorage
      localStorage.clear()

      // Reiniciar la aplicación
      reset()
    } catch (e) {
      console.error("Error al limpiar datos:", e)
      // Si falla la limpieza, intentar recargar la página
      window.location.href = "/"
    }
  }

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-center text-white">
          <div className="max-w-md w-full bg-zinc-900 p-6 rounded-lg border border-zinc-800 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Error crítico</h1>
            <p className="text-zinc-400 mb-6">
              Se ha producido un error crítico en la aplicación. Esto podría deberse a datos corruptos en el
              almacenamiento local.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCleanAndReset}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
              >
                Limpiar datos y reiniciar
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
