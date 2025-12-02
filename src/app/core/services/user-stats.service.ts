import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  updateDoc,
  increment,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

/**
 * Servicio para gestionar contadores de usuario (friendsCount, postsCount)
 * Este servicio mantiene actualizados los contadores en el documento del usuario
 */
@Injectable({
  providedIn: 'root'
})
export class UserStatsService {
  private firestore = inject(Firestore);

  // ==================== CONTADORES DE POSTS ====================
  
  /**
   * Incrementar contador de posts del usuario
   * Se llama cuando el usuario crea una nueva publicación
   */
  async incrementPostsCount(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, {
        postsCount: increment(1)
      });
      console.log('✅ postsCount incrementado para usuario:', userId);
    } catch (error) {
      console.error('❌ Error al incrementar postsCount:', error);
      throw error;
    }
  }

  /**
   * Decrementar contador de posts del usuario
   * Se llama cuando el usuario elimina una publicación
   */
  async decrementPostsCount(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, {
        postsCount: increment(-1)
      });
      console.log('✅ postsCount decrementado para usuario:', userId);
    } catch (error) {
      console.error('❌ Error al decrementar postsCount:', error);
      throw error;
    }
  }

  // ==================== CONTADORES DE AMIGOS ====================
  
  /**
   * Incrementar contador de amigos para ambos usuarios
   * Se llama cuando una solicitud de amistad es aceptada
   */
  async incrementFriendsCount(userId1: string, userId2: string): Promise<void> {
    try {
      const user1Ref = doc(this.firestore, 'users', userId1);
      const user2Ref = doc(this.firestore, 'users', userId2);

      await Promise.all([
        updateDoc(user1Ref, { friendsCount: increment(1) }),
        updateDoc(user2Ref, { friendsCount: increment(1) })
      ]);

      console.log('✅ friendsCount incrementado para ambos usuarios');
    } catch (error) {
      console.error('❌ Error al incrementar friendsCount:', error);
      throw error;
    }
  }

  /**
   * Decrementar contador de amigos para ambos usuarios
   * Se llama cuando una amistad es eliminada
   */
  async decrementFriendsCount(userId1: string, userId2: string): Promise<void> {
    try {
      const user1Ref = doc(this.firestore, 'users', userId1);
      const user2Ref = doc(this.firestore, 'users', userId2);

      await Promise.all([
        updateDoc(user1Ref, { friendsCount: increment(-1) }),
        updateDoc(user2Ref, { friendsCount: increment(-1) })
      ]);

      console.log('✅ friendsCount decrementado para ambos usuarios');
    } catch (error) {
      console.error('❌ Error al decrementar friendsCount:', error);
      throw error;
    }
  }

  // ==================== RECALCULAR CONTADORES ====================
  
  /**
   * Recalcular contador de posts desde Firestore
   * Útil para corregir inconsistencias
   */
  async recalculatePostsCount(userId: string): Promise<number> {
    try {
      const postsQuery = query(
        collection(this.firestore, 'posts'),
        where('autorId', '==', userId)
      );
      
      const snapshot = await getDocs(postsQuery);
      const count = snapshot.size;

      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, { postsCount: count });

      console.log(`✅ postsCount recalculado: ${count} posts`);
      return count;
    } catch (error) {
      console.error('❌ Error al recalcular postsCount:', error);
      return 0;
    }
  }

  /**
   * Recalcular contador de amigos desde Firestore
   * Útil para corregir inconsistencias
   */
  async recalculateFriendsCount(userId: string): Promise<number> {
    try {
      const friendsQuery1 = query(
        collection(this.firestore, 'friends'),
        where('userId1', '==', userId),
        where('status', '==', 'accepted')
      );

      const friendsQuery2 = query(
        collection(this.firestore, 'friends'),
        where('userId2', '==', userId),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2)
      ]);

      const count = snapshot1.size + snapshot2.size;

      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, { friendsCount: count });

      console.log(`✅ friendsCount recalculado: ${count} amigos`);
      return count;
    } catch (error) {
      console.error('❌ Error al recalcular friendsCount:', error);
      return 0;
    }
  }

  /**
   * Recalcular todos los contadores de un usuario
   */
  async recalculateAllCounters(userId: string): Promise<{ posts: number; friends: number }> {
    const [posts, friends] = await Promise.all([
      this.recalculatePostsCount(userId),
      this.recalculateFriendsCount(userId)
    ]);

    return { posts, friends };
  }

  // ==================== OBTENER CONTADORES ACTUALES ====================
  
  /**
   * Obtener los contadores actuales de un usuario
   */
  async getUserCounts(userId: string): Promise<{ friendsCount: number; postsCount: number }> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          friendsCount: data['friendsCount'] || 0,
          postsCount: data['postsCount'] || 0
        };
      }

      return { friendsCount: 0, postsCount: 0 };
    } catch (error) {
      console.error('❌ Error al obtener contadores:', error);
      return { friendsCount: 0, postsCount: 0 };
    }
  }
}