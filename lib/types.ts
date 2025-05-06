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

export interface User {
  id: string
  name: string
  email: string
  image?: string
  favorites?: string[] // IDs de medios favoritos
  history?: string[] // IDs de medios vistos
}

export interface UserContext {
  userId: string
  setUserId: (id: string) => void
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  socialLogin: (provider: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

// Tipo para comentarios
export interface Comment {
  id: string
  mediaId: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  favorites?: string[]
  history?: string[]
}
