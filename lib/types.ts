export interface MediaItem {
  id: string
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
  userId: string // ID del usuario que subió el medio
}

export interface UserContext {
  userId: string
  setUserId: (id: string) => void
}
