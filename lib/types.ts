export interface MediaItem {
  id: string
  title: string
  url: string
  type: "image" | "video"
  category: string
  thumbnail?: string
  createdAt: string
  protected?: boolean // Indica si el medio está protegido contra descargas
}
