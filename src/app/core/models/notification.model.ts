import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface de Notificación (Notification Document en Firestore)
 * Ruta: /notifications/{notificationId}
 */
export interface Notification {
  notificationId: string;            // ID único de la notificación
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

/**
 * Type para los tipos de notificación
 */
export type NotificationType = 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'mention';

/**
 * Interface para UI de Notificaciones
 */
export interface NotificationUI extends Notification {
  timeAgo: string;
  icon: string;
  color: string;
}

/**
 * Función helper para obtener el icono según el tipo
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons = {
    'like': '❤️',
    'comment': '💬',
    'friend_request': '👥',
    'friend_accepted': '✅',
    'mention': '📢'
  };
  
  return icons[type] || '🔔';
}

/**
 * Función helper para obtener el color según el tipo
 */
export function getNotificationColor(type: NotificationType): string {
  const colors = {
    'like': '#f02849',
    'comment': '#1877f2',
    'friend_request': '#42b72a',
    'friend_accepted': '#42b72a',
    'mention': '#f7b928'
  };
  
  return colors[type] || '#65676b';
}