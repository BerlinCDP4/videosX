"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/contexts/user-context"

export function UserAvatar() {
  const { user, isAuthenticated } = useUser()

  if (!isAuthenticated || !user) {
    return (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar>
      <AvatarImage src={user.profilePicture || "/default-avatar.png"} alt={user.name} />
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
