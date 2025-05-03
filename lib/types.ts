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
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  socialLogin: (provider: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
}

export interface UserProfile {
  id: string
  name: string
  email: string
  username: string
  profilePicture?: string
  provider: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  username: string
}
