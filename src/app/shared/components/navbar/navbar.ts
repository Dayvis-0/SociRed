import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private friendService = inject(FriendService);
  private router = inject(Router);

  searchOpen = false;
  searchQuery = '';
  userMenuOpen = false;
  notificationsOpen = false;
  currentUser: User | null = null;
  userInitials: string = '';
  
  // Notificaciones
  notifications: Notification[] = [];
  unreadCount: number = 0;
  loadingNotification: string | null = null;
  
  private userSubscription?: Subscription;
  private notificationsSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userInitials = this.getInitials(user.displayName);
        
        // Iniciar listener de notificaciones
        console.log('🔔 Iniciando listener de notificaciones para:', user.userId);
        this.notificationService.startListening(user.userId);
      } else {
        // Detener listener si no hay usuario
        this.notificationService.stopListening();
      }
    });

    // Suscribirse a las notificaciones
    this.notificationsSubscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );

    // Suscribirse al contador de no leídas
    this.unreadCountSubscription = this.notificationService.unreadCount$.subscribe(
      count => {
        this.unreadCount = count;
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.notificationsSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();
    this.notificationService.stopListening();
  }

  /**
   * Cerrar menús cuando se hace clic fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Cerrar menú de usuario si el clic es fuera
    if (!target.closest('.user-menu-container')) {
      this.userMenuOpen = false;
    }
    
    // Cerrar menú de notificaciones si el clic es fuera
    if (!target.closest('.notification-container')) {
      this.notificationsOpen = false;
    }
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   */
  getInitials(displayName: string): string {
    if (!displayName) return '??';
    
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    this.notificationsOpen = false;
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    this.userMenuOpen = false;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  /**
   * Obtener icono según tipo de notificación
   */
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'like': '❤️',
      'comment': '💬',
      'friend_request': '👥',
      'friend_accepted': '✅',
      'mention': '📢'
    };
    return icons[type] || '🔔';
  }

  /**
   * Obtener tiempo relativo
   */
  getTimeAgo(notification: Notification): string {
    return this.notificationService.getRelativeTime(notification.createdAt);
  }

  /**
   * Marcar notificación como leída y navegar
   */
  async handleNotificationClick(notification: Notification): Promise<void> {
    try {
      if (!notification.read) {
        await this.notificationService.markAsRead(notification.notificationId);
      }

      this.closeNotifications();

      // Navegar según el tipo
      if (notification.type === 'friend_request') {
        // Ya manejado por botones de aceptar/rechazar
        return;
      } else if (notification.type === 'friend_accepted') {
        await this.router.navigate(['/profile', notification.fromUserId]);
      } else if (notification.postId) {
        await this.router.navigate(['/post', notification.postId]);
      }
    } catch (error) {
      console.error('Error al manejar notificación:', error);
    }
  }

  /**
   * Aceptar solicitud de amistad
   */
  async acceptFriendRequest(notification: Notification, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!notification.friendshipId) return;
    
    this.loadingNotification = notification.notificationId;
    
    try {
      await this.friendService.acceptFriendRequest(notification.friendshipId);
      console.log('✅ Solicitud aceptada');
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      alert('Error al aceptar la solicitud. Intenta nuevamente.');
    } finally {
      this.loadingNotification = null;
    }
  }

  /**
   * Rechazar solicitud de amistad
   */
  async rejectFriendRequest(notification: Notification, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!notification.friendshipId) return;
    
    this.loadingNotification = notification.notificationId;
    
    try {
      await this.friendService.rejectFriendRequest(notification.friendshipId);
      console.log('✅ Solicitud rechazada');
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud. Intenta nuevamente.');
    } finally {
      this.loadingNotification = null;
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      await this.notificationService.markAllAsRead(this.currentUser.userId);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }

  /**
   * Cerrar sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.closeUserMenu();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Intenta nuevamente.');
    }
  }
}