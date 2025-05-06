"use client"

import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

export function MobileHomeButton() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="md:hidden fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleGoHome}
        size="icon"
        className="h-12 w-12 rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg"
      >
        <Home className="h-6 w-6" />
        <span className="sr-only">Inicio</span>
      </Button>
    </div>
  )
}
