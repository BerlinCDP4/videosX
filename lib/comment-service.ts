import { executeQuery } from "./db"
import type { Comment } from "./types"

// Interfaz para el servicio de comentarios
export interface CommentService {
  // Obtener comentarios por ID de medio
  getCommentsByMediaId(mediaId: number): Promise<Comment[]>

  // Añadir un comentario
  addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>

  // Eliminar un comentario
  deleteComment(id: number, userId: number): Promise<boolean>
}

// Implementación del servicio de comentarios
export const commentService: CommentService = {
  // Obtener comentarios por ID de medio
  async getCommentsByMediaId(mediaId: number): Promise<Comment[]> {
    try {
      const comments = await executeQuery<any[]>(
        `
        SELECT c.id, c.media_id, c.user_id, c.text, c.created_at, u.name as user_name, u.image_url as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.media_id = $1
        ORDER BY c.created_at DESC
      `,
        [mediaId],
      )

      return comments.map((comment) => ({
        id: comment.id,
        mediaId: comment.media_id,
        userId: comment.user_id,
        userName: comment.user_name,
        userAvatar: comment.user_avatar,
        text: comment.text,
        createdAt: comment.created_at,
      }))
    } catch (error) {
      console.error(`Error al obtener comentarios para el medio ${mediaId}:`, error)
      return []
    }
  },

  // Añadir un comentario
  async addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    try {
      const result = await executeQuery<any[]>(
        `
        INSERT INTO comments (media_id, user_id, text) 
        VALUES ($1, $2, $3) 
        RETURNING id, media_id, user_id, text, created_at
      `,
        [comment.mediaId, comment.userId, comment.text],
      )

      if (result.length === 0) {
        throw new Error("Error al añadir comentario")
      }

      const newComment = result[0]

      // Obtener información del usuario
      const userResult = await executeQuery<any[]>(
        `
        SELECT name, image_url FROM users WHERE id = $1
      `,
        [comment.userId],
      )

      return {
        id: newComment.id,
        mediaId: newComment.media_id,
        userId: newComment.user_id,
        userName: userResult[0]?.name || "Usuario",
        userAvatar: userResult[0]?.image_url || null,
        text: newComment.text,
        createdAt: newComment.created_at,
      }
    } catch (error) {
      console.error("Error al añadir comentario:", error)
      throw new Error("No se pudo añadir el comentario")
    }
  },

  // Eliminar un comentario
  async deleteComment(id: number, userId: number): Promise<boolean> {
    try {
      // Verificar que el usuario es el autor
      const commentResult = await executeQuery<any[]>(
        `
        SELECT user_id FROM comments WHERE id = $1
      `,
        [id],
      )

      if (commentResult.length === 0 || commentResult[0].user_id !== userId) {
        return false
      }

      // Eliminar el comentario
      await executeQuery(
        `
        DELETE FROM comments 
        WHERE id = $1
      `,
        [id],
      )

      return true
    } catch (error) {
      console.error("Error al eliminar comentario:", error)
      return false
    }
  },
}
