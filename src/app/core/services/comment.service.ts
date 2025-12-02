import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private firestore = inject(Firestore);

  /**
   * Obtener comentarios de un post
   */
  getCommentsByPost(postId: string, limitCount: number = 50): Observable<Comment[]> {
    const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
    const q = query(
      commentsCollection,
      where('parentCommentId', '==', null),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            comentarioId: doc.id,
            postId: data['postId'] || postId,
            autorId: data['autorId'],
            autorName: data['autorName'],
            autorPhotoURL: data['autorPhotoURL'],
            texto: data['texto'],
            likes: data['likes'] || 0,
            likedBy: data['likedBy'] || [],
            fecha: this.convertToTimestamp(data['fecha']),
            createdAt: this.convertToTimestamp(data['createdAt']),
            updatedAt: this.convertToTimestamp(data['updatedAt']),
            parentCommentId: data['parentCommentId']
          } as Comment;
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener comentarios:', error);
        throw error;
      })
    );
  }

  /**
   * Crear un comentario
   */
  async createComment(
    postId: string,
    autorId: string,
    autorName: string,
    autorPhotoURL: string | undefined,
    texto: string,
    parentCommentId?: string
  ): Promise<string> {
    try {
      const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
      
      const commentData = {
        postId: postId,
        autorId: autorId,
        autorName: autorName,
        autorPhotoURL: autorPhotoURL || '',
        texto: texto,
        likes: 0,
        likedBy: [],
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parentCommentId: parentCommentId || null
      };

      const docRef = await addDoc(commentsCollection, commentData);

      // Incrementar contador de comentarios en el post
      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      console.log('✅ Comentario creado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear comentario:', error);
      throw error;
    }
  }

  /**
   * Dar/quitar like a un comentario
   */
  async toggleLike(postId: string, comentarioId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      const commentDoc = await getDocs(query(collection(this.firestore, `posts/${postId}/comentarios`), where('__name__', '==', comentarioId)));
      
      if (!commentDoc.empty) {
        const commentData = commentDoc.docs[0].data();
        const likedBy = commentData['likedBy'] || [];
        const hasLiked = likedBy.includes(userId);

        if (hasLiked) {
          // Quitar like
          await updateDoc(commentRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId)
          });
        } else {
          // Dar like
          await updateDoc(commentRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId)
          });
        }

        console.log('✅ Like actualizado en comentario');
      }
    } catch (error) {
      console.error('❌ Error al actualizar like:', error);
      throw error;
    }
  }

  /**
   * Actualizar un comentario
   */
  async updateComment(postId: string, comentarioId: string, texto: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      await updateDoc(commentRef, {
        texto: texto,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Comentario actualizado');
    } catch (error) {
      console.error('❌ Error al actualizar comentario:', error);
      throw error;
    }
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(postId: string, comentarioId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      await deleteDoc(commentRef);

      // Decrementar contador de comentarios en el post
      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });

      console.log('✅ Comentario eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar comentario:', error);
      throw error;
    }
  }

  /**
   * Obtener respuestas de un comentario
   */
  getCommentReplies(postId: string, parentCommentId: string): Observable<Comment[]> {
    const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
    const q = query(
      commentsCollection,
      where('parentCommentId', '==', parentCommentId),
      orderBy('createdAt', 'asc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            comentarioId: doc.id,
            postId: data['postId'] || postId,
            autorId: data['autorId'],
            autorName: data['autorName'],
            autorPhotoURL: data['autorPhotoURL'],
            texto: data['texto'],
            likes: data['likes'] || 0,
            likedBy: data['likedBy'] || [],
            fecha: this.convertToTimestamp(data['fecha']),
            createdAt: this.convertToTimestamp(data['createdAt']),
            updatedAt: this.convertToTimestamp(data['updatedAt']),
            parentCommentId: data['parentCommentId']
          } as Comment;
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener respuestas:', error);
        throw error;
      })
    );
  }

  /**
   * Helper: Convertir a Timestamp
   */
  private convertToTimestamp(value: any): Timestamp {
    if (!value) return Timestamp.now();
    if (value instanceof Timestamp) return value;
    if (value.toDate && typeof value.toDate === 'function') {
      return Timestamp.fromDate(value.toDate());
    }
    if (value instanceof Date) return Timestamp.fromDate(value);
    return Timestamp.now();
  }
}