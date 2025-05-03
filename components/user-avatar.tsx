"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

export function UserAvatar() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar>
      <AvatarImage src={user.image || "/default-avatar.png"} alt={user.name || ""} />
      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
    </Avatar>
  )
}
