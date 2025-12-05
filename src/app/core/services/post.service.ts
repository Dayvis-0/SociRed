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
  orderBy,
  limit,
  where,
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
import { Post, CreatePostData, UpdatePostData } from '../models/post.model';
import { UserStatsService } from './user-stats.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private firestore = inject(Firestore);
  private userStatsService = inject(UserStatsService);
  private postsCollection = collection(this.firestore, 'posts');

  // ==================== CREAR POST ====================
  async createPost(
    autorId: string, 
    autorName: string, 
    autorInitials: string, 
    autorPhotoURL: string | undefined, 
    data: CreatePostData
  ): Promise<string> {
    try {
      const postData = {
        autorId,
        autorName,
        autorInitials,
        autorPhotoURL: autorPhotoURL || '',
        contenido: data.contenido,
        imagenUrl: data.imagenUrl || '',
        fecha: serverTimestamp(),
        likes: 0,
        commentsCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.postsCollection, postData);
      
      // Actualizar el postId en el documento
      await updateDoc(docRef, { postId: docRef.id });

      // Incrementar contador de posts del usuario
      await this.userStatsService.incrementPostsCount(autorId);

      console.log('✅ Post creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear post:', error);
      throw error;
    }
  }

  // ==================== OBTENER TODOS LOS POSTS (TIEMPO REAL) ====================
  getAllPosts(limitCount: number = 50): Observable<Post[]> {
    return new Observable(observer => {
      const q = query(
        this.postsCollection,
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );

      // 🔥 onSnapshot escucha cambios en TIEMPO REAL
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              postId: doc.id,
              ...data,
              fecha: this.convertToTimestamp(data['fecha']),
              createdAt: this.convertToTimestamp(data['createdAt']),
              updatedAt: this.convertToTimestamp(data['updatedAt'])
            } as Post;
          });

          console.log('🔄 Posts actualizados en tiempo real:', posts.length);
          observer.next(posts);
        },
        error => {
          console.error('❌ Error al escuchar posts:', error);
          observer.error(error);
        }
      );

      // Cleanup: desuscribirse cuando el Observable se cancele
      return () => {
        console.log('🛑 Desuscrito de posts en tiempo real');
        unsubscribe();
      };
    });
  }

  // ==================== OBTENER POSTS DE UN USUARIO (TIEMPO REAL) ====================
  getUserPosts(autorId: string, limitCount: number = 50): Observable<Post[]> {
    return new Observable(observer => {
      const q = query(
        this.postsCollection,
        where('autorId', '==', autorId),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              postId: doc.id,
              ...data,
              fecha: this.convertToTimestamp(data['fecha']),
              createdAt: this.convertToTimestamp(data['createdAt']),
              updatedAt: this.convertToTimestamp(data['updatedAt'])
            } as Post;
          });

          console.log('🔄 Posts del usuario actualizados:', posts.length);
          observer.next(posts);
        },
        error => {
          console.error('❌ Error al escuchar posts del usuario:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  // ==================== OBTENER UN POST POR ID ====================
  async getPostById(postId: string): Promise<Post | null> {
    try {
      const docRef = doc(this.firestore, 'posts', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          postId: docSnap.id,
          ...data,
          fecha: this.convertToTimestamp(data['fecha']),
          createdAt: this.convertToTimestamp(data['createdAt']),
          updatedAt: this.convertToTimestamp(data['updatedAt'])
        } as Post;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al obtener post:', error);
      return null;
    }
  }

  // ==================== ACTUALIZAR POST ====================
  async updatePost(postId: string, data: UpdatePostData): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'posts', postId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Post actualizado:', postId);
    } catch (error) {
      console.error('❌ Error al actualizar post:', error);
      throw error;
    }
  }

  // ==================== ELIMINAR POST ====================
  async deletePost(postId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'posts', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = docSnap.data() as Post;
        const autorId = postData.autorId;

        // Eliminar el post
        await deleteDoc(docRef);

        // Decrementar contador de posts del usuario
        await this.userStatsService.decrementPostsCount(autorId);

        console.log('✅ Post eliminado:', postId);
      } else {
        console.warn('⚠️ Post no encontrado:', postId);
      }
    } catch (error) {
      console.error('❌ Error al eliminar post:', error);
      throw error;
    }
  }

  // ==================== DAR/QUITAR LIKE ====================
  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'posts', postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Post no encontrado');
      }

      const post = docSnap.data() as Post;
      const isLiked = post.likedBy?.includes(userId) || false;

      if (isLiked) {
        // Quitar like
        await updateDoc(docRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        console.log('👎 Like removido del post:', postId);
      } else {
        // Dar like
        await updateDoc(docRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        console.log('👍 Like agregado al post:', postId);
      }
    } catch (error) {
      console.error('❌ Error al dar/quitar like:', error);
      throw error;
    }
  }

  // ==================== ACTUALIZAR CONTADOR DE COMENTARIOS ====================
  async updateCommentsCount(postId: string, count: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'posts', postId);
      await updateDoc(docRef, {
        commentsCount: count >= 0 ? count : 0,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error al actualizar contador de comentarios:', error);
      throw error;
    }
  }

  // ==================== HELPER: CONVERTIR A TIMESTAMP ====================
  private convertToTimestamp(value: any): Timestamp {
    if (!value) {
      return Timestamp.now();
    }

    if (value instanceof Timestamp) {
      return value;
    }

    if (value.toDate && typeof value.toDate === 'function') {
      return Timestamp.fromDate(value.toDate());
    }

    if (value instanceof Date) {
      return Timestamp.fromDate(value);
    }

    return Timestamp.now();
  }
}