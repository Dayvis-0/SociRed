import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private firestore = inject(Firestore);

  // ==================== OBTENER COMENTARIOS DE UN POST (TIEMPO REAL) ====================
  getCommentsByPost(postId: string, limitCount: number = 50): Observable<Comment[]> {
    return new Observable(observer => {
      const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
      const q = query(
        commentsCollection,
        where('parentCommentId', '==', null),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      // 🔥 onSnapshot escucha cambios en TIEMPO REAL
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const comments = snapshot.docs.map(doc => {
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

          console.log(`🔄 Comentarios del post ${postId} actualizados:`, comments.length);
          observer.next(comments);
        },
        error => {
          console.error('❌ Error al escuchar comentarios:', error);
          observer.error(error);
        }
      );

      // Cleanup: desuscribirse cuando el Observable se cancele
      return () => {
        console.log(`🛑 Desuscrito de comentarios del post ${postId}`);
        unsubscribe();
      };
    });
  }

  // ==================== CREAR UN COMENTARIO ====================
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

  // ==================== DAR/QUITAR LIKE A UN COMENTARIO ====================
  async toggleLike(postId: string, comentarioId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comentario no encontrado');
      }

      const commentData = commentSnap.data();
      const likedBy = commentData['likedBy'] || [];
      const hasLiked = likedBy.includes(userId);

      if (hasLiked) {
        // Quitar like
        await updateDoc(commentRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        console.log('👎 Like removido del comentario:', comentarioId);
      } else {
        // Dar like
        await updateDoc(commentRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        console.log('👍 Like agregado al comentario:', comentarioId);
      }
    } catch (error) {
      console.error('❌ Error al actualizar like:', error);
      throw error;
    }
  }

  // ==================== ACTUALIZAR UN COMENTARIO ====================
  async updateComment(postId: string, comentarioId: string, texto: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      await updateDoc(commentRef, {
        texto: texto,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Comentario actualizado:', comentarioId);
    } catch (error) {
      console.error('❌ Error al actualizar comentario:', error);
      throw error;
    }
  }

  // ==================== ELIMINAR UN COMENTARIO ====================
  async deleteComment(postId: string, comentarioId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, `posts/${postId}/comentarios`, comentarioId);
      await deleteDoc(commentRef);

      // Decrementar contador de comentarios en el post
      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });

      console.log('✅ Comentario eliminado:', comentarioId);
    } catch (error) {
      console.error('❌ Error al eliminar comentario:', error);
      throw error;
    }
  }

  // ==================== OBTENER RESPUESTAS DE UN COMENTARIO (TIEMPO REAL) ====================
  getCommentReplies(postId: string, parentCommentId: string): Observable<Comment[]> {
    return new Observable(observer => {
      const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
      const q = query(
        commentsCollection,
        where('parentCommentId', '==', parentCommentId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const replies = snapshot.docs.map(doc => {
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

          console.log(`🔄 Respuestas del comentario ${parentCommentId} actualizadas:`, replies.length);
          observer.next(replies);
        },
        error => {
          console.error('❌ Error al escuchar respuestas:', error);
          observer.error(error);
        }
      );

      return () => {
        console.log(`🛑 Desuscrito de respuestas del comentario ${parentCommentId}`);
        unsubscribe();
      };
    });
  }

  // ==================== CONTAR COMENTARIOS DE UN POST ====================
  async getCommentsCount(postId: string): Promise<number> {
    try {
      const commentsCollection = collection(this.firestore, `posts/${postId}/comentarios`);
      const q = query(commentsCollection, where('parentCommentId', '==', null));
      
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            unsubscribe();
            resolve(snapshot.size);
          },
          (error) => {
            unsubscribe();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('❌ Error al contar comentarios:', error);
      return 0;
    }
  }

  // ==================== HELPER: CONVERTIR A TIMESTAMP ====================
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