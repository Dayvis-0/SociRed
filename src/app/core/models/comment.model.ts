// src/app/core/models/comment.model.ts

import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface de Comentario (Comment Document en Firestore)
 * Ruta: /posts/{postId}/comentarios/{comentarioId}
 */
export interface Comment {
  comentarioId: string;              // ID único del comentario
  postId: string;                    // ID del post al que pertenece
  autorId: string;                   // ID del usuario autor
  autorName: string;                 // Nombre del autor
  autorPhotoURL?: string;            // Foto del autor
  texto: string;                     // Contenido del comentario
  likes: number;                     // Cantidad de likes
  likedBy: string[];                 // Array de userIds que dieron like
  fecha: Timestamp;                  // Fecha de creación
  createdAt: Timestamp;              // Timestamp de creación
  updatedAt: Timestamp;              // Timestamp de actualización
  parentCommentId?: string;          // ID del comentario padre (para respuestas)
}

/**
 * Interface para UI de Comentarios
 */
export interface CommentUI extends Comment {
  timeAgo: string;
  isLikedByCurrentUser: boolean;
  replies?: CommentUI[];
}