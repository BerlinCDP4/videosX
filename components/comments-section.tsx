"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { Comment } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { commentService } from "@/lib/db-service"

interface CommentsProps {
  mediaId: string
}

export default function CommentsSection({ mediaId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Cargar comentarios al iniciar
  useEffect(() => {
    loadComments()
  }, [mediaId])

  // Función para cargar comentarios
  const loadComments = async () => {
    try {
      const mediaComments = commentService.getByMediaId(mediaId)
      setComments(mediaComments)
    } catch (error) {
      console.error("Error al cargar comentarios:", error)
      setComments([])
    }
  }

  // Función para añadir un comentario
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault() // Prevenir comportamiento por defecto del formulario
    e.stopPropagation() // Detener propagación del evento

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated || !user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear nuevo comentario
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        mediaId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.image,
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      }

      // Guardar en la base de datos
      const savedComment = commentService.add(newCommentObj)

      // Actualizar estado local
      setComments((prev) => [savedComment, ...prev])

      // Limpiar campo de comentario
      setNewComment("")

      toast({
        title: "Comentario añadido",
        description: "Tu comentario ha sido publicado correctamente",
      })
    } catch (error) {
      console.error("Error al añadir comentario:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar cambios en el textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
  }

  // Función para manejar teclas en el textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation() // Detener propagación para evitar que active controles de video
  }

  // Función para eliminar un comentario
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    try {
      // Eliminar de la base de datos
      const success = commentService.delete(commentId, user.id)

      if (!success) {
        toast({
          title: "Error",
          description: "No tienes permiso para eliminar este comentario",
          variant: "destructive",
        })
        return
      }

      // Actualizar estado local
      setComments((prev) => prev.filter((c) => c.id !== commentId))

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar comentario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      })
    }
  }

  // Formatear fecha relativa
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch (e) {
      return "hace un momento"
    }
  }

  return (
    <div className="mt-6" onClick={(e) => e.stopPropagation()}>
      <Card className="bg-card border-muted">
        <CardHeader>
          <CardTitle>Comentarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="flex flex-col space-y-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                className="bg-muted border-muted resize-none"
                rows={3}
              />
              <Button
                type="submit"
                className="self-end bg-accent hover:bg-accent/90"
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
              >
                {isLoading ? "Publicando..." : "Publicar comentario"}
              </Button>
            </form>
          ) : (
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-muted-foreground">Inicia sesión para comentar</p>
            </div>
          )}

          <div className="space-y-4 mt-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay comentarios aún. ¡Sé el primero en comentar!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-3 rounded-md bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar || "/default-avatar.png"} alt={comment.userName} />
                    <AvatarFallback>{comment.userName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                      </div>
                      {user && comment.userId === user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteComment(comment.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
