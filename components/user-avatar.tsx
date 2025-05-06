"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { blobStorage } from "@/lib/vercel-storage"
import { useEffect, useState } from "react"

export function UserAvatar() {
  const { user } = useAuth()
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

  if (!user) {
    return (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar>
      <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={user.name || ""} />
      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
    </Avatar>
  )
}
