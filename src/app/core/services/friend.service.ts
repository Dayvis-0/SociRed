import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Suggestion, Friendship } from '../models/suggestion.model';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { UserStatsService } from './user-stats.service';

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private firestore = inject(Firestore);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private userStatsService = inject(UserStatsService);
  
  private friendsCollection = collection(this.firestore, 'friends');
  private suggestionsCollection = collection(this.firestore, 'suggestions');
  private usersCollection = collection(this.firestore, 'users');

  // ==================== SUGERENCIAS ====================
  
  getSuggestions(userId: string, limitCount: number = 10): Observable<Suggestion[]> {
    const q = query(
      this.suggestionsCollection,
      where('userId', '==', userId),
      orderBy('mutualFriends', 'desc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            suggestionId: doc.id,
            ...data,
            createdAt: this.convertToTimestamp(data['createdAt'])
          } as Suggestion;
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener sugerencias:', error);
        return of([]);
      })
    );
  }

  async generateSuggestions(userId: string, limitCount: number = 3): Promise<Suggestion[]> {
    try {
      const usersQuery = query(this.usersCollection, limit(20));
      const usersSnapshot = await getDocs(usersQuery);
      
      const suggestions: Suggestion[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        if (userDoc.id === userId) continue;
        
        const userData = userDoc.data() as User;
        
        const areFriends = await this.areFriends(userId, userDoc.id);
        if (areFriends) continue;
        
        const suggestion: Suggestion = {
          suggestionId: '',
          userId: userId,
          suggestedUserId: userDoc.id,
          suggestedUserName: userData.displayName,
          suggestedUserInitials: this.getInitials(userData.displayName),
          suggestedUserPhotoURL: userData.photoURL,
          mutualFriends: Math.floor(Math.random() * 10),
          reason: 'random',
          createdAt: Timestamp.now()
        };
        
        suggestions.push(suggestion);
        
        if (suggestions.length >= limitCount) break;
      }
      
      return suggestions;
    } catch (error) {
      console.error('❌ Error al generar sugerencias:', error);
      return [];
    }
  }

  // ==================== SOLICITUDES DE AMISTAD ====================
  
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    try {
      const existingFriendship = await this.getFriendship(fromUserId, toUserId);
      
      if (existingFriendship) {
        console.log('⚠️ Ya existe una relación de amistad');
        return;
      }

      const fromUserDoc = await getDoc(doc(this.firestore, 'users', fromUserId));
      if (!fromUserDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }
      
      const fromUserData = fromUserDoc.data() as User;

      const friendshipData = {
        userId1: fromUserId,
        userId2: toUserId,
        status: 'pending',
        requestedBy: fromUserId,
        requestedTo: toUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.friendsCollection, friendshipData);
      await updateDoc(docRef, { friendshipId: docRef.id });

      await this.notificationService.createFriendRequestNotification(
        toUserId,
        fromUserId,
        fromUserData.displayName,
        fromUserData.photoURL,
        docRef.id
      );

      console.log('✅ Solicitud de amistad enviada');
    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error);
      throw error;
    }
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    try {
      const friendshipDoc = await getDoc(doc(this.firestore, 'friends', friendshipId));
      if (!friendshipDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const friendshipData = friendshipDoc.data() as Friendship;
      const currentUserId = this.authService.getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const docRef = doc(this.firestore, 'friends', friendshipId);
      await updateDoc(docRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      await this.userStatsService.incrementFriendsCount(
        friendshipData.userId1,
        friendshipData.userId2
      );

      const currentUserDoc = await getDoc(doc(this.firestore, 'users', currentUserId));
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data() as User;

        await this.notificationService.createFriendAcceptedNotification(
          friendshipData.requestedBy,
          currentUserId,
          currentUserData.displayName,
          currentUserData.photoURL
        );
      }

      await this.notificationService.deleteNotificationByFriendshipId(
        currentUserId,
        friendshipId
      );

      console.log('✅ Solicitud de amistad aceptada y contadores actualizados');
    } catch (error) {
      console.error('❌ Error al aceptar solicitud:', error);
      throw error;
    }
  }

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    try {
      const currentUserId = this.authService.getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const docRef = doc(this.firestore, 'friends', friendshipId);
      await deleteDoc(docRef);

      await this.notificationService.deleteNotificationByFriendshipId(
        currentUserId,
        friendshipId
      );

      console.log('✅ Solicitud de amistad rechazada');
    } catch (error) {
      console.error('❌ Error al rechazar solicitud:', error);
      throw error;
    }
  }

  async removeFriend(friendshipId: string): Promise<void> {
    try {
      const friendshipDoc = await getDoc(doc(this.firestore, 'friends', friendshipId));
      
      if (friendshipDoc.exists()) {
        const friendshipData = friendshipDoc.data() as Friendship;
        
        if (friendshipData.status === 'accepted') {
          await this.userStatsService.decrementFriendsCount(
            friendshipData.userId1,
            friendshipData.userId2
          );
        }
      }

      const docRef = doc(this.firestore, 'friends', friendshipId);
      await deleteDoc(docRef);

      console.log('✅ Amistad eliminada y contadores actualizados');
    } catch (error) {
      console.error('❌ Error al eliminar amistad:', error);
      throw error;
    }
  }

  // ==================== CONSULTAS ====================
  
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const q1 = query(
        this.friendsCollection,
        where('userId1', '==', userId1),
        where('userId2', '==', userId2),
        where('status', '==', 'accepted')
      );

      const q2 = query(
        this.friendsCollection,
        where('userId1', '==', userId2),
        where('userId2', '==', userId1),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      return !snapshot1.empty || !snapshot2.empty;
    } catch (error) {
      console.error('❌ Error al verificar amistad:', error);
      return false;
    }
  }

  async getFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    try {
      const q1 = query(
        this.friendsCollection,
        where('userId1', '==', userId1),
        where('userId2', '==', userId2)
      );

      const q2 = query(
        this.friendsCollection,
        where('userId1', '==', userId2),
        where('userId2', '==', userId1)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const docSnap = snapshot1.docs[0] || snapshot2.docs[0];
      
      if (docSnap) {
        const data = docSnap.data();
        return {
          friendshipId: docSnap.id,
          ...data,
          createdAt: this.convertToTimestamp(data['createdAt']),
          updatedAt: this.convertToTimestamp(data['updatedAt'])
        } as Friendship;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al obtener amistad:', error);
      return null;
    }
  }

  /**
   * 🔥 OBTENER AMIGOS EN TIEMPO REAL (CON LISTENER)
   */
  getFriends(userId: string): Observable<User[]> {
    return new Observable(observer => {
      const q1 = query(
        this.friendsCollection,
        where('userId1', '==', userId),
        where('status', '==', 'accepted')
      );

      const q2 = query(
        this.friendsCollection,
        where('userId2', '==', userId),
        where('status', '==', 'accepted')
      );

      let friendIds: string[] = [];
      let unsubscribers: (() => void)[] = [];

      // 🔥 Listener para friendships donde el usuario es userId1
      const unsubscribe1 = onSnapshot(q1, async (snapshot1: QuerySnapshot<DocumentData>) => {
        const ids1: string[] = [];
        snapshot1.docs.forEach(doc => {
          const data = doc.data();
          ids1.push(data['userId2']);
        });

        // Combinar con los IDs del otro query
        friendIds = [...new Set([...ids1, ...friendIds])];
        
        await this.loadFriendsData(friendIds, observer);
      });

      // 🔥 Listener para friendships donde el usuario es userId2
      const unsubscribe2 = onSnapshot(q2, async (snapshot2: QuerySnapshot<DocumentData>) => {
        const ids2: string[] = [];
        snapshot2.docs.forEach(doc => {
          const data = doc.data();
          ids2.push(data['userId1']);
        });

        // Combinar con los IDs del otro query
        friendIds = [...new Set([...friendIds, ...ids2])];
        
        await this.loadFriendsData(friendIds, observer);
      });

      unsubscribers = [unsubscribe1, unsubscribe2];

      // 🔥 Listeners para detectar cambios en el estado online de cada amigo
      const setupUserListeners = (friendIds: string[]) => {
        // Limpiar listeners anteriores
        unsubscribers.slice(2).forEach(unsub => unsub());
        unsubscribers = unsubscribers.slice(0, 2);

        // Crear nuevo listener para cada amigo
        friendIds.forEach(friendId => {
          const userDoc = doc(this.firestore, 'users', friendId);
          const unsubUser = onSnapshot(userDoc, async () => {
            // Cuando cambia el estado de un usuario, recargar todos
            await this.loadFriendsData(friendIds, observer);
          });
          unsubscribers.push(unsubUser);
        });
      };

      // Configurar listeners de usuarios después de obtener friendIds
      setTimeout(() => setupUserListeners(friendIds), 500);

      // Cleanup: desuscribirse cuando el Observable se cancele
      return () => {
        console.log('🛑 Desuscrito de amigos en tiempo real');
        unsubscribers.forEach(unsub => unsub());
      };
    });
  }

  /**
   * 🔥 Cargar datos de amigos y emitir al observer
   */
  private async loadFriendsData(friendIds: string[], observer: any): Promise<void> {
    try {
      const friends: User[] = [];
      
      for (const friendId of friendIds) {
        const userDoc = await getDoc(doc(this.firestore, 'users', friendId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          friends.push({
            ...userData,
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen
          });
        }
      }

      console.log('🔄 Amigos actualizados en tiempo real:', friends.length);
      observer.next(friends);
    } catch (error) {
      console.error('❌ Error al cargar datos de amigos:', error);
      observer.error(error);
    }
  }

  // ==================== HELPERS ====================
  
  private convertToTimestamp(value: any): Timestamp {
    if (!value) return Timestamp.now();
    if (value instanceof Timestamp) return value;
    if (value.toDate) return Timestamp.fromDate(value.toDate());
    if (value instanceof Date) return Timestamp.fromDate(value);
    return Timestamp.now();
  }

  private getInitials(name: string): string {
    if (!name) return '??';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}