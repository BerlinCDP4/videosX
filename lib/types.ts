// Tipos para la aplicación

// Tipo para elementos multimedia
export interface MediaItem {
  id: number
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
  userId: number
  userName?: string
  viewedAt?: string
}

// Tipo para comentarios
export interface Comment {
  id: number
  mediaId: number
  userId: number
  userName: string
  userAvatar?: string
  text: string
  createdAt: string
}

// Tipo para usuarios
export interface User {
  id: number
  name: string
  email: string
  image?: string
  favorites?: number[]
  history?: number[]
  createdAt: string
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

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  favorites?: string[]
  history?: string[]
}
