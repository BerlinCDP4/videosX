"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Upload, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { MainNavigation } from "@/components/main-navigation"
import { userService, blobStorage } from "@/lib/vercel-storage"

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | undefined>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("profile")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Cargar datos del usuario
    if (user) {
      setName(user.name || "")
      setUsername(user.email || "") // Usar email como username por defecto

      // Cargar imagen de perfil
      if (user.image) {
        if (user.image.startsWith("profile_")) {
          // Es una imagen almacenada en nuestro sistema
          const imageData = blobStorage.getImage(user.image)
          setProfilePicture(imageData || "/default-avatar.png")
        } else {
          // Es una URL externa
          setProfilePicture(user.image)
        }
      } else {
        setProfilePicture("/default-avatar.png")
      }
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      // Actualizar perfil
      const updatedUser = userService.update(user.id, {
        name,
        // No actualizamos el email aquí para evitar problemas de autenticación
      })

      if (!updatedUser) {
        throw new Error("Error al actualizar perfil")
      }

      // Actualizar imagen de perfil si ha cambiado
      if (
        profilePicture &&
        profilePicture !== "/default-avatar.png" &&
        (!user.image || (user.image && profilePicture !== blobStorage.getImage(user.image)))
      ) {
        userService.updateProfileImage(user.id, profilePicture)
      }

      setSuccess("Perfil actualizado correctamente")

      // Actualizar el contexto de autenticación
      updateProfile({
        ...user,
        name,
      })
    } catch (err) {
      console.error("Error al actualizar perfil:", err)
      setError("Error al actualizar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Función para cargar imagen
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicture(event.target.result.toString())
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Función para abrir el selector de archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Función simplificada para manejar la navegación
  const handleNavigate = (section: string) => {
    setActiveSection(section)

    // Mapa de rutas simplificado
    const routes: Record<string, string> = {
      home: "/",
      images: "/images",
      videos: "/videos",
      upload: "/upload",
      favorites: "/favorites",
      recent: "/recent",
      profile: "/profile",
      history: "/history",
    }

    const path = routes[section]
    if (path) {
      router.push(path)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white">Mi Perfil</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-2 bg-card border-muted">
              <CardHeader>
                <CardTitle>Información del perfil</CardTitle>
                <CardDescription>Actualiza tu información personal</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-500/20 border-green-500 text-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-muted border-muted"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Nombre de usuario</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-muted border-muted"
                        disabled={true} // Deshabilitado para evitar cambios de email
                      />
                      <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                      {isLoading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card border-muted">
              <CardHeader>
                <CardTitle>Tu foto de perfil</CardTitle>
                <CardDescription>Sube una foto para personalizar tu perfil</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profilePicture || "/default-avatar.png"} alt={user?.name || "Usuario"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="grid w-full gap-2">
                  <Label htmlFor="picture" className="sr-only">
                    Foto de perfil
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadClick}
                      className="w-full bg-muted border-muted"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir foto
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
