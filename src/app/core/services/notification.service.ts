import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  collectionData
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface de Notificación
 */
export interface Notification {
  notificationId: string;
  userId: string;                    // Usuario que recibe la notificación
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'mention';
  fromUserId: string;                // Usuario que generó la notificación
  fromUserName: string;
  fromUserPhotoURL?: string;
  postId?: string;                   // Opcional, si es sobre un post
  friendshipId?: string;             // Opcional, para solicitudes de amistad
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private notificationsCollection = collection(this.firestore, 'notifications');

  // BehaviorSubject para notificaciones no leídas
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // BehaviorSubject para lista de notificaciones
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unsubscribe?: () => void;

  // ==================== LISTENER EN TIEMPO REAL ====================

  /**
   * Iniciar listener de notificaciones en tiempo real
   */
  startListening(userId: string): void {
    console.log('🔔 Iniciando listener para userId:', userId);
    
    if (this.unsubscribe) {
      console.log('🔄 Deteniendo listener anterior');
      this.unsubscribe();
    }

    const q = query(
      this.notificationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    console.log('📡 Suscribiéndose a notificaciones en tiempo real...');

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔔 Listener de notificaciones activado. Documentos:', snapshot.size);
      const notifications: Notification[] = [];
      let unreadCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification: Notification = {
          notificationId: doc.id,
          userId: data['userId'],
          type: data['type'],
          fromUserId: data['fromUserId'],
          fromUserName: data['fromUserName'],
          fromUserPhotoURL: data['fromUserPhotoURL'],
          postId: data['postId'],
          friendshipId: data['friendshipId'],
          message: data['message'],
          read: data['read'],
          createdAt: this.convertToTimestamp(data['createdAt'])
        };

        notifications.push(notification);
        
        if (!notification.read) {
          unreadCount++;
        }
      });

      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(unreadCount);
      
      console.log('📬 Notificaciones actualizadas:', notifications.length);
      console.log('📌 No leídas:', unreadCount);
    }, (error) => {
      console.error('❌ Error en listener de notificaciones:', error);
    });
  }

  /**
   * Detener listener
   */
  stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  // ==================== CREAR NOTIFICACIONES ====================

  /**
   * Crear notificación de solicitud de amistad
   */
  async createFriendRequestNotification(
    toUserId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserPhotoURL: string | undefined,
    friendshipId: string
  ): Promise<void> {
    try {
      await addDoc(this.notificationsCollection, {
        userId: toUserId,
        type: 'friend_request',
        fromUserId: fromUserId,
        fromUserName: fromUserName,
        fromUserPhotoURL: fromUserPhotoURL || '',
        friendshipId: friendshipId,
        message: `${fromUserName} te envió una solicitud de amistad`,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log('✅ Notificación de solicitud de amistad creada');
    } catch (error) {
      console.error('❌ Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de amistad aceptada
   */
  async createFriendAcceptedNotification(
    toUserId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserPhotoURL: string | undefined
  ): Promise<void> {
    try {
      await addDoc(this.notificationsCollection, {
        userId: toUserId,
        type: 'friend_accepted',
        fromUserId: fromUserId,
        fromUserName: fromUserName,
        fromUserPhotoURL: fromUserPhotoURL || '',
        message: `${fromUserName} aceptó tu solicitud de amistad`,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log('✅ Notificación de amistad aceptada creada');
    } catch (error) {
      console.error('❌ Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de like en post
   */
  async createLikeNotification(
    toUserId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserPhotoURL: string | undefined,
    postId: string
  ): Promise<void> {
    try {
      // Evitar notificar al mismo usuario
      if (toUserId === fromUserId) return;

      await addDoc(this.notificationsCollection, {
        userId: toUserId,
        type: 'like',
        fromUserId: fromUserId,
        fromUserName: fromUserName,
        fromUserPhotoURL: fromUserPhotoURL || '',
        postId: postId,
        message: `A ${fromUserName} le gustó tu publicación`,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log('✅ Notificación de like creada');
    } catch (error) {
      console.error('❌ Error al crear notificación:', error);
    }
  }

  /**
   * Crear notificación de comentario
   */
  async createCommentNotification(
    toUserId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserPhotoURL: string | undefined,
    postId: string
  ): Promise<void> {
    try {
      // Evitar notificar al mismo usuario
      if (toUserId === fromUserId) return;

      await addDoc(this.notificationsCollection, {
        userId: toUserId,
        type: 'comment',
        fromUserId: fromUserId,
        fromUserName: fromUserName,
        fromUserPhotoURL: fromUserPhotoURL || '',
        postId: postId,
        message: `${fromUserName} comentó tu publicación`,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log('✅ Notificación de comentario creada');
    } catch (error) {
      console.error('❌ Error al crear notificación:', error);
    }
  }

  // ==================== MARCAR COMO LEÍDA ====================

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'notifications', notificationId);
      await updateDoc(docRef, {
        read: true
      });

      console.log('✅ Notificación marcada como leída');
    } catch (error) {
      console.error('❌ Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);

      console.log('✅ Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('❌ Error al marcar todas como leídas:', error);
      throw error;
    }
  }

  // ==================== ELIMINAR NOTIFICACIONES ====================

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'notifications', notificationId);
      await deleteDoc(docRef);

      console.log('✅ Notificación eliminada');
    } catch (error) {
      console.error('❌ Error al eliminar notificación:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación por friendshipId (cuando se rechaza una solicitud)
   */
  async deleteNotificationByFriendshipId(userId: string, friendshipId: string): Promise<void> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('friendshipId', '==', friendshipId),
        where('type', '==', 'friend_request')
      );

      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log('✅ Notificaciones de solicitud eliminadas');
    } catch (error) {
      console.error('❌ Error al eliminar notificaciones:', error);
    }
  }

  // ==================== HELPERS ====================

  private convertToTimestamp(value: any): Timestamp {
    if (!value) return Timestamp.now();
    if (value instanceof Timestamp) return value;
    if (value.toDate && typeof value.toDate === 'function') {
      return Timestamp.fromDate(value.toDate());
    }
    if (value instanceof Date) return Timestamp.fromDate(value);
    return Timestamp.now();
  }

  /**
   * Obtener tiempo relativo (ej: "hace 5 minutos")
   */
  getRelativeTime(timestamp: Timestamp): string {
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Justo ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}