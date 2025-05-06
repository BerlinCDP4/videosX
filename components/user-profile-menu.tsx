"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { blobStorage } from "@/lib/vercel-storage"

export function UserProfileMenu() {
  const { user, isAuthenticated, logout, isRemembered } = useAuth()
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string>("/default-avatar.png")

  useEffect(() => {
    if (user?.image) {
      if (user.image.startsWith("profile_")) {
        // Es una imagen almacenada en nuestro sistema
        const imageData = blobStorage.getImage(user.image)
        setAvatarSrc(imageData || "/default-avatar.png")
      } else {
        // Es una URL externa
        setAvatarSrc(user.image)
      }
    } else {
      setAvatarSrc("/default-avatar.png")
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push("/")
    setShowLogoutDialog(false)
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={user?.name || "Usuario"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-muted" align="end" forceMount>
          {isAuthenticated ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {isRemembered && <p className="text-xs text-accent mt-1">Sesión recordada</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Invitado</p>
                  <p className="text-xs leading-none text-muted-foreground">No has iniciado sesión</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogin} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Iniciar Sesión</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-card border-muted">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              {isRemembered
                ? "Tu sesión está guardada. Si cierras sesión, tendrás que volver a iniciar sesión la próxima vez."
                : "¿Estás seguro de que quieres cerrar sesión?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-white hover:bg-muted/80">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-white hover:bg-destructive/90">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
